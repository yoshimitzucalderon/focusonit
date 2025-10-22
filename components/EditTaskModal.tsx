'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CalendarPlus, FileText, Flag, Tag, Bell, X, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { DatePicker } from './DatePicker'
import { parseDateString, toDateOnlyString, getLocalTimestamp, getTimezoneOffset } from '@/lib/utils/timezone'

interface EditTaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: (updatedTask: Task) => void
}

export default function EditTaskModal({ task, isOpen, onClose, onTaskUpdated }: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja' | null>(null)
  const [tags, setTags] = useState<string>('')
  const [reminder, setReminder] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  // Cargar datos de la tarea cuando se abre el modal
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.due_date ? parseDateString(task.due_date) : null)
      setPriority(task.priority)
      setTags(task.tags?.join(', ') || '')
      setReminder(task.reminder_enabled || false)
      setShowAdvanced(Boolean(task.tags?.length || task.reminder_enabled))
    }
  }, [task, isOpen])

  const handleUpdate = async () => {
    if (!task || !title.trim()) return

    setUpdating(true)

    const updates = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate ? toDateOnlyString(dueDate) : null,
      priority: priority,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()) : null,
      reminder_enabled: reminder,
      reminder_at: reminder && dueDate ? dueDate.toISOString() : null,
      updated_at: getLocalTimestamp(),
      timezone_offset: getTimezoneOffset()
    }

    // Mostrar feedback inmediato
    const toastId = toast.loading('Guardando cambios...')

    try {
      const { data, error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update(updates)
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error

      // ✅ ACTUALIZACIÓN OPTIMISTA INMEDIATA - Llamar callback con la tarea actualizada
      if (data && onTaskUpdated) {
        onTaskUpdated(data as Task)
      }

      // 🔄 Sincronizar con Google Calendar si está conectado y la tarea tiene google_calendar_sync activado
      const updatedTask = data as Task
      if (updatedTask.google_calendar_sync && updatedTask.google_event_id) {
        // Sincronizar en segundo plano (no bloquear la UI)
        fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: [updatedTask.id] }),
        }).catch(err => {
          console.error('Error syncing with Google Calendar:', err)
          // No mostrar error al usuario, solo log
        })
      }

      // Cerrar modal después de guardar exitosamente
      onClose()
      toast.success('Tarea actualizada correctamente', { id: toastId })
    } catch (error: any) {
      toast.error('Error al actualizar tarea', { id: toastId })
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setDueDate(null)
    setPriority(null)
    setTags('')
    setReminder(false)
    setShowAdvanced(false)
    onClose()
  }

  if (!task) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header - FIJO */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 pr-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Edit3 className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Editar tarea</h3>
                  <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Actualiza los detalles</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={updating}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X className="text-white" size={18} />
              </motion.button>
            </div>

            {/* Body - SCROLLABLE */}
            <div
              className="overflow-y-scroll overflow-x-hidden p-3 sm:p-6 space-y-3 sm:space-y-5 pb-20"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                flex: '1 1 0',
                minHeight: 0,
                maxHeight: 'calc(90vh - 240px)'
              }}
            >
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all outline-none"
                  placeholder="¿Qué necesitas hacer?"
                  autoFocus
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Descripción
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all resize-none outline-none"
                    placeholder="Notas, contexto, detalles..."
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
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPriority(priority === 'alta' ? null : 'alta')}
                    type="button"
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      priority === 'alta'
                        ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Flag className="inline mr-1.5" size={16} />
                    Alta
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPriority(priority === 'media' ? null : 'media')}
                    type="button"
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      priority === 'media'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Flag className="inline mr-1.5" size={16} />
                    Media
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPriority(priority === 'baja' ? null : 'baja')}
                    type="button"
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      priority === 'baja'
                        ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Flag className="inline mr-1.5" size={16} />
                    Baja
                  </motion.button>
                </div>
              </div>

              {/* Opciones avanzadas */}
              <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
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
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all outline-none"
                            placeholder="trabajo, urgente, reunión (separadas por coma)"
                            style={{ caretColor: '#3b82f6' }}
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

            {/* Footer - FIJO */}
            <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ minHeight: '70px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                type="button"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdate}
                disabled={updating || !title.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                type="button"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Edit3 size={18} />
                    Guardar cambios
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
