'use client'

import { useState, useRef } from 'react'
import { Task } from '@/types/database.types'
import { Clock, AlertCircle, Zap, CheckCircle2, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useSwipeGesture'

interface MobileTaskBlockProps {
  task: Task
  onTap: () => void
  onUpdateTime?: (taskId: string, newTimes: { start_time: string, end_time: string }) => void
  top: number
  height: number
  width?: string
  left?: string
  zIndex?: number
}

export default function MobileTaskBlock({ task, onTap, onUpdateTime, top, height, width = '100%', left = '0%', zIndex = 1 }: MobileTaskBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const taskRef = useRef<HTMLDivElement>(null)
  const { triggerHaptic } = useHapticFeedback()

  // LONG PRESS para activar drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setDragOffset(0)

    // Iniciar timer de long press (500ms)
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      triggerHaptic(50)
      console.log('🔄 Modo drag activado para:', task.title)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const deltaY = touch.clientY - startY

    if (isDragging) {
      e.preventDefault() // Prevenir scroll
      setDragOffset(deltaY)
    } else {
      // Cancelar long press si se mueve antes de activar
      if (Math.abs(deltaY) > 10 && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    if (isDragging && onUpdateTime) {
      // Calcular nueva hora basada en posición
      const hourHeight = 64 // 64px por hora en vista móvil
      const hoursChanged = Math.round(dragOffset / hourHeight)

      if (hoursChanged !== 0 && task.start_time && task.end_time) {
        const newStartTime = calculateNewTime(task.start_time, hoursChanged)
        const newEndTime = calculateNewTime(task.end_time, hoursChanged)

        console.log('⏰ Nueva hora:', newStartTime, '-', newEndTime)

        onUpdateTime(task.id, {
          start_time: newStartTime,
          end_time: newEndTime
        })

        triggerHaptic(20)
      }
    }

    // Reset
    setIsDragging(false)
    setDragOffset(0)
    setStartY(0)
  }

  const calculateNewTime = (time: string, hoursToAdd: number): string => {
    const [hours, minutes] = time.split(':').map(Number)
    let newHours = hours + hoursToAdd

    // Clamp entre 0-23
    if (newHours < 0) newHours = 0
    if (newHours > 23) newHours = 23

    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
  }

  // Estilos por prioridad
  const getPriorityStyles = () => {
    switch (task.priority) {
      case 'alta':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-500',
          text: 'text-red-900 dark:text-red-100',
          icon: AlertCircle,
          emoji: '🔥'
        }
      case 'media':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          border: 'border-yellow-500',
          text: 'text-yellow-900 dark:text-yellow-100',
          icon: Zap,
          emoji: '⚡'
        }
      case 'baja':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-500',
          text: 'text-green-900 dark:text-green-100',
          icon: CheckCircle2,
          emoji: '✓'
        }
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          border: 'border-gray-400',
          text: 'text-gray-900 dark:text-gray-100',
          icon: Clock,
          emoji: '📌'
        }
    }
  }

  const styles = getPriorityStyles()
  const PriorityIcon = styles.icon

  // Calcular duración
  const getDuration = () => {
    if (!task.start_time || !task.end_time) return ''
    const [startHour, startMin] = task.start_time.split(':').map(Number)
    const [endHour, endMin] = task.end_time.split(':').map(Number)
    const durationMin = (endHour * 60 + endMin) - (startHour * 60 + startMin)

    const hours = Math.floor(durationMin / 60)
    const minutes = durationMin % 60

    if (hours === 0) return `${minutes}min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  return (
    <>
      <motion.div
        ref={taskRef}
        onClick={!isDragging ? onTap : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{
          scale: isDragging ? 1.05 : 1,
          opacity: isDragging ? 0.8 : 1,
          y: dragOffset
        }}
        style={{
          position: 'absolute',
          top: `${top}px`,
          height: `${height}px`,
          width: width,
          left: left,
          zIndex: isDragging ? 50 : zIndex,
          touchAction: isDragging ? 'none' : 'auto'
        }}
        className={`
          ${styles.bg} border-l-4 ${styles.border}
          rounded-lg px-2 py-2
          ${styles.text}
          transition-all
          ${isDragging ? 'shadow-2xl' : 'shadow-sm'}
          ${task.completed ? 'opacity-60' : ''}
          overflow-hidden
          mr-1
        `}
      >
        {/* Indicador de drag */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <GripVertical className="w-3 h-3" />
              Arrastrando...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vista compacta para tareas pequeñas (< 60px de altura) */}
        {height < 60 ? (
          <div className="flex items-center gap-2 h-full">
            <span className="text-sm flex-shrink-0">{styles.emoji}</span>
            <span className="text-xs font-semibold truncate flex-1">
              {task.title}
            </span>
            {task.start_time && (
              <span className="text-xs opacity-70 flex-shrink-0">
                {formatTime(task.start_time)}
              </span>
            )}
          </div>
        ) : height < 90 ? (
          /* Vista media para tareas de 60-90px */
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{styles.emoji}</span>
              <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                {task.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-70">
              {task.start_time && (
                <>
                  <span>{formatTime(task.start_time)}</span>
                  <span>•</span>
                </>
              )}
              <span>{getDuration()}</span>
            </div>
          </div>
        ) : (
          /* Vista completa para tareas grandes (> 90px) */
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-2 mb-2">
              <PriorityIcon size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm mb-1 line-clamp-2 ${task.completed ? 'line-through' : ''}`}>
                  {task.title}
                </h4>
                {task.description && height > 120 && (
                  <p className="text-xs opacity-70 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between text-xs opacity-70">
              {task.start_time && task.end_time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(task.start_time)} - {formatTime(task.end_time)}
                </span>
              )}
              <span className="font-medium">{getDuration()}</span>
            </div>

            {/* Tags para tareas muy grandes */}
            {task.tags && task.tags.length > 0 && height > 140 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {task.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-[10px] opacity-50">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Línea guía mientras se arrastra */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: `${top + dragOffset}px`,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#6366f1',
            zIndex: 40
          }}
        />
      )}
    </>
  )
}
