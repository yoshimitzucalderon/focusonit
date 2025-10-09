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
    tags?: string[] | null
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
  const isListeningRef = useRef(false)
  const isProcessingRef = useRef(false)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = useRef<string>('')

  // Mantener refs sincronizadas con states
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  // Cleanup al desmontar o cuando el navegador pierde foco
  useEffect(() => {
    const stopRecognition = (showToast = true) => {
      if (recognitionRef.current) {
        try {
          console.log('🛑 Deteniendo recognition...')
          // Solo usar stop(), abort() causa errores
          recognitionRef.current.stop()
          setIsListening(false)
          setIsProcessing(false)
          if (showToast) {
            toast.error('Grabación detenida')
          }
          // Limpiar referencia después de un delay
          setTimeout(() => {
            recognitionRef.current = null
          }, 100)
        } catch (err) {
          console.error('Error al detener reconocimiento:', err)
        }
      }
    }

    const handleVisibilityChange = () => {
      const isActive = isListeningRef.current || isProcessingRef.current
      console.log('👁️ Visibility change:', document.hidden, 'isActive:', isActive)
      // Solo detener si realmente está grabando
      if (document.hidden && isActive) {
        console.log('🛑 Página oculta - deteniendo grabación activa')
        stopRecognition()
      }
    }

    const handleBlur = () => {
      const isActive = isListeningRef.current || isProcessingRef.current
      console.log('👁️ Window blur, isActive:', isActive)
      // Solo detener si está grabando
      if (isActive) {
        console.log('🛑 Window blur - deteniendo grabación activa')
        stopRecognition()
      }
    }

    const handleBeforeUnload = () => {
      console.log('👁️ Before unload')
      // Siempre detener al cerrar/navegar
      stopRecognition(false) // Sin toast porque la página se está cerrando
    }

    const handleFocusOut = () => {
      const isActive = isListeningRef.current || isProcessingRef.current
      console.log('👁️ Focus out, isActive:', isActive)
      // Delay para iOS, solo si está grabando
      setTimeout(() => {
        if (document.hidden && (isListeningRef.current || isProcessingRef.current)) {
          console.log('🛑 Focus out - deteniendo grabación activa')
          stopRecognition()
        }
      }, 100)
    }

    // Eventos para diferentes navegadores y dispositivos
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', () => stopRecognition(false))
    window.addEventListener('focusout', handleFocusOut)

    // Para iOS Safari/Chrome - usar Page Visibility API más agresivamente
    // SOLO si está grabando activamente
    const checkInterval = setInterval(() => {
      if (document.hidden && recognitionRef.current && (isListeningRef.current || isProcessingRef.current)) {
        console.log('⏰ Interval check: página oculta y grabación activa - deteniendo')
        stopRecognition(false) // Sin toast en interval para evitar spam
      }
    }, 500)

    return () => {
      clearInterval(checkInterval)
      // Limpiar timeout de silencio si existe
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', () => stopRecognition(false))
      window.removeEventListener('focusout', handleFocusOut)
      // Solo detener si realmente está activo
      if (isListeningRef.current || isProcessingRef.current) {
        stopRecognition(false)
      }
    }
  }, []) // ← SIN dependencias - solo se ejecuta una vez

  const startVoiceEdit = async () => {
    try {
      // Limpiar cualquier reconocimiento anterior SOLO si existe
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          // NO llamar a abort() aquí - solo stop() es suficiente
        } catch (err) {
          console.log('No hay reconocimiento previo que limpiar')
        }
        // Limpiar la referencia
        recognitionRef.current = null
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
      recognition.continuous = true  // Cambio a true para detectar silencio
      recognition.interimResults = true  // Ver resultados mientras hablas

      finalTranscriptRef.current = ''  // Reset del transcript

      recognition.addEventListener('start', () => {
        console.log('🎤 Recognition started')
        setIsListening(true)
        toast.success('Escuchando... Di tu comando')
      })

      recognition.addEventListener('result', (event: any) => {
        // Limpiar timeout de silencio previo
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
        }

        // Acumular transcripción (final + interim)
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        console.log('🎤 Final:', finalTranscriptRef.current, 'Interim:', interimTranscript)

        // Iniciar timeout de silencio de 3 segundos
        silenceTimeoutRef.current = setTimeout(async () => {
          console.log('🔇 3 segundos de silencio detectados - procesando...')

          const finalText = finalTranscriptRef.current.trim()
          if (!finalText) {
            toast.error('No se detectó voz. Intenta de nuevo.')
            recognitionRef.current?.stop()
            return
          }

          // Detener reconocimiento y procesar
          try {
            recognitionRef.current?.stop()
          } catch (err) {
            console.error('Error al detener:', err)
          }

          setIsListening(false)
          setIsProcessing(true)

          const loadingToast = toast.loading('Procesando comando...')

          try {
            // Detectar zona horaria del usuario
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

            const response = await fetch('/api/voice-edit-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript: finalText,
                currentTask,
                timezone: userTimezone
              })
            })

            if (!response.ok) throw new Error('Error al procesar')

            const result = await response.json()
            console.log('✅ Respuesta completa del API:', result)
            console.log('✅ Campos cambiados (changedFields):', result.changedFields)
            console.log('✅ Tags recibidos:', result.changedFields?.tags)

            toast.dismiss(loadingToast)

            // Verificar si hay cambios válidos
            const hasChanges = result.changedFields &&
              typeof result.changedFields === 'object' &&
              Object.keys(result.changedFields).length > 0 &&
              Object.keys(result.changedFields).some(key => result.changedFields[key] !== undefined && result.changedFields[key] !== null)

            if (hasChanges) {
              console.log('✅ Estableciendo cambios sugeridos en estado:', result)
              setSuggestedChanges(result)
            } else {
              console.warn('⚠️ No se detectaron cambios válidos:', result)
              toast.error('No se detectaron cambios en el comando. Intenta ser más específico.')
            }
          } catch (err) {
            console.error(err)
            toast.dismiss(loadingToast)
            toast.error('Error al procesar comando')
          } finally {
            setIsProcessing(false)
            finalTranscriptRef.current = ''
          }
        }, 3000) // 3 segundos de silencio
      })

      recognition.addEventListener('error', (event: any) => {
        console.log('🚨 Recognition error:', event.error)

        // Limpiar timeout de silencio en caso de error
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }

        setIsListening(false)
        setIsProcessing(false)
        finalTranscriptRef.current = ''

        if (event.error === 'no-speech') {
          toast.error('No se detectó voz. Intenta de nuevo.')
        } else if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado')
        } else if (event.error !== 'aborted') {
          // No mostrar error si fue abort intencional
          toast.error('Error: ' + event.error)
        }

        // Limpiar referencia
        if (recognitionRef.current) {
          recognitionRef.current = null
        }
      })

      recognition.addEventListener('end', () => {
        console.log('🛑 Recognition ended')

        // Limpiar timeout de silencio cuando termina
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }

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
