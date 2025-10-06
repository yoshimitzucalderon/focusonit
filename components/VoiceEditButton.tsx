'use client'

import { useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmChangesModal from './ConfirmChangesModal'

interface VoiceEditButtonProps {
  taskId: string
  currentTask: {
    title: string
    dueDate: string | null
    description: string | null
    priority: 'low' | 'medium' | 'high'
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

  const startVoiceEdit = async () => {
    try {
      // Verificar soporte del navegador
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.addEventListener('start', () => {
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
          console.log('✅ Cambios detectados:', result)

          toast.dismiss(loadingToast)

          if (result.changedFields && Object.keys(result.changedFields).length > 0) {
            setSuggestedChanges(result)
          } else {
            toast.error('No se detectaron cambios en el comando')
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
        setIsListening(false)
        setIsProcessing(false)
        console.error('Error:', event.error)

        if (event.error === 'no-speech') {
          toast.error('No se detectó voz. Intenta de nuevo.')
        } else if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado')
        } else {
          toast.error('Error: ' + event.error)
        }
      })

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
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : isListening ? (
          <MicOff className="w-4 h-4 text-red-500 animate-pulse" />
        ) : (
          <Mic className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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
