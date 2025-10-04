'use client'

import { useMemo } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskList from '@/components/TaskList'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SelectionProvider, useSelection } from '@/context/SelectionContext'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { createClient } from '@/lib/supabase/client'
import { TaskUpdate } from '@/types/database.types'
import toast from 'react-hot-toast'

function WeekPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

  // Agrupar tareas por día (próximos 7 días)
  const weekGroups = useMemo(() => {
    const groups: { date: Date; label: string; tasks: typeof tasks }[] = []

    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayTasks = tasks.filter((task) => {
        if (!task.due_date || task.completed) return false

        const taskDate = new Date(task.due_date)
        return taskDate >= dayStart && taskDate <= dayEnd
      })

      groups.push({
        date,
        label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(date, "EEEE d 'de' MMMM", { locale: es }),
        tasks: dayTasks,
      })
    }

    return groups
  }, [tasks])

  const totalPending = weekGroups.reduce((acc, group) => acc + group.tasks.length, 0)

  // Acciones masivas
  const handleBulkComplete = async () => {
    const confirmed = window.confirm(
      `¿Marcar ${selectedIds.size} tarea(s) como completada(s)?`
    )

    if (!confirmed) return

    try {
      const updateData: TaskUpdate = {
        completed: true,
        completed_at: new Date().toISOString(),
      }

      const updates = Array.from(selectedIds).map((taskId) =>
        supabase
          .from('tasks')
          .update(updateData)
          .eq('id', taskId)
      )

      await Promise.all(updates)

      clearSelection()
      toast.success(`${selectedIds.size} tarea(s) completada(s)`)
    } catch (error) {
      toast.error('Error al completar tareas')
      console.error(error)
    }
  }

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `¿Eliminar ${selectedIds.size} tarea(s)? Esta acción no se puede deshacer.`
    )

    if (!confirmed) return

    try {
      const deletes = Array.from(selectedIds).map((taskId) =>
        supabase.from('tasks').delete().eq('id', taskId)
      )

      await Promise.all(deletes)

      clearSelection()
      toast.success(`${selectedIds.size} tarea(s) eliminada(s)`)
    } catch (error) {
      toast.error('Error al eliminar tareas')
      console.error(error)
    }
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
    <>
      <div className="space-y-6">
        {/* Header */}
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Esta Semana</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalPending} {totalPending === 1 ? 'tarea pendiente' : 'tareas pendientes'} en los
              próximos 7 días
            </p>
          </div>

          {/* Groups por día */}
          <div className="space-y-8">
            {weekGroups.map((group, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-lg font-semibold dark:text-white capitalize">
                    {group.label}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {group.tasks.length}
                  </span>
                </div>

                {group.tasks.length > 0 ? (
                  <TaskList tasks={group.tasks} />
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic pl-4">
                    Sin tareas programadas
                  </p>
                )}
              </div>
            ))}
          </div>

          {totalPending === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No tienes tareas pendientes para esta semana
              </p>
            </div>
          )}
      </div>

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
      />
    </>
  )
}

export default function WeekPage() {
  return (
    <SelectionProvider>
      <WeekPageContent />
    </SelectionProvider>
  )
}
