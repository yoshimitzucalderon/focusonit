'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Save, Check, RotateCcw, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SaveButtonProps {
  hasChanges: boolean
  isSaving: boolean
  onSave: () => void
  onReset: () => void
}

export function SaveButton({ hasChanges, isSaving, onSave, onReset }: SaveButtonProps) {
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false)
  const [prevIsSaving, setPrevIsSaving] = useState(false)

  // Show confirmation when save completes
  useEffect(() => {
    if (prevIsSaving && !isSaving && !hasChanges) {
      setShowSavedConfirmation(true)
      setTimeout(() => setShowSavedConfirmation(false), 3000)
    }
    setPrevIsSaving(isSaving)
  }, [isSaving, hasChanges, prevIsSaving])

  const handleReset = () => {
    if (window.confirm('¿Seguro que deseas restaurar? Perderás la configuración actual.')) {
      onReset()
    }
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 md:bottom-0 left-0 right-0 z-[90] mb-16 md:mb-0 border-t-2 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <AnimatePresence mode="wait">
              {showSavedConfirmation && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                  <span>¡Guardado!</span>
                </motion.div>
              )}
              {!showSavedConfirmation && !hasChanges && !isSaving && (
                <motion.div
                  key="no-changes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Todo guardado</span>
                </motion.div>
              )}
              {hasChanges && !isSaving && (
                <motion.div
                  key="has-changes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"
                  />
                  <span className="font-medium">Cambios sin guardar</span>
                </motion.div>
              )}
              {isSaving && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                >
                  <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Guardando...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-300 dark:border-gray-600"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: hasChanges && !isSaving ? 1.02 : 1 }}
              whileTap={{ scale: hasChanges && !isSaving ? 0.98 : 1 }}
              animate={hasChanges && !isSaving ? {
                boxShadow: [
                  '0 4px 12px rgba(59, 130, 246, 0.3)',
                  '0 4px 16px rgba(59, 130, 246, 0.5)',
                  '0 4px 12px rgba(59, 130, 246, 0.3)'
                ]
              } : {}}
              transition={hasChanges ? { repeat: Infinity, duration: 2 } : {}}
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className={`
                px-6 py-2.5 rounded-lg font-semibold text-white
                flex items-center gap-2 transition-all
                ${hasChanges && !isSaving
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : hasChanges ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardado</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
