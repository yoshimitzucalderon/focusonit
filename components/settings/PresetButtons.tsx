'use client'

import { motion } from 'framer-motion'
import { Zap, Clock, TrendingUp, Wrench } from 'lucide-react'

interface Preset {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  workDuration: number
  shortBreak: number
  longBreak: number
  pomodorosUntilLongBreak: number
}

const PRESETS: Preset[] = [
  {
    id: 'classic',
    name: 'Clásico',
    icon: <Clock className="w-5 h-5" />,
    description: '25-5-15-4',
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    pomodorosUntilLongBreak: 4
  },
  {
    id: 'short',
    name: 'Corto',
    icon: <Zap className="w-5 h-5" />,
    description: '15-3-10-3',
    workDuration: 15,
    shortBreak: 3,
    longBreak: 10,
    pomodorosUntilLongBreak: 3
  },
  {
    id: 'long',
    name: 'Largo',
    icon: <TrendingUp className="w-5 h-5" />,
    description: '50-10-30-2',
    workDuration: 50,
    shortBreak: 10,
    longBreak: 30,
    pomodorosUntilLongBreak: 2
  }
]

interface PresetButtonsProps {
  currentSettings: {
    work_duration: number
    short_break_duration: number
    long_break_duration: number
    pomodoros_until_long_break: number
  }
  onPresetSelect: (preset: Omit<Preset, 'id' | 'name' | 'icon' | 'description'>) => void
}

export function PresetButtons({ currentSettings, onPresetSelect }: PresetButtonsProps) {
  const isCustom = !PRESETS.some(preset =>
    preset.workDuration === currentSettings.work_duration &&
    preset.shortBreak === currentSettings.short_break_duration &&
    preset.longBreak === currentSettings.long_break_duration &&
    preset.pomodorosUntilLongBreak === currentSettings.pomodoros_until_long_break
  )

  const getCurrentPresetId = () => {
    const match = PRESETS.find(preset =>
      preset.workDuration === currentSettings.work_duration &&
      preset.shortBreak === currentSettings.short_break_duration &&
      preset.longBreak === currentSettings.long_break_duration &&
      preset.pomodorosUntilLongBreak === currentSettings.pomodoros_until_long_break
    )
    return match?.id || 'custom'
  }

  const currentPresetId = getCurrentPresetId()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Presets Rápidos
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isCustom ? 'Personalizado activo' : 'Preset aplicado'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPresetSelect({
              workDuration: preset.workDuration,
              shortBreak: preset.shortBreak,
              longBreak: preset.longBreak,
              pomodorosUntilLongBreak: preset.pomodorosUntilLongBreak
            })}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200
              ${currentPresetId === preset.id
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
              }
            `}
          >
            {currentPresetId === preset.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <div className={`
                p-2 rounded-lg
                ${currentPresetId === preset.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {preset.icon}
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${
                  currentPresetId === preset.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {preset.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {preset.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}

        {/* Custom Indicator */}
        <motion.div
          whileHover={{ scale: isCustom ? 1.02 : 1 }}
          className={`
            p-3 rounded-lg border-2 transition-all duration-200
            ${isCustom
              ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`
              p-2 rounded-lg
              ${isCustom
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
              }
            `}>
              <Wrench className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className={`font-semibold text-sm ${
                isCustom
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Custom
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isCustom ? 'Activo' : 'Ajusta'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
