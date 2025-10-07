'use client'

interface PriorityBadgeProps {
  priority: 'alta' | 'media' | 'baja'
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = {
    alta: {
      icon: '🔴',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-300 dark:border-red-700'
    },
    media: {
      icon: '🟡',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-700'
    },
    baja: {
      icon: '🟢',
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-700'
    }
  }[priority]

  return (
    <div className={`
      flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
      ${config.bg} ${config.text} ${config.border}
    `}>
      <span>{config.icon}</span>
      <span className="capitalize">{priority}</span>
    </div>
  )
}
