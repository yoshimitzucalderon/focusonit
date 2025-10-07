interface Session {
  id: string
  task_id?: string
  duration_seconds?: number
  is_completed?: boolean
  created_at: string
  tasks?: {
    title: string
  }
}

interface GroupedSession {
  date: string
  dateKey: string
  dateDisplay: string
  totalMinutes: number
  sessionCount: number
  sessions: Session[]
  isExpanded: boolean
}

export function groupSessionsByDate(sessions: Session[]): GroupedSession[] {
  // Ordenar por fecha (más reciente primero)
  const sorted = [...sessions].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Agrupar por fecha
  const groups = new Map<string, Session[]>()

  sorted.forEach(session => {
    const dateKey = new Date(session.created_at).toDateString()
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(session)
  })

  // Convertir a array con metadata
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  return Array.from(groups.entries()).map(([dateKey, sessions]) => {
    const date = new Date(dateKey)
    let dateDisplay = formatDate(date)
    let shortKey = dateKey

    // Etiquetas especiales
    if (dateKey === today) {
      dateDisplay = `Hoy - ${formatDate(date)}`
      shortKey = 'today'
    } else if (dateKey === yesterday) {
      dateDisplay = `Ayer - ${formatDate(date)}`
      shortKey = 'yesterday'
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + Math.floor((s.duration_seconds || 0) / 60), 0)

    return {
      date: dateKey,
      dateKey: shortKey,
      dateDisplay,
      totalMinutes,
      sessionCount: sessions.length,
      sessions,
      isExpanded: shortKey === 'today' // Hoy expandido por defecto
    }
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
