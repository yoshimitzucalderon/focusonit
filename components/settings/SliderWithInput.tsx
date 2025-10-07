'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'

interface SliderWithInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  icon?: React.ReactNode
  color?: string
  unit?: string
  warningThreshold?: { min?: number; max?: number; message: string }
  helpText?: string
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  icon,
  color = 'blue',
  unit = 'min',
  warningThreshold,
  helpText
}: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [showTooltip, setShowTooltip] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    let newValue = parseInt(inputValue)

    if (isNaN(newValue) || newValue < min) {
      newValue = min
    } else if (newValue > max) {
      newValue = max
    }

    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const hasWarning = warningThreshold && (
    (warningThreshold.min && value < warningThreshold.min) ||
    (warningThreshold.max && value > warningThreshold.max)
  )

  const colorClasses = {
    blue: 'accent-blue-500 focus:ring-blue-500',
    green: 'accent-green-500 focus:ring-green-500',
    purple: 'accent-purple-500 focus:ring-purple-500',
    amber: 'accent-amber-500 focus:ring-amber-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
          {label}
          {helpText && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 z-10">
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs py-2 px-3 rounded shadow-lg">
                  {helpText}
                </div>
              </div>
            </div>
          )}
        </label>
      </div>

      <div className="flex items-center gap-4">
        {/* Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`
              w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
              ${colorClasses[color as keyof typeof colorClasses]}
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-${color}-500
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-${color}-500
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
            `}
          />

          {/* Tooltip during drag */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  left: `${((value - min) / (max - min)) * 100}%`
                }}
              >
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                  {value} {unit}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Number */}
        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className={`
              w-20 px-3 py-2 text-center font-semibold
              bg-white dark:bg-slate-700
              border-2 rounded-lg
              transition-all
              ${isFocused
                ? `border-${color}-500 ring-2 ring-${color}-200 dark:ring-${color}-900/50`
                : 'border-gray-300 dark:border-gray-600'
              }
              text-gray-900 dark:text-white
              hover:border-gray-400 dark:hover:border-gray-500
              focus:outline-none
            `}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
            {unit}
          </span>
        </div>
      </div>

      {/* Warning/Suggestion */}
      <AnimatePresence>
        {hasWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700 dark:text-amber-300">
              {warningThreshold?.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
