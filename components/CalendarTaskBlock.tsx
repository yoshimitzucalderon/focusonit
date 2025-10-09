'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Clock, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface CalendarTaskBlockProps {
  task: Task
  top: number
  height: number
  onEdit: () => void
  onUpdate: () => void
}

export default function CalendarTaskBlock({
  task,
  top: initialTop,
  height: initialHeight,
  onEdit,
  onUpdate
}: CalendarTaskBlockProps) {
  const [isDraggingTop, setIsDraggingTop] = useState(false)
  const [isDraggingBottom, setIsDraggingBottom] = useState(false)
  const [top, setTop] = useState(initialTop)
  const [height, setHeight] = useState(initialHeight)
  const [tempTop, setTempTop] = useState(initialTop)
  const [tempHeight, setTempHeight] = useState(initialHeight)
  const blockRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setTop(initialTop)
    setHeight(initialHeight)
    setTempTop(initialTop)
    setTempHeight(initialHeight)
  }, [initialTop, initialHeight])

  // Snap a intervalos de 15 minutos
  const snapToInterval = (minutes: number, interval: number = 15) => {
    return Math.round(minutes / interval) * interval
  }

  // Convertir minutos a tiempo HH:MM:SS
  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
  }

  // Convertir tiempo HH:MM:SS a minutos
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Manejar inicio de drag en borde superior
  const handleTopMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingTop(true)
  }

  // Manejar inicio de drag en borde inferior
  const handleBottomMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingBottom(true)
  }

  // Manejar movimiento del mouse
  useEffect(() => {
    if (!isDraggingTop && !isDraggingBottom) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!blockRef.current) return

      const calendarContainer = blockRef.current.closest('.relative') as HTMLElement
      if (!calendarContainer) return

      const rect = calendarContainer.getBoundingClientRect()
      const mouseY = e.clientY - rect.top + calendarContainer.parentElement!.scrollTop

      if (isDraggingTop) {
        // Arrastrar borde superior
        const newTop = snapToInterval(Math.max(0, Math.min(mouseY, tempTop + tempHeight - 15)))
        const newHeight = tempTop + tempHeight - newTop

        if (newHeight >= 15) { // Mínimo 15 minutos
          setTempTop(newTop)
          setTempHeight(newHeight)
        }
      } else if (isDraggingBottom) {
        // Arrastrar borde inferior
        const newHeight = snapToInterval(Math.max(15, mouseY - tempTop))
        setTempHeight(Math.min(newHeight, 1440 - tempTop)) // No exceder las 24 horas
      }
    }

    const handleMouseUp = async () => {
      if (isDraggingTop || isDraggingBottom) {
        // Guardar cambios en la base de datos
        const newStartTime = minutesToTime(tempTop)
        const newEndTime = minutesToTime(tempTop + tempHeight)

        try {
          const { error } = await supabase
            .from('tasks')
            .update({
              start_time: newStartTime,
              end_time: newEndTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id)

          if (error) throw error

          setTop(tempTop)
          setHeight(tempHeight)
          toast.success('Horario actualizado')
          onUpdate()
        } catch (error) {
          console.error('Error updating task time:', error)
          toast.error('Error al actualizar horario')
          // Revertir cambios
          setTempTop(top)
          setTempHeight(height)
        }
      }

      setIsDraggingTop(false)
      setIsDraggingBottom(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingTop, isDraggingBottom, tempTop, tempHeight, top, height, task.id, onUpdate])

  // Calcular tiempo de inicio y fin para tooltip
  const startTime = minutesToTime(tempTop).slice(0, 5)
  const endTime = minutesToTime(tempTop + tempHeight).slice(0, 5)
  const duration = Math.round(tempHeight / 60 * 10) / 10 // Horas con 1 decimal

  // Color basado en prioridad
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'alta':
        return 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300'
      case 'media':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300'
      case 'baja':
        return 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300'
    }
  }

  return (
    <motion.div
      ref={blockRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute left-0 right-2 rounded-lg border-l-4 px-3 py-2 cursor-pointer group transition-shadow hover:shadow-lg ${getPriorityColor()} ${
        task.completed ? 'opacity-50' : ''
      } ${isDraggingTop || isDraggingBottom ? 'shadow-2xl z-30' : 'z-10'}`}
      style={{
        top: `${tempTop}px`,
        height: `${tempHeight}px`,
        minHeight: '30px'
      }}
      onClick={(e) => {
        if (!isDraggingTop && !isDraggingBottom) {
          e.stopPropagation()
          onEdit()
        }
      }}
    >
      {/* Borde superior para redimensionar */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleTopMouseDown}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
      </div>

      {/* Contenido de la tarea */}
      <div className="relative z-10 h-full flex flex-col justify-between overflow-hidden">
        <div className="flex items-start gap-2 min-h-0">
          <GripVertical size={14} className="flex-shrink-0 mt-0.5 opacity-50" />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm leading-tight ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </p>
            {tempHeight > 45 && task.description && (
              <p className="text-xs opacity-75 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {tempHeight > 60 && (
          <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
            <Clock size={12} />
            <span>{startTime} - {endTime}</span>
            <span className="ml-auto">{duration}h</span>
          </div>
        )}
      </div>

      {/* Tooltip mientras se arrastra */}
      {(isDraggingTop || isDraggingBottom) && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
          {startTime} - {endTime} ({duration}h)
        </div>
      )}

      {/* Borde inferior para redimensionar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleBottomMouseDown}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
      </div>
    </motion.div>
  )
}
