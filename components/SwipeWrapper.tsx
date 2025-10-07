'use client'

import { useState, ReactNode } from 'react'
import { motion, useMotionValue, PanInfo } from 'framer-motion'
import { CheckCircle, Trash2, Edit3 } from 'lucide-react'

interface SwipeWrapperProps {
  children: ReactNode
  taskId: string
  onComplete?: () => void
  onDelete?: () => void
  onEdit?: () => void
  isCompleted?: boolean
}

export default function SwipeWrapper({
  children,
  taskId,
  onComplete,
  onDelete,
  onEdit,
  isCompleted = false,
}: SwipeWrapperProps) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)

  // Snap points
  const SNAP_CLOSED = 0
  const SNAP_FULL = -210 // 3 botones × 70px cada uno en móvil (w-[70px])
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

  const handleActionClick = (action: () => void) => {
    console.log('=== BUTTON ACTION CLICKED ===')
    action()
    closeSwipe()
  }

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Botones de acción - COMPLETAMENTE FUERA DE LA PANTALLA cuando están cerrados */}
        <div
          className="absolute top-0 bottom-0 flex transition-all duration-200"
          style={{
            right: isSwipeOpen ? 0 : -240,
            width: '240px',
            zIndex: isSwipeOpen && !isDragging ? 40 : 0,
            pointerEvents: isSwipeOpen && !isDragging ? 'auto' : 'none'
          }}
        >
          {/* Botón Completado - MÁS ANCHO */}
          <button
            type="button"
            onClick={(e) => {
              console.log('🟢 BOTÓN COMPLETADO CLICKED!')
              e.preventDefault()
              e.stopPropagation()
              if (onComplete) {
                handleActionClick(onComplete)
              }
            }}
            onTouchEnd={(e) => {
              console.log('🟢 BOTÓN COMPLETADO TOUCHED!')
              e.preventDefault()
              e.stopPropagation()
              if (onComplete) {
                handleActionClick(onComplete)
              }
            }}
            className="w-[70px] sm:w-28 flex flex-col items-center justify-center bg-green-500 text-white
                       hover:bg-green-600 hover:shadow-lg
                       active:bg-green-700 active:scale-95 active:shadow-inner
                       transition-all duration-150 touch-manipulation"
          >
            <CheckCircle size={22} className="mb-0.5 sm:mb-1" />
            <span className="text-xs sm:text-sm font-semibold">
              {isCompleted ? 'Reabrir' : 'Hecho'}
            </span>
          </button>

          {/* Botón Editar */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                console.log('🔵 BOTÓN EDITAR CLICKED!')
                e.preventDefault()
                e.stopPropagation()
                handleActionClick(onEdit)
              }}
              onTouchEnd={(e) => {
                console.log('🔵 BOTÓN EDITAR TOUCHED!')
                e.preventDefault()
                e.stopPropagation()
                handleActionClick(onEdit)
              }}
              className="w-[70px] sm:w-28 flex flex-col items-center justify-center bg-blue-500 text-white
                         hover:bg-blue-600 hover:shadow-lg
                         active:bg-blue-700 active:scale-95 active:shadow-inner
                         transition-all duration-150 touch-manipulation"
            >
              <Edit3 size={22} className="mb-0.5 sm:mb-1" />
              <span className="text-xs sm:text-sm font-semibold">Editar</span>
            </button>
          )}

          {/* Botón Borrar - MÁS ANCHO */}
          <button
            type="button"
            onClick={(e) => {
              console.log('🔴 BOTÓN BORRAR CLICKED!')
              e.preventDefault()
              e.stopPropagation()
              const confirmed = window.confirm('¿Eliminar esta tarea?')
              if (confirmed && onDelete) {
                handleActionClick(onDelete)
              } else {
                closeSwipe()
              }
            }}
            onTouchEnd={(e) => {
              console.log('🔴 BOTÓN BORRAR TOUCHED!')
              e.preventDefault()
              e.stopPropagation()
              const confirmed = window.confirm('¿Eliminar esta tarea?')
              if (confirmed && onDelete) {
                handleActionClick(onDelete)
              } else {
                closeSwipe()
              }
            }}
            className="w-[70px] sm:w-28 flex flex-col items-center justify-center bg-red-500 text-white
                       hover:bg-red-600 hover:shadow-lg
                       active:bg-red-700 active:scale-95 active:shadow-inner
                       transition-all duration-150 touch-manipulation"
          >
            <Trash2 size={22} className="mb-0.5 sm:mb-1" />
            <span className="text-xs sm:text-sm font-semibold">Borrar</span>
          </button>
        </div>

        {/* Contenido (TaskItem) - draggable con z-index ALTO cuando se arrastra */}
        <motion.div
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: SNAP_FULL, right: SNAP_CLOSED }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{
            x,
            zIndex: isDragging ? 50 : 20
          }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event, info) => {
            setIsDragging(false)
            handleDragEnd(event, info)
          }}
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

      {/* Backdrop para cerrar swipe - z-index MENOR que botones */}
      {isSwipeOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={closeSwipe}
          onTouchEnd={closeSwipe}
        />
      )}
    </>
  )
}
