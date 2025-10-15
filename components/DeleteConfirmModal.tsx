'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { Task } from '@/types/database.types'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tasks: Task[]
  isDeleting?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  tasks,
  isDeleting = false
}: DeleteConfirmModalProps) {
  const taskCount = tasks.length
  const showTaskList = taskCount <= 3

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icono de advertencia */}
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-full flex items-center justify-center shadow-lg">
                    <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center shadow-md"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Título */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                ¿Eliminar {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}?
              </h2>

              {/* Descripción */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Esta acción no se puede deshacer. {taskCount === 1 ? 'La tarea será eliminada' : 'Las tareas serán eliminadas'} permanentemente.
              </p>
            </div>

            {/* Lista de tareas (si son 3 o menos) */}
            {showTaskList && (
              <div className="px-6 pb-4">
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {taskCount === 1 ? 'Tarea a eliminar:' : 'Tareas a eliminar:'}
                  </p>
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <motion.li
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        <span className="line-clamp-2 break-words">{task.title}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={isDeleting}
                whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar {taskCount > 1 && `(${taskCount})`}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
