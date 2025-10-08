'use client'

import { Timer, Play, Pause, Clock, X, Wind, Zap } from 'lucide-react'
import { usePomodoroTimer } from '@/lib/hooks/usePomodoroTimer'
import { motion, AnimatePresence } from 'framer-motion'
import { CircularProgress } from './CircularProgress'
import { useState, useEffect, useMemo } from 'react'
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
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')

  // Relaxing messages for break time
  const breakMessages = useMemo(() => [
    'Respira profundo',
    'Momento para ti',
    'Estira tus músculos',
    'Cierra los ojos',
    'Toma agua',
    'Relaja tus hombros',
    'Mira a lo lejos'
  ], [])

  const randomMessage = useMemo(() =>
    breakMessages[Math.floor(Math.random() * breakMessages.length)],
    [breakMessages]
  )

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Breathing animation cycle for break mode (4-7-8 technique)
  useEffect(() => {
    if (!isBreak || !showExpanded) return

    const breathCycle = () => {
      // Inhale: 4 seconds
      setBreathPhase('inhale')

      setTimeout(() => {
        // Hold: 7 seconds
        setBreathPhase('hold')

        setTimeout(() => {
          // Exhale: 8 seconds
          setBreathPhase('exhale')
        }, 7000)
      }, 4000)
    }

    breathCycle()
    const interval = setInterval(breathCycle, 19000) // Total cycle: 4+7+8 = 19 seconds

    return () => clearInterval(interval)
  }, [isBreak, showExpanded])

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
          ? 'linear-gradient(135deg, #FED7AA 0%, #FBCFE8 50%, #DDD6FE 100%)'
          : 'linear-gradient(135deg, #EFF6FF 0%, #F3F4F6 100%)'
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
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.9) 100%)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: isBreak
            ? '0 20px 60px rgba(251, 146, 60, 0.25), 0 10px 30px rgba(234, 88, 12, 0.15)'
            : '0 25px 70px rgba(79, 70, 229, 0.35), 0 15px 40px rgba(139, 92, 246, 0.25)',
          borderRadius: '32px',
          border: isBreak ? '1px solid rgba(251, 146, 60, 0.1)' : '1px solid rgba(79, 70, 229, 0.1)',
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
          {isBreak ? (
            <>
              {/* Título principal del descanso */}
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-8"
              >
                {randomMessage}
              </motion.h3>
            </>
          ) : (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold mb-2 text-purple-900"
            >
              ¡Enfócate!
            </motion.h3>
          )}

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

          {/* Circular Progress with Gradient OR Breathing Circle */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 20 }}
          >
            {isBreak && (
              <>
                {/* Floating particles for break mode - more subtle */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #14B8A6, #3B82F6)',
                      width: `${4 + Math.random() * 4}px`,
                      height: `${4 + Math.random() * 4}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -40, 0],
                      x: [0, Math.random() * 30 - 15, 0],
                      opacity: [0.2, 0.5, 0.2],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 15 + Math.random() * 10,
                      repeat: Infinity,
                      delay: i * 1.5,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </>
            )}

            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{
                background: isBreak
                  ? 'radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(79, 70, 229, 0.6) 0%, transparent 70%)'
              }}
            />

            {isBreak ? (
              /* Breathing Circle for Break Mode */
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                {/* Concentric ripples */}
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute rounded-full border-2"
                    style={{
                      borderColor: 'rgba(20, 184, 166, 0.2)',
                      width: '220px',
                      height: '220px',
                    }}
                    animate={{
                      scale: breathPhase === 'inhale' ? [1, 1.2] : breathPhase === 'exhale' ? [1.2, 1] : 1.2,
                      opacity: breathPhase === 'hold' ? 0.3 : [0.4, 0.1],
                    }}
                    transition={{
                      duration: breathPhase === 'inhale' ? 4 : breathPhase === 'exhale' ? 8 : 7,
                      delay: ring * 0.3,
                      ease: "easeInOut",
                      repeat: breathPhase === 'hold' ? 0 : Infinity,
                      repeatDelay: breathPhase === 'inhale' ? 15 : breathPhase === 'exhale' ? 11 : 0
                    }}
                  />
                ))}

                {/* Central breathing circle with enhanced scale */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)',
                    width: '150px',
                    height: '150px',
                  }}
                  animate={{
                    scale: breathPhase === 'inhale' ? [1.0, 1.2] : breathPhase === 'exhale' ? [1.2, 1.0] : 1.2,
                    boxShadow: breathPhase === 'hold'
                      ? '0 0 60px rgba(20, 184, 166, 0.7)'
                      : ['0 0 40px rgba(20, 184, 166, 0.5)', '0 0 60px rgba(20, 184, 166, 0.7)', '0 0 40px rgba(20, 184, 166, 0.5)']
                  }}
                  transition={{
                    duration: breathPhase === 'inhale' ? 4 : breathPhase === 'exhale' ? 8 : 7,
                    ease: "easeInOut",
                    repeat: breathPhase === 'hold' ? 0 : Infinity,
                    repeatDelay: breathPhase === 'inhale' ? 15 : breathPhase === 'exhale' ? 11 : 0
                  }}
                />

                {/* Wind icon behind white circle */}
                <Wind className="absolute w-12 h-12 text-teal-400 opacity-20" style={{ zIndex: 1 }} />

                {/* Círculo blanco central sólido con timer */}
                <div
                  className="absolute w-48 h-48 rounded-full bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.05)',
                    zIndex: 2
                  }}
                >
                  {/* Texto de respiración arriba - MÁS PEQUEÑO */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={breathPhase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-sm text-gray-600 mb-2"
                    >
                      {breathPhase === 'inhale' && 'Inhala...'}
                      {breathPhase === 'hold' && 'Sostén...'}
                      {breathPhase === 'exhale' && 'Exhala...'}
                    </motion.p>
                  </AnimatePresence>

                  {/* Timer grande y visible */}
                  <div
                    className="text-7xl font-black text-gray-900 font-mono tabular-nums"
                    style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                  >
                    {timeRemainingFormatted}
                  </div>
                </div>
              </div>
            ) : (
              /* Energetic Circle for Work Mode */
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                {/* SVG Circle with Progress */}
                <svg width="280" height="280" className="absolute transform -rotate-90">
                  <defs>
                    <linearGradient id="gradient-work" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>

                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r="110"
                    fill="none"
                    stroke="rgba(203, 213, 225, 0.25)"
                    strokeWidth="12"
                  />

                  {/* Progress circle */}
                  <motion.circle
                    cx="140"
                    cy="140"
                    r="110"
                    fill="none"
                    stroke="url(#gradient-work)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={691}
                    initial={{ strokeDashoffset: 691 }}
                    animate={{
                      strokeDashoffset: 691 - (691 * progressPercentage) / 100
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </svg>

                {/* Central energetic circle with Zap icon - DETRÁS */}
                <motion.div
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    width: '160px',
                    height: '160px',
                    zIndex: 1
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 30px rgba(79, 70, 229, 0.4)',
                      '0 0 45px rgba(139, 92, 246, 0.6)',
                      '0 0 30px rgba(79, 70, 229, 0.4)'
                    ]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="w-16 h-16 text-purple-300 opacity-30" />
                </motion.div>

                {/* Círculo blanco central sólido con timer - ADELANTE */}
                <div
                  className="absolute w-48 h-48 rounded-full bg-white shadow-inner flex items-center justify-center"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.05)',
                    zIndex: 2
                  }}
                >
                  {/* Timer grande y visible */}
                  <div
                    className="text-7xl font-black text-gray-900 font-mono tabular-nums"
                    style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                  >
                    {timeRemainingFormatted}
                  </div>
                </div>
              </div>
            )}
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
          aria-label={isRunning ? (isBreak ? 'Ver descanso' : 'Ver Pomodoro') : 'Iniciar Pomodoro'}
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
