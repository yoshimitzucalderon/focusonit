'use client';

import { Mic, MicOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProcessedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  tags?: string[];
  createdAt?: string;
  source?: string;
}

interface VoiceTaskButtonProps {
  onProcessedTask: (task: ProcessedTask) => void;
}

export default function VoiceTaskButton({ onProcessedTask }: VoiceTaskButtonProps) {
  console.log('🎤 VoiceTaskButton COMPONENT LOADED');

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  console.log('🎤 VoiceTaskButton RENDERING', { isSupported, isListening });

  useEffect(() => {
    // Verificar soporte del navegador
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      console.log('Speech Recognition disponible:', !!SpeechRecognition);
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true; // Cambiado a true para escuchar más tiempo
        recognitionInstance.interimResults = true; // Ver resultados mientras hablas
        recognitionInstance.lang = 'es-ES';
        recognitionInstance.maxAlternatives = 1;

        recognitionInstance.addEventListener('result', async (event: any) => {
          // Obtener el último resultado final (no intermedio)
          const lastResult = event.results[event.results.length - 1];
          if (!lastResult.isFinal) {
            console.log('📝 Resultado intermedio:', lastResult[0].transcript);
            return; // Esperar a que sea final
          }

          const transcript = lastResult[0].transcript;
          console.log('✅ Transcripción FINAL:', transcript);

          // Detener reconocimiento después de capturar
          recognitionInstance.stop();

          const loadingToast = toast.loading('Procesando tu tarea...');

          try {
            // Enviar a n8n para procesamiento con Gemini
            const response = await fetch('/api/voice-to-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript })
            });

            if (!response.ok) throw new Error('Error al procesar la voz');

            const data = await response.json();
            console.log('📦 Respuesta de n8n:', data);

            // Cerrar el toast de loading
            toast.dismiss(loadingToast);

            // Pasar la tarea procesada al componente padre
            if (data.title) {
              onProcessedTask({
                title: data.title,
                description: data.description,
                dueDate: data.dueDate
              });
              toast.success('Tarea creada: ' + data.title);
            } else {
              throw new Error('No se pudo procesar la tarea');
            }
          } catch (error) {
            console.error('❌ Error:', error);
            toast.dismiss(loadingToast);
            toast.error('Error al procesar el audio');
          }
        });

        recognitionInstance.addEventListener('start', () => {
          console.log('✅ Grabación INICIADA');
          setIsListening(true);
          toast.success('Escuchando... Habla ahora');
        });

        recognitionInstance.addEventListener('error', (event: any) => {
          console.error('❌ Error de reconocimiento:', event.error);
          setIsListening(false);
          if (event.error === 'no-speech') {
            toast.error('No se detectó ninguna voz. Habla más fuerte o más cerca.');
          } else if (event.error === 'not-allowed') {
            toast.error('Permiso de micrófono denegado');
          } else if (event.error === 'aborted') {
            console.log('⚠️ Grabación abortada - puede ser normal si ya se procesó');
            // No mostrar error si fue abortado intencionalmente
          } else {
            toast.error('Error: ' + event.error);
          }
        });

        recognitionInstance.addEventListener('end', () => {
          console.log('🛑 Grabación FINALIZADA');
          setIsListening(false);
        });

        setRecognition(recognitionInstance);
      }
    }
  }, [onProcessedTask]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Reconocimiento de voz no disponible');
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error al detener:', error);
      }
    } else {
      try {
        console.log('🎙️ Intentando iniciar grabación...');
        recognition.start();
        // No cambiar isListening aquí - esperar al evento onstart
      } catch (error: any) {
        console.error('Error al iniciar:', error);
        if (error.message?.includes('not-allowed') || error.name === 'NotAllowedError') {
          toast.error('Permiso de micrófono denegado. Ve a Configuración → Safari → Micrófono');
        } else {
          toast.error('Error al iniciar reconocimiento de voz');
        }
      }
    }
  };

  return (
    <button
        type="button"
        onClick={toggleListening}
        disabled={!isSupported}
        className={`ml-2 p-3 rounded-full transition-colors ${
          !isSupported
            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
            : isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={
          !isSupported
            ? 'Reconocimiento de voz no disponible en este navegador'
            : isListening
            ? 'Detener grabación'
            : 'Grabar tarea por voz'
        }
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
  );
}
