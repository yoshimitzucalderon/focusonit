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
import toast from 'react-hot-toast'

interface UsePomodoroTimerProps {
  taskId: string
  userId: string
  onComplete?: () => void
}

export function usePomodoroTimer({ taskId, userId, onComplete }: UsePomodoroTimerProps) {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0) // seconds
  const [isRunning, setIsRunning] = useState(false)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0) // seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds
  const HEARTBEAT_INTERVAL = 30 * 1000 // 30 seconds

  // Load total time spent on this task
  useEffect(() => {
    const loadTotalTime = async () => {
      const total = await getTotalTimeForTask(taskId)
      setTotalTimeSpent(total)
    }
    loadTotalTime()
  }, [taskId])

  // Check for active session on mount and after task changes
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await getActiveTimeSession(userId)

        if (session && session.task_id === taskId) {
          // Resume this task's session
          setActiveSession(session)
          const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
          const remaining = Math.max(0, POMODORO_DURATION - elapsed)
          setTimeRemaining(remaining)
          setIsRunning(true)

          // Restore from localStorage if exists
          const localKey = `pomodoro_active_${userId}_${taskId}`
          const localData = localStorage.getItem(localKey)
          if (localData) {
            const parsed = JSON.parse(localData)
            setTimeRemaining(parsed.timeRemaining || remaining)
          }
        }
      } catch (error) {
        console.error('Error checking active session:', error)
      }
    }

    checkActiveSession()
  }, [taskId, userId, POMODORO_DURATION])

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newValue = prev - 1

          // Save to localStorage
          const localKey = `pomodoro_active_${userId}_${taskId}`
          localStorage.setItem(localKey, JSON.stringify({
            timeRemaining: newValue,
            sessionId: activeSession?.id,
            startedAt: activeSession?.started_at,
          }))

          if (newValue <= 0) {
            handleComplete()
            return 0
          }

          return newValue
        })
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
  }, [isRunning, timeRemaining, userId, taskId, activeSession])

  // Heartbeat to update Supabase every 30 seconds
  useEffect(() => {
    if (isRunning && activeSession) {
      heartbeatRef.current = setInterval(async () => {
        await heartbeatTimeSession(activeSession.id)
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
  }, [isRunning, activeSession])

  // Start timer
  const start = useCallback(async () => {
    try {
      const session = await createTimeSession(taskId, userId)
      setActiveSession(session)
      setTimeRemaining(POMODORO_DURATION)
      setIsRunning(true)

      // Save to localStorage
      const localKey = `pomodoro_active_${userId}_${taskId}`
      localStorage.setItem(localKey, JSON.stringify({
        timeRemaining: POMODORO_DURATION,
        sessionId: session.id,
        startedAt: session.started_at,
      }))

      toast.success('Timer iniciado - 25 minutos')
    } catch (error) {
      console.error('Error starting timer:', error)
      toast.error('Error al iniciar timer')
    }
  }, [taskId, userId, POMODORO_DURATION])

  // Pause timer
  const pause = useCallback(async () => {
    if (!activeSession) return

    try {
      await pauseTimeSession(activeSession.id)
      setIsRunning(false)

      // Clear localStorage
      const localKey = `pomodoro_active_${userId}_${taskId}`
      localStorage.removeItem(localKey)

      // Reload total time
      const total = await getTotalTimeForTask(taskId)
      setTotalTimeSpent(total)

      toast.success('Timer pausado')
      setActiveSession(null)
    } catch (error) {
      console.error('Error pausing timer:', error)
      toast.error('Error al pausar timer')
    }
  }, [activeSession, taskId, userId])

  // Complete timer (finished 25 minutes)
  const handleComplete = useCallback(async () => {
    if (!activeSession) return

    try {
      await completeTimeSession(activeSession.id)
      setIsRunning(false)
      setTimeRemaining(0)

      // Clear localStorage
      const localKey = `pomodoro_active_${userId}_${taskId}`
      localStorage.removeItem(localKey)

      // Reload total time
      const total = await getTotalTimeForTask(taskId)
      setTotalTimeSpent(total)

      // Play success sound (optional)
      const audio = new Audio('/sounds/pomodoro-complete.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore if sound doesn't exist or autoplay is blocked
      })

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
  }, [activeSession, taskId, userId, onComplete])

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
