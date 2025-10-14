'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react'

interface SavingIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  compact?: boolean
}

export function SavingIndicator({ status, compact = false }: SavingIndicatorProps) {
  if (status === 'idle') return null

  const config = {
    saving: {
      icon: Loader2,
      text: 'Guardando...',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      animate: true
    },
    saved: {
      icon: Check,
      text: 'Guardado',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      animate: false
    },
    error: {
      icon: CloudOff,
      text: 'Error al guardar',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      animate: false
    }
  }

  const current = config[status]
  const Icon = current.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`
          fixed top-20 right-4 z-40
          flex items-center gap-2
          px-3 py-2 rounded-lg
          border shadow-lg
          ${current.bgColor}
          ${current.borderColor}
          backdrop-blur-sm
        `}
      >
        <Icon
          className={`${current.color} ${current.animate ? 'animate-spin' : ''}`}
          size={compact ? 16 : 18}
        />
        {!compact && (
          <span className={`text-sm font-medium ${current.color}`}>
            {current.text}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Hook para manejar el estado del indicador
export function useSavingIndicator() {
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const startSaving = React.useCallback(() => {
    setStatus('saving')
  }, [])

  const markSaved = React.useCallback(() => {
    setStatus('saved')
    // Auto-ocultar después de 2 segundos
    setTimeout(() => setStatus('idle'), 2000)
  }, [])

  const markError = React.useCallback(() => {
    setStatus('error')
    // Auto-ocultar después de 3 segundos
    setTimeout(() => setStatus('idle'), 3000)
  }, [])

  return {
    status,
    startSaving,
    markSaved,
    markError
  }
}
