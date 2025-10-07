'use client'

import { Calendar, ChevronDown } from 'lucide-react'
import { TimePeriod } from '@/lib/hooks/useStatsFilters'
import { motion } from 'framer-motion'

interface FilterBarProps {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' }
]

export function FilterBar({ selectedPeriod, onPeriodChange }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Período
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {periods.map((period) => (
          <motion.button
            key={period.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPeriodChange(period.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                selectedPeriod === period.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }
            `}
          >
            {period.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
