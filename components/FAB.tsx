'use client'

import { Plus, Mic, Keyboard, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useSelection } from '@/context/SelectionContext'

interface FABProps {
  onTextInput: () => void
  onVoiceInput: () => void
}

export function FAB({ onTextInput, onVoiceInput }: FABProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { hasSelection } = useSelection()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú al hacer click fuera
  // Cerrar menú cuando se activa la selección
  useEffect(() => {
    if (hasSelection && isExpanded) {
      setIsExpanded(false)
    }
  }, [hasSelection, isExpanded])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (isExpanded) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      // Pequeño delay para evitar cerrar inmediatamente al abrir
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
      }, 100)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isExpanded])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleOptionClick = (action: () => void) => {
    // Ejecutar acción inmediatamente
    action()
    // Cerrar menú después de un frame para mejor feedback visual
    requestAnimationFrame(() => {
      setIsExpanded(false)
    })
  }

  // No renderizar si hay selección activa
  if (hasSelection) {
    return null
  }

  return (
    <>
      {/* Backdrop - Animación rápida optimizada */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-[35]"
            style={{ WebkitBackdropFilter: 'blur(2px)', backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Speed Dial Container */}
      <motion.div
        initial={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7, y: 20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-20 md:bottom-8 right-4 z-40 flex flex-col items-end gap-3"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Options - Animaciones GPU-optimizadas */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Grabar con voz */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                transition={{
                  duration: 0.15,
                  delay: 0.05,
                  ease: [0.4, 0, 0.2, 1] // cubic-bezier easing
                }}
                onClick={() => handleOptionClick(onVoiceInput)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white dark:bg-slate-700 px-4 py-3 rounded-full shadow-lg active:shadow-md transition-shadow"
                style={{ transform: 'translateZ(0)' }} // Force GPU
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Grabar
                </span>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Mic size={20} className="text-white" />
                </div>
              </motion.button>

              {/* Escribir */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                transition={{
                  duration: 0.15,
                  delay: 0,
                  ease: [0.4, 0, 0.2, 1]
                }}
                onClick={() => handleOptionClick(onTextInput)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 bg-white dark:bg-slate-700 px-4 py-3 rounded-full shadow-lg active:shadow-md transition-shadow"
                style={{ transform: 'translateZ(0)' }}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Escribir
                </span>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Keyboard size={20} className="text-white" />
                </div>
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB Button - Optimizado para GPU */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{
            scale: scrolled ? 0.9 : 1,
            y: scrolled ? 8 : 0,
          }}
          whileTap={{ scale: 0.85 }}
          onClick={handleToggle}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg active:shadow-xl flex items-center justify-center group"
          style={{
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            transform: 'translateZ(0)', // Force GPU
            willChange: 'transform'
          }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{ transform: 'translateZ(0)' }}
          >
            {isExpanded ? (
              <X size={28} className="text-white" strokeWidth={2.5} />
            ) : (
              <Plus size={28} className="text-white" strokeWidth={2.5} />
            )}
          </motion.div>

          {/* Ripple effect - Más rápido */}
          <motion.span
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0, scale: 0 }}
            whileTap={{
              opacity: [0, 0.2, 0],
              scale: [0, 1.5],
              transition: { duration: 0.4 }
            }}
          />
        </motion.button>
      </motion.div>
    </>
  )
}
