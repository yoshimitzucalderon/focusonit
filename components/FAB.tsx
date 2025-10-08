'use client'

import { Plus, Mic, Keyboard, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface FABProps {
  onTextInput: () => void
  onVoiceInput: () => void
}

export function FAB({ onTextInput, onVoiceInput }: FABProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (isExpanded) setIsExpanded(false)
    }

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [isExpanded])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleOptionClick = (action: () => void, e: React.MouseEvent) => {
    e.stopPropagation()
    action()
    setIsExpanded(false)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[35] backdrop-blur-[1px]"
          />
        )}
      </AnimatePresence>

      {/* Speed Dial Container */}
      <div className="fixed bottom-20 md:bottom-8 right-4 z-40 flex flex-col items-end gap-3">
        {/* Options */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Grabar con voz */}
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: 0.05 }}
                onClick={(e) => handleOptionClick(onVoiceInput, e)}
                className="flex items-center gap-3 bg-white dark:bg-slate-700 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
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
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: 0 }}
                onClick={(e) => handleOptionClick(onTextInput, e)}
                className="flex items-center gap-3 bg-white dark:bg-slate-700 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
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

        {/* Main FAB Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{
            scale: scrolled ? 0.9 : 1,
            y: scrolled ? 8 : 0,
          }}
          whileTap={{ scale: 0.85 }}
          onClick={handleToggle}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg active:shadow-xl transition-shadow flex items-center justify-center group hover:shadow-2xl"
          style={{
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
          }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <X size={28} className="text-white" strokeWidth={2.5} />
            ) : (
              <Plus size={28} className="text-white" strokeWidth={2.5} />
            )}
          </motion.div>

          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 group-active:animate-ping" />
        </motion.button>
      </div>
    </>
  )
}
