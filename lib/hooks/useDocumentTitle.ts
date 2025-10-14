'use client'

import { useEffect, useRef } from 'react'

interface UseDocumentTitleOptions {
  /**
   * Si está habilitado, actualiza el título del documento
   */
  enabled?: boolean
  /**
   * Restaurar el título original cuando se desmonte
   */
  restoreOnUnmount?: boolean
}

/**
 * Hook para actualizar el título del documento (pestaña del navegador)
 * Útil para mostrar tiempo restante del Pomodoro en pestañas en background
 */
export function useDocumentTitle(
  title: string | null,
  options: UseDocumentTitleOptions = {}
) {
  const { enabled = true, restoreOnUnmount = true } = options
  const originalTitleRef = useRef<string>()

  useEffect(() => {
    // Guardar título original en el primer render
    if (originalTitleRef.current === undefined) {
      originalTitleRef.current = document.title
    }

    // Actualizar título si está habilitado y hay un título válido
    if (enabled && title) {
      document.title = title
    } else if (enabled && !title && restoreOnUnmount) {
      // Restaurar título original si no hay título nuevo
      document.title = originalTitleRef.current || 'FocusOnIt'
    }

    // Cleanup: restaurar título original al desmontar
    return () => {
      if (restoreOnUnmount && originalTitleRef.current) {
        document.title = originalTitleRef.current
      }
    }
  }, [title, enabled, restoreOnUnmount])

  // Función para restaurar el título manualmente
  const restore = () => {
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current
    }
  }

  return { restore }
}
