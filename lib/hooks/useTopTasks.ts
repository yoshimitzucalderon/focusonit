import { useState, useMemo } from 'react'

interface TaskWithStats {
  taskId: string
  title: string
  totalSeconds: number
  sessionCount: number
  completionRate: number
  priority?: 'alta' | 'media' | 'baja'
  tags?: string[]
}

export type SortBy = 'time' | 'sessions' | 'completion'
export type FilterBy = 'all' | 'completed' | 'pending'

export function useTopTasks(tasks: TaskWithStats[]) {
  const [sortBy, setSortBy] = useState<SortBy>('time')
  const [filter, setFilter] = useState<FilterBy>('all')

  const filteredAndSorted = useMemo(() => {
    let result = [...tasks]

    // Filtrar
    if (filter === 'completed') {
      result = result.filter(t => t.completionRate >= 100)
    } else if (filter === 'pending') {
      result = result.filter(t => t.completionRate < 100)
    }

    // Ordenar
    result.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return b.totalSeconds - a.totalSeconds
        case 'sessions':
          return b.sessionCount - a.sessionCount
        case 'completion':
          return b.completionRate - a.completionRate
        default:
          return 0
      }
    })

    return result.slice(0, 10) // Top 10
  }, [tasks, sortBy, filter])

  return {
    tasks: filteredAndSorted,
    sortBy,
    setSortBy,
    filter,
    setFilter
  }
}
