'use client'

import { Timer, Play, Pause, Clock, X } from 'lucide-react'
import { usePomodoroTimer } from '@/lib/hooks/usePomodoroTimer'
import { motion, AnimatePresence } from 'framer-motion'
import { CircularProgress } from './CircularProgress'
import { useState } from 'react'

interface PomodoroTimerProps {
  taskId: string
  userId: string
  onComplete?: () => void
}

export function PomodoroTimer({ taskId, userId, onComplete }: PomodoroTimerProps) {
  const {
    isRunning,
    timeRemaining,
    timeRemainingFormatted,
    totalTimeFormatted,
    start,
    pause,
  } = usePomodoroTimer({ taskId, userId, onComplete })

  const [showExpanded, setShowExpanded] = useState(false)

  // Calculate progress percentage (how much time has elapsed)
  const POMODORO_DURATION = 25 * 60 // This should ideally come from settings
  const progressPercentage = ((POMODORO_DURATION - timeRemaining) / POMODORO_DURATION) * 100

  return (
    <>
      {/* Compact Timer Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (isRunning) {
              setShowExpanded(!showExpanded)
            } else {
              start()
            }
          }}
          className={`
            group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
            text-xs font-medium transition-all duration-200
            ${isRunning
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            }
          `}
          title={isRunning ? 'Ver timer expandido' : 'Iniciar Pomodoro'}
        >
          {/* Icon with animation */}
          <div className="relative">
            {isRunning ? (
              <Timer className="w-3.5 h-3.5" />
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
      </div>

      {/* Expanded Timer Modal */}
      <AnimatePresence>
        {isRunning && showExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full relative shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setShowExpanded(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Timer Display */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-6 uppercase tracking-wide">
                  Pomodoro en progreso
                </h3>

                {/* Circular Progress */}
                <div className="relative mb-6">
                  <CircularProgress
                    percentage={progressPercentage}
                    size={200}
                    strokeWidth={12}
                    color="#3b82f6"
                  />
                  {/* Time in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
                      {timeRemainingFormatted}
                    </span>
                  </div>
                </div>

                {/* Pause Button */}
                <button
                  onClick={() => {
                    pause()
                    setShowExpanded(false)
                  }}
                  className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Pausar Pomodoro
                </button>

                {/* Total Time */}
                {totalTimeFormatted !== '0m' && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Tiempo total: <span className="font-semibold">{totalTimeFormatted}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
