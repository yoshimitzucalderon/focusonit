'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmChangesModal from './ConfirmChangesModal'

interface VoiceEditButtonProps {
  taskId: string
  currentTask: {
    title: string
    dueDate: string | null
    description: string | null
    priority: 'baja' | 'media' | 'alta'
  }
  onEditConfirmed: (changes: any) => void
}

export default function VoiceEditButton({
  taskId,
  currentTask,
  onEditConfirmed
}: VoiceEditButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestedChanges, setSuggestedChanges] = useState<any>(null)
  const recognitionRef = useRef<any>(null)

  // Cleanup al desmontar o cuando el navegador pierde foco
  useEffect(() => {
    const stopRecognition = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.abort()
          setIsListening(false)
          setIsProcessing(false)
          toast.error('Grabación detenida')
        } catch (err) {
          console.error('Error al detener reconocimiento:', err)
        }
      }
    }

    const handleVisibilityChange = () => {
      console.log('👁️ Visibility change:', document.hidden)
      if (document.hidden) {
        console.log('🛑 Página oculta - deteniendo grabación')
        stopRecognition()
      }
    }

    const handleBlur = () => {
      console.log('👁️ Window blur - deteniendo grabación')
      stopRecognition()
    }

    const handleBeforeUnload = () => {
      console.log('👁️ Before unload - deteniendo grabación')
      stopRecognition()
    }

    const handleFocusOut = () => {
      console.log('👁️ Focus out - deteniendo grabación')
      // Delay para iOS
      setTimeout(() => {
        if (document.hidden) {
          stopRecognition()
        }
      }, 100)
    }

    // Eventos para diferentes navegadores y dispositivos
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', stopRecognition)
    window.addEventListener('focusout', handleFocusOut)

    // Para iOS Safari/Chrome - usar Page Visibility API más agresivamente
    const checkInterval = setInterval(() => {
      if (document.hidden && recognitionRef.current) {
        console.log('⏰ Interval check: página oculta - deteniendo')
        stopRecognition()
      }
    }, 500)

    return () => {
      clearInterval(checkInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', stopRecognition)
      window.removeEventListener('focusout', handleFocusOut)
      stopRecognition()
    }
  }, [])

  const startVoiceEdit = async () => {
    try {
      // Limpiar cualquier reconocimiento anterior
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.abort()
        } catch (err) {
          console.log('No hay reconocimiento previo que limpiar')
        }
      }

      // Verificar soporte del navegador
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
        return
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'es-MX'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.addEventListener('start', () => {
        console.log('🎤 Recognition started')
        setIsListening(true)
        toast.success('Escuchando... Di tu comando')
      })

      recognition.addEventListener('result', async (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log('🎤 Comando:', transcript)

        setIsListening(false)
        setIsProcessing(true)

        const loadingToast = toast.loading('Procesando comando...')

        try {
          const response = await fetch('/api/voice-edit-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, currentTask })
          })

          if (!response.ok) throw new Error('Error al procesar')

          const result = await response.json()
          console.log('✅ Respuesta completa:', result)
          console.log('✅ Campos cambiados:', result.changedFields)

          toast.dismiss(loadingToast)

          // Verificar si hay cambios válidos
          const hasChanges = result.changedFields &&
            typeof result.changedFields === 'object' &&
            Object.keys(result.changedFields).length > 0 &&
            Object.keys(result.changedFields).some(key => result.changedFields[key] !== undefined && result.changedFields[key] !== null)

          if (hasChanges) {
            setSuggestedChanges(result)
          } else {
            console.warn('No se detectaron cambios válidos:', result)
            toast.error('No se detectaron cambios en el comando. Intenta ser más específico.')
          }
        } catch (err) {
          console.error(err)
          toast.dismiss(loadingToast)
          toast.error('Error al procesar comando')
        } finally {
          setIsProcessing(false)
        }
      })

      recognition.addEventListener('error', (event: any) => {
        console.log('🚨 Recognition error:', event.error)
        setIsListening(false)
        setIsProcessing(false)

        if (event.error === 'no-speech') {
          toast.error('No se detectó voz. Intenta de nuevo.')
        } else if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado')
        } else {
          toast.error('Error: ' + event.error)
        }

        // Limpiar referencia
        if (recognitionRef.current) {
          recognitionRef.current = null
        }
      })

      recognition.addEventListener('end', () => {
        console.log('🛑 Recognition ended')
        setIsListening(false)
        // NO limpiar la referencia aquí para que el interval pueda detectarla
        // recognitionRef.current = null
      })

      // Agregar event listener para cuando se detiene manualmente
      recognition.addEventListener('audioend', () => {
        console.log('🔇 Audio ended')
        setIsListening(false)
      })

      console.log('🎬 Starting recognition...')
      recognition.start()
    } catch (err) {
      console.error(err)
      toast.error('Error al iniciar grabación')
    }
  }

  return (
    <>
      <button
        onClick={startVoiceEdit}
        disabled={isListening || isProcessing}
        title="Editar con voz"
        className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
        ) : isListening ? (
          <MicOff className="w-4 h-4 text-red-500 animate-pulse" />
        ) : (
          <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Modal de confirmación de cambios */}
      {suggestedChanges && (
        <ConfirmChangesModal
          changes={suggestedChanges}
          currentTask={currentTask}
          onConfirm={() => {
            onEditConfirmed(suggestedChanges.changedFields)
            setSuggestedChanges(null)
          }}
          onCancel={() => setSuggestedChanges(null)}
        />
      )}
    </>
  )
}
