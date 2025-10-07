'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface CyclePreviewProps {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosUntilLongBreak: number
}

export function CyclePreview({
  workDuration,
  shortBreakDuration,
  longBreakDuration,
  pomodorosUntilLongBreak
}: CyclePreviewProps) {
  // Calcular duración total del ciclo
  const totalCycleMinutes =
    workDuration * pomodorosUntilLongBreak +
    shortBreakDuration * (pomodorosUntilLongBreak - 1) +
    longBreakDuration

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Crear timeline del ciclo
  const timeline = []
  for (let i = 0; i < pomodorosUntilLongBreak; i++) {
    timeline.push({ type: 'work', duration: workDuration })
    if (i < pomodorosUntilLongBreak - 1) {
      timeline.push({ type: 'shortBreak', duration: shortBreakDuration })
    }
  }
  timeline.push({ type: 'longBreak', duration: longBreakDuration })

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900/50">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Vista Previa del Ciclo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Un ciclo completo de {pomodorosUntilLongBreak} Pomodoro{pomodorosUntilLongBreak > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">⏱️ Duración total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatDuration(totalCycleMinutes)}
          </p>
        </div>
      </div>

      {/* Timeline Visual - Horizontal con tarjetas grandes */}
      <div className="relative">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {timeline.map((item, index) => {
            const isWork = item.type === 'work'
            const isShortBreak = item.type === 'shortBreak'
            const isLongBreak = item.type === 'longBreak'

            return (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                  className="flex-shrink-0"
                >
                  <div
                    className={`
                      relative group flex flex-col items-center justify-center rounded-xl
                      transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer
                      ${isWork ? 'w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700' : ''}
                      ${isShortBreak ? 'w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700' : ''}
                      ${isLongBreak ? 'w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700' : ''}
                      shadow-md
                    `}
                  >
                    {/* Emoji Icons */}
                    <div className={`${isWork ? 'text-3xl sm:text-4xl' : isLongBreak ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
                      {isWork && '🍅'}
                      {isShortBreak && '☕'}
                      {isLongBreak && '🛋️'}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white mt-1">
                      {item.duration} min
                    </span>

                    {/* Tooltip mejorado */}
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs py-2 px-3 rounded-lg shadow-xl whitespace-nowrap">
                        <div className="font-semibold">
                          {isWork && 'Pomodoro'}
                          {isShortBreak && 'Descanso corto'}
                          {isLongBreak && 'Descanso largo'}
                        </div>
                        <div className="text-gray-300 dark:text-gray-600">
                          {item.duration} minutos
                        </div>
                        {/* Arrow */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                      </div>
                    </div>
                  </div>

                  {/* Label debajo */}
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    {isWork && 'Pomodoro'}
                    {isShortBreak && 'Break'}
                    {isLongBreak && 'Long Break'}
                  </p>
                </motion.div>

                {/* Arrow between items - más visible */}
                {index < timeline.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                    className="mx-1 sm:mx-2"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend mejorada */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pomodoro <span className="text-gray-500 dark:text-gray-400">({workDuration}m)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descanso corto <span className="text-gray-500 dark:text-gray-400">({shortBreakDuration}m)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descanso largo <span className="text-gray-500 dark:text-gray-400">({longBreakDuration}m)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
