'use client'

import { useState } from 'react'
import { Volume2, Bell, ChevronDown } from 'lucide-react'
import { SliderWithInput } from './SliderWithInput'
import { motion, AnimatePresence } from 'framer-motion'

interface SoundControlsProps {
  soundEnabled: boolean
  notificationsEnabled: boolean
  volume: number
  onSoundEnabledChange: (enabled: boolean) => void
  onNotificationsEnabledChange: (enabled: boolean) => void
  onVolumeChange: (volume: number) => void
}

type SoundType = 'bell-soft' | 'bell-classic' | 'ding' | 'alarm-soft' | 'chime' | 'none'

const SOUND_TYPES: { id: SoundType; name: string; frequency: number; duration: number; type: OscillatorType }[] = [
  { id: 'bell-soft', name: 'Bell suave', frequency: 800, duration: 0.5, type: 'sine' },
  { id: 'bell-classic', name: 'Campana clásica', frequency: 1000, duration: 0.6, type: 'triangle' },
  { id: 'ding', name: 'Ding', frequency: 1200, duration: 0.3, type: 'sine' },
  { id: 'alarm-soft', name: 'Alarma suave', frequency: 600, duration: 0.8, type: 'square' },
  { id: 'chime', name: 'Chime', frequency: 1400, duration: 0.4, type: 'triangle' },
  { id: 'none', name: 'Ninguno (silencioso)', frequency: 0, duration: 0, type: 'sine' }
]

export function SoundControls({
  soundEnabled,
  notificationsEnabled,
  volume,
  onSoundEnabledChange,
  onNotificationsEnabledChange,
  onVolumeChange
}: SoundControlsProps) {
  const [selectedSound, setSelectedSound] = useState<SoundType>('bell-soft')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const playTestSound = (soundType?: SoundType) => {
    const sound = SOUND_TYPES.find(s => s.id === (soundType || selectedSound))
    if (!sound || sound.id === 'none') return

    try {
      // Create Web Audio API context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create oscillator (generates the tone)
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure the sound
      oscillator.frequency.value = sound.frequency
      oscillator.type = sound.type

      // Set volume
      gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration)

      // Play sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + sound.duration)
    } catch (err) {
      console.log('Error playing sound:', err)
    }
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
          type="button"
          onClick={testNotification}
          className="ml-14 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium text-sm transition-all active:scale-95"
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

      {/* Sound Type Selector & Volume */}
      {soundEnabled && (
        <div className="ml-14 space-y-4">
          {/* Sound Type Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de sonido
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors text-left"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {SOUND_TYPES.find(s => s.id === selectedSound)?.name}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-[60] w-full mt-2 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden"
                >
                  {SOUND_TYPES.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        setSelectedSound(sound.id)
                        setIsDropdownOpen(false)
                        if (sound.id !== 'none') {
                          playTestSound(sound.id)
                        }
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-left
                        transition-colors
                        ${
                          selectedSound === sound.id
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                        }
                      `}
                    >
                      <span className="font-medium">{sound.name}</span>
                      {selectedSound === sound.id && (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Test Sound Button */}
          <button
            type="button"
            onClick={() => playTestSound()}
            disabled={selectedSound === 'none'}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95
              ${
                selectedSound === 'none'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              }
            `}
          >
            🔊 Probar sonido
          </button>

          {/* Volume Slider */}
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
        </div>
      )}
    </div>
  )
}
