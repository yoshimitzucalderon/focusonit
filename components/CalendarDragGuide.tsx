'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

interface CalendarDragGuideProps {
  /**
   * Si el drag está activo
   */
  isDragging: boolean
  /**
   * Posición Y del mouse en el calendario (en minutos)
   */
  mouseMinutes: number | null
  /**
   * Referencia al contenedor del calendario para calcular posición
   */
  calendarRef: React.RefObject<HTMLDivElement>
}

/**
 * Línea guía horizontal que sigue al mouse durante drag & drop
 * Muestra el horario exacto donde caerá la tarea
 */
export default function CalendarDragGuide({
  isDragging,
  mouseMinutes,
  calendarRef
}: CalendarDragGuideProps) {
  const [guidePosition, setGuidePosition] = useState<number | null>(null)
  const [snappedMinutes, setSnappedMinutes] = useState<number | null>(null)

  useEffect(() => {
    if (!isDragging || mouseMinutes === null || !calendarRef.current) {
      setGuidePosition(null)
      setSnappedMinutes(null)
      return
    }

    // Snap a intervalos de 15 minutos
    const snapped = Math.round(mouseMinutes / 15) * 15
    const clampedSnapped = Math.max(0, Math.min(1439, snapped))

    setSnappedMinutes(clampedSnapped)
    setGuidePosition(clampedSnapped)
  }, [isDragging, mouseMinutes, calendarRef])

  if (!isDragging || guidePosition === null || snappedMinutes === null) {
    return null
  }

  // Formatear tiempo HH:MM
  const hours = Math.floor(snappedMinutes / 60)
  const minutes = snappedMinutes % 60
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute left-0 right-0 pointer-events-none z-30"
        style={{ top: `${guidePosition}px` }}
      >
        {/* Línea horizontal guía */}
        <div className="relative">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-80"
          />

          {/* Indicadores laterales con el horario */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Círculo indicador izquierdo */}
            <div className="w-3 h-3 rounded-full bg-primary-500 shadow-lg animate-pulse" />

            {/* Badge con la hora */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 font-mono font-bold text-sm whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              {timeString}
            </div>
          </div>

          {/* Indicador derecho */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 rounded-full bg-primary-500 shadow-lg animate-pulse" />
          </div>

          {/* Línea punteada sutil que se extiende verticalmente */}
          <div className="absolute left-16 top-0 bottom-0 w-px bg-primary-300 dark:bg-primary-700 opacity-30" style={{ height: '30px', top: '-15px' }} />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
