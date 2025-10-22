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
  const [importRange, setImportRange] = useState<'week' | 'month' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [calendars, setCalendars] = useState<any[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary')
  const [loadingCalendars, setLoadingCalendars] = useState(false)

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  useEffect(() => {
    if (isConnected) {
      loadCalendars()
    }
  }, [isConnected])

  const loadCalendars = async () => {
    setLoadingCalendars(true)
    try {
      const response = await fetch('/api/calendar/list')
      const data = await response.json()

      console.log('=== CALENDARS LOADED ===')
      console.log('All calendars:', JSON.stringify(data.calendars, null, 2))

      if (data.success) {
        setCalendars(data.calendars)
        // Set primary calendar as default
        const primaryCal = data.calendars.find((cal: any) => cal.primary)
        console.log('Primary calendar:', primaryCal)
        if (primaryCal) {
          setSelectedCalendarId(primaryCal.id)
          console.log('Selected calendar ID set to:', primaryCal.id)
        }
      }
    } catch (error) {
      console.error('Error loading calendars:', error)
    } finally {
      setLoadingCalendars(false)
    }
  }

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
      const now = new Date()
      let startDate: Date
      let endDate: Date

      // Calculate date range based on selection
      if (importRange === 'week') {
        // Last 7 days to next 7 days (14 days total)
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 7)
        endDate.setHours(23, 59, 59, 999)
      } else if (importRange === 'month') {
        // Entire current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // custom
        if (!customStartDate || !customEndDate) {
          toast.error('Por favor selecciona ambas fechas')
          setImporting(false)
          return
        }
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
      }

      console.log('Importing events with date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })

      console.log('Selected Calendar ID:', selectedCalendarId)

      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          calendarId: selectedCalendarId,
        }),
      })

      console.log('API Response status:', response.status)

      const data = await response.json()
      console.log('API Response data:', JSON.stringify(data, null, 2))

      if (data.success) {
        console.log(`SUCCESS: Imported ${data.count} events`)
        toast.success(`✓ ${data.count} evento(s) importado(s) exitosamente`)
      } else {
        console.log('ERROR:', data.error)
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
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (importRange === 'week') {
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(now)
        endDate.setDate(endDate.getDate() + 7)
        endDate.setHours(23, 59, 59, 999)
      } else if (importRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
      } else {
        if (!customStartDate || !customEndDate) {
          toast.error('Por favor selecciona ambas fechas')
          setSyncing(false)
          return
        }
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
      }

      console.log('Syncing tasks with date range:', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })

      const response = await fetch('/api/calendar/sync-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('Sync result:', data)
        toast.success(`✓ ${data.successCount} tarea(s) sincronizada(s) con Google Calendar`)

        if (data.failCount > 0) {
          toast.error(`⚠️ ${data.failCount} tarea(s) fallaron al sincronizar`)
        }
      } else {
        toast.error(data.error || 'Error al sincronizar tareas')
      }
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

          {/* Calendar selector */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Calendario a importar
            </p>

            {loadingCalendars ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <select
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.summary} {cal.primary ? '(Principal)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Import range selector */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Período a importar
            </p>

            <div className="space-y-3">
              {/* Range options */}
              <div className="flex gap-2">
                <button
                  onClick={() => setImportRange('week')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importRange === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500'
                  }`}
                >
                  Esta semana
                </button>
                <button
                  onClick={() => setImportRange('month')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importRange === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500'
                  }`}
                >
                  Este mes
                </button>
                <button
                  onClick={() => setImportRange('custom')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importRange === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {/* Custom date inputs */}
              {importRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">💡 Puedes usar cualquier cuenta de Google</p>
                <p className="text-blue-700 dark:text-blue-300">
                  No necesitas iniciar sesión con Google en FocusOnIt. Puedes conectar tu Google Calendar
                  desde cualquier cuenta de Gmail, incluso si iniciaste sesión con un correo diferente.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50">
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
        </div>
      )}
    </div>
  )
}
