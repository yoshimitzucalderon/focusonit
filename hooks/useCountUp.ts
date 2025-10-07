import { useState, useEffect } from 'react'

export function useCountUp(end: number, duration: number = 1000, enabled: boolean = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(end)
      return
    }

    let start = 0
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [end, duration, enabled])

  return count
}
