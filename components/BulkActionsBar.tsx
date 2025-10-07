'use client'

import { Trash2, CheckCircle, X, Edit3 } from 'lucide-react'
import { useSelection } from '@/context/SelectionContext'
import { memo } from 'react'

interface BulkActionsBarProps {
  onBulkComplete: () => void
  onBulkDelete: () => void
  onBulkEdit?: () => void
  completeButtonText?: string
}

function BulkActionsBarComponent({ onBulkComplete, onBulkDelete, onBulkEdit, completeButtonText = 'Completar' }: BulkActionsBarProps) {
  const { selectedIds, clearSelection, hasSelection } = useSelection()

  // Solo mostrar si hay tareas seleccionadas
  if (!hasSelection) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 md:bottom-0 md:left-64">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Contador + botón cerrar */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearSelection}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Cancelar selección"
          >
            <X size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedIds.size} {selectedIds.size === 1 ? 'seleccionada' : 'seleccionadas'}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          {selectedIds.size === 1 && onBulkEdit && (
            <button
              onClick={onBulkEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <Edit3 size={18} />
              <span className="text-sm font-medium hidden sm:inline">Editar</span>
            </button>
          )}

          <button
            onClick={onBulkComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors"
          >
            <CheckCircle size={18} />
            <span className="text-sm font-medium hidden sm:inline">{completeButtonText}</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Memoizar el componente para evitar re-renders innecesarios
// Solo se re-renderizará cuando cambien las props (onBulkComplete, onBulkDelete, completeButtonText)
export const BulkActionsBar = memo(BulkActionsBarComponent)
