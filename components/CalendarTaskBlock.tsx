'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Clock, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { diagnoseTaskTimes, normalizeTime, isValidTimeFormat } from '@/lib/utils/timeNormalization'

interface CalendarTaskBlockProps {
  task: Task
  top: number
  height: number
  onEdit: () => void
  onUpdate: () => void
  overlapWidth?: number
  overlapOffset?: number
  overlapCount?: number
}

export default function CalendarTaskBlock({
  task,
  top: initialTop,
  height: initialHeight,
  onEdit,
  onUpdate,
  overlapWidth = 100,
  overlapOffset = 0,
  overlapCount = 1
}: CalendarTaskBlockProps) {
  const [isResizingTop, setIsResizingTop] = useState(false)
  const [isResizingBottom, setIsResizingBottom] = useState(false)
  const [top, setTop] = useState(initialTop)
  const [height, setHeight] = useState(initialHeight)
  const [tempTop, setTempTop] = useState(initialTop)
  const [tempHeight, setTempHeight] = useState(initialHeight)
  const blockRef = useRef<HTMLDivElement | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Drag & drop para mover la tarea completa
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    disabled: isResizingTop || isResizingBottom,
  })

  const dragStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined

  // Diagnóstico de tiempos al cargar la tarea
  useEffect(() => {
    const diagnosis = diagnoseTaskTimes(task)

    if (diagnosis.hasIssues) {
      console.error('⚠️ TAREA CON PROBLEMAS DETECTADA:', {
        id: task.id,
        title: task.title,
        start_time: task.start_time,
        end_time: task.end_time,
        start_time_type: typeof task.start_time,
        end_time_type: typeof task.end_time,
        issues: diagnosis.issues
      })
    } else {
      console.log('✅ Tarea con tiempos válidos:', {
        id: task.id,
        title: task.title,
        start_time: task.start_time,
        end_time: task.end_time
      })
    }
  }, [task.id, task.title, task.start_time, task.end_time])

  useEffect(() => {
    setTop(initialTop)
    setHeight(initialHeight)
    setTempTop(initialTop)
    setTempHeight(initialHeight)
  }, [initialTop, initialHeight])

  // Snap a intervalos de 15 minutos (más suave que 1 hora)
  const snapToInterval = (minutes: number, interval: number = 15) => {
    return Math.round(minutes / interval) * interval
  }

  // Convertir minutos a tiempo HH:MM:SS
  const minutesToTime = (minutes: number) => {
    const clampedMinutes = Math.max(0, Math.min(1439, minutes)) // 0-1439 (23:59)
    const hours = Math.floor(clampedMinutes / 60)
    const mins = clampedMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
  }

  // Convertir tiempo HH:MM:SS a minutos
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Manejar inicio de resize en borde superior
  const handleTopMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // VALIDAR tiempos antes de permitir resize
    if (!isValidTimeFormat(task.start_time) || !isValidTimeFormat(task.end_time)) {
      console.error('❌ Tiempos inválidos detectados al intentar resize:', {
        taskId: task.id,
        start_time: task.start_time,
        end_time: task.end_time
      })

      toast.error('Formato de tiempo inválido. Normalizando...')

      // Normalizar automáticamente
      const normalizedStart = normalizeTime(task.start_time)
      const normalizedEnd = normalizeTime(task.end_time)

      // Actualizar en BD
      supabase
        .from('tasks')
        // @ts-ignore
        .update({
          start_time: normalizedStart,
          end_time: normalizedEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .then(() => {
          toast.success('Tiempos normalizados. Intenta de nuevo.')
          onUpdate()
        })

      return
    }

    setIsResizingTop(true)
  }

  // Manejar inicio de resize en borde inferior
  const handleBottomMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // VALIDAR tiempos antes de permitir resize
    if (!isValidTimeFormat(task.start_time) || !isValidTimeFormat(task.end_time)) {
      console.error('❌ Tiempos inválidos detectados al intentar resize:', {
        taskId: task.id,
        start_time: task.start_time,
        end_time: task.end_time
      })

      toast.error('Formato de tiempo inválido. Normalizando...')

      // Normalizar automáticamente
      const normalizedStart = normalizeTime(task.start_time)
      const normalizedEnd = normalizeTime(task.end_time)

      // Actualizar en BD
      supabase
        .from('tasks')
        // @ts-ignore
        .update({
          start_time: normalizedStart,
          end_time: normalizedEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .then(() => {
          toast.success('Tiempos normalizados. Intenta de nuevo.')
          onUpdate()
        })

      return
    }

    setIsResizingBottom(true)
  }

  // Manejar movimiento del mouse para resize
  useEffect(() => {
    if (!isResizingTop && !isResizingBottom) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!blockRef.current) return

      const calendarContainer = blockRef.current.closest('.relative') as HTMLElement
      if (!calendarContainer) return

      const containerRect = calendarContainer.getBoundingClientRect()
      const scrollTop = calendarContainer.parentElement?.scrollTop || 0

      // Calcular posición Y relativa al calendario (en píxeles desde el top)
      const mouseY = e.clientY - containerRect.top + scrollTop

      // Convertir a minutos (cada píxel = 1 minuto)
      let mouseMinutes = Math.max(0, Math.min(1440, mouseY))

      // Snap a 15 minutos
      mouseMinutes = snapToInterval(mouseMinutes, 15)

      if (isResizingTop) {
        // Redimensionar desde arriba: cambiar start_time, mantener end_time
        const originalEndMinutes = tempTop + tempHeight
        const newTop = mouseMinutes
        const newHeight = originalEndMinutes - newTop

        // Validar duración mínima de 15 minutos
        if (newHeight >= 15 && newTop >= 0) {
          setTempTop(newTop)
          setTempHeight(newHeight)
        }
      } else if (isResizingBottom) {
        // Redimensionar desde abajo: cambiar end_time, mantener start_time
        const newEndMinutes = mouseMinutes
        const newHeight = newEndMinutes - tempTop

        // Validar duración mínima de 15 minutos y no exceder 23:59
        if (newHeight >= 15 && newEndMinutes <= 1440) {
          setTempHeight(newHeight)
        }
      }
    }

    const handleMouseUp = async () => {
      if (isResizingTop || isResizingBottom) {
        // Guardar cambios en la base de datos
        const newStartTime = minutesToTime(tempTop)
        const newEndTime = minutesToTime(tempTop + tempHeight)

        try {
          const { error } = await supabase
            .from('tasks')
            // @ts-ignore - Temporary fix for Supabase type inference issue with new columns
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

      setIsResizingTop(false)
      setIsResizingBottom(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingTop, isResizingBottom, tempTop, tempHeight, top, height, task.id, onUpdate, supabase])

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

  // Merge refs callback
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    blockRef.current = node
    setNodeRef(node)
  }, [setNodeRef])

  return (
    <div
      ref={setRefs}
      style={{
        ...dragStyle,
        top: `${tempTop}px`,
        height: `${tempHeight}px`,
        minHeight: '30px',
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '4px', // Separación entre tareas
        left: `${overlapOffset}%`,
        width: `calc(${overlapWidth}% - 8px)`, // Restar padding
      }}
      className={`absolute rounded-lg border-l-4 border border-gray-200 dark:border-gray-700 shadow-sm px-3 py-2 group transition-shadow hover:shadow-lg ${getPriorityColor()} ${
        task.completed ? 'opacity-50' : ''
      } ${isResizingTop || isResizingBottom ? 'shadow-2xl z-30' : 'z-10'} ${!isResizingTop && !isResizingBottom ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={(e) => {
        if (!isResizingTop && !isResizingBottom && !isDragging) {
          e.stopPropagation()
          onEdit()
        }
      }}
    >
      {/* Borde superior para redimensionar */}
      <div
        className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-blue-400/30 transition-colors flex items-center justify-center"
        onMouseDown={handleTopMouseDown}
        style={{ zIndex: 40 }}
      >
        <div className="w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Badge indicador de tareas superpuestas */}
      {overlapCount > 1 && (
        <div className="absolute top-1 right-1 bg-blue-500 dark:bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg z-50">
          {overlapCount}
        </div>
      )}

      {/* Contenido de la tarea - área para drag & drop de toda la tarea */}
      <div
        {...listeners}
        {...attributes}
        className="relative z-10 h-full flex flex-col justify-between overflow-hidden px-1 py-1"
      >
        <div className="flex items-start gap-2 min-h-0">
          <GripVertical size={14} className="flex-shrink-0 mt-0.5 opacity-30 group-hover:opacity-70 transition-opacity" />
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

      {/* Tooltip mientras se redimensiona - más prominente */}
      {(isResizingTop || isResizingBottom) && (
        <div className="fixed left-1/2 top-4 -translate-x-1/2 bg-blue-600 dark:bg-blue-700 text-white text-base px-4 py-3 rounded-lg shadow-2xl whitespace-nowrap z-[100] pointer-events-none border-2 border-blue-400 dark:border-blue-500">
          <div className="font-bold text-lg">{startTime} - {endTime}</div>
          <div className="text-sm opacity-90 mt-1">
            Duración: {duration}h ({Math.round(tempHeight)} minutos)
          </div>
          <div className="text-xs opacity-75 mt-1">
            {isResizingTop ? '↑ Ajustando hora de inicio' : '↓ Ajustando hora de fin'}
          </div>
        </div>
      )}

      {/* Borde inferior para redimensionar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-blue-400/30 transition-colors flex items-center justify-center"
        onMouseDown={handleBottomMouseDown}
        style={{ zIndex: 40 }}
      >
        <div className="w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}
