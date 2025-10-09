'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Clock, GripVertical, AlertCircle, Zap, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { diagnoseTaskTimes, normalizeTime, isValidTimeFormat } from '@/lib/utils/timeNormalization'
import { motion, AnimatePresence } from 'framer-motion'

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

// Tamaños de tarea basados en altura (duración)
const TASK_SIZES = {
  TINY: 30,      // ≤ 30 minutos
  SMALL: 45,     // 30-45 minutos
  MEDIUM: 60,    // 45-60 minutos
  LARGE: Infinity // > 60 minutos
}

type TaskSize = 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE'

const getTaskSize = (height: number): TaskSize => {
  if (height <= TASK_SIZES.TINY) return 'TINY'
  if (height <= TASK_SIZES.SMALL) return 'SMALL'
  if (height <= TASK_SIZES.MEDIUM) return 'MEDIUM'
  return 'LARGE'
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
  const [showTooltip, setShowTooltip] = useState(false)
  const [expandedTask, setExpandedTask] = useState(false)
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
    }
  }, [task.id, task.title, task.start_time, task.end_time])

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
    const clampedMinutes = Math.max(0, Math.min(1439, minutes))
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

    if (!isValidTimeFormat(task.start_time) || !isValidTimeFormat(task.end_time)) {
      toast.error('Formato de tiempo inválido. Normalizando...')
      const normalizedStart = normalizeTime(task.start_time)
      const normalizedEnd = normalizeTime(task.end_time)

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

    if (!isValidTimeFormat(task.start_time) || !isValidTimeFormat(task.end_time)) {
      toast.error('Formato de tiempo inválido. Normalizando...')
      const normalizedStart = normalizeTime(task.start_time)
      const normalizedEnd = normalizeTime(task.end_time)

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

      const mouseY = e.clientY - containerRect.top + scrollTop
      let mouseMinutes = Math.max(0, Math.min(1440, mouseY))
      mouseMinutes = snapToInterval(mouseMinutes, 15)

      if (isResizingTop) {
        const originalEndMinutes = tempTop + tempHeight
        const newTop = mouseMinutes
        const newHeight = originalEndMinutes - newTop

        if (newHeight >= 15 && newTop >= 0) {
          setTempTop(newTop)
          setTempHeight(newHeight)
        }
      } else if (isResizingBottom) {
        const newEndMinutes = mouseMinutes
        const newHeight = newEndMinutes - tempTop

        if (newHeight >= 15 && newEndMinutes <= 1440) {
          setTempHeight(newHeight)
        }
      }
    }

    const handleMouseUp = async () => {
      if (isResizingTop || isResizingBottom) {
        const newStartTime = minutesToTime(tempTop)
        const newEndTime = minutesToTime(tempTop + tempHeight)

        try {
          const { error } = await supabase
            .from('tasks')
            // @ts-ignore
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

  // Calcular tiempo de inicio y fin
  const startTime = minutesToTime(tempTop).slice(0, 5)
  const endTime = minutesToTime(tempTop + tempHeight).slice(0, 5)
  const duration = Math.round(tempHeight / 60 * 10) / 10
  const durationMinutes = tempHeight

  // Determinar tamaño de visualización
  const taskSize = getTaskSize(tempHeight)

  // Estilos de prioridad mejorados con iconos
  const getPriorityStyles = () => {
    switch (task.priority) {
      case 'alta':
        return {
          bg: 'bg-gradient-to-br from-danger-50 via-white to-danger-50/50 dark:from-danger-950/20 dark:via-gray-900 dark:to-danger-950/10',
          border: 'border-l-danger-500',
          text: 'text-danger-900 dark:text-danger-100',
          shadow: 'shadow-soft-lg hover:shadow-danger',
          indicator: 'bg-danger-500',
          icon: AlertCircle,
          emoji: '🔥',
          badgeBg: 'bg-danger-100 dark:bg-danger-900/30 border-danger-300 dark:border-danger-700 text-danger-700 dark:text-danger-300'
        }
      case 'media':
        return {
          bg: 'bg-gradient-to-br from-warning-50 via-white to-warning-50/50 dark:from-warning-950/20 dark:via-gray-900 dark:to-warning-950/10',
          border: 'border-l-warning-500',
          text: 'text-warning-900 dark:text-warning-100',
          shadow: 'shadow-soft-lg hover:shadow-warning-500/20',
          indicator: 'bg-warning-500',
          icon: Zap,
          emoji: '⚡',
          badgeBg: 'bg-warning-100 dark:bg-warning-900/30 border-warning-300 dark:border-warning-700 text-warning-700 dark:text-warning-300'
        }
      case 'baja':
        return {
          bg: 'bg-gradient-to-br from-success-50 via-white to-success-50/50 dark:from-success-950/20 dark:via-gray-900 dark:to-success-950/10',
          border: 'border-l-success-500',
          text: 'text-success-900 dark:text-success-100',
          shadow: 'shadow-soft-lg hover:shadow-success',
          indicator: 'bg-success-500',
          icon: CheckCircle2,
          emoji: '✓',
          badgeBg: 'bg-success-100 dark:bg-success-900/30 border-success-300 dark:border-success-700 text-success-700 dark:text-success-300'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-primary-50 via-white to-primary-50/50 dark:from-primary-950/20 dark:via-gray-900 dark:to-primary-950/10',
          border: 'border-l-primary-500',
          text: 'text-primary-900 dark:text-primary-100',
          shadow: 'shadow-soft-lg hover:shadow-primary',
          indicator: 'bg-primary-500',
          icon: Clock,
          emoji: '📌',
          badgeBg: 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
        }
    }
  }

  const style = getPriorityStyles()
  const PriorityIcon = style.icon

  // Merge refs callback
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    blockRef.current = node
    setNodeRef(node)
  }, [setNodeRef])

  // ============================================
  // RENDERIZADO ADAPTATIVO SEGÚN TAMAÑO
  // ============================================

  // TINY: Solo emoji + tooltip hover
  if (taskSize === 'TINY') {
    return (
      <>
        <div
          ref={setRefs}
          style={{
            ...dragStyle,
            top: `${tempTop}px`,
            height: `${tempHeight}px`,
            minHeight: '30px',
            opacity: isDragging ? 0.5 : 1,
            left: `${overlapOffset}%`,
            width: `calc(${overlapWidth}% - 8px)`,
          }}
          className={`
            absolute ${style.bg} ${style.border}
            border-l-4 rounded-lg
            flex items-center justify-center
            cursor-pointer
            hover:scale-105 ${style.shadow}
            transition-all duration-200
            z-10 hover:z-20
            ${task.completed ? 'opacity-60' : ''}
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation()
            setExpandedTask(true)
          }}
          {...listeners}
          {...attributes}
        >
          {/* Solo emoji de prioridad centrado */}
          <span className="text-lg select-none">{style.emoji}</span>

          {/* Indicador de más tareas superpuestas */}
          {overlapCount > 1 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow-soft border border-white dark:border-gray-900">
              {overlapCount}
            </div>
          )}

          {/* Indicador de "hay más info" */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse opacity-70" />
        </div>

        {/* Tooltip completo al hacer hover */}
        <AnimatePresence>
          {showTooltip && !expandedTask && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="
                fixed z-[100] left-full ml-3
                bg-gray-900 dark:bg-gray-800 text-white
                rounded-xl shadow-soft-2xl
                p-4 w-72
                pointer-events-none
                border border-gray-700
              "
              style={{
                top: `${tempTop + 40}px`,
                left: `calc(${overlapOffset}% + ${overlapWidth}% + 12px)`
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{style.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1.5 leading-tight">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-gray-800 dark:bg-gray-700 rounded-lg font-medium flex items-center gap-1.5">
                  <Clock size={11} />
                  {startTime} - {endTime}
                </span>
                <span className={`px-2.5 py-1 rounded-lg font-semibold ${style.badgeBg}`}>
                  {durationMinutes} min
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal expandido al hacer click */}
        <AnimatePresence>
          {expandedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setExpandedTask(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-soft-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${style.badgeBg}`}>
                    <PriorityIcon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                    <Clock size={16} />
                    {startTime} - {endTime}
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${style.badgeBg} flex items-center gap-1.5`}>
                    <PriorityIcon size={16} />
                    {durationMinutes} min
                  </span>
                </div>
                <button
                  onClick={() => {
                    setExpandedTask(false)
                    onEdit()
                  }}
                  className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all hover:shadow-primary"
                >
                  Editar tarea
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // SMALL: Icono + título truncado
  if (taskSize === 'SMALL') {
    return (
      <>
        <div
          ref={setRefs}
          style={{
            ...dragStyle,
            top: `${tempTop}px`,
            height: `${tempHeight}px`,
            minHeight: '40px',
            opacity: isDragging ? 0.5 : 1,
            left: `${overlapOffset}%`,
            width: `calc(${overlapWidth}% - 8px)`,
          }}
          className={`
            absolute ${style.bg} ${style.border}
            border-l-4 rounded-lg p-2
            cursor-pointer group
            hover:scale-[1.02] ${style.shadow}
            transition-all duration-200
            z-10 hover:z-20
            ${task.completed ? 'opacity-60' : ''}
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          {...listeners}
          {...attributes}
        >
          <div className="flex items-center gap-1.5 h-full">
            <span className="text-base select-none">{style.emoji}</span>
            <h3 className={`${style.text} text-xs font-semibold truncate flex-1`}>
              {task.title}
            </h3>
          </div>

          {overlapCount > 1 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-soft border border-white dark:border-gray-900">
              {overlapCount}
            </div>
          )}

          {/* Resize handles invisibles pero funcionales */}
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100"
            onMouseDown={handleTopMouseDown}
            style={{ zIndex: 40 }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 hover:opacity-100"
            onMouseDown={handleBottomMouseDown}
            style={{ zIndex: 40 }}
          />
        </div>

        {/* Tooltip expandido */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="
                fixed z-[100]
                bg-gray-900 dark:bg-gray-800 text-white
                rounded-xl shadow-soft-2xl
                p-4 w-72
                pointer-events-none
                border border-gray-700
              "
              style={{
                top: `${tempTop + 40}px`,
                left: `calc(${overlapOffset}% + ${overlapWidth}% + 12px)`
              }}
            >
              <h4 className="font-semibold mb-1.5">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-gray-300 mb-3 leading-relaxed">{task.description}</p>
              )}
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Clock size={12} />
                {startTime} - {endTime} • {durationMinutes} min
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // MEDIUM: Icono + título + tiempo (sin descripción)
  if (taskSize === 'MEDIUM') {
    return (
      <>
        <div
          ref={setRefs}
          style={{
            ...dragStyle,
            top: `${tempTop}px`,
            height: `${tempHeight}px`,
            opacity: isDragging ? 0.5 : 1,
            left: `${overlapOffset}%`,
            width: `calc(${overlapWidth}% - 8px)`,
          }}
          className={`
            absolute ${style.bg} ${style.border}
            border-l-4 rounded-xl p-2.5
            cursor-pointer group
            hover:scale-[1.01] ${style.shadow}
            transition-all duration-200
            z-10 hover:z-20
            ${task.completed ? 'opacity-60' : ''}
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          {...listeners}
          {...attributes}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm select-none">{style.emoji}</span>
            <h3 className={`${style.text} text-sm font-semibold truncate flex-1`}>
              {task.title}
            </h3>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {startTime} - {endTime}
          </div>

          {overlapCount > 1 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-soft border border-white dark:border-gray-900">
              {overlapCount}
            </div>
          )}

          {/* Resize handles */}
          <div
            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary-500/10 transition-all rounded-t-xl"
            onMouseDown={handleTopMouseDown}
            style={{ zIndex: 40 }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-primary-500/10 transition-all rounded-b-xl"
            onMouseDown={handleBottomMouseDown}
            style={{ zIndex: 40 }}
          />
        </div>

        {/* Tooltip con descripción completa */}
        <AnimatePresence>
          {showTooltip && task.description && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="
                fixed z-[100]
                bg-gray-900 dark:bg-gray-800 text-white
                rounded-xl shadow-soft-2xl
                p-4 w-72
                pointer-events-none
                border border-gray-700
              "
              style={{
                top: `${tempTop + 40}px`,
                left: `calc(${overlapOffset}% + ${overlapWidth}% + 12px)`
              }}
            >
              <p className="text-sm leading-relaxed">{task.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // LARGE: Vista completa (diseño actual mejorado)
  return (
    <div
      ref={setRefs}
      style={{
        ...dragStyle,
        top: `${tempTop}px`,
        height: `${tempHeight}px`,
        minHeight: '30px',
        opacity: isDragging ? 0.5 : 1,
        marginBottom: '6px',
        left: `${overlapOffset}%`,
        width: `calc(${overlapWidth}% - 8px)`,
      }}
      className={`
        absolute rounded-2xl border-l-4 ${style.border}
        ${style.bg} ${style.text} ${style.shadow}
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
      {/* Borde superior para redimensionar */}
      <div
        className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize hover:bg-primary-500/10 transition-all duration-150 flex items-center justify-center rounded-t-2xl group/top"
        onMouseDown={handleTopMouseDown}
        style={{ zIndex: 40 }}
      >
        <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover/top:opacity-100 transition-all duration-200 group-hover/top:bg-primary-500 group-hover/top:h-1.5" />
      </div>

      {/* Badge indicador de tareas superpuestas */}
      {overlapCount > 1 && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-soft-lg border-2 border-white dark:border-gray-900 z-50 animate-scale-in">
          {overlapCount}
        </div>
      )}

      {/* Contenido de la tarea */}
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

      {/* Tooltip mientras se redimensiona */}
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

      {/* Borde inferior para redimensionar */}
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
