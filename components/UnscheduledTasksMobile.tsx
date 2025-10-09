'use client'

import { useState } from 'react'
import { Task } from '@/types/database.types'
import { ChevronUp, Calendar, Clock, MoreVertical, CheckCircle2, AlertCircle, Zap, Check } from 'lucide-react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useSwipeGesture, useHapticFeedback } from '@/hooks/useSwipeGesture'

interface UnscheduledTasksMobileProps {
  tasks: Task[]
  onScheduleTask?: (task: Task) => void
  onToggleComplete?: (taskId: string) => void
}

export default function UnscheduledTasksMobile({
  tasks,
  onScheduleTask,
  onToggleComplete
}: UnscheduledTasksMobileProps) {
  const [sheetHeight, setSheetHeight] = useState<'mini' | 'medio' | 'full'>('mini') // mini, medio, full
  const { triggerHaptic } = useHapticFeedback()

  // Calcular altura según estado
  const heights = {
    mini: '80px',
    medio: '40vh',
    full: '85vh'
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y

    console.log('📐 Drag end - velocity:', velocity, 'offset:', offset)

    // Arrastrado hacia abajo - reducir o minimizar
    if (velocity > 500 || offset > 100) {
      triggerHaptic(10)
      if (sheetHeight === 'full') {
        setSheetHeight('medio')
        console.log('📉 Full -> Medio')
      } else if (sheetHeight === 'medio') {
        setSheetHeight('mini')
        console.log('📉 Medio -> Mini')
      }
    }
    // Arrastrado hacia arriba - expandir
    else if (velocity < -500 || offset < -100) {
      triggerHaptic(10)
      if (sheetHeight === 'mini') {
        setSheetHeight('medio')
        console.log('📈 Mini -> Medio')
      } else if (sheetHeight === 'medio') {
        setSheetHeight('full')
        console.log('📈 Medio -> Full')
      }
    }
  }

  const toggleSheet = () => {
    triggerHaptic(15)
    if (sheetHeight === 'mini') {
      setSheetHeight('medio')
    } else {
      setSheetHeight('mini')
    }
  }

  const closeSheet = () => {
    triggerHaptic(10)
    setSheetHeight('mini')
  }

  return (
    <>
      {/* OVERLAY - Solo visible cuando NO está minimizado */}
      {sheetHeight !== 'mini' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSheet}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        />
      )}

      {/* BOTTOM SHEET */}
      <motion.div
        animate={{ height: heights[sheetHeight] }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl flex flex-col"
        style={{ touchAction: sheetHeight === 'mini' ? 'auto' : 'none' }}
      >
        {/* HANDLE PARA ARRASTRAR - Área clickeable más grande */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={() => {
            // Click simple para expandir cuando está minimizado
            if (sheetHeight === 'mini') {
              triggerHaptic(15)
              setSheetHeight('medio')
              console.log('📈 Abriendo drawer por click')
            }
          }}
          className="flex justify-center py-3 cursor-pointer active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full transition-colors" />
        </motion.div>

        {/* HEADER - También clickeable cuando está minimizado */}
        <div
          className="px-4 pb-2 border-b border-gray-200 dark:border-gray-700"
          onClick={() => {
            if (sheetHeight === 'mini') {
              triggerHaptic(15)
              setSheetHeight('medio')
              console.log('📈 Abriendo drawer por click en header')
            }
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Sin programar
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-semibold">
                {tasks.length}
              </span>

              {/* BOTÓN MINIMIZAR */}
              {sheetHeight !== 'mini' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeSheet()
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
                >
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-180" />
                </button>
              )}

              {/* BOTÓN EXPANDIR cuando está minimizado */}
              {sheetHeight === 'mini' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    triggerHaptic(15)
                    setSheetHeight('medio')
                    console.log('📈 Expandiendo drawer')
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
                >
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LISTA DE TAREAS - Solo visible si NO está minimizado */}
        {sheetHeight !== 'mini' ? (
          <div className="overflow-y-auto flex-1 px-3 py-3 space-y-2">
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success-600 dark:text-success-400" />
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  ¡Todo programado!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Todas tus tareas tienen horario asignado
                </p>
              </motion.div>
            ) : (
              tasks.map((task, index) => (
                <MobileTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onSchedule={onScheduleTask}
                  onToggleComplete={onToggleComplete}
                />
              ))
            )}
          </div>
        ) : (
          /* HINT cuando está minimizado */
          <div className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
            👆 Arrastra hacia arriba para ver {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
          </div>
        )}
      </motion.div>
    </>
  )
}

interface MobileTaskCardProps {
  task: Task
  index: number
  onSchedule?: (task: Task) => void
  onToggleComplete?: (taskId: string) => void
}

function MobileTaskCard({ task, index, onSchedule, onToggleComplete }: MobileTaskCardProps) {
  const [showActions, setShowActions] = useState(false)
  const { triggerHaptic } = useHapticFeedback()

  const swipeGesture = useSwipeGesture(
    80,
    () => {
      // Swipe left - mostrar acciones
      setShowActions(true)
      triggerHaptic(10)
    },
    () => {
      // Swipe right - marcar completada
      if (onToggleComplete) {
        onToggleComplete(task.id)
        triggerHaptic(15)
      }
    }
  )

  // PROGRAMAR RÁPIDAMENTE con checkbox
  const handleQuickSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('✅ Checkbox click - programación rápida:', task.title)

    if (onSchedule) {
      // Sugerir próximo horario disponible (siguiente hora completa)
      const now = new Date()
      const nextHour = new Date(now)
      nextHour.setHours(now.getHours() + 1, 0, 0, 0)

      console.log('📅 Programando automáticamente a las', nextHour.getHours() + ':00')

      triggerHaptic(20)
      onSchedule(task)
    }
  }

  const getPriorityConfig = () => {
    switch (task.priority) {
      case 'alta':
        return {
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-500',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          icon: AlertCircle,
          emoji: '🔥'
        }
      case 'media':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/10',
          border: 'border-yellow-500',
          badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: Zap,
          emoji: '⚡'
        }
      case 'baja':
        return {
          bg: 'bg-green-50 dark:bg-green-900/10',
          border: 'border-green-500',
          badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle2,
          emoji: '✓'
        }
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-700',
          border: 'border-gray-400',
          badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
          icon: Clock,
          emoji: '📌'
        }
    }
  }

  const config = getPriorityConfig()
  const PriorityIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden"
    >
      {/* ACCIONES AL HACER SWIPE LEFT */}
      {showActions && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 'auto' }}
          className="absolute inset-y-0 right-0 flex items-center gap-2 px-3 bg-gradient-to-l from-primary-600 to-purple-600"
        >
          <button
            onClick={() => {
              if (onSchedule) onSchedule(task)
              setShowActions(false)
            }}
            className="p-3 bg-white/20 rounded-lg active:scale-95 transition-transform"
          >
            <Calendar className="w-5 h-5 text-white" />
          </button>
        </motion.div>
      )}

      {/* TARJETA DE TAREA */}
      <div
        {...swipeGesture}
        onClick={() => {
          if (showActions) {
            setShowActions(false)
          }
        }}
        className={`
          ${config.bg} border-l-4 ${config.border}
          rounded-xl p-4 shadow-sm
          active:bg-gray-100 dark:active:bg-gray-700
          transition-all
          ${task.completed ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox - Programar rápidamente */}
          <button
            onClick={handleQuickSchedule}
            className="
              mt-0.5 w-6 h-6 min-w-6 rounded border-2
              border-primary-500
              flex items-center justify-center
              hover:bg-primary-50 dark:hover:bg-primary-900/20
              active:scale-90
              transition-all
            "
            title="Programar rápidamente"
          >
            <Calendar className="w-4 h-4 text-primary-600" />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className={`
              font-semibold text-base text-gray-900 dark:text-white mb-1 leading-tight
              ${task.completed ? 'line-through opacity-60' : ''}
            `}>
              {task.title}
            </h4>

            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${config.badge} px-2 py-1 rounded-full text-xs font-medium`}>
                {config.emoji} {task.priority}
              </span>

              {task.due_date && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1 items-center">
                  {task.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-xs text-gray-400 font-medium">
                      +{task.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botón de menú */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onSchedule) onSchedule(task)
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors active:scale-90"
          >
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
