'use client'

import { useMemo } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskInput from '@/components/TaskInput'
import TaskList from '@/components/TaskList'
import { subDays } from 'date-fns'

export default function CompletedPage() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()

  // Filtrar tareas completadas (últimos 30 días)
  const completedTasks = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30)

    return tasks
      .filter((task) => {
        if (!task.completed || !task.completed_at) return false

        const completedDate = new Date(task.completed_at)
        return completedDate >= thirtyDaysAgo
      })
      .sort((a, b) => {
        // Ordenar por fecha de completado (más reciente primero)
        if (!a.completed_at || !b.completed_at) return 0
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      })
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="pb-20 md:pb-6">
      <TaskInput userId={user.id} />

      <div className="mt-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Tareas Completadas</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {completedTasks.length}{' '}
            {completedTasks.length === 1 ? 'tarea completada' : 'tareas completadas'} en los
            últimos 30 días
          </p>
        </div>

        {/* Task List */}
        <TaskList
          tasks={completedTasks}
          emptyMessage="No has completado tareas en los últimos 30 días"
        />
      </div>
    </div>
  )
}