'use client'

import { useState, ReactNode } from 'react'
import { motion, useMotionValue, PanInfo } from 'framer-motion'
import { CheckCircle, Trash2 } from 'lucide-react'

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
    const currentX = x.get()

    console.log('=== SWIPE DEBUG ===')
    console.log('isOpen:', isSwipeOpen)
    console.log('offset.x:', offset)
    console.log('velocity.x:', velocity)
    console.log('current x:', currentX)
    console.log('==================')

    // CASO 1: Swipe a la derecha para CERRAR (cuando está abierto)
    if (isSwipeOpen) {
      // Si se movió hacia la derecha O tiene velocidad positiva
      if (offset > SWIPE_THRESHOLD || velocity > 300) {
        console.log('Cerrando con swipe derecha')
        x.set(SNAP_CLOSED)
        setIsSwipeOpen(false)
        return
      }
      // Si no se movió lo suficiente, mantener abierto
      x.set(SNAP_FULL)
      return
    }

    // CASO 2: Swipe a la izquierda para ABRIR (cuando está cerrado)
    if (!isSwipeOpen) {
      // Ignorar swipe a la derecha cuando está cerrado
      if (offset > 0) {
        x.set(SNAP_CLOSED)
        return
      }

      // Validar threshold mínimo
      if (Math.abs(offset) < SWIPE_THRESHOLD) {
        x.set(SNAP_CLOSED)
        return
      }

      // Abrir si se movió suficiente o tiene velocidad
      if (velocity < -500 || offset < -90) {
        console.log('Abriendo con swipe izquierda')
        x.set(SNAP_FULL)
        setIsSwipeOpen(true)
      } else {
        x.set(SNAP_CLOSED)
      }
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
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: SNAP_FULL, right: 100 }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={handleDragEnd}
          animate={{
            x: isSwipeOpen ? SNAP_FULL : SNAP_CLOSED,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 40,
          }}
          className="relative bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing"
        >
          {children}
        </motion.div>
      </div>

      {/* Backdrop para cerrar swipe */}
      {isSwipeOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={closeSwipe}
          onTouchEnd={closeSwipe}
        />
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
