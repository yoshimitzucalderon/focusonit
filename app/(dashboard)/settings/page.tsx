'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getPomodoroSettings, updatePomodoroSettings } from '@/lib/supabase/pomodoroSettingsQueries'
import { PomodoroSettings } from '@/types/database.types'
import { Settings, Clock, Bell, Volume2, Play, Coffee } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PomodoroSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        const data = await getPomodoroSettings(user.id)
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const handleSave = async () => {
    if (!user || !settings) return

    setSaving(true)
    try {
      await updatePomodoroSettings(user.id, settings)
      toast.success('Configuración guardada')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof PomodoroSettings>(
    key: K,
    value: PomodoroSettings[K]
  ) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user || !settings) return null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7" />
          Configuración
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Personaliza tu experiencia con el Pomodoro
        </p>
      </div>

      {/* Timer Durations */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold dark:text-white">Duración de Sesiones</h3>
        </div>

        <div className="space-y-4">
          {/* Work Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duración de Pomodoro (minutos)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="120"
                value={settings.work_duration}
                onChange={(e) => updateSetting('work_duration', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 w-16 text-center">
                {settings.work_duration}
              </span>
            </div>
          </div>

          {/* Short Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descanso corto (minutos)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                value={settings.short_break_duration}
                onChange={(e) => updateSetting('short_break_duration', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400 w-16 text-center">
                {settings.short_break_duration}
              </span>
            </div>
          </div>

          {/* Long Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descanso largo (minutos)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="60"
                value={settings.long_break_duration}
                onChange={(e) => updateSetting('long_break_duration', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 w-16 text-center">
                {settings.long_break_duration}
              </span>
            </div>
          </div>

          {/* Pomodoros until long break */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pomodoros antes de descanso largo
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2"
                max="10"
                value={settings.pomodoros_until_long_break}
                onChange={(e) => updateSetting('pomodoros_until_long_break', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 w-16 text-center">
                {settings.pomodoros_until_long_break}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-start Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold dark:text-white">Inicio Automático</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto-iniciar descansos</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Iniciar descansos automáticamente al completar un Pomodoro
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_start_breaks}
              onChange={(e) => updateSetting('auto_start_breaks', e.target.checked)}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto-iniciar Pomodoros</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Iniciar siguiente Pomodoro automáticamente al terminar descanso
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_start_pomodoros}
              onChange={(e) => updateSetting('auto_start_pomodoros', e.target.checked)}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </label>
        </div>
      </div>

      {/* Notifications & Sound */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold dark:text-white">Notificaciones y Sonido</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Activar notificaciones</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrar notificaciones del navegador al completar sesiones
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Activar sonido</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reproducir sonido al completar sesiones
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.sound_enabled}
              onChange={(e) => updateSetting('sound_enabled', e.target.checked)}
              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </label>

          {settings.sound_enabled && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Volumen del sonido
                </label>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sound_volume}
                  onChange={(e) => updateSetting('sound_volume', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 w-12 text-center">
                  {settings.sound_volume}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Settings className="w-5 h-5" />
            Guardar Configuración
          </>
        )}
      </button>
    </div>
  )
}
