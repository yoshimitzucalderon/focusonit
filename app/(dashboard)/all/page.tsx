'use client'

import { useMemo } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskList from '@/components/TaskList'
import { SelectionProvider, useSelection } from '@/context/SelectionContext'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { createClient } from '@/lib/supabase/client'
import { TaskUpdate } from '@/types/database.types'
import toast from 'react-hot-toast'

function AllPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

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

  // Acciones masivas
  const handleBulkComplete = async () => {
    const confirmed = window.confirm(
      `¿Marcar ${selectedIds.size} tarea(s) como completada(s)?`
    )

    if (!confirmed) return

    try {
      const updates = Array.from(selectedIds).map((taskId) =>
        supabase
          .from('tasks')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          } satisfies TaskUpdate)
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

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
      />
    </>
  )
}

export default function AllPage() {
  return (
    <SelectionProvider>
      <AllPageContent />
    </SelectionProvider>
  )
}
