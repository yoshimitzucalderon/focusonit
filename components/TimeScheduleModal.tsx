'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { X, Clock, Tag, AlertCircle, Trash2, Sparkles } from 'lucide-react'
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
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta'>(task.priority || 'media')
  const [tags, setTags] = useState<string[]>(task.tags || [])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Popular tags para sugerencias
  const popularTags = ['trabajo', 'estudio', 'personal', 'urgente', 'reunión', 'proyecto']
  const suggestedTags = popularTags.filter(tag => !tags.includes(tag))

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [startTime, endTime, priority, tags])

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
        // @ts-ignore
        .update({
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          priority,
          tags,
          is_all_day: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      toast.success('Tarea actualizada')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Error al actualizar tarea')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSchedule = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore
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

  const addTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove))
  }

  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  // Calcular duración
  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

    if (durationMinutes <= 0) return { valid: false, text: 'Hora inválida' }

    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours === 0) return { valid: true, text: `${minutes}min`, minutes: durationMinutes }
    if (minutes === 0) return { valid: true, text: `${hours}h`, minutes: durationMinutes }
    return { valid: true, text: `${hours}h ${minutes}min`, minutes: durationMinutes }
  }

  const duration = calculateDuration()

  // Estilos de prioridad
  const getPriorityStyles = (p: 'baja' | 'media' | 'alta') => {
    const isActive = priority === p
    switch (p) {
      case 'alta':
        return isActive
          ? 'bg-danger-100 text-danger-700 ring-2 ring-danger-500 dark:bg-danger-900/30 dark:text-danger-400 dark:ring-danger-500'
          : 'bg-gray-100 text-gray-600 hover:bg-danger-50 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-danger-900/20'
      case 'media':
        return isActive
          ? 'bg-warning-100 text-warning-700 ring-2 ring-warning-500 dark:bg-warning-900/30 dark:text-warning-400 dark:ring-warning-500'
          : 'bg-gray-100 text-gray-600 hover:bg-warning-50 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-warning-900/20'
      case 'baja':
        return isActive
          ? 'bg-success-100 text-success-700 ring-2 ring-success-500 dark:bg-success-900/30 dark:text-success-400 dark:ring-success-500'
          : 'bg-gray-100 text-gray-600 hover:bg-success-50 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-success-900/20'
    }
  }

  const getPriorityEmoji = (p: 'baja' | 'media' | 'alta') => {
    switch (p) {
      case 'alta': return '🔥'
      case 'media': return '⚡'
      case 'baja': return '✓'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >

          {/* HEADER COMPACTO */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg leading-tight">Editar Horario</h3>
                <p className="text-primary-100 text-xs">Ajusta hora, prioridad y etiquetas</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* CONTENIDO DEL MODAL */}
          <div className="p-6 space-y-4">

            {/* TÍTULO Y DESCRIPCIÓN DE LA TAREA */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 leading-snug">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SELECTOR DE PRIORIDAD */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Prioridad
              </label>
              <div className="flex gap-2">
                {(['baja', 'media', 'alta'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${getPriorityStyles(p)}
                    `}
                  >
                    <span className="mr-1.5">{getPriorityEmoji(p)}</span>
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* HORARIOS - DISEÑO COMPACTO */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="
                    w-full px-3 py-2 text-sm
                    border-2 border-gray-200 dark:border-gray-600
                    rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800
                    dark:bg-gray-700 dark:text-white
                    transition-all outline-none
                  "
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="
                    w-full px-3 py-2 text-sm
                    border-2 border-gray-200 dark:border-gray-600
                    rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800
                    dark:bg-gray-700 dark:text-white
                    transition-all outline-none
                  "
                />
              </div>
            </div>

            {/* DURACIÓN CALCULADA - INTEGRADA */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                ${!duration.valid
                  ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
                  : 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                }
              `}
            >
              {duration.valid ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Duración: {duration.text}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>{duration.text}</span>
                </>
              )}
            </motion.div>

            {/* ETIQUETAS */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Etiquetas
              </label>

              {/* Etiquetas existentes */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="
                        inline-flex items-center gap-1.5
                        bg-primary-100 text-primary-700
                        dark:bg-primary-900/30 dark:text-primary-400
                        px-2.5 py-1 rounded-full text-xs font-medium
                      "
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(idx)}
                        className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Input para nueva etiqueta */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Agregar etiqueta..."
                  className="
                    flex-1 px-3 py-2 text-sm
                    border-2 border-gray-200 dark:border-gray-600
                    rounded-lg
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800
                    dark:bg-gray-700 dark:text-white
                    transition-all outline-none
                  "
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="
                    px-4 py-2 bg-gray-100 hover:bg-gray-200
                    dark:bg-gray-700 dark:hover:bg-gray-600
                    text-gray-700 dark:text-gray-300
                    rounded-lg text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Agregar
                </button>
              </div>

              {/* Sugerencias de etiquetas populares */}
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Sugerencias:</span>
                  {suggestedTags.slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addSuggestedTag(tag)}
                      className="
                        text-xs px-2 py-1
                        bg-gray-100 hover:bg-primary-100
                        dark:bg-gray-700 dark:hover:bg-primary-900/30
                        text-gray-600 hover:text-primary-700
                        dark:text-gray-400 dark:hover:text-primary-400
                        rounded-full transition-colors
                      "
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NOTA DE ATAJOS */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs">Ctrl+Enter</kbd>
                {' '}para guardar •
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs ml-1">Esc</kbd>
                {' '}para cerrar
              </span>
            </div>
          </div>

          {/* FOOTER CON BOTONES COMPACTOS */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex items-center justify-between">

            {/* Botón eliminar a la izquierda */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRemoveSchedule}
              disabled={saving}
              className="
                flex items-center gap-2
                px-3 py-2
                text-danger-600 dark:text-danger-400
                hover:bg-danger-50 dark:hover:bg-danger-900/20
                rounded-lg text-sm font-medium
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Quitar horario</span>
              <span className="sm:hidden">Quitar</span>
            </motion.button>

            {/* Botones principales */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={saving}
                className="
                  px-4 py-2
                  bg-white dark:bg-gray-700
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-600
                  rounded-lg text-sm font-medium
                  transition-all
                  border border-gray-200 dark:border-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 4px 12px 0 rgb(99 102 241 / 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !duration.valid}
                className="
                  px-5 py-2
                  bg-gradient-to-r from-primary-600 to-purple-600
                  text-white rounded-lg text-sm font-semibold
                  hover:from-primary-700 hover:to-purple-700
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  shadow-sm hover:shadow-lg
                "
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
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
