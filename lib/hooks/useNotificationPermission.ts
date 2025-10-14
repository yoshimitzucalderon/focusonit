'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Hook para gestionar permisos de notificaciones del navegador
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    // Verificar si las notificaciones están soportadas
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  /**
   * Solicitar permiso para mostrar notificaciones
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!supported) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [supported])

  /**
   * Mostrar una notificación si hay permisos
   */
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!supported || Notification.permission !== 'granted') {
      return null
    }

    try {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      })
    } catch (error) {
      console.error('Error showing notification:', error)
      return null
    }
  }, [supported])

  return {
    permission,
    supported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showNotification
  }
}
