'use client'

import { motion } from 'framer-motion'

interface CircularProgressProps {
  percentage: number // 0-100
  size?: number // diameter in pixels
  strokeWidth?: number
  color?: string
  backgroundColor?: string
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6', // blue-500
  backgroundColor = '#e5e7eb', // gray-200
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="dark:stroke-gray-700"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
}
