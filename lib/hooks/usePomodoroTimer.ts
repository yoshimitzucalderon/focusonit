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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Get duration from settings or use default
  const POMODORO_DURATION = (settings?.work_duration || 25) * 60 // Convert minutes to seconds
  const HEARTBEAT_INTERVAL = 30 * 1000 // 30 seconds

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

  // Complete timer (finished 25 minutes)
  const handleComplete = useCallback(async () => {
    if (!activeSession) return

    try {
      await completeTimeSession(activeSession.id)
      setIsRunning(false)
      setTimeRemaining(0)

      // Reload total time
      const total = await getTotalTimeForTask(taskId)
      setTotalTimeSpent(total)

      // Play success sound if enabled
      if (settings?.sound_enabled) {
        const audio = new Audio('/sounds/pomodoro-complete.mp3')
        audio.volume = (settings.sound_volume || 50) / 100
        audio.play().catch(() => {
          // Ignore if sound doesn't exist or autoplay is blocked
        })
      }

      // Show notification if enabled
      if (settings?.notifications_enabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('¡Pomodoro completado! 🍅', {
            body: 'Tiempo de tomar un descanso',
            icon: '/icon-192x192.png',
          })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission()
        }
      }

      toast.success('¡Pomodoro completado! 🍅', {
        duration: 4000,
        icon: '🎉',
      })

      setActiveSession(null)

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error completing timer:', error)
      toast.error('Error al completar timer')
    }
  }, [activeSession, taskId, onComplete, settings])

  // Sync timer based on real elapsed time
  const syncTimerFromSession = useCallback((session: TimeSession) => {
    const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
    const remaining = Math.max(0, POMODORO_DURATION - elapsed)
    setTimeRemaining(remaining)

    // Auto-complete if time ran out while app was in background
    if (remaining <= 0 && isRunning) {
      handleComplete()
    }
  }, [POMODORO_DURATION, isRunning, handleComplete])

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
        // Always recalculate based on real elapsed time from started_at
        const elapsed = Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000)
        const remaining = Math.max(0, POMODORO_DURATION - elapsed)

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
  }, [isRunning, activeSession, POMODORO_DURATION, handleComplete, timeRemaining])

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
      const session = await createTimeSession(taskId, userId)
      setActiveSession(session)
      setTimeRemaining(POMODORO_DURATION)
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
  }, [taskId, userId, POMODORO_DURATION, settings])

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

    // Actions
    start,
    pause,

    // Utils
    formatTime,
    formatTotalTime,
  }
}
