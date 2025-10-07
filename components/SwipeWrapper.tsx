'use client'

import React, { useRef, useState, useEffect } from 'react'
import { CheckCircle, Edit2, Trash2 } from 'lucide-react'

interface SwipeWrapperProps {
  children: React.ReactNode
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
  taskId?: string
}

export default function SwipeWrapper({
  children,
  onComplete,
  onEdit,
  onDelete,
  taskId
}: SwipeWrapperProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = -100
  const MAX_SWIPE = -240

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isSwipeOpen) {
          setIsSwipeOpen(false)
          setDragX(0)
        }
      }
    }

    if (isSwipeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isSwipeOpen])

  const handleStart = (clientX: number) => {
    startX.current = clientX
    currentX.current = dragX
    setIsDragging(true)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return

    const diff = clientX - startX.current
    const newX = Math.max(MAX_SWIPE, Math.min(0, currentX.current + diff))
    setDragX(newX)
  }

  const handleEnd = () => {
    setIsDragging(false)

    if (dragX < SWIPE_THRESHOLD) {
      setDragX(MAX_SWIPE)
      setIsSwipeOpen(true)
    } else {
      setDragX(0)
      setIsSwipeOpen(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  const handleButtonClick = (action: () => void) => {
    action()
    setIsSwipeOpen(false)
    setDragX(0)
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* BOTONES FIJOS DETRÁS - Estilo iOS Real */}
      <div className="absolute inset-0 flex items-stretch justify-end">
        {/* Botón Completar */}
        {onComplete && (
          <button
            onClick={() => handleButtonClick(onComplete)}
            className="flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white transition-colors w-20"
            disabled={!isSwipeOpen}
            style={{
              pointerEvents: isSwipeOpen ? 'auto' : 'none'
            }}
            aria-label="Marcar como completada"
          >
            <CheckCircle className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Hecho</span>
          </button>
        )}

        {/* Botón Editar */}
        {onEdit && (
          <button
            onClick={() => handleButtonClick(onEdit)}
            className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors w-20"
            disabled={!isSwipeOpen}
            style={{
              pointerEvents: isSwipeOpen ? 'auto' : 'none'
            }}
            aria-label="Editar tarea"
          >
            <Edit2 className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Editar</span>
          </button>
        )}

        {/* Botón Eliminar */}
        {onDelete && (
          <button
            onClick={() => handleButtonClick(onDelete)}
            className="flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors w-20"
            disabled={!isSwipeOpen}
            style={{
              pointerEvents: isSwipeOpen ? 'auto' : 'none'
            }}
            aria-label="Eliminar tarea"
          >
            <Trash2 className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Borrar</span>
          </button>
        )}
      </div>

      {/* CONTENIDO QUE SE DESLIZA - Estilo iOS */}
      <div
        className="relative transition-transform"
        style={{
          transform: `translateX(${dragX}px)`,
          transitionDuration: isDragging ? '0ms' : '200ms',
          zIndex: 10,
          width: '100%',
          backgroundColor: isDarkMode ? '#1f2937' : 'white',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
