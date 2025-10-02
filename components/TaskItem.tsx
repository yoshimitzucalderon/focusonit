'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Check, Trash2, Edit3, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import { DatePicker } from './DatePicker'

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [isCompleting, setIsCompleting] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(task.description || '')
  const editInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const hasDescription = task.description && task.description.trim().length > 0
  const isLongDescription = (task.description?.length || 0) > 150

  // Toggle completado con animación
  const toggleComplete = async () => {
    setIsCompleting(true)

    // Pequeño delay para mostrar animación antes de actualizar
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            completed: !task.completed,
            completed_at: !task.completed ? new Date().toISOString() : null,
          })
          .eq('id', task.id)

        if (error) throw error
      } catch (error: any) {
        toast.error('Error al actualizar tarea')
        console.error(error)
      } finally {
        setIsCompleting(false)
      }
    }, 200)
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
        .update({ title: title.trim() })
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
        .update({
          due_date: newDate ? newDate.toISOString() : null,
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
        .update({ description: descriptionValue.trim() || null })
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

  // Eliminar tarea
  const deleteTask = async (skipConfirm = false) => {
    if (!skipConfirm && !confirm('¿Eliminar esta tarea?')) return

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)

      if (error) throw error

      toast.success('Tarea eliminada')
    } catch (error: any) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

  // Handler para swipe (estilo iPhone)
  const handleDrag = (event: any, info: PanInfo) => {
    setDragX(info.offset.x)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeVelocity = info.velocity.x
    const swipeDistance = info.offset.x

    // Threshold más bajo y más sensible a velocidad (como iPhone)
    if (swipeVelocity < -300 || swipeDistance < -80) {
      // Eliminar con animación
      deleteTask(true)
    } else {
      // Volver a posición inicial
      setDragX(0)
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
  const isOverdue =
    task.due_date && !task.completed && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))

  const daysOverdue = isOverdue && task.due_date
    ? differenceInDays(new Date(), new Date(task.due_date))
    : 0

  return (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: -100, right: 0 }}
      dragElastic={0}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: isCompleting ? 0.3 : 1,
        y: 0,
        scale: isCompleting ? 0.98 : 1,
        x: dragX
      }}
      exit={{ opacity: 0, x: -400, transition: { duration: 0.25, ease: 'easeIn' } }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 0.5
      }}
      className={`task-item group relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
        task.completed
          ? 'opacity-60 bg-gray-50 dark:bg-slate-800/50'
          : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-l-4'
      } ${
        isOverdue
          ? 'border-red-300 dark:border-red-800 border-l-4 border-l-red-500'
          : 'border-gray-200 dark:border-gray-700 hover:border-l-primary-500'
      }`}
    >
      {/* Botón de eliminar que aparece detrás */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-end pr-4 rounded-r-lg"
        style={{
          opacity: Math.min(Math.abs(dragX) / 80, 1),
          pointerEvents: 'none'
        }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
          task.completed
            ? 'bg-green-500 border-green-500 scale-110'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:scale-110'
        }`}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </button>

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
              className={`flex-1 text-sm sm:text-base transition-all duration-200 dark:text-white break-words ${
                task.completed ? 'line-through' : 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400'
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
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-64 sm:max-h-96 overflow-y-auto break-words description-scroll">
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

        {/* Fecha con DatePicker */}
        <div className="mt-2">
          <DatePicker
            value={task.due_date ? new Date(task.due_date) : null}
            onChange={updateDate}
            placeholder="Agregar fecha"
          />
        </div>
      </div>

      {/* Acciones */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        {/* Editar */}
        {!task.completed && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
            title="Editar (doble click)"
          >
            <Edit3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </button>
        )}

        {/* Eliminar */}
        <button
          onClick={() => deleteTask()}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
          title="Eliminar (swipe left)"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </motion.div>
    </motion.div>
  )
}