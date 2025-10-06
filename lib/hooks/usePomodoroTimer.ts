'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TimeSession } from '@/types/database.types'
import {
  createTimeSession,
  pauseTimeSession,
  completeTimeSession,
  getActiveTimeSession,
  getTotalTimeForTask,
  heartbeatTimeSession,
} from '@/lib/supabase/timeSessionQueries'
import { usePomodoroSettings } from './usePomodoroSettings'
import toast from 'react-hot-toast'

interface UsePomodoroTimerProps {
  taskId: string
  userId: string
  onComplete?: () => void
}

export function usePomodoroTimer({ taskId, userId, onComplete }: UsePomodoroTimerProps) {
  const { settings } = usePomodoroSettings(userId)
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0) // seconds
  const [isRunning, setIsRunning] = useState(false)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0) // seconds
  const [pomodoroCount, setPomodoroCount] = useState(0) // Current count in cycle
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const isCompletingRef = useRef(false) // Prevent multiple completions

  // Get durations from settings or use defaults
  const WORK_DURATION = (settings?.work_duration || 25) * 60
  const SHORT_BREAK_DURATION = (settings?.short_break_duration || 5) * 60
  const LONG_BREAK_DURATION = (settings?.long_break_duration || 15) * 60
  const POMODOROS_UNTIL_LONG_BREAK = settings?.pomodoros_until_long_break || 4
  const HEARTBEAT_INTERVAL = 30 * 1000

  // Determine session type and duration
  const sessionType = activeSession?.session_type || 'work'
  const isBreak = sessionType === 'short_break' || sessionType === 'long_break'

  const getCurrentDuration = () => {
    if (!activeSession) return WORK_DURATION
    switch (activeSession.session_type) {
      case 'short_break':
        return SHORT_BREAK_DURATION
      case 'long_break':
        return LONG_BREAK_DURATION
      default:
        return WORK_DURATION
    }
  }

  // Load total time spent on this task
  useEffect(() => {
    const loadTotalTime = async () => {
      try {
        const total = await getTotalTimeForTask(taskId)
        setTotalTimeSpent(total)
      } catch (error) {
        console.error('Error loading total time:', error)
        // Don't show toast for background loading errors
        setTotalTimeSpent(0)
      }
    }
    loadTotalTime()
  }, [taskId])

  // Complete timer (finished session)
  const handleComplete = useCallback(async () => {
    if (!activeSession || isCompletingRef.current) {
      console.log('Skipping handleComplete - already running or no session')
      return
    }

    // Prevent multiple calls
    console.log('Starting handleComplete')
    isCompletingRef.current = true

    const currentType = activeSession.session_type
    const isWorkSession = currentType === 'work' || currentType === 'pomodoro_25'
    const isBreakSession = currentType === 'short_break' || currentType === 'long_break'

    try {
      await completeTimeSession(activeSession.id)
      setIsRunning(false)
      setTimeRemaining(0)

      // Reload total time (only for work sessions)
      if (isWorkSession) {
        const total = await getTotalTimeForTask(taskId)
        setTotalTimeSpent(total)
      }

      // Play sound if enabled
      if (settings?.sound_enabled) {
        try {
          // Using Web Audio API to generate a pleasant notification sound
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          // Pleasant notification sound (two-tone chime)
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

          const volume = (settings.sound_volume || 50) / 100
          gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        } catch (error) {
          console.error('Error playing sound:', error)
        }
      }

      // ONLY ONE notification type - Browser notification OR nothing
      if (settings?.notifications_enabled && 'Notification' in window && Notification.permission === 'granted') {
        if (isWorkSession) {
          new Notification('¡Pomodoro completado! 🍅', {
            body: 'Tiempo de tomar un descanso',
            icon: '/icon-192x192.png',
          })
        } else {
          new Notification('¡Descanso completado! ☕', {
            body: 'Hora de volver al trabajo',
            icon: '/icon-192x192.png',
          })
        }
      }

      // Handle next session based on type
      if (isWorkSession) {
        // Increment pomodoro count
        const newCount = (activeSession.pomodoro_count || 0) + 1
        setPomodoroCount(newCount)

        // Auto-start break if enabled
        if (settings?.auto_start_breaks) {
          const isLongBreak = newCount % POMODOROS_UNTIL_LONG_BREAK === 0
          const breakType: 'short_break' | 'long_break' = isLongBreak ? 'long_break' : 'short_break'

          setTimeout(async () => {
            try {
              const session = await createTimeSession(taskId, userId, breakType, newCount)
              setActiveSession(session)
              setTimeRemaining(breakType === 'long_break' ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION)
              setIsRunning(true)
            } catch (error) {
              console.error('Error auto-starting break:', error)
            }
          }, 1000)
        }
        // No toast - only browser notification
      } else if (isBreakSession) {
        // Reset count after long break
        if (currentType === 'long_break') {
          setPomodoroCount(0)
        }

        // Auto-start work session if enabled
        if (settings?.auto_start_pomodoros) {
          setTimeout(async () => {
            try {
              const newCount = currentType === 'long_break' ? 0 : pomodoroCount
              const session = await createTimeSession(taskId, userId, 'work', newCount)
              setActiveSession(session)
              setTimeRemaining(WORK_DURATION)
              setIsRunning(true)
            } catch (error) {
              console.error('Error auto-starting work:', error)
            }
          }, 1000)
        }
        // No toast - only browser notification
      }

      setActiveSession(null)

      // Reset flag after a delay to prevent rapid re-triggers
      setTimeout(() => {
        isCompletingRef.current = false
        console.log('Reset isCompletingRef after delay')
      }, 2000)

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error completing timer:', error)
      toast.error('Error al completar timer')
      // Reset flag after delay even on error
      setTimeout(() => {
        isCompletingRef.current = false
      }, 2000)
    }
  }, [activeSession, taskId, userId, onComplete, settings, pomodoroCount, WORK_DURATION, SHORT_BREAK_DURATION, LONG_BREAK_DURATION, POMODOROS_UNTIL_LONG_BREAK])

  // Sync timer based on real elapsed time
  const syncTimerFromSession = useCallback((session: TimeSession) => {
    // Get correct duration for this session type
    let targetDuration = WORK_DURATION
    if (session.session_type === 'short_break') {
      targetDuration = SHORT_BREAK_DURATION
    } else if (session.session_type === 'long_break') {
      targetDuration = LONG_BREAK_DURATION
    }

    const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    const remaining = Math.max(0, targetDuration - elapsed)
    setTimeRemaining(remaining)
    setPomodoroCount(session.pomodoro_count || 0)

    // Auto-complete if time ran out while app was in background
    if (remaining <= 0 && isRunning) {
      handleComplete()
    }
  }, [WORK_DURATION, SHORT_BREAK_DURATION, LONG_BREAK_DURATION, isRunning, handleComplete])

  // Check for active session on mount and after task changes
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await getActiveTimeSession(userId)

        if (session && session.task_id === taskId) {
          // Resume this task's session
          setActiveSession(session)
          syncTimerFromSession(session)
          setIsRunning(true)
        }
      } catch (error) {
        console.error('Error checking active session:', error)
      }
    }

    checkActiveSession()
  }, [taskId, userId, syncTimerFromSession])

  // Detect when app visibility changes (mobile/desktop)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && activeSession) {
        // App came back to foreground - sync timer with real elapsed time
        console.log('App visible again - syncing timer...')
        syncTimerFromSession(activeSession)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRunning, activeSession, syncTimerFromSession])

  // Timer countdown - recalculate based on real time every second
  useEffect(() => {
    if (isRunning && activeSession && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        // Get correct duration for this session type
        let targetDuration = WORK_DURATION
        if (activeSession.session_type === 'short_break') {
          targetDuration = SHORT_BREAK_DURATION
        } else if (activeSession.session_type === 'long_break') {
          targetDuration = LONG_BREAK_DURATION
        }

        // Always recalculate based on real elapsed time from started_at
        const elapsed = Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000)
        const remaining = Math.max(0, targetDuration - elapsed)

        setTimeRemaining(remaining)

        if (remaining <= 0) {
          handleComplete()
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, activeSession, WORK_DURATION, SHORT_BREAK_DURATION, LONG_BREAK_DURATION, handleComplete, timeRemaining])

  // Heartbeat to update Supabase every 30 seconds
  useEffect(() => {
    if (isRunning && activeSession) {
      heartbeatRef.current = setInterval(async () => {
        try {
          await heartbeatTimeSession(activeSession.id)
        } catch (error) {
          console.error('Heartbeat error (non-critical):', error)
          // Don't show error to user - heartbeat is background sync
        }
      }, HEARTBEAT_INTERVAL)
    } else {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [isRunning, activeSession, HEARTBEAT_INTERVAL])

  // Start timer
  const start = useCallback(async () => {
    try {
      const session = await createTimeSession(taskId, userId, 'work', pomodoroCount)
      setActiveSession(session)
      setTimeRemaining(WORK_DURATION)
      setIsRunning(true)

      const minutes = settings?.work_duration || 25
      toast.success(`Timer iniciado - ${minutes} minutos`)
    } catch (error: any) {
      console.error('Error starting timer:', error)

      // Show user-friendly error message
      const errorMessage = error?.message || 'Error desconocido al iniciar timer'

      if (errorMessage.includes('time_sessions no existe')) {
        toast.error('Error: Tabla no encontrada. Ejecuta la migración SQL primero.', {
          duration: 5000,
        })
      } else if (errorMessage.includes('permisos')) {
        toast.error('Error: Sin permisos. Verifica las políticas RLS.', {
          duration: 5000,
        })
      } else {
        toast.error(`Error al iniciar timer: ${errorMessage}`, {
          duration: 4000,
        })
      }
    }
  }, [taskId, userId, WORK_DURATION, settings, pomodoroCount])

  // Pause timer
  const pause = useCallback(async () => {
    if (!activeSession) return

    try {
      await pauseTimeSession(activeSession.id)
      setIsRunning(false)

      // Reload total time
      const total = await getTotalTimeForTask(taskId)
      setTotalTimeSpent(total)

      toast.success('Timer pausado')
      setActiveSession(null)
    } catch (error) {
      console.error('Error pausing timer:', error)
      toast.error('Error al pausar timer')
    }
  }, [activeSession, taskId])

  // Format time for display (MM:SS)
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Format total time spent (Xh Ym)
  const formatTotalTime = useCallback((seconds: number): string => {
    if (seconds === 0) return '0m'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }, [])

  return {
    // State
    isRunning,
    timeRemaining,
    timeRemainingFormatted: formatTime(timeRemaining),
    totalTimeSpent,
    totalTimeFormatted: formatTotalTime(totalTimeSpent),
    activeSession,
    pomodoroCount,
    sessionType,
    isBreak,
    currentDuration: getCurrentDuration(),

    // Actions
    start,
    pause,

    // Utils
    formatTime,
    formatTotalTime,
  }
}
