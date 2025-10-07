import { useMemo } from 'react'
import { format, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface TimeSession {
  id: string
  started_at: string
  duration_seconds: number | null
  is_completed: boolean
  tasks?: {
    priority?: 'alta' | 'media' | 'baja'
  }
}

interface StatsMetrics {
  totalTime: number
  totalSessions: number
  completedSessions: number
  currentStreak: number
  longestStreak: number
}

interface ComparisonMetrics {
  timeChange: number
  sessionsChange: number
  completedChange: number
}

export interface Insight {
  icon: string
  type: 'success' | 'info' | 'warning'
  message: string
}

export function useInsights(
  sessions: TimeSession[],
  metrics: StatsMetrics,
  comparison: ComparisonMetrics
): Insight[] {
  return useMemo(() => {
    const insights: Insight[] = []

    // 1. Mejor día de la semana
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const dayStats: Record<number, number> = {}

    sessions.forEach(session => {
      const day = getDay(new Date(session.started_at))
      dayStats[day] = (dayStats[day] || 0) + (session.duration_seconds || 0)
    })

    const bestDay = Object.entries(dayStats)
      .sort(([, a], [, b]) => b - a)[0]

    if (bestDay && bestDay[1] > 0) {
      const hours = Math.floor(bestDay[1] / 3600)
      const minutes = Math.round((bestDay[1] % 3600) / 60)
      insights.push({
        icon: '✨',
        type: 'success',
        message: `¡Tu mejor día fue ${dayNames[parseInt(bestDay[0])]} con ${hours}h ${minutes}m!`
      })
    }

    // 2. Comparación con período anterior
    if (comparison.timeChange !== 0 && !isNaN(comparison.timeChange)) {
      if (comparison.timeChange > 0) {
        insights.push({
          icon: '📈',
          type: 'info',
          message: `Tu productividad aumentó +${Math.abs(comparison.timeChange).toFixed(0)}% vs período anterior`
        })
      } else if (comparison.timeChange < -10) {
        insights.push({
          icon: '📉',
          type: 'warning',
          message: `Tu productividad bajó ${Math.abs(comparison.timeChange).toFixed(0)}% vs período anterior`
        })
      }
    }

    // 3. Tareas de alta prioridad
    const highPriorityCount = sessions.filter(s => s.tasks?.priority === 'alta').length
    if (highPriorityCount > 10) {
      insights.push({
        icon: '🎯',
        type: 'success',
        message: `Completaste ${highPriorityCount} sesiones de alta prioridad`
      })
    }

    // 4. Días sin actividad (identificar patrones)
    const daysWithActivity = new Set(
      sessions.map(s => format(new Date(s.started_at), 'yyyy-MM-dd'))
    )

    const weekendActivity = sessions.filter(s => {
      const day = getDay(new Date(s.started_at))
      return day === 0 || day === 6
    }).length

    if (weekendActivity === 0 && sessions.length > 0) {
      insights.push({
        icon: '⚠️',
        type: 'warning',
        message: 'Sin actividad los fines de semana'
      })
    }

    // 5. Racha actual (si es notable)
    if (metrics.currentStreak >= 7) {
      insights.push({
        icon: '🔥',
        type: 'success',
        message: `¡Racha de ${metrics.currentStreak} días consecutivos!`
      })
    } else if (metrics.currentStreak === 0 && metrics.longestStreak > 0) {
      insights.push({
        icon: '💪',
        type: 'info',
        message: `Reinicia tu racha. Tu mejor fue de ${metrics.longestStreak} días`
      })
    }

    // 6. Promedio de sesiones por día
    const avgSessionsPerDay = sessions.length / Math.max(daysWithActivity.size, 1)
    if (avgSessionsPerDay >= 3) {
      insights.push({
        icon: '⚡',
        type: 'success',
        message: `Excelente ritmo con ${avgSessionsPerDay.toFixed(1)} sesiones por día`
      })
    }

    // 7. Tasa de completitud
    const completionRate = metrics.totalSessions > 0
      ? (metrics.completedSessions / metrics.totalSessions) * 100
      : 0

    if (completionRate >= 80 && metrics.totalSessions >= 5) {
      insights.push({
        icon: '🏆',
        type: 'success',
        message: `${completionRate.toFixed(0)}% de sesiones completadas. ¡Excelente!`
      })
    } else if (completionRate < 50 && metrics.totalSessions >= 5) {
      insights.push({
        icon: '💡',
        type: 'warning',
        message: `Solo ${completionRate.toFixed(0)}% de sesiones completadas. Intenta terminar lo que empiezas`
      })
    }

    // Limitar a 4 insights
    return insights.slice(0, 4)
  }, [sessions, metrics, comparison])
}
