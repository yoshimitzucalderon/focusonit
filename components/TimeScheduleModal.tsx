'use client'

import { useState } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { X, Clock, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Editar Horario</h3>
                <p className="text-blue-100 text-sm">Ajusta hora de inicio y fin</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="text-white" size={18} />
            </motion.button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Título de la tarea */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tarea</p>
              <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{task.description}</p>
              )}
            </div>

            {/* Hora de inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Hora de inicio
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Hora de fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Hora de fin
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Duración calculada */}
            {durationMinutes > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Duración
                </span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  {durationHours > 0 && `${durationHours}h `}
                  {durationMins > 0 && `${durationMins}min`}
                </span>
              </div>
            )}

            {/* Advertencia si la hora de fin es menor o igual a la de inicio */}
            {durationMinutes <= 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ La hora de fin debe ser posterior a la hora de inicio
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRemoveSchedule}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border-2 border-red-300 dark:border-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Quitar horario
            </motion.button>

            <div className="flex-1" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 border-2 border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || durationMinutes <= 0}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
