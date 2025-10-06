'use client'

import { useEffect } from 'react'

interface ConfirmChangesModalProps {
  changes: {
    changedFields: {
      title?: string
      dueDate?: string
      description?: string
      priority?: string
    }
    original: {
      title: string
      dueDate: string | null
      description: string | null
      priority: string
    }
  }
  currentTask: any
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmChangesModal({
  changes,
  currentTask,
  onConfirm,
  onCancel
}: ConfirmChangesModalProps) {
  const { changedFields, original } = changes

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onCancel])

  const priorityLabels = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          📝 Cambios sugeridos
        </h3>

        <div className="space-y-3 mb-6">
          {changedFields.title && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Título:</p>
              <p className="text-red-600 line-through text-sm break-words">{original.title}</p>
              <p className="text-green-600 font-medium break-words">{changedFields.title}</p>
            </div>
          )}

          {changedFields.dueDate && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha:</p>
              <p className="text-red-600 line-through text-sm">
                {original.dueDate || 'Sin fecha'}
              </p>
              <p className="text-green-600 font-medium">{changedFields.dueDate}</p>
            </div>
          )}

          {changedFields.description && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descripción:</p>
              <p className="text-red-600 line-through text-sm break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                {original.description || 'Sin descripción'}
              </p>
              <p className="text-green-600 font-medium break-words whitespace-pre-wrap max-h-48 overflow-y-auto">
                {changedFields.description}
              </p>
            </div>
          )}

          {changedFields.priority && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prioridad:</p>
              <p className="text-red-600 line-through text-sm">
                {priorityLabels[original.priority as keyof typeof priorityLabels]}
              </p>
              <p className="text-green-600 font-medium">
                {priorityLabels[changedFields.priority as keyof typeof priorityLabels]}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-gray-800 pt-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[48px]"
          >
            Aplicar cambios
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 dark:border-gray-600 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors dark:text-white min-h-[48px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
