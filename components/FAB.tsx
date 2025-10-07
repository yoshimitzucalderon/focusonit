'use client'

import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface FABProps {
  onClick: () => void
}

export function FAB({ onClick }: FABProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Ocultar FAB al hacer scroll down, mostrar al scroll up
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{
        scale: scrolled ? 0.9 : 1,
        y: scrolled ? 8 : 0,
      }}
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg active:shadow-xl transition-shadow flex items-center justify-center group hover:shadow-2xl"
      style={{
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
      }}
    >
      <motion.div
        animate={{ rotate: scrolled ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Plus size={28} className="text-white" strokeWidth={2.5} />
      </motion.div>

      {/* Ripple effect */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 group-active:animate-ping" />
    </motion.button>
  )
}
