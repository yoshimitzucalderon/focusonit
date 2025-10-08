'use client'

import { useEffect, useState, useRef } from 'react'

export function ModalDebug() {
  const [info, setInfo] = useState<any>({})
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector('[class*="flex-col"]')
      const scrollableContent = document.querySelector('[class*="overflow-y-scroll"]')
      const footer = document.querySelector('[class*="modal-footer"], [class*="flex-shrink-0"]:last-child')

      if (modal || scrollableContent) {
        setInfo({
          timestamp: new Date().toLocaleTimeString(),
          modal: {
            found: !!modal,
            height: modal?.clientHeight || 0,
            scrollHeight: modal?.scrollHeight || 0,
            canScroll: (modal?.scrollHeight || 0) > (modal?.clientHeight || 0)
          },
          content: {
            found: !!scrollableContent,
            height: scrollableContent?.clientHeight || 0,
            scrollHeight: scrollableContent?.scrollHeight || 0,
            canScroll: (scrollableContent?.scrollHeight || 0) > (scrollableContent?.clientHeight || 0),
            overflowY: scrollableContent ? getComputedStyle(scrollableContent).overflowY : 'N/A'
          },
          footer: {
            found: !!footer,
            visible: footer ? isElementVisible(footer) : false
          },
          viewport: {
            height: window.innerHeight,
            width: window.innerWidth
          }
        })
      }
    }

    intervalRef.current = setInterval(checkModal, 1000)
    checkModal()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  function isElementVisible(el: Element): boolean {
    const rect = el.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  if (!info.modal && !info.content) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#0f0',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 99999,
        maxWidth: '300px',
        maxHeight: '400px',
        overflow: 'auto'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
        🔍 Modal Debug {info.timestamp}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#ff0' }}>Modal Container:</div>
        <div>Found: {info.modal?.found ? '✅' : '❌'}</div>
        <div>Height: {info.modal?.height}px</div>
        <div>ScrollHeight: {info.modal?.scrollHeight}px</div>
        <div>Can Scroll: {info.modal?.canScroll ? '✅' : '❌'}</div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#ff0' }}>Scrollable Content:</div>
        <div>Found: {info.content?.found ? '✅' : '❌'}</div>
        <div>Height: {info.content?.height}px</div>
        <div>ScrollHeight: {info.content?.scrollHeight}px</div>
        <div>Can Scroll: {info.content?.canScroll ? '✅' : '❌'}</div>
        <div>Overflow-Y: {info.content?.overflowY}</div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#ff0' }}>Footer:</div>
        <div>Found: {info.footer?.found ? '✅' : '❌'}</div>
        <div>Visible: {info.footer?.visible ? '✅' : '❌'}</div>
      </div>

      <div>
        <div style={{ color: '#ff0' }}>Viewport:</div>
        <div>Width: {info.viewport?.width}px</div>
        <div>Height: {info.viewport?.height}px</div>
      </div>
    </div>
  )
}
