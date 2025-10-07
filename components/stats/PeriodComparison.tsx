'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComparisonData {
  metric: string
  current: {
    value: number
    display: string
  }
  previous: {
    value: number
    display: string
  }
  change: {
    value: number
    isPositive: boolean
  }
  icon: string
}

interface PeriodComparisonProps {
  currentPeriod: {
    label: string
    totalMinutes: number
    sessionsCount: number
    completedTasks: number
  }
  previousPeriod: {
    label: string
    totalMinutes: number
    sessionsCount: number
    completedTasks: number
  }
}

export function PeriodComparison({ currentPeriod, previousPeriod }: PeriodComparisonProps) {
  const comparisons = useMemo(() =>
    calculateComparisons(currentPeriod, previousPeriod),
    [currentPeriod, previousPeriod]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl shadow-sm border-2 border-blue-100 dark:border-blue-900/50 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📈</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentPeriod.label} vs {previousPeriod.label}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comparativa de rendimiento
          </p>
        </div>
      </div>

      {/* Grid de comparaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisons.map((comparison, index) => (
          <ComparisonItem key={comparison.metric} data={comparison} index={index} />
        ))}
      </div>
    </motion.div>
  )
}

// Sub-componente para cada métrica
function ComparisonItem({ data, index }: { data: ComparisonData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      {/* Métrica e ícono */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{data.icon}</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {data.metric}
        </span>
      </div>

      {/* Valores */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.current.display}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>vs</span>
          <span>{data.previous.display}</span>
        </div>
      </div>

      {/* Cambio porcentual */}
      <div className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold
        ${data.change.isPositive
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }
      `}>
        {data.change.isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{data.change.isPositive ? '+' : ''}{data.change.value.toFixed(1)}%</span>
      </div>
    </motion.div>
  )
}

// Función de cálculo
function calculateComparisons(
  currentData: PeriodComparisonProps['currentPeriod'],
  previousData: PeriodComparisonProps['previousPeriod']
): ComparisonData[] {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, isPositive: current > 0 }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return [
    {
      metric: "Tiempo",
      current: {
        value: currentData.totalMinutes,
        display: formatDuration(currentData.totalMinutes)
      },
      previous: {
        value: previousData.totalMinutes,
        display: formatDuration(previousData.totalMinutes)
      },
      change: calculateChange(currentData.totalMinutes, previousData.totalMinutes),
      icon: "⏱️"
    },
    {
      metric: "Sesiones",
      current: {
        value: currentData.sessionsCount,
        display: currentData.sessionsCount.toString()
      },
      previous: {
        value: previousData.sessionsCount,
        display: previousData.sessionsCount.toString()
      },
      change: calculateChange(currentData.sessionsCount, previousData.sessionsCount),
      icon: "🎯"
    },
    {
      metric: "Completadas",
      current: {
        value: currentData.completedTasks,
        display: currentData.completedTasks.toString()
      },
      previous: {
        value: previousData.completedTasks,
        display: previousData.completedTasks.toString()
      },
      change: calculateChange(currentData.completedTasks, previousData.completedTasks),
      icon: "✅"
    }
  ]
}
