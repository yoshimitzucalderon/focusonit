'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, RotateCcw } from 'lucide-react'

interface GoalsConfig {
  weeklyHours: number
  monthlyHours: number
  weeklyTasks: number
  monthlyTasks: number
  streakDays: number
}

interface GoalsConfigModalProps {
  isOpen: boolean
  onClose: () => void
  currentConfig: GoalsConfig
  onSave: (config: GoalsConfig) => void
}

const DEFAULT_CONFIG: GoalsConfig = {
  weeklyHours: 20,
  monthlyHours: 80,
  weeklyTasks: 15,
  monthlyTasks: 60,
  streakDays: 7
}

export function GoalsConfigModal({ isOpen, onClose, currentConfig, onSave }: GoalsConfigModalProps) {
  const [config, setConfig] = useState<GoalsConfig>(currentConfig)

  useEffect(() => {
    setConfig(currentConfig)
  }, [currentConfig])

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  const handleChange = (field: keyof GoalsConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Configurar Objetivos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Personaliza tus metas de productividad
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Horas Semanales */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">⏱️</span>
                    Horas semanales
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={config.weeklyHours}
                      onChange={(e) => handleChange('weeklyHours', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">horas</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Meta de tiempo de trabajo semanal
                  </p>
                </div>

                {/* Horas Mensuales */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">📅</span>
                    Horas mensuales
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="744"
                      value={config.monthlyHours}
                      onChange={(e) => handleChange('monthlyHours', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">horas</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Meta de tiempo de trabajo mensual
                  </p>
                </div>

                {/* Tareas Semanales */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">✅</span>
                    Tareas semanales
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.weeklyTasks}
                      onChange={(e) => handleChange('weeklyTasks', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">tareas</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cantidad de tareas a completar por semana
                  </p>
                </div>

                {/* Tareas Mensuales */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">📊</span>
                    Tareas mensuales
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.monthlyTasks}
                      onChange={(e) => handleChange('monthlyTasks', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">tareas</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cantidad de tareas a completar por mes
                  </p>
                </div>

                {/* Racha de Días */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="text-lg">🔥</span>
                    Racha de días
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={config.streakDays}
                      onChange={(e) => handleChange('streakDays', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">días</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Días consecutivos trabajando como objetivo
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restablecer
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
