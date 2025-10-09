'use client'

import { useState } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { X, Clock, Calendar as CalendarIcon, Trash2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface TimeScheduleModalProps {
  task: Task
  onClose: () => void
  onSave: () => void
}

export default function TimeScheduleModal({ task, onClose, onSave }: TimeScheduleModalProps) {
  const [startTime, setStartTime] = useState(task.start_time?.slice(0, 5) || '09:00')
  const [endTime, setEndTime] = useState(task.end_time?.slice(0, 5) || '10:00')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    // Validar que end_time sea posterior a start_time
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (endMinutes <= startMinutes) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary fix for Supabase type inference issue with new columns
        .update({
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          is_all_day: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      toast.success('Horario actualizado')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating task time:', error)
      toast.error('Error al actualizar horario')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSchedule = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary fix for Supabase type inference issue with new columns
        .update({
          start_time: null,
          end_time: null,
          is_all_day: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      toast.success('Horario eliminado')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error removing schedule:', error)
      toast.error('Error al eliminar horario')
    } finally {
      setSaving(false)
    }
  }

  // Calcular duración
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  const durationHours = Math.floor(durationMinutes / 60)
  const durationMins = durationMinutes % 60

  return (
    <AnimatePresence>
      {/* Backdrop mejorado con blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header con gradiente mejorado */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-6 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Editar Horario</h3>
                  <p className="text-primary-100 text-sm mt-0.5">Ajusta hora de inicio y fin</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200"
              >
                <X className="text-white" size={20} />
              </motion.button>
            </div>
          </div>

          {/* Body con mejor espaciado */}
          <div className="p-8 space-y-6">
            {/* Título de la tarea con mejor diseño */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarIcon size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tarea</p>
                  <p className="font-semibold text-gray-900 dark:text-white leading-snug">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{task.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hora de inicio con diseño mejorado */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Hora de inicio
              </label>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all outline-none font-medium text-lg"
                />
              </div>
            </div>

            {/* Hora de fin con diseño mejorado */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Hora de fin
              </label>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all outline-none font-medium text-lg"
                />
              </div>
            </div>

            {/* Duración calculada con animación */}
            {durationMinutes > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-success-50 to-success-100/50 dark:from-success-900/20 dark:to-success-800/10 rounded-2xl p-4 border border-success-200 dark:border-success-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-success-600 dark:text-success-400" />
                    <span className="text-sm font-semibold text-success-700 dark:text-success-400">
                      Duración total
                    </span>
                  </div>
                  <span className="text-lg font-bold text-success-900 dark:text-success-300">
                    {durationHours > 0 && `${durationHours}h `}
                    {durationMins > 0 && `${durationMins}min`}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Advertencia mejorada */}
            {durationMinutes <= 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-danger-50 to-danger-100/50 dark:from-danger-900/20 dark:to-danger-800/10 rounded-2xl p-4 border border-danger-200 dark:border-danger-800"
              >
                <p className="text-sm font-medium text-danger-700 dark:text-danger-400 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  La hora de fin debe ser posterior a la hora de inicio
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer con mejor diseño */}
          <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRemoveSchedule}
              disabled={saving}
              className="px-5 py-3 rounded-xl font-semibold text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900/50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-danger"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Quitar horario</span>
              <span className="sm:hidden">Quitar</span>
            </motion.button>

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={saving}
              className="px-5 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 shadow-sm"
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 8px 24px 0 rgb(99 102 241 / 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || durationMinutes <= 0}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 shadow-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Guardando...
                </span>
              ) : (
                'Guardar'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
