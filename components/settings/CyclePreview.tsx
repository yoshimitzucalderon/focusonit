'use client'

import { motion } from 'framer-motion'
import { Coffee, Clock } from 'lucide-react'

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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Vista Previa del Ciclo
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Un ciclo completo de {pomodorosUntilLongBreak} Pomodoro{pomodorosUntilLongBreak > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Duración total</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatDuration(totalCycleMinutes)}
          </p>
        </div>
      </div>

      {/* Timeline Visual */}
      <div className="relative">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {timeline.map((item, index) => {
            const isWork = item.type === 'work'
            const isShortBreak = item.type === 'shortBreak'
            const isLongBreak = item.type === 'longBreak'

            return (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0"
              >
                <div
                  className={`
                    relative group flex flex-col items-center justify-center rounded-lg
                    transition-all duration-200 hover:scale-105
                    ${isWork ? 'w-16 h-16 bg-blue-500 dark:bg-blue-600' : ''}
                    ${isShortBreak ? 'w-12 h-12 bg-green-500 dark:bg-green-600' : ''}
                    ${isLongBreak ? 'w-16 h-16 bg-purple-500 dark:bg-purple-600' : ''}
                  `}
                >
                  {isWork && (
                    <>
                      <Clock className="w-6 h-6 text-white" />
                      <span className="text-xs font-bold text-white mt-1">
                        {item.duration}m
                      </span>
                    </>
                  )}
                  {(isShortBreak || isLongBreak) && (
                    <>
                      <Coffee className="w-5 h-5 text-white" />
                      <span className="text-xs font-bold text-white mt-1">
                        {item.duration}m
                      </span>
                    </>
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block">
                    <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs py-1 px-2 rounded whitespace-nowrap">
                      {isWork && 'Pomodoro'}
                      {isShortBreak && 'Descanso corto'}
                      {isLongBreak && 'Descanso largo'}
                      : {item.duration} min
                    </div>
                  </div>
                </div>

                {/* Arrow between items */}
                {index < timeline.length - 1 && (
                  <svg
                    className="w-3 h-3 text-gray-400 dark:text-gray-600 mx-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Pomodoro ({workDuration}m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Descanso corto ({shortBreakDuration}m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500 dark:bg-purple-600"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Descanso largo ({longBreakDuration}m)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
