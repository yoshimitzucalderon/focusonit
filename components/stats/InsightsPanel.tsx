'use client'

import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { Insight } from '@/lib/hooks/useInsights'

interface InsightsPanelProps {
  insights: Insight[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return null
  }

  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-400'
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-400'
      case 'info':
        return 'text-blue-700 dark:text-blue-400'
      default:
        return 'text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Insights de este período
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            <span className="text-2xl flex-shrink-0">{insight.icon}</span>
            <p className={`text-sm font-medium ${getInsightStyles(insight.type)}`}>
              {insight.message}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
