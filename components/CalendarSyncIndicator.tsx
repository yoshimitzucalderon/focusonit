'use client'

import { Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface CalendarSyncIndicatorProps {
  googleEventId?: string | null
  syncedWithCalendar?: boolean
  googleCalendarSync?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function CalendarSyncIndicator({
  googleEventId,
  syncedWithCalendar,
  googleCalendarSync,
  size = 'sm',
  showLabel = false
}: CalendarSyncIndicatorProps) {
  // Don't show anything if sync is not enabled
  if (!googleCalendarSync) {
    return null
  }

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const iconSize = sizeClasses[size]

  // Synced successfully
  if (googleEventId && syncedWithCalendar) {
    return (
      <div className="flex items-center gap-1.5" title="Sincronizado con Google Calendar">
        <Calendar className={`${iconSize} text-blue-500 dark:text-blue-400`} />
        {showLabel && (
          <span className="text-xs text-blue-600 dark:text-blue-400">Sincronizado</span>
        )}
      </div>
    )
  }

  // Sync pending or failed
  if (googleCalendarSync && !syncedWithCalendar) {
    return (
      <div className="flex items-center gap-1.5" title="Sincronización pendiente">
        <AlertCircle className={`${iconSize} text-amber-500 dark:text-amber-400`} />
        {showLabel && (
          <span className="text-xs text-amber-600 dark:text-amber-400">Pendiente</span>
        )}
      </div>
    )
  }

  return null
}
