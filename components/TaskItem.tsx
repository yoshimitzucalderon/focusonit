'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Edit3, Clock, FileText, ChevronDown, ChevronUp, Circle, CheckCircle2, Timer, GripVertical, Copy, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { isPast, isToday, differenceInDays } from 'date-fns'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { DatePicker } from './DatePicker'
import { useSelection } from '@/context/SelectionContext'
import { PomodoroTimer } from './PomodoroTimer'
import { getLocalTimestamp, toDateOnlyString, parseDateString, getTimezoneOffset } from '@/lib/utils/timezone'
import VoiceEditButton from './VoiceEditButton'
import { getTotalTimeForTask } from '@/lib/supabase/timeSessionQueries'
import { useSwipeable } from 'react-swipeable'

interface TaskItemProps {
  task: Task
  onDoubleClick?: () => void
}

interface VoiceTaskChanges {
  title?: string
  dueDate?: string | null
  description?: string | null
  priority?: 'baja' | 'media' | 'alta'
  tags?: string[]
}

export default function TaskItem({ task, onDoubleClick }: TaskItemProps) {
  const { selectedIds, toggleSelection } = useSelection()
  const isSelected = selectedIds.has(task.id)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(task.description || '')
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isDragMode, setIsDragMode] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // 10ms vibration
    }
  }

  // Long press handlers para activar modo drag
  const handleLongPressStart = () => {
    if (task.completed) return
    const timer = setTimeout(() => {
      setIsDragMode(true)
      triggerHaptic()
    }, 500) // 500ms para activar drag mode
    setLongPressTimer(timer)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Swipe handlers - solo si NO está en drag mode
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (task.completed || isDragMode) return
      const offset = eventData.deltaX
      setSwipeOffset(offset)

      if (offset < -50) {
        setSwipeDirection('left') // Swipe left = Completar (verde)
      } else if (offset > 50) {
        setSwipeDirection('right') // Swipe right = Eliminar (rojo)
      } else {
        setSwipeDirection(null)
      }
    },
    onSwipedLeft: async () => {
      if (task.completed || isDragMode) return
      // Completar tarea al swipe IZQUIERDA (verde)
      triggerHaptic()
      await toggleComplete()
      setSwipeOffset(0)
      setSwipeDirection(null)
    },
    onSwipedRight: async () => {
      if (task.completed || isDragMode) return
      // Eliminar tarea al swipe DERECHA (rojo)
      triggerHaptic()
      await deleteTask()
      setSwipeOffset(0)
      setSwipeDirection(null)
    },
    onSwiped: () => {
      if (swipeDirection !== 'left') {
        setSwipeOffset(0)
        setSwipeDirection(null)
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: isDragMode ? false : true, // Permitir scroll cuando está en drag mode
  })

  const hasDescription = task.description && task.description.trim().length > 0
  const isLongDescription = (task.description?.length || 0) > 150

  // Toggle completar tarea con actualización optimista
  const toggleComplete = async () => {
    const toastId = toast.loading('Actualizando...')

    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? getLocalTimestamp() : null,
          updated_at: getLocalTimestamp()
        })
        .eq('id', task.id)

      if (error) throw error

      toast.success(task.completed ? 'Tarea marcada como pendiente' : 'Tarea completada', { id: toastId })
    } catch (error: any) {
      toast.error('Error al actualizar tarea', { id: toastId })
      console.error(error)
    }
  }

  // Cargar tiempo total acumulado
  useEffect(() => {
    const loadTotalTime = async () => {
      const total = await getTotalTimeForTask(task.id)
      setTotalTimeSeconds(total)
    }
    loadTotalTime()
  }, [task.id])

  // Desactivar drag mode al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (isDragMode) {
        setIsDragMode(false)
      }
    }

    if (isDragMode) {
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDragMode])

  // Formatear tiempo total
  const formatTotalTime = (seconds: number) => {
    if (seconds === 0) return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Editar título
  const saveTitle = async () => {
    if (title.trim() === task.title || !title.trim()) {
      setEditing(false)
      setTitle(task.title)
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          title: title.trim(),
          updated_at: getLocalTimestamp()
        })
        .eq('id', task.id)

      if (error) throw error

      setEditing(false)
      toast.success('Tarea actualizada')
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
      console.error(error)
    }
  }

  // Cambiar fecha
  const updateDate = async (newDate: Date | null) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          due_date: newDate ? toDateOnlyString(newDate) : null,
          updated_at: getLocalTimestamp(),
          timezone_offset: getTimezoneOffset(),
          // Activar sincronización automática con Google Calendar si tiene fecha
          google_calendar_sync: newDate ? true : task.google_calendar_sync
        })
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error

      // 🔄 Sincronizar inmediatamente con Google Calendar si tiene fecha
      if (data && (data as any).google_calendar_sync && (data as any).due_date) {
        fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: [(data as any).id] }),
        }).catch(err => {
          console.error('Error syncing task date change with Google Calendar:', err)
        })
      }

      toast.success(newDate ? 'Fecha actualizada' : 'Fecha eliminada')
    } catch (error: any) {
      toast.error('Error al actualizar fecha')
      console.error(error)
    }
  }

  // Guardar descripción
  const saveDescription = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          description: descriptionValue.trim() || null,
          updated_at: getLocalTimestamp()
        })
        .eq('id', task.id)

      if (error) throw error

      setIsEditingDescription(false)
      toast.success('Descripción actualizada')
    } catch (error: any) {
      toast.error('Error al actualizar descripción')
      console.error(error)
    }
  }

  const cancelEditDescription = () => {
    setDescriptionValue(task.description || '')
    setIsEditingDescription(false)
  }

  // Handler para edición por voz
  const handleVoiceEdit = async (changes: VoiceTaskChanges) => {
    try {
      const updateData: any = {
        updated_at: getLocalTimestamp()
      }

      // Mapear campos del cambio a formato de DB
      if (changes.title !== undefined) {
        updateData.title = changes.title
        setTitle(changes.title)
      }
      if (changes.description !== undefined) {
        updateData.description = changes.description
        setDescriptionValue(changes.description || '')
      }
      if (changes.dueDate !== undefined) {
        updateData.due_date = changes.dueDate
        updateData.timezone_offset = getTimezoneOffset()
      }
      if (changes.priority !== undefined) {
        updateData.priority = changes.priority
      }
      if (changes.tags !== undefined) {
        updateData.tags = changes.tags
      }

      console.log('📝 Actualizando tarea con datos:', updateData)

      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update(updateData)
        .eq('id', task.id)

      if (error) throw error

      toast.success('Tarea actualizada por voz')
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
      console.error(error)
    }
  }


  // Focus en input al entrar en modo edición
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editing])

  // Verificar si está atrasada y calcular días
  const taskDueDate = task.due_date ? parseDateString(task.due_date) : null
  const isOverdue =
    taskDueDate && !task.completed && isPast(taskDueDate) && !isToday(taskDueDate)

  const daysOverdue = isOverdue && taskDueDate
    ? differenceInDays(new Date(), taskDueDate)
    : 0

  // Determinar color del borde izquierdo basado en prioridad
  const getPriorityColor = () => {
    if (isOverdue) return 'border-l-red-500 dark:border-l-red-400'
    switch (task.priority) {
      case 'alta':
        return 'border-l-red-400 dark:border-l-red-500'
      case 'media':
        return 'border-l-yellow-400 dark:border-l-yellow-500'
      case 'baja':
        return 'border-l-green-400 dark:border-l-green-500'
      default:
        return 'border-l-gray-300 dark:border-l-gray-600'
    }
  }

  // Función para duplicar tarea
  const duplicateTask = async () => {
    try {
      const { data, error} = await supabase
        .from('tasks')
        .insert({
          title: `${task.title} (copia)`,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          user_id: task.user_id,
          created_at: getLocalTimestamp(),
          updated_at: getLocalTimestamp(),
          // Activar sincronización automática si tiene fecha
          google_calendar_sync: task.due_date ? true : false
        } as any)
        .select()
        .single()

      if (error) throw error

      // 🔄 Sincronizar inmediatamente con Google Calendar si tiene fecha
      if (data && (data as any).google_calendar_sync && (data as any).due_date) {
        fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: [(data as any).id] }),
        }).catch(err => {
          console.error('Error syncing duplicated task with Google Calendar:', err)
        })
      }

      toast.success('Tarea duplicada')
    } catch (error) {
      toast.error('Error al duplicar tarea')
      console.error(error)
    }
  }

  // Función para eliminar tarea
  const deleteTask = async () => {
    if (!confirm('¿Eliminar esta tarea?')) return

    try {
      // Si la tarea está sincronizada con Google Calendar, eliminar el evento primero
      if (task.google_event_id && task.google_calendar_sync) {
        console.log('🗑️  Deleting Google Calendar event:', task.google_event_id)

        // Llamar a la API para eliminar el evento de Google Calendar
        const deleteEventResponse = await fetch('/api/calendar/delete-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: task.google_event_id
          }),
        })

        if (!deleteEventResponse.ok) {
          console.warn('Failed to delete Google Calendar event, but continuing with task deletion')
        } else {
          console.log('✅ Google Calendar event deleted')
        }
      }

      // Eliminar la tarea de Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error
      toast.success('Tarea eliminada')
    } catch (error) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      {/* Swipe Actions - Minimalistas iOS-style */}
      <AnimatePresence>
        {/* Swipe Left - Completar (verde) */}
        {swipeDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-0"
          >
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
        )}

        {/* Swipe Right - Eliminar (rojo) */}
        {swipeDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-0"
          >
            <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Trash2 size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Task Card */}
      <motion.div
        {...handlers}
        onDoubleClick={() => {
          if (!task.completed && onDoubleClick) {
            onDoubleClick()
          }
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: 1,
          y: 0,
          x: swipeOffset
        }}
        exit={{ opacity: 0, x: -100 }}
        transition={{
          duration: 0.2,
          x: { type: "spring", stiffness: 300, damping: 30 }
        }}
        className={`task-item group relative flex items-start gap-2 p-3 rounded-xl border border-l-4 transition-all duration-300 touch-pan-y
          ${task.completed
            ? 'opacity-50 bg-gray-50/80 dark:bg-slate-800/30 border-gray-200 dark:border-gray-700 border-l-gray-300 dark:border-l-gray-600'
            : `bg-white dark:bg-slate-800/90 border-gray-200 dark:border-slate-700/60
               hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 dark:hover:shadow-lg
               md:hover:-translate-y-0.5 md:hover:bg-gray-50 dark:md:hover:bg-slate-700/90
               ${getPriorityColor()}`
          }
          ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-md' : ''}
          ${isDragMode ? 'ring-2 ring-purple-500 dark:ring-purple-400 shadow-xl' : ''}
        `}
      >
      {/* Drag Handle - solo visible en modo drag */}
      {!task.completed && isDragMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-0.5"
        >
          <GripVertical className="w-5 h-5 text-purple-500 dark:text-purple-400" />
        </motion.div>
      )}

      {/* Quick Actions - visible solo en hover */}
      {!task.completed && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 0, x: 10 }}
          className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-200 z-10"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={duplicateTask}
            className="p-1.5 rounded-md bg-white/80 dark:bg-slate-600/80 hover:bg-blue-50 dark:hover:bg-blue-900/50 border border-gray-200 dark:border-gray-600 shadow-sm backdrop-blur-sm transition-colors"
            title="Duplicar tarea"
          >
            <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={deleteTask}
            className="p-1.5 rounded-md bg-white/80 dark:bg-slate-600/80 hover:bg-red-50 dark:hover:bg-red-900/50 border border-gray-200 dark:border-gray-600 shadow-sm backdrop-blur-sm transition-colors"
            title="Eliminar tarea"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
          </motion.button>
        </motion.div>
      )}
      {/* Checkbox mejorado con animación - Optimizado para mobile */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          toggleSelection(task.id)
        }}
        className="flex-shrink-0 relative w-8 h-8 md:w-6 md:h-6 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isSelected ? 'Deseleccionar tarea' : 'Seleccionar tarea'}
      >
        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.div
              key="checked"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <motion.svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <motion.path
                    d="M2 7L5.5 10.5L12 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="relative">
            <input
              ref={editInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveTitle()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditing(false)
                  setTitle(task.title)
                }
              }}
              className="w-full px-3 py-2 border-2 border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-slate-700 dark:text-white"
            />
            {/* Indicador de edición */}
            <div className="absolute -top-6 left-0 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
              <Edit3 className="w-3 h-3" />
              <span>Editando... (Enter: guardar, Esc: cancelar)</span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <h3
              onDoubleClick={() => !task.completed && setEditing(true)}
              className={`flex-1 text-sm sm:text-base transition-all duration-200 text-gray-900 dark:text-white break-words pr-12 ${
                task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400'
              } ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
            >
              {task.title}
            </h3>
            {/* Badge de días atrasados */}
            {isOverdue && daysOverdue > 0 && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white text-xs font-semibold rounded-full shadow-sm"
              >
                <Clock className="w-3 h-3" />
                {daysOverdue}d
              </motion.span>
            )}
          </div>
        )}

        {/* Descripción - Vista Colapsada */}
        {hasDescription && !isExpanded && !isEditingDescription && (
          <div className="mt-2">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words whitespace-pre-wrap">
              {task.description}
            </p>
            {isLongDescription && (
              <button
                onClick={() => setIsExpanded(true)}
                className="mt-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 active:text-primary-800"
              >
                Ver más <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Descripción - Vista Expandida */}
        <AnimatePresence>
          {hasDescription && isExpanded && !isEditingDescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 bg-gray-50 dark:bg-slate-700/50 rounded-md p-2.5 sm:p-3 border border-gray-200 dark:border-gray-600"
            >
              {/* En mobile: Sin scroll interno, muestra todo */}
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words sm:max-h-96 sm:overflow-y-auto sm:description-scroll">
                {task.description}
              </p>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-800 font-medium flex items-center gap-1 min-h-[44px] sm:min-h-0 sm:py-0 py-2"
                >
                  <ChevronUp className="w-3.5 h-3.5" /> Ver menos
                </button>
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 active:text-primary-800 font-medium flex items-center gap-1 min-h-[44px] sm:min-h-0 sm:py-0 py-2"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Descripción - Modo Edición */}
        <AnimatePresence>
          {isEditingDescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2"
            >
              <textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Agrega detalles..."
                className="w-full px-3 py-2 text-sm border-2 border-primary-500 dark:border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-slate-700 dark:text-white resize-none"
                rows={5}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    cancelEditDescription()
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveDescription}
                  className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelEditDescription}
                  className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] sm:min-h-0"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agregar descripción si no existe */}
        {!hasDescription && !isEditingDescription && (
          <button
            onClick={() => setIsEditingDescription(true)}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-1 underline-offset-2 flex items-center gap-1 font-medium transition-colors"
          >
            <FileText className="w-3 h-3" /> Agregar detalles
          </button>
        )}

        {/* Fecha y Timer en la misma fila - Comprimidos */}
        <div className="mt-1 flex items-center gap-2 flex-wrap scale-90 origin-left">
          {/* Fecha con DatePicker */}
          <DatePicker
            value={taskDueDate}
            onChange={updateDate}
            placeholder="Agregar fecha"
          />

          {/* Voice Edit Button - visible en todas las resoluciones */}
          {!task.completed && (
            <VoiceEditButton
              taskId={task.id}
              currentTask={{
                title: task.title,
                dueDate: task.due_date,
                description: task.description,
                priority: task.priority || 'media',
                tags: task.tags
              }}
              onEditConfirmed={handleVoiceEdit}
            />
          )}

          {/* Pomodoro Timer - solo si la tarea no está completada */}
          {!task.completed && (
            <PomodoroTimer
              taskId={task.id}
              userId={task.user_id}
            />
          )}

          {/* Tiempo total acumulado con badge mejorado */}
          {totalTimeSeconds > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-900/40 dark:via-blue-800/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700/50 shadow-sm backdrop-blur-sm"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTotalTime(totalTimeSeconds)}</span>
            </motion.div>
          )}

          {/* Etiquetas */}
          {task.tags && task.tags.length > 0 && (
            <>
              {task.tags.slice(0, 2).map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full"
                >
                  <span>#{tag}</span>
                </motion.div>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">+{task.tags.length - 2}</span>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  )
}