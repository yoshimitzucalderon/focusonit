'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, Plus, Minus } from 'lucide-react'

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
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)

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

  const handleIncrement = () => {
    const increment = value < 10 ? 1 : 5
    const newValue = Math.min(value + increment, max)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const decrement = value < 10 ? 1 : 5
    const newValue = Math.max(value - decrement, min)
    onChange(newValue)
  }

  const hasWarning = warningThreshold && (
    (warningThreshold.min && value < warningThreshold.min) ||
    (warningThreshold.max && value > warningThreshold.max)
  )

  const colorMap = {
    blue: {
      slider: 'bg-blue-500',
      border: 'border-blue-500',
      ring: 'ring-blue-200 dark:ring-blue-900/50',
      text: 'text-blue-600 dark:text-blue-400',
      button: 'hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 dark:active:bg-blue-900/50'
    },
    green: {
      slider: 'bg-green-500',
      border: 'border-green-500',
      ring: 'ring-green-200 dark:ring-green-900/50',
      text: 'text-green-600 dark:text-green-400',
      button: 'hover:bg-green-100 dark:hover:bg-green-900/30 active:bg-green-200 dark:active:bg-green-900/50'
    },
    purple: {
      slider: 'bg-purple-500',
      border: 'border-purple-500',
      ring: 'ring-purple-200 dark:ring-purple-900/50',
      text: 'text-purple-600 dark:text-purple-400',
      button: 'hover:bg-purple-100 dark:hover:bg-purple-900/30 active:bg-purple-200 dark:active:bg-purple-900/50'
    },
    amber: {
      slider: 'bg-amber-500',
      border: 'border-amber-500',
      ring: 'ring-amber-200 dark:ring-amber-900/50',
      text: 'text-amber-600 dark:text-amber-400',
      button: 'hover:bg-amber-100 dark:hover:bg-amber-900/30 active:bg-amber-200 dark:active:bg-amber-900/50'
    }
  }

  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue

  // Calculate slider fill percentage
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
          {label}
          {helpText && (
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 z-10">
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs py-2 px-3 rounded-lg shadow-xl">
                  {helpText}
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                </div>
              </div>
            </div>
          )}
        </label>
        <div className={`text-sm font-bold ${colors.text}`}>
          {value} {unit}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Slider */}
        <div className="flex-1 relative">
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Filled portion */}
            <motion.div
              className={`absolute left-0 top-0 h-full ${colors.slider}`}
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          <input
            ref={sliderRef}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => {
              setShowTooltip(true)
              setIsDragging(true)
            }}
            onMouseUp={() => {
              setIsDragging(false)
              setTimeout(() => setShowTooltip(false), 200)
            }}
            onTouchStart={() => {
              setShowTooltip(true)
              setIsDragging(true)
            }}
            onTouchEnd={() => {
              setIsDragging(false)
              setTimeout(() => setShowTooltip(false), 200)
            }}
            className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer z-10"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />

          {/* Custom thumb */}
          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white ${colors.border} border-[3px] shadow-lg cursor-pointer pointer-events-none`}
            style={{
              left: `calc(${percentage}% - 12px)`
            }}
            animate={{
              scale: isDragging ? 1.3 : 1,
              boxShadow: isDragging
                ? '0 8px 16px rgba(0,0,0,0.25)'
                : '0 4px 8px rgba(0,0,0,0.15)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />

          {/* Tooltip during drag */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute -top-12 pointer-events-none z-20"
                style={{
                  left: `calc(${percentage}% - 24px)`
                }}
              >
                <div className={`${colors.slider} text-white text-sm font-bold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap`}>
                  {value} {unit}
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${colors.slider} rotate-45`}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Number with +/- buttons */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={handleDecrement}
            disabled={value <= min}
            className={`
              p-1.5 rounded transition-all
              ${value <= min
                ? 'opacity-30 cursor-not-allowed'
                : `${colors.button} cursor-pointer`
              }
            `}
            aria-label="Decrement"
          >
            <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

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
              w-16 px-2 py-1.5 text-center font-bold text-sm
              bg-white dark:bg-slate-800
              border-2 rounded
              transition-all
              ${isFocused
                ? `${colors.border} ring-2 ${colors.ring}`
                : 'border-transparent'
              }
              text-gray-900 dark:text-white
              focus:outline-none
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            `}
          />

          <button
            onClick={handleIncrement}
            disabled={value >= max}
            className={`
              p-1.5 rounded transition-all
              ${value >= max
                ? 'opacity-30 cursor-not-allowed'
                : `${colors.button} cursor-pointer`
              }
            `}
            aria-label="Increment"
          >
            <Plus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Warning/Suggestion */}
      <AnimatePresence>
        {hasWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300 font-medium">
                {warningThreshold?.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
