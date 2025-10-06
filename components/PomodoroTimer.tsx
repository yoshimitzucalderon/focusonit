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
    start,
    pause,
    sessionType,
    isBreak,
    pomodoroCount,
    currentDuration,
  } = usePomodoroTimer({ taskId, userId, onComplete })

  const [showExpanded, setShowExpanded] = useState(false)

  // Calculate progress percentage (how much time has elapsed)
  const progressPercentage = ((currentDuration - timeRemaining) / currentDuration) * 100

  // Colors based on session type
  const colors = {
    work: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      button: 'bg-red-500 hover:bg-red-600',
      progress: '#3b82f6', // blue-500
    },
    break: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      button: 'bg-orange-500 hover:bg-orange-600',
      progress: '#10b981', // green-500
    },
  }

  const currentColors = isBreak ? colors.break : colors.work

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
              setShowExpanded(true)
            }
          }}
          className={`
            group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
            text-xs font-medium transition-all duration-200
            ${isRunning
              ? `${currentColors.bg} ${currentColors.text} ${currentColors.hover}`
              : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            }
          `}
          title={isRunning ? (isBreak ? 'Ver descanso' : 'Ver Pomodoro') : 'Iniciar Pomodoro'}
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
                <h3 className={`text-sm font-semibold ${currentColors.text} mb-2 uppercase tracking-wide`}>
                  {isBreak ? (sessionType === 'long_break' ? 'Descanso largo' : 'Descanso corto') : 'Pomodoro'}
                </h3>

                {/* Pomodoro Counter */}
                {!isBreak && pomodoroCount > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Pomodoro {pomodoroCount} completado{pomodoroCount !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Circular Progress */}
                <div className="relative mb-6">
                  <CircularProgress
                    percentage={progressPercentage}
                    size={200}
                    strokeWidth={12}
                    color={currentColors.progress}
                  />
                  {/* Time in center */}
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
                      {timeRemainingFormatted}
                    </span>
                    {isBreak && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ☕ Relájate
                      </span>
                    )}
                  </div>
                </div>

                {/* Pause Button */}
                <button
                  onClick={() => {
                    pause()
                    setShowExpanded(false)
                  }}
                  className={`w-full px-6 py-3 ${currentColors.button} text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2`}
                >
                  <Pause className="w-5 h-5" />
                  {isBreak ? 'Pausar descanso' : 'Pausar Pomodoro'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
