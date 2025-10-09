'use client'

import { Task } from '@/types/database.types'
import { Clock, AlertCircle, Zap, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface MobileTaskBlockProps {
  task: Task
  onTap: () => void
  top: number
  height: number
}

export default function MobileTaskBlock({ task, onTap, top, height }: MobileTaskBlockProps) {
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
    <motion.div
      onClick={onTap}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        left: '8px',
        right: '8px'
      }}
      className={`
        ${styles.bg} border-l-4 ${styles.border}
        rounded-lg px-3 py-2
        ${styles.text}
        transition-all active:shadow-lg
        ${task.completed ? 'opacity-60' : ''}
        overflow-hidden
      `}
    >
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
  )
}
