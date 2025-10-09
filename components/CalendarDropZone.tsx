'use client'

import { useDroppable } from '@dnd-kit/core'

interface CalendarDropZoneProps {
  hour: number
  isOver?: boolean
}

export default function CalendarDropZone({ hour }: CalendarDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700 transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
      }`}
      style={{ top: `${hour * 60}px`, height: '60px' }}
    >
      <div className="flex h-full">
        {/* Columna de tiempo */}
        <div className="w-16 flex-shrink-0 pr-2 text-right">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {hour.toString().padStart(2, '0')}:00
          </span>
        </div>

        {/* Área de tareas */}
        <div className="flex-1 relative">
          {/* Línea de media hora */}
          <div className="absolute top-8 left-0 right-0 h-px bg-gray-100 dark:bg-gray-700/50" />

          {/* Indicador de drop */}
          {isOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                Soltar aquí
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
