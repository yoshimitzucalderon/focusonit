'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Check, Trash2, Edit3, Clock, FileText, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, PanInfo, AnimatePresence, useMotionValue } from 'framer-motion'
import { DatePicker } from './DatePicker'

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState(task.description || '')
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const hasDescription = task.description && task.description.trim().length > 0
  const isLongDescription = (task.description?.length || 0) > 150

  // Configuración del swipe
  const x = useMotionValue(0)
  const SNAP_CLOSED = 0
  const SNAP_FULL = -160
  const SWIPE_THRESHOLD = 20

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
  const deleteTask = async () => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)

      if (error) throw error

      toast.success('Tarea eliminada')
      closeSwipe()
    } catch (error: any) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

  // Handler para swipe estilo iOS
  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Si el movimiento es muy pequeño, ignorar
    if (Math.abs(offset) < SWIPE_THRESHOLD) {
      x.set(SNAP_CLOSED)
      setIsSwipeOpen(false)
      return
    }

    // Determinar a qué snap point ir
    if (velocity < -500 || offset < -80) {
      // Swipe rápido o largo a la izquierda - abrir completamente
      x.set(SNAP_FULL)
      setIsSwipeOpen(true)
    } else {
      // Cerrar
      x.set(SNAP_CLOSED)
      setIsSwipeOpen(false)
    }
  }

  const closeSwipe = () => {
    x.set(SNAP_CLOSED)
    setIsSwipeOpen(false)
  }

  const handleCompleteFromSwipe = () => {
    toggleComplete()
    closeSwipe()
  }

  const handleEditFromSwipe = () => {
    setEditing(true)
    closeSwipe()
  }

  const handleDeleteFromSwipe = () => {
    setShowDeleteConfirm(true)
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
    <div className="relative overflow-hidden rounded-lg">
      {/* Botones de acción (detrás del swipe) */}
      <div className="absolute inset-y-0 right-0 flex">
        {/* Botón Completar */}
        <button
          onClick={handleCompleteFromSwipe}
          className="w-[53px] flex flex-col items-center justify-center bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">
            {task.completed ? 'Reabrir' : 'Hecho'}
          </span>
        </button>

        {/* Botón Editar */}
        <button
          onClick={handleEditFromSwipe}
          className="w-[53px] flex flex-col items-center justify-center bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-colors"
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Editar</span>
        </button>

        {/* Botón Eliminar */}
        <button
          onClick={handleDeleteFromSwipe}
          className="w-[53px] flex flex-col items-center justify-center bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Borrar</span>
        </button>
      </div>

      {/* Contenido de la tarea (draggable) */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: SNAP_FULL, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        animate={{
          x: isSwipeOpen ? SNAP_FULL : SNAP_CLOSED
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        initial={{ opacity: 0, y: -10 }}
        whileDrag={{ cursor: 'grabbing' }}
        className={`task-item group relative flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-colors duration-200 cursor-grab active:cursor-grabbing ${
          task.completed
            ? 'opacity-60 bg-gray-50 dark:bg-slate-800/50'
            : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-l-4'
        } ${
          isOverdue
            ? 'border-red-300 dark:border-red-800 border-l-4 border-l-red-500'
            : 'border-gray-200 dark:border-gray-700 hover:border-l-primary-500'
        }`}
      >
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

      </motion.div>

      {/* Backdrop para cerrar swipe */}
      {isSwipeOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={closeSwipe}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2 dark:text-white">¿Eliminar tarea?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteTask()
                  setShowDeleteConfirm(false)
                }}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 font-medium transition-colors min-h-[44px]"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 active:bg-gray-400 font-medium transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}