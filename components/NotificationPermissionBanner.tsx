'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useNotificationPermission } from '@/lib/hooks/useNotificationPermission'

const DISMISSED_KEY = 'notificationBannerDismissed'

export function NotificationPermissionBanner() {
  const { permission, supported, requestPermission } = useNotificationPermission()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Verificar si el usuario ya ha descartado el banner
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true'

    // Mostrar banner solo si:
    // 1. Las notificaciones están soportadas
    // 2. No han sido concedidas ni denegadas
    // 3. El usuario no ha descartado el banner
    if (supported && permission === 'default' && !wasDismissed) {
      setDismissed(false)
    }
  }, [supported, permission])

  const handleRequest = async () => {
    const result = await requestPermission()
    if (result === 'granted') {
      setDismissed(true)
      localStorage.setItem(DISMISSED_KEY, 'true')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  if (!supported || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-auto px-4"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              Activa las notificaciones
            </h3>
            <p className="text-blue-100 text-xs mb-3">
              Recibe alertas cuando tu Pomodoro termine, incluso con la pestaña en segundo plano
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleRequest}
                className="px-4 py-2 bg-white text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-50 transition-colors"
              >
                Activar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 text-white font-medium text-xs rounded-lg hover:bg-white/20 transition-colors"
              >
                Más tarde
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
