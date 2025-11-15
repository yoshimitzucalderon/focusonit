'use client'

import { useState } from 'react'

/**
 * Temporary component to test Sentry integration
 * DELETE THIS FILE after verifying Sentry is working
 */
export function SentryTestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const testSentry = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-sentry', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult('✅ Error enviado a Sentry correctamente')
      } else {
        setResult('✅ Error capturado y enviado a Sentry. Revisa tu dashboard!')
      }
    } catch (error) {
      setResult('❌ Error al llamar al endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">🧪 Prueba de Sentry</p>
        <button
          onClick={testSentry}
          disabled={loading}
          className="bg-white text-purple-600 px-4 py-2 rounded font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Probar Sentry'}
        </button>
        {result && (
          <p className="text-xs mt-2 bg-purple-700 p-2 rounded">
            {result}
          </p>
        )}
        <p className="text-xs opacity-75 mt-1">
          Click para enviar error de prueba
        </p>
      </div>
    </div>
  )
}
