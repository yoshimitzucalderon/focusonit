'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()

        let x = 0
        let y = 0

        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2
            y = rect.top - 8
            break
          case 'bottom':
            x = rect.left + rect.width / 2
            y = rect.bottom + 8
            break
          case 'left':
            x = rect.left - 8
            y = rect.top + rect.height / 2
            break
          case 'right':
            x = rect.right + 8
            y = rect.top + rect.height / 2
            break
        }

        setCoords({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={showTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: position === 'top' || position === 'bottom'
              ? 'translateX(-50%)'
              : position === 'left'
              ? 'translateX(-100%)'
              : 'translateY(-50%)'
          }}
        >
          <div className={`
            bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-3 py-2 rounded-lg shadow-xl max-w-xs
            animate-in fade-in zoom-in-95 duration-200
            ${position === 'top' ? 'mb-2' : ''}
            ${position === 'bottom' ? 'mt-2' : ''}
            ${position === 'left' ? 'mr-2' : ''}
            ${position === 'right' ? 'ml-2' : ''}
          `}>
            {content}

            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45
                ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
              `}
            />
          </div>
        </div>
      )}
    </>
  )
}
