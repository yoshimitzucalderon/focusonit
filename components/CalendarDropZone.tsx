'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'

interface CalendarDropZoneProps {
  hour: number
  isOver?: boolean
  onTaskDrop?: (taskData: any, hour: number, minute: number) => void
}

export default function CalendarDropZone({ hour, onTaskDrop }: CalendarDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
  })

  const showHighlight = isOver

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        showHighlight
          ? 'bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-400 dark:border-primary-600 shadow-inner'
          : ''
      }`}
      style={{ top: `${hour * 60}px`, height: '60px' }}
    >
      <div className="flex h-full">
        {/* Columna de tiempo */}
        <div className="w-16 flex-shrink-0 pr-2 text-right">
          <span className={`text-xs font-medium transition-colors ${
            isOver
              ? 'text-primary-700 dark:text-primary-300 font-bold'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {hour.toString().padStart(2, '0')}:00
          </span>
        </div>

        {/* Área de tareas */}
        <div className="flex-1 relative">
          {/* Línea de media hora */}
          <div className={`absolute top-8 left-0 right-0 h-px transition-colors ${
            isOver
              ? 'bg-primary-300 dark:bg-primary-700'
              : 'bg-gray-100 dark:bg-gray-700/50'
          }`} />

          {/* Indicador de drop mejorado */}
          {showHighlight && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-300 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg border-2 border-primary-400 dark:border-primary-600 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span>Soltar aquí • {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
