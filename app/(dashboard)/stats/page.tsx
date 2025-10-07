'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getTimeSessionsWithTasks, getCompletedTasksWithoutPomodoro } from '@/lib/supabase/timeSessionQueries'
import { BarChart3, Clock, Timer, TrendingUp, CheckCircle2, Flame, Target } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStatsFilters } from '@/lib/hooks/useStatsFilters'
import { useStatsCalculations } from '@/lib/hooks/useStatsCalculations'
import { useInsights } from '@/lib/hooks/useInsights'
import { useTopTasks } from '@/lib/hooks/useTopTasks'
import { FilterBar } from '@/components/stats/FilterBar'
import { MetricCard } from '@/components/stats/MetricCard'
import { ProductivityChart } from '@/components/stats/ProductivityChart'
import { WeeklyDistributionChart } from '@/components/stats/WeeklyDistributionChart'
import { PriorityDonutChart } from '@/components/stats/PriorityDonutChart'
import { InsightsPanel } from '@/components/stats/InsightsPanel'
import { TopTasksControls } from '@/components/stats/TopTasksControls'
import { PriorityBadge } from '@/components/stats/PriorityBadge'

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

interface CompletedTaskWithoutPomodoro {
  id: string
  title: string
  completed_at: string | null
}

export default function StatsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<TimeSessionWithTask[]>([])
  const [tasksWithoutPomodoro, setTasksWithoutPomodoro] = useState<CompletedTaskWithoutPomodoro[]>([])
  const [loading, setLoading] = useState(true)
  const { filter, setPeriod } = useStatsFilters()
  const stats = useStatsCalculations(sessions as any, filter.dateRange, filter.previousPeriodRange)
  const insights = useInsights(sessions as any, stats.metrics, stats.comparison)
  const topTasks = useTopTasks(stats.tasksWithStats)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [sessionsData, tasksData] = await Promise.all([
          getTimeSessionsWithTasks(user.id),
          getCompletedTasksWithoutPomodoro(user.id)
        ])
        setSessions(sessionsData as TimeSessionWithTask[])
        setTasksWithoutPomodoro(tasksData as CompletedTaskWithoutPomodoro[])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Historial y análisis de tus sesiones de trabajo
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar selectedPeriod={filter.period} onPeriodChange={setPeriod} />

      {/* Cards de estadísticas generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tiempo Total"
          value={formatTime(stats.metrics.totalTime)}
          subtitle="horas trabajadas"
          icon={Clock}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          change={stats.comparison.timeChange}
        />

        <MetricCard
          title="Sesiones"
          value={stats.metrics.totalSessions.toString()}
          subtitle="sesiones iniciadas"
          icon={Timer}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          change={stats.comparison.sessionsChange}
        />

        <MetricCard
          title="Completadas"
          value={stats.metrics.completedSessions.toString()}
          subtitle="sesiones finalizadas"
          icon={CheckCircle2}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          change={stats.comparison.completedChange}
        />

        <MetricCard
          title="Racha Actual"
          value={stats.metrics.currentStreak.toString()}
          subtitle={`Mejor: ${stats.metrics.longestStreak} días`}
          icon={Flame}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Insights Panel */}
      <InsightsPanel insights={insights} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductivityChart data={stats.productivityData} />
        <WeeklyDistributionChart data={stats.dayDistribution} />
      </div>

      {/* Priority Donut Chart */}
      <PriorityDonutChart data={stats.priorityDistribution} />

      {/* Top 10 Tareas Mejorado */}
      {stats.tasksWithStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold dark:text-white">Top 10 Tareas</h3>
          </div>

          {/* Controles */}
          <TopTasksControls
            sortBy={topTasks.sortBy}
            setSortBy={topTasks.setSortBy}
            filter={topTasks.filter}
            setFilter={topTasks.setFilter}
          />

          {/* Lista de tareas */}
          <div className="space-y-4">
            {topTasks.tasks.map((task, index) => {
              const percentage = stats.metrics.totalTime > 0
                ? (task.totalSeconds / stats.metrics.totalTime) * 100
                : 0

              return (
                <div
                  key={task.taskId}
                  className="flex flex-col sm:flex-row items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors overflow-hidden"
                >
                  {/* Número e indicador */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 dark:text-gray-500 font-mono font-semibold text-lg w-8">
                      #{index + 1}
                    </span>
                    {task.priority && <PriorityBadge priority={task.priority} />}
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 break-words">
                      {task.title}
                    </h4>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {task.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Barra de progreso con % */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 dark:bg-blue-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="absolute -top-6 right-0 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Stats a la derecha */}
                  <div className="text-right sm:ml-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {task.sessionCount} {task.sessionCount === 1 ? 'sesión' : 'sesiones'}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatTime(task.totalSeconds)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial de Sesiones */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold dark:text-white">Historial de Sesiones</h3>
          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
            {stats.metrics.totalSessions}
          </span>
        </div>

        {stats.metrics.totalSessions === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay sesiones registradas en este período. ¡Empieza a trabajar en tus tareas!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions
              .filter(session => {
                const sessionDate = new Date(session.started_at)
                return sessionDate >= filter.dateRange.start && sessionDate <= filter.dateRange.end
              })
              .map((session) => (
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

      {/* Tareas completadas sin Pomodoro */}
      {tasksWithoutPomodoro.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold dark:text-white">Tareas Completadas sin Pomodoro</h3>
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
              {tasksWithoutPomodoro.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Estas tareas fueron completadas sin usar el temporizador Pomodoro
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasksWithoutPomodoro.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white truncate">
                    {task.title}
                  </p>
                  {task.completed_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Completada: {format(new Date(task.completed_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                    Sin timer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
