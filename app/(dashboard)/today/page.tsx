'use client'

import { useMemo, useState } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskInput from '@/components/TaskInput'
import TaskList from '@/components/TaskList'
import { startOfDay, endOfDay, isPast, isToday } from 'date-fns'
import { Eye, EyeOff } from 'lucide-react'

export default function TodayPage() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const [hideCompleted, setHideCompleted] = useState(false)

  const todayTasks = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    return tasks.filter((task) => {
      if (hideCompleted && task.completed) return false

      // Tareas sin fecha
      if (!task.due_date) return true

      const taskDate = new Date(task.due_date)

      // Tareas de hoy
      if (taskDate >= todayStart && taskDate <= todayEnd) return true

      // Tareas atrasadas (pasadas y no completadas)
      if (isPast(taskDate) && !isToday(taskDate) && !task.completed) return true

      return false
    })
  }, [tasks, hideCompleted])

  const pendingCount = todayTasks.filter((t) => !t.completed).length
  const overdueCount = todayTasks.filter(
    (t) =>
      t.due_date &&
      isPast(new Date(t.due_date)) &&
      !isToday(new Date(t.due_date)) &&
      !t.completed
  ).length

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Hoy</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
              {overdueCount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium ml-2">
                  · {overdueCount} {overdueCount === 1 ? 'atrasada' : 'atrasadas'}
                </span>
              )}
            </p>
          </div>

          {/* Toggle para ocultar completadas */}
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
          >
            {hideCompleted ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Mostrar completadas</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Ocultar completadas</span>
              </>
            )}
          </button>
        </div>

        {/* Task List */}
        <TaskList
          tasks={todayTasks}
          emptyMessage="¡Todo listo! No hay tareas pendientes para hoy"
        />
      </div>
    </div>
  )
}