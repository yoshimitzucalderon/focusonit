'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format, addDays, addWeeks, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  buttonClassName?: string
  minDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Sin fecha',
  buttonClassName = '',
  minDate = new Date()
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState<{ top: number; left: number } | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Calcular posición del popover y ajustar si está fuera de viewport
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const popoverHeight = 400 // Altura aproximada del calendario
      const popoverWidth = 320 // Ancho aproximado del calendario

      let top = rect.bottom + 8
      let left = rect.left

      // Si el popover se sale por abajo, mostrarlo arriba del botón
      if (top + popoverHeight > viewportHeight) {
        top = rect.top - popoverHeight - 8
      }

      // Si el popover se sale por la derecha, ajustar a la izquierda
      if (left + popoverWidth > viewportWidth) {
        left = viewportWidth - popoverWidth - 16
      }

      // Si se sale por la izquierda, ajustar al borde
      if (left < 16) {
        left = 16
      }

      setButtonPosition({ top, left })
    }
  }, [isOpen])

  const handleSelect = (date: Date | undefined) => {
    onChange(date || null)
    setIsOpen(false)
  }

  const handleToday = () => {
    onChange(new Date())
    setIsOpen(false)
  }

  const handleTomorrow = () => {
    const tomorrow = addDays(new Date(), 1)
    onChange(tomorrow)
    setIsOpen(false)
  }

  const handleNextWeek = () => {
    const nextMonday = addWeeks(startOfWeek(new Date(), { locale: es, weekStartsOn: 1 }), 1)
    onChange(nextMonday)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
  }

  // Renderizar el popover usando Portal para evitar problemas de z-index
  const renderPopover = () => {
    if (!isOpen || !buttonPosition || !isMounted) return null

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Calendar Popover */}
        <div
          style={{
            position: 'fixed',
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            zIndex: 9999
          }}
          className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in"
        >
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={handleTomorrow}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
              >
                Mañana
              </button>
              <button
                onClick={handleNextWeek}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
              >
                Próx. semana
              </button>
              {value && (
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ml-auto flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Quitar
                </button>
              )}
            </div>

            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={value || undefined}
              onSelect={handleSelect}
              locale={es}
              weekStartsOn={1}
              className="rdp-custom"
              disabled={{ before: minDate }}
              modifiersClassNames={{
                selected: 'rdp-day_selected',
                today: 'rdp-day_today'
              }}
            />
          </div>
        </div>
      </>,
      document.body
    )
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
          value
            ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
        } ${buttonClassName}`}
      >
        <CalendarIcon className="w-4 h-4" />
        <span className="font-medium">
          {value ? format(value, "d 'de' MMM", { locale: es }) : placeholder}
        </span>
      </button>

      {/* Popover renderizado en Portal */}
      {renderPopover()}
    </>
  )
}
