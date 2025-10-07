import { useMemo } from 'react'
import { isWithinInterval, format, eachDayOfInterval, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRange } from './useStatsFilters'

interface TimeSession {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  is_completed: boolean
  tasks?: {
    title: string
    priority?: 'alta' | 'media' | 'baja'
    tags?: string[]
  }
}

interface StatsMetrics {
  totalTime: number
  totalSessions: number
  completedSessions: number
  averageSessionTime: number
  longestStreak: number
  currentStreak: number
}

interface ComparisonMetrics {
  timeChange: number
  sessionsChange: number
  completedChange: number
}

interface DayDistribution {
  day: string
  dayName: string
  hours: number
}

interface PriorityDistribution {
  priority: string
  count: number
  percentage: number
  color: string
  [key: string]: string | number // Index signature for Recharts compatibility
}

interface TaskWithStats {
  taskId: string
  title: string
  totalSeconds: number
  sessionCount: number
  completionRate: number
  priority?: 'alta' | 'media' | 'baja'
  tags?: string[]
}

interface TagStats {
  tag: string
  totalSeconds: number
  percentage: number
  taskCount: number
}

export function useStatsCalculations(
  sessions: TimeSession[],
  dateRange: DateRange,
  previousDateRange: DateRange
) {
  // Filtrar sesiones por rango de fechas
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.started_at)
      return isWithinInterval(sessionDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [sessions, dateRange])

  const previousSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.started_at)
      return isWithinInterval(sessionDate, { start: previousDateRange.start, end: previousDateRange.end })
    })
  }, [sessions, previousDateRange])

  // Métricas principales
  const metrics = useMemo<StatsMetrics>(() => {
    const totalTime = filteredSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
    const completedSessions = filteredSessions.filter(s => s.is_completed).length
    const totalSessions = filteredSessions.length

    const averageSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0

    // Calcular rachas
    const sessionDates = filteredSessions
      .map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = format(new Date(), 'yyyy-MM-dd')

    sessionDates.forEach((date, index) => {
      if (index === 0 || new Date(date).getTime() - new Date(sessionDates[index - 1]).getTime() === 86400000) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }

      if (date === today) {
        currentStreak = tempStreak
      }
    })

    longestStreak = Math.max(longestStreak, tempStreak)

    return {
      totalTime,
      totalSessions,
      completedSessions,
      averageSessionTime,
      longestStreak,
      currentStreak
    }
  }, [filteredSessions])

  // Comparación con período anterior
  const comparison = useMemo<ComparisonMetrics>(() => {
    const prevTotalTime = previousSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
    const prevTotalSessions = previousSessions.length
    const prevCompletedSessions = previousSessions.filter(s => s.is_completed).length

    const timeChange = prevTotalTime > 0
      ? ((metrics.totalTime - prevTotalTime) / prevTotalTime) * 100
      : metrics.totalTime > 0 ? 100 : 0

    const sessionsChange = prevTotalSessions > 0
      ? ((metrics.totalSessions - prevTotalSessions) / prevTotalSessions) * 100
      : metrics.totalSessions > 0 ? 100 : 0

    const completedChange = prevCompletedSessions > 0
      ? ((metrics.completedSessions - prevCompletedSessions) / prevCompletedSessions) * 100
      : metrics.completedSessions > 0 ? 100 : 0

    return {
      timeChange,
      sessionsChange,
      completedChange
    }
  }, [metrics, previousSessions])

  // Distribución por día de la semana
  const dayDistribution = useMemo<DayDistribution[]>(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const dayStats: Record<number, number> = {}

    filteredSessions.forEach(session => {
      const day = getDay(new Date(session.started_at))
      dayStats[day] = (dayStats[day] || 0) + (session.duration_seconds || 0)
    })

    return dayNames.map((name, index) => ({
      day: name,
      dayName: name,
      hours: (dayStats[index] || 0) / 3600
    }))
  }, [filteredSessions])

  // Distribución por prioridad
  const priorityDistribution = useMemo<PriorityDistribution[]>(() => {
    const priorityStats = { alta: 0, media: 0, baja: 0, none: 0 }

    filteredSessions.forEach(session => {
      const priority = session.tasks?.priority || 'none'
      priorityStats[priority as keyof typeof priorityStats]++
    })

    const total = Object.values(priorityStats).reduce((a, b) => a + b, 0)

    return [
      {
        priority: 'Alta',
        count: priorityStats.alta,
        percentage: total > 0 ? (priorityStats.alta / total) * 100 : 0,
        color: '#EF4444'
      },
      {
        priority: 'Media',
        count: priorityStats.media,
        percentage: total > 0 ? (priorityStats.media / total) * 100 : 0,
        color: '#F59E0B'
      },
      {
        priority: 'Baja',
        count: priorityStats.baja,
        percentage: total > 0 ? (priorityStats.baja / total) * 100 : 0,
        color: '#10B981'
      }
    ].filter(item => item.count > 0)
  }, [filteredSessions])

  // Tareas con estadísticas
  const tasksWithStats = useMemo<TaskWithStats[]>(() => {
    const taskMap = new Map<string, TaskWithStats>()

    filteredSessions.forEach(session => {
      const existing = taskMap.get(session.task_id)
      const duration = session.duration_seconds || 0

      if (existing) {
        existing.totalSeconds += duration
        existing.sessionCount++
      } else {
        taskMap.set(session.task_id, {
          taskId: session.task_id,
          title: session.tasks?.title || 'Sin título',
          totalSeconds: duration,
          sessionCount: 1,
          completionRate: session.is_completed ? 100 : 0,
          priority: session.tasks?.priority,
          tags: session.tasks?.tags
        })
      }
    })

    return Array.from(taskMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds)
  }, [filteredSessions])

  // Estadísticas por etiquetas
  const tagStats = useMemo<TagStats[]>(() => {
    const tagMap = new Map<string, { totalSeconds: number; taskIds: Set<string> }>()

    filteredSessions.forEach(session => {
      const tags = session.tasks?.tags || []
      tags.forEach(tag => {
        const existing = tagMap.get(tag)
        const duration = session.duration_seconds || 0

        if (existing) {
          existing.totalSeconds += duration
          existing.taskIds.add(session.task_id)
        } else {
          tagMap.set(tag, {
            totalSeconds: duration,
            taskIds: new Set([session.task_id])
          })
        }
      })
    })

    const totalTime = metrics.totalTime || 1

    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        totalSeconds: data.totalSeconds,
        percentage: (data.totalSeconds / totalTime) * 100,
        taskCount: data.taskIds.size
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
  }, [filteredSessions, metrics.totalTime])

  // Datos para gráfico de línea (productividad en el tiempo)
  const productivityData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    const dayMap = new Map<string, number>()

    filteredSessions.forEach(session => {
      const day = format(new Date(session.started_at), 'yyyy-MM-dd')
      const current = dayMap.get(day) || 0
      dayMap.set(day, current + (session.duration_seconds || 0))
    })

    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const seconds = dayMap.get(dateKey) || 0
      return {
        date: format(day, 'dd/MM', { locale: es }),
        hours: seconds / 3600,
        sessions: filteredSessions.filter(s =>
          format(new Date(s.started_at), 'yyyy-MM-dd') === dateKey
        ).length
      }
    })
  }, [filteredSessions, dateRange])

  return {
    metrics,
    comparison,
    dayDistribution,
    priorityDistribution,
    tasksWithStats,
    tagStats,
    productivityData
  }
}
