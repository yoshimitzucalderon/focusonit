'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Eye, RotateCcw, Pause, Check, Play, Clock } from 'lucide-react'
import { groupSessionsByDate, formatDateTime, formatDuration } from '@/lib/utils/sessionGrouping'

interface Session {
  id: string
  task_id?: string
  duration_seconds?: number
  is_completed?: boolean
  created_at: string
  tasks?: {
    title: string
  }
}

interface SessionHistoryProps {
  sessions: Session[]
  onRepeatTask?: (taskId: string) => void
  onPauseSession?: (sessionId: string) => void
  onCompleteSession?: (sessionId: string) => void
  onViewDetails?: (sessionId: string) => void
}

export function SessionHistory({
  sessions,
  onRepeatTask,
  onPauseSession,
  onCompleteSession,
  onViewDetails
}: SessionHistoryProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set(['today']))
  const [displayLimit, setDisplayLimit] = useState(5)

  // Agrupar sesiones por fecha
  const groupedSessions = useMemo(() =>
    groupSessionsByDate(sessions),
    [sessions]
  )

  const displayedGroups = groupedSessions.slice(0, displayLimit)
  const hasMore = groupedSessions.length > displayLimit

  const toggleDate = (dateKey: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedDates(newExpanded)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Historial de Sesiones
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registro completo de actividad
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
          {sessions.length} total
        </div>
      </div>

      {/* Lista agrupada */}
      <div className="space-y-4">
        {displayedGroups.map((group) => {
          const isExpanded = expandedDates.has(group.dateKey)

          return (
            <div key={group.date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Header del día (colapsable) */}
              <button
                onClick={() => toggleDate(group.dateKey)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {group.dateDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    Total: {formatDuration(group.totalMinutes)}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>
                    {group.sessionCount} {group.sessionCount === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>
              </button>

              {/* Lista de sesiones (colapsable) */}
              {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {group.sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      onRepeat={() => onRepeatTask?.(session.task_id || '')}
                      onPause={() => onPauseSession?.(session.id)}
                      onComplete={() => onCompleteSession?.(session.id)}
                      onViewDetails={() => onViewDetails?.(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Cargar más */}
      {hasMore && (
        <button
          onClick={() => setDisplayLimit(prev => prev + 5)}
          className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
        >
          Cargar más sesiones ↓
        </button>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">📭</span>
          <p className="font-medium">No hay sesiones registradas</p>
          <p className="text-sm mt-1">Comienza una tarea para ver tu historial aquí</p>
        </div>
      )}
    </div>
  )
}

// Sub-componente para cada sesión
function SessionItem({
  session,
  onRepeat,
  onPause,
  onComplete,
  onViewDetails
}: {
  session: Session
  onRepeat: () => void
  onPause: () => void
  onComplete: () => void
  onViewDetails: () => void
}) {
  const status = session.is_completed ? 'completada' : 'en-progreso'

  const statusConfig = {
    'completada': {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      icon: '✓'
    },
    'en-progreso': {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      icon: '⏱️'
    }
  }[status]

  const duration = Math.floor((session.duration_seconds || 0) / 60)
  const taskTitle = session.tasks?.title || 'Sin título'

  return (
    <div className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition ${statusConfig.bg}`}>
      <div className="flex items-start gap-4">
        {/* Icono pomodoro */}
        <div className="flex-shrink-0 mt-1">
          <span className="text-2xl">🍅</span>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Título y estado */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
              {taskTitle}
            </h4>
            <span className={`
              flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap
              ${statusConfig.badge}
            `}>
              {statusConfig.icon} {status === 'en-progreso' ? 'En progreso' : 'Completada'}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span>{formatDateTime(session.created_at)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-wrap">
            {status === 'completada' && (
              <>
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Ver detalles"
                  onClick={onViewDetails}
                />
                <ActionButton
                  icon={<RotateCcw className="w-4 h-4" />}
                  label="Repetir tarea"
                  onClick={onRepeat}
                />
              </>
            )}

            {status === 'en-progreso' && (
              <>
                <ActionButton
                  icon={<Pause className="w-4 h-4" />}
                  label="Pausar"
                  onClick={onPause}
                  variant="warning"
                />
                <ActionButton
                  icon={<Check className="w-4 h-4" />}
                  label="Completar"
                  onClick={onComplete}
                  variant="success"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Botón de acción reutilizable
function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default'
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'success' | 'warning'
}) {
  const variantStyles = {
    default: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
  }[variant]

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition ${variantStyles}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
