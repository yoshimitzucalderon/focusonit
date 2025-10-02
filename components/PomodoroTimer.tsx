'use client'

import { Timer, Play, Pause, Clock } from 'lucide-react'
import { usePomodoroTimer } from '@/lib/hooks/usePomodoroTimer'
import { motion, AnimatePresence } from 'framer-motion'

interface PomodoroTimerProps {
  taskId: string
  userId: string
  onComplete?: () => void
}

export function PomodoroTimer({ taskId, userId, onComplete }: PomodoroTimerProps) {
  const {
    isRunning,
    timeRemainingFormatted,
    totalTimeFormatted,
    start,
    pause,
  } = usePomodoroTimer({ taskId, userId, onComplete })

  return (
    <div className="flex items-center gap-2">
      {/* Timer Button */}
      <button
        onClick={isRunning ? pause : start}
        className={`
          group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
          text-xs font-medium transition-all duration-200
          ${isRunning
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
          }
        `}
        title={isRunning ? 'Pausar timer' : 'Iniciar Pomodoro (25 min)'}
      >
        {/* Icon with animation */}
        <div className="relative">
          {isRunning ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}

          {/* Pulse animation when running */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 bg-blue-400 dark:bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* Countdown display */}
        <AnimatePresence mode="wait">
          {isRunning && (
            <motion.span
              key="countdown"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="font-mono tabular-nums"
            >
              {timeRemainingFormatted}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Total Time Badge */}
      {totalTimeFormatted !== '0m' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md text-xs text-gray-600 dark:text-gray-400"
          title="Tiempo total acumulado"
        >
          <Clock className="w-3 h-3" />
          <span className="font-medium">{totalTimeFormatted}</span>
        </motion.div>
      )}
    </div>
  )
}
