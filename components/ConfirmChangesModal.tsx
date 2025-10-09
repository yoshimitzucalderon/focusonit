'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmChangesModalProps {
  changes: {
    changedFields: {
      title?: string
      dueDate?: string
      description?: string
      priority?: string
      tags?: string[]
    }
    original: {
      title: string
      dueDate: string | null
      description: string | null
      priority: string
      tags?: string[] | null
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

  // Debug logging
  console.log('🔍 ConfirmChangesModal - changedFields:', changedFields)
  console.log('🔍 ConfirmChangesModal - original:', original)
  console.log('🔍 ConfirmChangesModal - tags en changedFields:', changedFields.tags)

  // Cerrar con ESC y bloquear scroll del body
  useEffect(() => {
    // Bloquear scroll del body de manera más compatible con mobile
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width
    const scrollY = window.scrollY

    // En mobile, usar overflow: hidden sin position: fixed
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
      // Restaurar scroll del body
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      document.body.style.touchAction = ''

      // Restaurar posición de scroll en desktop
      if (!isMobile) {
        window.scrollTo(0, scrollY)
      }
    }
  }, [onCancel])

  const priorityLabels = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      style={{ zIndex: 999999, isolation: 'isolate' }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl my-8 max-h-[85vh] overflow-hidden flex flex-col relative z-[10000] border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold dark:text-white flex items-center gap-2">
            <span className="text-blue-500">✏️</span> Cambios sugeridos
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {changedFields.title && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Título</p>
              <p className="text-red-500/80 line-through text-sm break-words mb-1">{original.title}</p>
              <p className="text-green-600 dark:text-green-500 font-medium break-words">{changedFields.title}</p>
            </div>
          )}

          {changedFields.dueDate && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Fecha</p>
              <p className="text-red-500/80 line-through text-sm mb-1">
                {original.dueDate || 'Sin fecha'}
              </p>
              <p className="text-green-600 dark:text-green-500 font-medium">{changedFields.dueDate}</p>
            </div>
          )}

          {changedFields.description && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Descripción</p>

              {/* Old description - scrollable with visual indicator */}
              <div className="relative mb-3">
                <div className="text-red-500/80 line-through text-sm break-words whitespace-pre-wrap max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-300 dark:scrollbar-thumb-red-700 scrollbar-track-red-50 dark:scrollbar-track-gray-800 rounded border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 p-2">
                  {original.description || 'Sin descripción'}
                </div>
                {/* Scroll indicator */}
                {(original.description?.length || 0) > 150 && (
                  <div className="text-xs text-red-400 dark:text-red-500 mt-1 flex items-center gap-1">
                    <span>⤓</span> Desliza para ver más
                  </div>
                )}
              </div>

              {/* New description - scrollable with visual indicator */}
              <div className="relative">
                <div className="text-green-600 dark:text-green-500 font-medium text-sm break-words whitespace-pre-wrap max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-400 dark:scrollbar-thumb-green-700 scrollbar-track-green-50 dark:scrollbar-track-gray-800 rounded border border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/20 p-2">
                  {changedFields.description}
                </div>
                {/* Scroll indicator */}
                {(changedFields.description?.length || 0) > 150 && (
                  <div className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                    <span>⤓</span> Desliza para ver más
                  </div>
                )}
              </div>
            </div>
          )}

          {changedFields.priority && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Prioridad</p>
              <p className="text-red-500/80 line-through text-sm mb-1">
                {priorityLabels[original.priority as keyof typeof priorityLabels]}
              </p>
              <p className="text-green-600 dark:text-green-500 font-medium">
                {priorityLabels[changedFields.priority as keyof typeof priorityLabels]}
              </p>
            </div>
          )}

          {changedFields.tags && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Etiquetas</p>

              {/* Original tags */}
              {original.tags && original.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {original.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-500/80 line-through text-xs font-medium rounded-full border border-red-200 dark:border-red-900"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-red-500/80 line-through text-sm mb-2">Sin etiquetas</p>
              )}

              {/* New tags */}
              <div className="flex flex-wrap gap-1.5">
                {changedFields.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-500 text-xs font-semibold rounded-full border border-green-200 dark:border-green-900"
                  >
                    + #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Sticky buttons */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-all font-medium min-h-[48px] shadow-lg shadow-blue-500/20"
          >
            Aplicar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 transition-all font-medium min-h-[48px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  // Usar portal para renderizar en el root del DOM, fuera del flujo normal
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}
