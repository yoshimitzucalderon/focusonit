'use client'

import { Timer, Play, Pause, Clock, X } from 'lucide-react'
import { usePomodoroTimer } from '@/lib/hooks/usePomodoroTimer'
import { motion, AnimatePresence } from 'framer-motion'
import { CircularProgress } from './CircularProgress'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

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

  const modalContent = isRunning && showExpanded && mounted ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl"
      onClick={() => setShowExpanded(false)}
      style={{
        isolation: 'isolate',
        background: isBreak
          ? 'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.15), rgba(234, 88, 12, 0.1))'
          : 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15), rgba(139, 92, 246, 0.1))'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
        style={{
          background: isBreak
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 237, 213, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(238, 242, 255, 0.8) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: isBreak
            ? '0 20px 60px rgba(251, 146, 60, 0.3), 0 10px 30px rgba(234, 88, 12, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            : '0 20px 60px rgba(79, 70, 229, 0.3), 0 10px 30px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          padding: '48px 40px'
        }}
      >
        {/* Close button */}
        <motion.button
          type="button"
          onClick={() => setShowExpanded(false)}
          className="absolute top-6 right-6 p-2.5 rounded-full transition-all z-10 group"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </motion.button>

        {/* Timer Display */}
        <div className="flex flex-col items-center">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-bold uppercase tracking-widest mb-1"
            style={{
              background: isBreak
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {isBreak ? (sessionType === 'long_break' ? 'Descanso largo' : 'Descanso corto') : 'Pomodoro'}
          </motion.h3>

          {/* Pomodoro Counter with dots */}
          {!isBreak && pomodoroCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mb-6"
            >
              {Array.from({ length: Math.min(pomodoroCount, 4) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
                  }}
                />
              ))}
              {pomodoroCount > 4 && (
                <span className="text-xs font-semibold ml-1" style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  +{pomodoroCount - 4}
                </span>
              )}
            </motion.div>
          )}

          {/* Circular Progress with Gradient */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{
                background: isBreak
                  ? 'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(79, 70, 229, 0.6) 0%, transparent 70%)'
              }}
            />

            {/* SVG Circle with Gradient */}
            <svg width="240" height="240" className="relative transform -rotate-90">
              <defs>
                <linearGradient id={`gradient-${isBreak ? 'break' : 'work'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  {isBreak ? (
                    <>
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="50%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </>
                  )}
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background circle */}
              <circle
                cx="120"
                cy="120"
                r="100"
                fill="none"
                stroke="rgba(203, 213, 225, 0.3)"
                strokeWidth="14"
              />

              {/* Progress circle */}
              <motion.circle
                cx="120"
                cy="120"
                r="100"
                fill="none"
                stroke={`url(#gradient-${isBreak ? 'break' : 'work'})`}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={628}
                initial={{ strokeDashoffset: 628 }}
                animate={{
                  strokeDashoffset: 628 - (628 * progressPercentage) / 100
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                filter="url(#glow)"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(79, 70, 229, 0.5))'
                }}
              />
            </svg>

            {/* Time in center */}
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <span
                  className="text-6xl font-black font-mono tabular-nums"
                  style={{
                    background: isBreak
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 2px 20px rgba(79, 70, 229, 0.15)'
                  }}
                >
                  {timeRemainingFormatted}
                </span>
                {isBreak && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center mt-2"
                  >
                    <span className="text-sm font-medium text-orange-600">☕ Relájate</span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Pause Button */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Pause button clicked!')
              pause()
              setShowExpanded(false)
            }}
            className="relative w-full px-8 py-4 text-white font-bold rounded-2xl overflow-hidden cursor-pointer group"
            style={{
              background: isBreak
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: isBreak
                ? '0 10px 30px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(234, 88, 12, 0.3)'
                : '0 10px 30px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: isBreak
                ? '0 15px 40px rgba(249, 115, 22, 0.5), 0 6px 16px rgba(234, 88, 12, 0.4)'
                : '0 15px 40px rgba(239, 68, 68, 0.5), 0 6px 16px rgba(220, 38, 38, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", damping: 20 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />

            <div className="relative flex items-center justify-center gap-2">
              <Pause className="w-5 h-5" />
              <span className="text-base">
                {isBreak ? 'Pausar descanso' : 'Pausar Pomodoro'}
              </span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  ) : null

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

      {/* Expanded Timer Modal - Using Portal */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalContent}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
