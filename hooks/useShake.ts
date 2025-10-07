import { useState } from 'react'

export function useShake() {
  const [shouldShake, setShouldShake] = useState(false)

  const trigger = () => {
    setShouldShake(true)
    setTimeout(() => setShouldShake(false), 500)
  }

  return {
    shouldShake,
    trigger,
    className: shouldShake ? 'animate-shake' : ''
  }
}
