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
import toast from 'react-hot-toast'
import { parseDateString, getLocalTimestamp, getTimezoneOffset } from '@/lib/utils/timezone'
import { Calendar, Sparkles, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

function WeekPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

  // Agrupar tareas por día (próximos 7 días)
  const weekGroups = useMemo(() => {
    const groups: { date: Date; label: string; dayName: string; tasks: typeof tasks }[] = []

    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayTasks = tasks.filter((task) => {
        if (!task.due_date || task.completed) return false

        const taskDate = parseDateString(task.due_date)
        return taskDate >= dayStart && taskDate <= dayEnd
      })

      const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(date, "EEEE", { locale: es })
      const fullLabel = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(date, "EEEE d 'de' MMMM", { locale: es })

      groups.push({
        date,
        label: fullLabel,
        dayName,
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
      const updates = Array.from(selectedIds).map((taskId) =>
        supabase
          .from('tasks')
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({
            completed: true,
            completed_at: getLocalTimestamp(),
            updated_at: getLocalTimestamp(),
            timezone_offset: getTimezoneOffset()
          })
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
        <div className="space-y-6">
          {weekGroups.map((group, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="day-section"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-4 rounded-t-xl -mx-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-blue-500 dark:text-blue-400" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {group.label}
                    </h2>
                    {group.tasks.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white text-sm font-medium">
                        {group.tasks.length}
                      </span>
                    )}
                  </div>

                  {/* Botón agregar tarea */}
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                    + Agregar tarea
                  </button>
                </div>
              </div>

              {/* Tareas del día */}
              {group.tasks.length > 0 ? (
                <div className="task-list space-y-3 px-4 -mx-4">
                  <TaskList tasks={group.tasks} />
                </div>
              ) : (
                /* Día vacío atractivo */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center py-12 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 mx-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4"
                  >
                    <Sparkles className="text-blue-600 dark:text-blue-400" size={28} />
                  </motion.div>

                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    ¡Día libre!
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No hay tareas programadas para este día
                  </p>

                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors shadow-sm hover:shadow-md">
                    <Plus size={16} />
                    Agregar tarea
                  </button>
                </motion.div>
              )}

              {/* Separador entre días (excepto el último) */}
              {index < weekGroups.length - 1 && (
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {totalPending === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-800"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4"
            >
              <Sparkles className="text-white" size={36} />
            </motion.div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Semana despejada!
            </h3>

            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              No tienes tareas pendientes para esta semana. Perfecto momento para planificar nuevos objetivos.
            </p>

            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg hover:shadow-xl">
              <Plus size={20} />
              Crear nueva tarea
            </button>
          </motion.div>
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
