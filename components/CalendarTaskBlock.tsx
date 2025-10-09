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

  // Color basado en prioridad - Nuevo diseño con gradientes sutiles
  const getPriorityColors = () => {
    switch (task.priority) {
      case 'alta':
        return {
          bg: 'bg-gradient-to-br from-danger-50 via-white to-danger-50/50 dark:from-danger-950/20 dark:via-gray-900 dark:to-danger-950/10',
          border: 'border-l-danger-500',
          text: 'text-danger-900 dark:text-danger-100',
          shadow: 'shadow-soft-lg hover:shadow-danger',
          indicator: 'bg-danger-500'
        }
      case 'media':
        return {
          bg: 'bg-gradient-to-br from-warning-50 via-white to-warning-50/50 dark:from-warning-950/20 dark:via-gray-900 dark:to-warning-950/10',
          border: 'border-l-warning-500',
          text: 'text-warning-900 dark:text-warning-100',
          shadow: 'shadow-soft-lg hover:shadow-warning-500/20',
          indicator: 'bg-warning-500'
        }
      case 'baja':
        return {
          bg: 'bg-gradient-to-br from-success-50 via-white to-success-50/50 dark:from-success-950/20 dark:via-gray-900 dark:to-success-950/10',
          border: 'border-l-success-500',
          text: 'text-success-900 dark:text-success-100',
          shadow: 'shadow-soft-lg hover:shadow-success',
          indicator: 'bg-success-500'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-primary-50 via-white to-primary-50/50 dark:from-primary-950/20 dark:via-gray-900 dark:to-primary-950/10',
          border: 'border-l-primary-500',
          text: 'text-primary-900 dark:text-primary-100',
          shadow: 'shadow-soft-lg hover:shadow-primary',
          indicator: 'bg-primary-500'
        }
    }
  }

  const priorityColors = getPriorityColors()

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
        marginBottom: '6px', // Separación entre tareas
        left: `${overlapOffset}%`,
        width: `calc(${overlapWidth}% - 8px)`,
      }}
      className={`
        absolute rounded-2xl border-l-4 ${priorityColors.border}
        ${priorityColors.bg} ${priorityColors.text} ${priorityColors.shadow}
        px-4 py-3 group
        transition-all duration-200 ease-smooth
        hover:scale-[1.02] hover:z-20
        ${task.completed ? 'opacity-60' : ''}
        ${isResizingTop || isResizingBottom ? 'shadow-soft-2xl z-30 scale-105' : 'z-10'}
        ${!isResizingTop && !isResizingBottom ? 'cursor-grab active:cursor-grabbing' : ''}
        backdrop-blur-sm
      `}
      onClick={(e) => {
        if (!isResizingTop && !isResizingBottom && !isDragging) {
          e.stopPropagation()
          onEdit()
        }
      }}
    >
      {/* Borde superior para redimensionar - Diseño moderno */}
      <div
        className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize hover:bg-primary-500/10 transition-all duration-150 flex items-center justify-center rounded-t-2xl group/top"
        onMouseDown={handleTopMouseDown}
        style={{ zIndex: 40 }}
      >
        <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover/top:opacity-100 transition-all duration-200 group-hover/top:bg-primary-500 group-hover/top:h-1.5" />
      </div>

      {/* Badge indicador de tareas superpuestas - Modernizado */}
      {overlapCount > 1 && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-soft-lg border-2 border-white dark:border-gray-900 z-50 animate-scale-in">
          {overlapCount}
        </div>
      )}

      {/* Contenido de la tarea - área para drag & drop de toda la tarea */}
      <div
        {...listeners}
        {...attributes}
        className="relative z-10 h-full flex flex-col justify-between overflow-hidden"
      >
        <div className="flex items-start gap-2.5 min-h-0">
          <GripVertical
            size={16}
            className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-50 transition-all duration-200 text-gray-400 dark:text-gray-500"
          />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm leading-snug tracking-tight ${task.completed ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </p>
            {tempHeight > 50 && task.description && (
              <p className="text-xs opacity-70 mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {tempHeight > 65 && (
          <div className="flex items-center gap-1.5 text-2xs font-medium opacity-60 mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <Clock size={11} className="flex-shrink-0" />
            <span className="tracking-tight">{startTime} - {endTime}</span>
            <span className="ml-auto font-semibold">{duration}h</span>
          </div>
        )}
      </div>

      {/* Tooltip mientras se redimensiona - Diseño glassmorphism */}
      {(isResizingTop || isResizingBottom) && (
        <div className="fixed left-1/2 top-6 -translate-x-1/2 glass-dark-strong rounded-2xl shadow-soft-2xl whitespace-nowrap z-[100] pointer-events-none animate-fade-in-down overflow-hidden">
          <div className="px-5 py-3 border-l-4 border-primary-500">
            <div className="font-bold text-lg text-white tracking-tight">{startTime} - {endTime}</div>
            <div className="text-sm text-gray-200 mt-0.5 flex items-center gap-2">
              <Clock size={14} className="opacity-70" />
              <span>Duración: {duration}h ({Math.round(tempHeight)} min)</span>
            </div>
            <div className="text-xs text-primary-300 mt-1.5 flex items-center gap-1.5 font-medium">
              <span className="text-base">{isResizingTop ? '↑' : '↓'}</span>
              {isResizingTop ? 'Ajustando inicio' : 'Ajustando fin'}
            </div>
          </div>
        </div>
      )}

      {/* Borde inferior para redimensionar - Diseño moderno */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize hover:bg-primary-500/10 transition-all duration-150 flex items-center justify-center rounded-b-2xl group/bottom"
        onMouseDown={handleBottomMouseDown}
        style={{ zIndex: 40 }}
      >
        <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover/bottom:opacity-100 transition-all duration-200 group-hover/bottom:bg-primary-500 group-hover/bottom:h-1.5" />
      </div>
    </div>
  )
}
