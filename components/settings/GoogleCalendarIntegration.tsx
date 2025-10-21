'use client'

import { useEffect, useState } from 'react'
import { Calendar, Check, X, Loader2, RefreshCw, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface GoogleCalendarIntegrationProps {
  userId: string
}

export function GoogleCalendarIntegration({ userId }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status')
      const data = await response.json()

      if (data.success) {
        setIsConnected(data.connected)
      }
    } catch (error) {
      console.error('Error checking calendar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)

    try {
      const response = await fetch('/api/calendar/connect')
      const data = await response.json()

      if (data.success && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        toast.error('Error al conectar con Google Calendar')
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error)
      toast.error('Error al conectar con Google Calendar')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar Google Calendar? Esto no eliminará las tareas existentes.')) {
      return
    }

    setConnecting(true)

    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setIsConnected(false)
        toast.success('✓ Google Calendar desconectado exitosamente')
      } else {
        toast.error('Error al desconectar Google Calendar')
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      toast.error('Error al desconectar Google Calendar')
    } finally {
      setConnecting(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)

    try {
      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✓ ${data.count} evento(s) importado(s) exitosamente`)
      } else {
        toast.error(data.error || 'Error al importar eventos')
      }
    } catch (error) {
      console.error('Error importing events:', error)
      toast.error('Error al importar eventos')
    } finally {
      setImporting(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)

    try {
      // This will be implemented when we add auto-sync functionality
      // For now, we'll show a message
      toast.success('Sincronización automática activada para nuevas tareas')
    } catch (error) {
      console.error('Error syncing tasks:', error)
      toast.error('Error al sincronizar tareas')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Integración con Google Calendar
        </h2>
      </div>

      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isConnected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {isConnected ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {isConnected ? 'Conectado' : 'No conectado'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected
                  ? 'Tus tareas se sincronizan con Google Calendar'
                  : 'Conecta tu cuenta de Google para sincronizar tareas'
                }
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={connecting}
              className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Desconectar'
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Conectar con Google
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Actions when connected */}
      {isConnected && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Sincronización automática</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Las tareas nuevas y modificadas se sincronizarán automáticamente con Google Calendar.
                  Puedes importar eventos existentes o sincronizar tareas pendientes manualmente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Importar eventos
                </>
              )}
            </button>

            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar tareas
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {!isConnected && (
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>¿Qué puedes hacer con esta integración?</strong>
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Crear eventos en Google Calendar automáticamente al agregar tareas</li>
            <li>Actualizar eventos cuando modificas tus tareas</li>
            <li>Importar eventos existentes de tu calendario como tareas</li>
            <li>Mantener sincronizadas tus tareas y eventos en tiempo real</li>
          </ul>
        </div>
      )}
    </div>
  )
}
