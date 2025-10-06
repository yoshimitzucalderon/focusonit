'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Edit3, Clock, FileText, ChevronDown, ChevronUp, Circle, CheckCircle2, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import { isPast, isToday, differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { DatePicker } from './DatePicker'
import { useSelection } from '@/context/SelectionContext'
import { PomodoroTimer } from './PomodoroTimer'
import { getLocalTimestamp, toDateOnlyString, parseDateString, getTimezoneOffset } from '@/lib/utils/timezone'
import VoiceEditButton from './VoiceEditButton'
import { getTotalTimeForTask } from '@/lib/supabase/timeSessionQueries'

interface TaskItemProps {
  task: Task
}

interface VoiceTaskChanges {
  title?: string
  dueDate?: string | null
  description?: string | null
  priority?: 'baja' | 'media' | 'alta'
}

export default function TaskItem({ task }: TaskItemProps) {
  const { selectedIds, toggleSelection } = useSelection()
  const isSelected = selectedIds.has(task.id)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(task.description || '')
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0)
  const editInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const hasDescription = task.description && task.description.trim().length > 0
  const isLongDescription = (task.description?.length || 0) > 150

  // Cargar tiempo total acumulado
  useEffect(() => {
    const loadTotalTime = async () => {
      const total = await getTotalTimeForTask(task.id)
      setTotalTimeSeconds(total)
    }
    loadTotalTime()
  }, [task.id])

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
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          due_date: newDate ? toDateOnlyString(newDate) : null,
          updated_at: getLocalTimestamp(),
          timezone_offset: getTimezoneOffset()
        })
        .eq('id', task.id)

      if (error) throw error

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
    if (isOverdue) return 'border-l-red-500'
    switch (task.priority) {
      case 'alta':
        return 'border-l-red-400'
      case 'media':
        return 'border-l-yellow-400'
      case 'baja':
        return 'border-l-green-400'
      default:
        return 'border-l-gray-300'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className={`task-item group relative flex items-start gap-4 p-5 rounded-xl border border-l-4 transition-all duration-300
        ${task.completed
          ? 'opacity-50 bg-gray-50/80 dark:bg-slate-800/30 border-gray-200 dark:border-gray-700 border-l-gray-300'
          : `bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700
             hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20
             hover:-translate-y-0.5 hover:bg-gray-50 dark:hover:bg-slate-750
             ${getPriorityColor()}`
        }
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-md' : ''}
      `}
    >
      {/* Checkbox mejorado con animación */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          toggleSelection(task.id)
        }}
        className="flex-shrink-0 mt-0.5 relative w-6 h-6"
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
              className={`flex-1 text-sm sm:text-base transition-all duration-200 text-gray-900 dark:text-white break-words ${
                task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400'
              } ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
            >
              {task.title}
            </h3>
            {/* Indicador de descripción */}
            {hasDescription && !isExpanded && !isEditingDescription && (
              <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            {/* Badge de días atrasados */}
            {isOverdue && daysOverdue > 0 && (
              <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                <Clock className="w-3 h-3" />
                {daysOverdue}d
              </span>
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
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <FileText className="w-3 h-3" /> Agregar detalles
          </button>
        )}

        {/* Fecha y Timer en la misma fila */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
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
                priority: task.priority || 'media'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-700"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{formatTotalTime(totalTimeSeconds)}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}