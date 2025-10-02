'use client'

import { useState, ReactNode } from 'react'
import { motion, useMotionValue, PanInfo } from 'framer-motion'
import { CheckCircle, Trash2 } from 'lucide-react'
import { useSelection } from '@/context/SelectionContext'

interface SwipeWrapperProps {
  children: ReactNode
  taskId: string
  onComplete?: () => void
  onDelete?: () => void
  isCompleted?: boolean
}

export default function SwipeWrapper({
  children,
  taskId,
  onComplete,
  onDelete,
  isCompleted = false,
}: SwipeWrapperProps) {
  const { selectedIds, isSelectionMode, toggleSelection } = useSelection()
  const isSelected = selectedIds.has(taskId)
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const x = useMotionValue(0)

  // Snap points
  const SNAP_CLOSED = 0
  const SNAP_FULL = -106 // 2 botones * 53px = 106px
  const SWIPE_THRESHOLD = 20 // Mínimo 20px para activar

  // Handler para swipe estilo iOS
  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Si está cerrado, ignorar swipe a la derecha
    if (!isSwipeOpen && offset > 0) {
      x.set(SNAP_CLOSED)
      return
    }

    // Si está abierto y swipe a la derecha, cerrar
    if (isSwipeOpen && (offset > SWIPE_THRESHOLD || velocity > 500)) {
      x.set(SNAP_CLOSED)
      setIsSwipeOpen(false)
      return
    }

    // Si el movimiento es muy pequeño, ignorar
    if (Math.abs(offset) < SWIPE_THRESHOLD) {
      x.set(SNAP_CLOSED)
      setIsSwipeOpen(false)
      return
    }

    // Determinar a qué snap point ir
    if (velocity < -500 || offset < -90) {
      // Swipe rápido o largo a la izquierda - abrir completamente
      x.set(SNAP_FULL)
      setIsSwipeOpen(true)
    } else {
      // Cerrar
      x.set(SNAP_CLOSED)
      setIsSwipeOpen(false)
    }
  }

  const closeSwipe = () => {
    x.set(SNAP_CLOSED)
    setIsSwipeOpen(false)
  }

  const handleCompleteFromSwipe = () => {
    onComplete?.()
    closeSwipe()
  }

  const handleDeleteFromSwipe = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete?.()
    setShowDeleteConfirm(false)
    closeSwipe()
  }

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Checkbox de selección (solo visible en modo selección) */}
        {isSelectionMode && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-50 selection-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(taskId)}
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
            />
          </div>
        )}

        {/* Indicador visual de selección */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 pointer-events-none z-0" />
        )}

        {/* Botones de acción (detrás del swipe) */}
        <div className="absolute inset-y-0 right-0 flex">
          {/* Botón Completar */}
          <button
            onClick={handleCompleteFromSwipe}
            className="w-[53px] flex flex-col items-center justify-center bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">
              {isCompleted ? 'Reabrir' : 'Completado'}
            </span>
          </button>


          {/* Botón Eliminar */}
          <button
            onClick={handleDeleteFromSwipe}
            className="w-[53px] flex flex-col items-center justify-center bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Borrar</span>
          </button>
        </div>

        {/* Contenido (TaskItem) - draggable */}
        <motion.div
          drag={!isSelectionMode ? 'x' : false} // Deshabilitar drag en modo selección
          dragDirectionLock
          dragConstraints={
            isSwipeOpen
              ? { left: SNAP_FULL, right: 50 } // permite swipe derecha cuando está abierto
              : { left: SNAP_FULL, right: 0 }   // bloquea derecha cuando está cerrado
          }
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={handleDragEnd}
          animate={{
            x: isSwipeOpen ? SNAP_FULL : SNAP_CLOSED,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`relative bg-white dark:bg-slate-900 ${
            !isSelectionMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
          } ${isSelectionMode ? 'pl-12' : ''}`} // espacio para checkbox
          onClick={() => {
            if (isSelectionMode) {
              toggleSelection(taskId)
            }
          }}
        >
          {children}
        </motion.div>
      </div>

      {/* Backdrop para cerrar swipe */}
      {isSwipeOpen && !isSelectionMode && (
        <div className="fixed inset-0 z-30" onClick={closeSwipe} />
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-2 dark:text-white">
              ¿Eliminar tarea?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 font-medium transition-colors min-h-[44px]"
              >
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 active:bg-gray-400 font-medium transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
