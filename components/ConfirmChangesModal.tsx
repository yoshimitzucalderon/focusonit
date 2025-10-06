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
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          📝 Cambios sugeridos
        </h3>

        <div className="space-y-3 mb-6">
          {changedFields.title && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Título:</p>
              <p className="text-red-600 line-through text-sm">{original.title}</p>
              <p className="text-green-600 font-medium">{changedFields.title}</p>
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
              <p className="text-red-600 line-through text-sm">
                {original.description || 'Sin descripción'}
              </p>
              <p className="text-green-600 font-medium">{changedFields.description}</p>
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

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Aplicar cambios
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
