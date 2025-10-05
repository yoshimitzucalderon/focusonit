'use client'

import { useMemo } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskList from '@/components/TaskList'
import { subDays } from 'date-fns'
import { SelectionProvider, useSelection } from '@/context/SelectionContext'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getLocalTimestamp, getTimezoneOffset } from '@/lib/utils/timezone'

function CompletedPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

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

  // Acciones masivas - para completadas solo permitir eliminar
  const handleBulkComplete = async () => {
    // Reabrir tareas completadas
    const confirmed = window.confirm(
      `¿Reabrir ${selectedIds.size} tarea(s)?`
    )

    if (!confirmed) return

    try {
      const updates = Array.from(selectedIds).map((taskId) =>
        supabase
          .from('tasks')
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({
            completed: false,
            completed_at: null,
            updated_at: getLocalTimestamp(),
            timezone_offset: getTimezoneOffset()
          })
          .eq('id', taskId)
      )

      await Promise.all(updates)

      clearSelection()
      toast.success(`${selectedIds.size} tarea(s) reabiertas`)
    } catch (error) {
      toast.error('Error al reabrir tareas')
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

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        completeButtonText="Reabrir"
      />
    </>
  )
}

export default function CompletedPage() {
  return (
    <SelectionProvider>
      <CompletedPageContent />
    </SelectionProvider>
  )
}
