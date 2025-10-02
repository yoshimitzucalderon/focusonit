'use client'

import { Trash2, CheckCircle, X } from 'lucide-react'
import { useSelection } from '@/context/SelectionContext'

interface BulkActionsBarProps {
  onBulkComplete: () => void
  onBulkDelete: () => void
  completeButtonText?: string
}

export function BulkActionsBar({ onBulkComplete, onBulkDelete, completeButtonText = 'Completar' }: BulkActionsBarProps) {
  const { selectedIds, isSelectionMode, exitSelectionMode } = useSelection()

  if (!isSelectionMode) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 safe-area-bottom">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Info de selección */}
        <div className="flex items-center gap-3">
          <button
            onClick={exitSelectionMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Cancelar selección"
          >
            <X size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedIds.size} {selectedIds.size === 1 ? 'tarea seleccionada' : 'tareas seleccionadas'}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <button
            onClick={onBulkComplete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{completeButtonText}</span>
          </button>

          <button
            onClick={onBulkDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
