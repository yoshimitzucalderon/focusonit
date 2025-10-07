'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  change?: number
  changeLabel?: string
  additionalInfo?: {
    label: string
    value: string
  }[]
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  change,
  changeLabel = 'vs período anterior',
  additionalInfo
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0
  const hasChange = change !== undefined && change !== 0

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold dark:text-white mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      {hasChange && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-semibold ${
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {changeLabel}
            </span>
          </div>
        </div>
      )}

      {additionalInfo && additionalInfo.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {additionalInfo.map((info, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{info.label}</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{info.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
