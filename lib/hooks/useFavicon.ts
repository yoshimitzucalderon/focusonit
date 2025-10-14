'use client'

import { useEffect, useRef } from 'react'

/**
 * Genera un favicon dinámico con canvas para mostrar el estado del timer
 */
function generateTimerFavicon(
  minutes: number,
  isBreak: boolean = false
): string {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  // Fondo circular
  ctx.beginPath()
  ctx.arc(16, 16, 14, 0, Math.PI * 2)
  ctx.fillStyle = isBreak ? '#10b981' : '#3b82f6' // green para break, blue para work
  ctx.fill()

  // Texto con el número de minutos
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const text = minutes < 100 ? minutes.toString() : '99+'
  ctx.fillText(text, 16, 17)

  return canvas.toDataURL('image/png')
}

/**
 * Genera un favicon estático (por defecto)
 */
function generateDefaultFavicon(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  // Círculo azul con ícono de reloj
  ctx.beginPath()
  ctx.arc(16, 16, 14, 0, Math.PI * 2)
  ctx.fillStyle = '#6366f1' // indigo
  ctx.fill()

  // Símbolo de reloj simplificado
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(16, 16, 8, 0, Math.PI * 2)
  ctx.stroke()

  // Manecilla
  ctx.beginPath()
  ctx.moveTo(16, 16)
  ctx.lineTo(16, 10)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(16, 16)
  ctx.lineTo(20, 16)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

interface UseFaviconOptions {
  /**
   * Tiempo restante en segundos
   */
  timeRemaining?: number
  /**
   * Si está en modo descanso
   */
  isBreak?: boolean
  /**
   * Si el timer está activo
   */
  isRunning?: boolean
}

/**
 * Hook para actualizar el favicon del navegador dinámicamente
 * Muestra el tiempo restante del Pomodoro
 */
export function useFavicon(options: UseFaviconOptions = {}) {
  const { timeRemaining, isBreak = false, isRunning = false } = options
  const originalFaviconRef = useRef<string>()

  useEffect(() => {
    // Guardar el favicon original
    if (originalFaviconRef.current === undefined) {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
      if (link) {
        originalFaviconRef.current = link.href
      }
    }

    let faviconUrl: string

    if (isRunning && timeRemaining !== undefined) {
      // Generar favicon con tiempo restante
      const minutes = Math.ceil(timeRemaining / 60)
      faviconUrl = generateTimerFavicon(minutes, isBreak)
    } else {
      // Restaurar favicon por defecto
      faviconUrl = originalFaviconRef.current || generateDefaultFavicon()
    }

    // Actualizar favicon
    updateFavicon(faviconUrl)

    // Cleanup: restaurar favicon original al desmontar
    return () => {
      if (originalFaviconRef.current) {
        updateFavicon(originalFaviconRef.current)
      }
    }
  }, [timeRemaining, isBreak, isRunning])

  const restore = () => {
    if (originalFaviconRef.current) {
      updateFavicon(originalFaviconRef.current)
    }
  }

  return { restore }
}

/**
 * Actualiza el elemento link del favicon
 */
function updateFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = href
}
