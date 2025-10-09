import { useState, useRef } from 'react'

interface SwipeGestureResult {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  swipeDirection: 'left' | 'right' | null
  swipeDistance: number
  isSwipping: boolean
}

export function useSwipeGesture(
  minSwipeDistance: number = 50,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
): SwipeGestureResult {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isSwipping, setIsSwipping] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setSwipeDirection(null)
    setSwipeDistance(0)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwipping(false)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return

    const currentTouch = e.targetTouches[0].clientX
    setTouchEnd(currentTouch)

    const distance = touchStart - currentTouch
    setSwipeDistance(Math.abs(distance))

    // Detectar dirección mientras se mueve
    if (Math.abs(distance) > minSwipeDistance) {
      setIsSwipping(true)
      if (distance > 0) {
        setSwipeDirection('left')
      } else {
        setSwipeDirection('right')
      }
    }
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setSwipeDirection('left')
      if (onSwipeLeft) {
        onSwipeLeft()
      }
    }

    if (isRightSwipe) {
      setSwipeDirection('right')
      if (onSwipeRight) {
        onSwipeRight()
      }
    }

    // Reset después de un pequeño delay para permitir animaciones
    setTimeout(() => {
      setSwipeDirection(null)
      setSwipeDistance(0)
      setIsSwipping(false)
      setTouchStart(null)
      setTouchEnd(null)
    }, 300)
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    swipeDistance,
    isSwipping
  }
}

// Hook para haptic feedback
export function useHapticFeedback() {
  const triggerHaptic = (duration: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }

  const triggerSuccess = () => triggerHaptic(15)
  const triggerError = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  }
  const triggerWarning = () => triggerHaptic(20)

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError,
    triggerWarning
  }
}
