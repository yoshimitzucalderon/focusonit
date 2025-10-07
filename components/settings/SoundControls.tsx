'use client'

import { Volume2, Bell } from 'lucide-react'
import { SliderWithInput } from './SliderWithInput'

interface SoundControlsProps {
  soundEnabled: boolean
  notificationsEnabled: boolean
  volume: number
  onSoundEnabledChange: (enabled: boolean) => void
  onNotificationsEnabledChange: (enabled: boolean) => void
  onVolumeChange: (volume: number) => void
}

export function SoundControls({
  soundEnabled,
  notificationsEnabled,
  volume,
  onSoundEnabledChange,
  onNotificationsEnabledChange,
  onVolumeChange
}: SoundControlsProps) {
  const playTestSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = volume / 100
    audio.play().catch(err => console.log('Error playing sound:', err))
  }

  const testNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('FocusOnIt', {
            body: '¡Así se verá tu notificación!',
            icon: '/icon-192.png'
          })
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Notifications Toggle */}
      <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Activar notificaciones</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrar notificaciones al completar sesiones
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => onNotificationsEnabledChange(e.target.checked)}
          className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
        />
      </label>

      {notificationsEnabled && (
        <button
          onClick={testNotification}
          className="ml-14 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          🔔 Probar notificación
        </button>
      )}

      {/* Sound Toggle */}
      <label className="flex items-center justify-between cursor-pointer p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Activar sonido</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reproducir sonido al completar sesiones
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => onSoundEnabledChange(e.target.checked)}
          className="w-5 h-5 rounded accent-green-600 cursor-pointer"
        />
      </label>

      {/* Volume Slider */}
      {soundEnabled && (
        <div className="ml-14 space-y-2">
          <SliderWithInput
            label="Volumen"
            value={volume}
            min={0}
            max={100}
            onChange={onVolumeChange}
            icon={<Volume2 className="w-4 h-4" />}
            color="green"
            unit="%"
          />
          <button
            onClick={playTestSound}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
          >
            🔊 Probar sonido
          </button>
        </div>
      )}
    </div>
  )
}
