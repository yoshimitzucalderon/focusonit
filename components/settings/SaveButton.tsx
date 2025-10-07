'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Save, Check, RotateCcw } from 'lucide-react'

interface SaveButtonProps {
  hasChanges: boolean
  isSaving: boolean
  onSave: () => void
  onReset: () => void
}

export function SaveButton({ hasChanges, isSaving, onSave, onReset }: SaveButtonProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {!hasChanges && !isSaving && (
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
                  <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
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
            <button
              onClick={onReset}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>

            <motion.button
              whileHover={{ scale: hasChanges ? 1.02 : 1 }}
              whileTap={{ scale: hasChanges ? 0.98 : 1 }}
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className={`
                px-6 py-2.5 rounded-lg font-semibold text-white
                flex items-center gap-2 transition-all
                ${hasChanges
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
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
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
