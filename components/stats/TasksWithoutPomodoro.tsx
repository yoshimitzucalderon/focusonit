'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, Clock, Calendar, Filter } from 'lucide-react'

interface Task {
  id: string
  title: string
  completed_at?: string
  created_at: string
  used_pomodoro?: boolean
  completed_time?: number
  estimated_time?: number
}

interface TasksWithoutPomodoroProps {
  tasks: Task[]
}

export function TasksWithoutPomodoro({ tasks }: TasksWithoutPomodoroProps) {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => !t.used_pomodoro && t.completed_at)

    // Filtro de fecha
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7)
      } else if (dateFilter === 'month') {
        filterDate.setDate(now.getDate() - 30)
      }

      filtered = filtered.filter(t =>
        new Date(t.completed_at!) >= filterDate
      )
    }

    return filtered.sort((a, b) =>
      new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
    )
  }, [tasks, dateFilter])

  // Estadísticas
  const stats = useMemo(() => {
    const completed = filteredTasks.length
    const total = tasks.filter(t => t.completed_at).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const totalTime = filteredTasks.reduce((sum, t) => sum + (t.completed_time || 0), 0)
    const estimatedTime = filteredTasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0)
    const timeVariance = totalTime - estimatedTime

    return { completed, total, percentage, totalTime, estimatedTime, timeVariance }
  }, [filteredTasks, tasks])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header con estadísticas */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tareas Completadas sin Pomodoro
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.completed} tareas ({stats.percentage}% del total)
            </p>
          </div>
        </div>

        {/* Badge con número */}
        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold">
          {stats.completed}
        </div>
      </div>

      {/* Mini estadísticas */}
      {stats.completed > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatDuration(stats.totalTime)}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">Tiempo real</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatDuration(stats.estimatedTime)}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">Tiempo estimado</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.timeVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {stats.timeVariance > 0 ? '+' : ''}{formatDuration(Math.abs(stats.timeVariance))}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">Diferencia</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Filtrar:</span>
        </div>

        {/* Filtro de fecha */}
        <div className="flex gap-2">
          {(['all', 'today', 'week', 'month'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition
                ${dateFilter === filter
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }
              `}
            >
              {filter === 'all' ? 'Todas' :
               filter === 'today' ? 'Hoy' :
               filter === 'week' ? 'Esta semana' : 'Este mes'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const variance = (task.completed_time || 0) - (task.estimated_time || 0)
          const isOverTime = variance > 0

          return (
            <div key={task.id} className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(new Date(task.completed_at!))}
                  </span>
                  {task.completed_time && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(task.completed_time)}
                      </span>
                    </>
                  )}
                  {task.estimated_time && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>Est: {formatDuration(task.estimated_time)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Badge de tiempo */}
              {task.estimated_time && variance !== 0 && (
                <div className={`
                  px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                  ${isOverTime
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }
                `}>
                  {isOverTime ? '+' : ''}{formatDuration(Math.abs(variance))}
                </div>
              )}

              <span className="text-gray-400 dark:text-gray-500 text-sm">Sin timer</span>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">🎉</span>
          <p className="font-medium">¡Excelente! No hay tareas sin pomodoro</p>
          <p className="text-sm mt-1">Todas tus tareas completadas usaron el temporizador</p>
        </div>
      )}

      {/* Insight */}
      {stats.percentage > 30 && filteredTasks.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Consejo: Usa el pomodoro para mejorar tu enfoque
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                El {stats.percentage}% de tus tareas se completan sin usar el temporizador.
                Considera usar pomodoros para mejorar tu concentración y productividad.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
