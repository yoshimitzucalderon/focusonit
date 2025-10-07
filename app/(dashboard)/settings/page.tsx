'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getPomodoroSettings, updatePomodoroSettings } from '@/lib/supabase/pomodoroSettingsQueries'
import { PomodoroSettings } from '@/types/database.types'
import { Settings, Clock, Play, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { PresetButtons } from '@/components/settings/PresetButtons'
import { CyclePreview } from '@/components/settings/CyclePreview'
import { SliderWithInput } from '@/components/settings/SliderWithInput'
import { SoundControls } from '@/components/settings/SoundControls'
import { SaveButton } from '@/components/settings/SaveButton'

const DEFAULT_SETTINGS: Omit<PomodoroSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  notifications_enabled: true,
  sound_enabled: true,
  sound_volume: 50
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PomodoroSettings | null>(null)
  const [initialSettings, setInitialSettings] = useState<PomodoroSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        const data = await getPomodoroSettings(user.id)
        setSettings(data)
        setInitialSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const hasChanges = () => {
    if (!settings || !initialSettings) return false
    return JSON.stringify(settings) !== JSON.stringify(initialSettings)
  }

  const handleSave = async () => {
    if (!user || !settings) return

    setSaving(true)
    try {
      await updatePomodoroSettings(user.id, settings)
      setInitialSettings(settings)
      toast.success('✓ Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!settings) return
    const resetSettings = {
      ...settings,
      ...DEFAULT_SETTINGS
    }
    setSettings(resetSettings)
    toast.success('Valores restablecidos a los predeterminados')
  }

  const handlePresetSelect = (preset: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      work_duration: preset.workDuration,
      short_break_duration: preset.shortBreak,
      long_break_duration: preset.longBreak,
      pomodoros_until_long_break: preset.pomodorosUntilLongBreak
    })
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
    <>
      <div className="space-y-8 max-w-4xl pb-32 animate-in fade-in duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 sm:p-8 border border-blue-100 dark:border-blue-900/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Configuración del Pomodoro
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Personaliza tu experiencia de trabajo y descanso
              </p>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
          <PresetButtons
            currentSettings={{
              work_duration: settings.work_duration,
              short_break_duration: settings.short_break_duration,
              long_break_duration: settings.long_break_duration,
              pomodoros_until_long_break: settings.pomodoros_until_long_break
            }}
            onPresetSelect={handlePresetSelect}
          />
        </div>

        {/* Cycle Preview */}
        <CyclePreview
          workDuration={settings.work_duration}
          shortBreakDuration={settings.short_break_duration}
          longBreakDuration={settings.long_break_duration}
          pomodorosUntilLongBreak={settings.pomodoros_until_long_break}
        />

        {/* Timer Durations */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Duración de Sesiones
            </h2>
          </div>

          <div className="space-y-6">
            <SliderWithInput
              label="Duración de Pomodoro"
              value={settings.work_duration}
              min={1}
              max={120}
              onChange={(val) => updateSetting('work_duration', val)}
              icon="🍅"
              color="blue"
              warningThreshold={{
                min: 10,
                message: "⚠️ Muy corto: Pomodoros menores a 10 minutos pueden afectar tu concentración profunda"
              }}
              helpText="⏱️ Tiempo de concentración profunda. Recomendado: 25 min (técnica Pomodoro tradicional). Para trabajos creativos considera 50 min, para tareas rápidas 15 min."
            />

            <SliderWithInput
              label="Descanso corto"
              value={settings.short_break_duration}
              min={1}
              max={30}
              onChange={(val) => updateSetting('short_break_duration', val)}
              icon="☕"
              color="green"
              helpText="☕ Pausa breve entre Pomodoros. Recomendado: 5 min para estirar, descansar la vista y tomar agua. Aprovecha para levantarte de la silla."
            />

            <SliderWithInput
              label="Descanso largo"
              value={settings.long_break_duration}
              min={5}
              max={60}
              onChange={(val) => updateSetting('long_break_duration', val)}
              icon="🛋️"
              color="purple"
              helpText="🛋️ Descanso más largo después de completar el ciclo. Recomendado: 15-30 min para desconectar completamente. Sal a caminar o haz una actividad diferente."
            />

            <SliderWithInput
              label="Pomodoros hasta descanso largo"
              value={settings.pomodoros_until_long_break}
              min={2}
              max={10}
              onChange={(val) => updateSetting('pomodoros_until_long_break', val)}
              icon="🔄"
              color="amber"
              unit=""
              helpText="🔄 Número de Pomodoros antes de tomar un descanso largo. Recomendado: 4 ciclos. Ajusta según tu nivel de energía y tipo de trabajo."
            />
          </div>
        </div>

        {/* Auto-start Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Play className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Inicio Automático
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  ▶️
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Auto-iniciar descansos</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Iniciar descansos automáticamente al completar un Pomodoro
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_start_breaks}
                onChange={(e) => updateSetting('auto_start_breaks', e.target.checked)}
                className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  ⏭️
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Auto-iniciar Pomodoros</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Iniciar siguiente Pomodoro automáticamente al terminar descanso
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_start_pomodoros}
                onChange={(e) => updateSetting('auto_start_pomodoros', e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Notifications & Sound */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notificaciones y Sonido
            </h2>
          </div>

          <SoundControls
            soundEnabled={settings.sound_enabled}
            notificationsEnabled={settings.notifications_enabled}
            volume={settings.sound_volume}
            onSoundEnabledChange={(val) => updateSetting('sound_enabled', val)}
            onNotificationsEnabledChange={(val) => updateSetting('notifications_enabled', val)}
            onVolumeChange={(val) => updateSetting('sound_volume', val)}
          />
        </div>
      </div>

      {/* Sticky Save Button */}
      <SaveButton
        hasChanges={hasChanges()}
        isSaving={saving}
        onSave={handleSave}
        onReset={handleReset}
      />
    </>
  )
}
