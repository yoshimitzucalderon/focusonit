'use client'

import { useMemo } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskInput from '@/components/TaskInput'
import TaskList from '@/components/TaskList'

export default function AllPage() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()

  // Filtrar solo tareas pendientes, ordenadas por fecha
  const allPendingTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.completed)
      .sort((a, b) => {
        // Sin fecha van al final
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1

        // Ordenar por fecha
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
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
          <h2 className="text-2xl font-bold dark:text-white">Todas las Tareas</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {allPendingTasks.length}{' '}
            {allPendingTasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'}
          </p>
        </div>

        {/* Task List */}
        <TaskList
          tasks={allPendingTasks}
          emptyMessage="¡Felicitaciones! No tienes tareas pendientes"
        />
      </div>
    </div>
  )
}