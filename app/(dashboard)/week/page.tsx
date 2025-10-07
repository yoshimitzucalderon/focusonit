'use client'

import { useMemo, useState } from 'react'
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
import { Calendar, Sparkles, Plus, CalendarPlus, Type, FileText, Flag, Tag, Bell, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DatePicker } from '@/components/DatePicker'

function WeekPageContent() {
  const { user } = useAuth()
  const { tasks, loading } = useTasks()
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

  // Estado del modal
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja' | null>(null)
  const [tags, setTags] = useState<string>('')
  const [reminder, setReminder] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [creating, setCreating] = useState(false)

  // Abrir modal con fecha preseleccionada
  const openModalWithDate = (date: Date) => {
    setSelectedDate(date)
    setDueDate(date)
    setShowModal(true)
  }

  // Crear tarea
  const createTask = async () => {
    if (!title.trim() || !user) return

    setCreating(true)
    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate?.toISOString() || null,
          priority: priority,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()) : null,
          reminder_enabled: reminder,
          reminder_at: reminder && dueDate ? dueDate.toISOString() : null,
          completed: false,
          position: 0,
          created_at: getLocalTimestamp(),
          updated_at: getLocalTimestamp(),
          timezone_offset: getTimezoneOffset()
        })

      if (error) throw error

      // Resetear form
      setTitle('')
      setDescription('')
      setDueDate(null)
      setPriority(null)
      setTags('')
      setReminder(false)
      setShowAdvanced(false)
      setShowModal(false)
      setSelectedDate(null)

      toast.success('Tarea creada')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear tarea')
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

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
                  <button
                    onClick={() => openModalWithDate(group.date)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
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

                  <button
                    onClick={() => openModalWithDate(group.date)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors shadow-sm hover:shadow-md"
                  >
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

            <button
              onClick={() => {
                setShowModal(true)
                setDueDate(null)
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
            >
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

      {/* Modal para crear tarea */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CalendarPlus className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Nueva tarea
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowModal(false)
                    setTitle('')
                    setDescription('')
                    setDueDate(null)
                    setPriority(null)
                    setTimeEstimate(null)
                    setTags('')
                    setReminder(false)
                    setShowAdvanced(false)
                    setSelectedDate(null)
                  }}
                  disabled={creating}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="text-white" size={18} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Título *
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all"
                      placeholder="Ej: Llamar al cliente"
                      autoFocus
                    />
                    {!title.trim() && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Descripción
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all resize-none"
                      placeholder="Detalles adicionales..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Fecha de vencimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10" size={18} />
                    <DatePicker
                      value={dueDate}
                      onChange={(date) => setDueDate(date)}
                      placeholder="Seleccionar fecha"
                      buttonClassName="w-full pl-11 justify-start border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 px-4 py-3 rounded-xl transition-all"
                    />
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Prioridad
                  </label>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'alta' ? null : 'alta')}
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                        priority === 'alta'
                          ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700'
                      }`}
                    >
                      <Flag className="inline mr-2" size={16} />
                      Alta
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'media' ? null : 'media')}
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                        priority === 'media'
                          ? 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-200 dark:shadow-yellow-900/30'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-300 dark:hover:border-yellow-700'
                      }`}
                    >
                      <Flag className="inline mr-2" size={16} />
                      Media
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'baja' ? null : 'baja')}
                      type="button"
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                        priority === 'baja'
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 dark:shadow-green-900/30'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      <Flag className="inline mr-2" size={16} />
                      Baja
                    </motion.button>
                  </div>
                </div>

                {/* Opciones avanzadas (colapsable) */}
                <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    type="button"
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    Opciones avanzadas
                  </motion.button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 mt-4 overflow-hidden"
                      >
                        {/* Etiquetas */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Etiquetas
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                              type="text"
                              value={tags}
                              onChange={(e) => setTags(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all"
                              placeholder="trabajo, urgente, reunión (separadas por coma)"
                            />
                          </div>
                        </div>

                        {/* Recordatorio */}
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={reminder}
                                onChange={(e) => setReminder(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bell className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" size={18} />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Activar recordatorio
                              </span>
                            </div>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createTask}
                  disabled={creating || !title.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </span>
                  ) : (
                    'Crear tarea'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowModal(false)
                    setTitle('')
                    setDescription('')
                    setDueDate(null)
                    setPriority(null)
                    setTimeEstimate(null)
                    setTags('')
                    setReminder(false)
                    setShowAdvanced(false)
                    setSelectedDate(null)
                  }}
                  disabled={creating}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold transition-all disabled:opacity-50"
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
