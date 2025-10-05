'use client'

import { useMemo, useState } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskList from '@/components/TaskList'
import { startOfDay, endOfDay, isPast, isToday } from 'date-fns'
import { Eye, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { SelectionProvider, useSelection } from '@/context/SelectionContext'
import { BulkActionsBar } from '@/components/BulkActionsBar'

function TodayPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const [hideCompleted, setHideCompleted] = useState(false)
  const [movingAll, setMovingAll] = useState(false)
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

  // Separar tareas atrasadas y de hoy
  const { overdueTasks, todayTasks } = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const overdue: typeof tasks = []
    const today: typeof tasks = []

    tasks.forEach((task) => {
      if (hideCompleted && task.completed) return

      if (!task.due_date) {
        // Tareas sin fecha van a "hoy"
        today.push(task)
        return
      }

      const taskDate = new Date(task.due_date)

      // Tareas atrasadas (pasadas, no completadas, y no son de hoy)
      if (isPast(taskDate) && !isToday(taskDate) && !task.completed) {
        overdue.push(task)
      }
      // Tareas de hoy
      else if (taskDate >= todayStart && taskDate <= todayEnd) {
        today.push(task)
      }
    })

    return { overdueTasks: overdue, todayTasks: today }
  }, [tasks, hideCompleted])

  const pendingCount = todayTasks.filter((t) => !t.completed).length
  const overdueCount = overdueTasks.length

  // Mover todas las tareas atrasadas a hoy
  const moveAllToToday = async () => {
    if (overdueTasks.length === 0) return

    setMovingAll(true)
    const today = new Date()

    try {
      const updates = overdueTasks.map((task) =>
        supabase
          .from('tasks')
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({ due_date: today.toISOString() })
          .eq('id', task.id)
      )

      await Promise.all(updates)

      toast.success(`${overdueTasks.length} tareas movidas a hoy`)
    } catch (error) {
      toast.error('Error al mover tareas')
      console.error(error)
    } finally {
      setMovingAll(false)
    }
  }

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
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          }
          )
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Hoy</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
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

        {/* Sección de Tareas Atrasadas */}
        {overdueCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                    Tareas Atrasadas
                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {overdueCount}
                    </span>
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Tienes {overdueCount} {overdueCount === 1 ? 'tarea atrasada' : 'tareas atrasadas'} que necesitan atención
                  </p>
                </div>
              </div>
              <button
                onClick={moveAllToToday}
                disabled={movingAll}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {movingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Moviendo...
                  </>
                ) : (
                  <>
                    Mover todas a hoy
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Lista de tareas atrasadas */}
            <div className="mt-4 space-y-3">
              <TaskList tasks={overdueTasks} emptyMessage="" />
            </div>
          </div>
        )}

        {/* Sección de Tareas de Hoy */}
        <div>
          {overdueCount > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tareas de Hoy
            </h3>
          )}
          <TaskList
            tasks={todayTasks}
            emptyMessage={overdueCount > 0 ? 'No hay tareas programadas para hoy' : '¡Todo listo! No hay tareas pendientes para hoy'}
          />
        </div>
      </div>

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
      />
    </>
  )
}

export default function TodayPage() {
  return (
    <SelectionProvider>
      <TodayPageContent />
    </SelectionProvider>
  )
}