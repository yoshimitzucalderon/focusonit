'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getTimeSessionsWithTasks } from '@/lib/supabase/timeSessionQueries'
import { BarChart3, Clock, Timer, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimeSessionWithTask {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  is_completed: boolean
  session_type: string
  tasks: {
    title: string
    description: string | null
  }
}

export default function StatsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<TimeSessionWithTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return

      try {
        const data = await getTimeSessionsWithTasks(user.id)
        setSessions(data as TimeSessionWithTask[])
      } catch (error) {
        console.error('Error loading sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [user])

  // Calcular estadísticas
  const totalTimeSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const completedSessions = sessions.filter(s => s.is_completed).length
  const totalSessions = sessions.length

  // Agrupar por tarea
  const taskStats = sessions.reduce((acc, session) => {
    const taskId = session.task_id
    if (!acc[taskId]) {
      acc[taskId] = {
        title: session.tasks.title,
        totalSeconds: 0,
        sessionCount: 0
      }
    }
    acc[taskId].totalSeconds += session.duration_seconds || 0
    acc[taskId].sessionCount += 1
    return acc
  }, {} as Record<string, { title: string; totalSeconds: number; sessionCount: number }>)

  const sortedTasks = Object.entries(taskStats)
    .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
    .slice(0, 10)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold dark:text-white">Estadísticas</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Historial y análisis de tus sesiones de trabajo
        </p>
      </div>

      {/* Cards de estadísticas generales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Total</p>
              <p className="text-2xl font-bold dark:text-white">{formatTime(totalTimeSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones</p>
              <p className="text-2xl font-bold dark:text-white">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold dark:text-white">{completedSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Tareas por Tiempo */}
      {sortedTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold dark:text-white">Top 10 Tareas</h3>
          </div>
          <div className="space-y-3">
            {sortedTasks.map(([taskId, stats], index) => {
              const percentage = (stats.totalSeconds / totalTimeSeconds) * 100
              return (
                <div key={taskId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        #{index + 1}
                      </span>
                      <span className="dark:text-white truncate">{stats.title}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.sessionCount} {stats.sessionCount === 1 ? 'sesión' : 'sesiones'}
                      </span>
                      <span className="font-semibold dark:text-white">
                        {formatTime(stats.totalSeconds)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial de Sesiones */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Historial de Sesiones</h3>

        {sessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay sesiones registradas todavía. ¡Empieza a trabajar en tus tareas!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white truncate">
                    {session.tasks.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(session.started_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {session.is_completed && (
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      Completada
                    </span>
                  )}
                  <span className="text-sm font-semibold dark:text-white">
                    {session.duration_seconds ? formatDuration(session.duration_seconds) : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
