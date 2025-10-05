'use client';

import { Mic, MicOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProcessedTask {
  title: string;
  description?: string;
  dueDate?: string;
}

interface VoiceTaskButtonProps {
  onProcessedTask: (task: ProcessedTask) => void;
}

export default function VoiceTaskButton({ onProcessedTask }: VoiceTaskButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar soporte del navegador
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'es-ES';

        recognitionInstance.onresult = async (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('Transcripción:', transcript);

          try {
            // Enviar a n8n para procesamiento con Gemini
            const response = await fetch('/api/voice-to-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript })
            });

            if (!response.ok) throw new Error('Error al procesar la voz');

            const data = await response.json();

            // Pasar la tarea procesada al componente padre
            if (data.title) {
              onProcessedTask({
                title: data.title,
                description: data.description,
                dueDate: data.dueDate
              });
              toast.success('Tarea procesada desde voz');
            } else {
              throw new Error('No se pudo procesar la tarea');
            }
          } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar el audio');
          }
        };

        recognitionInstance.onerror = (event) => {
          console.error('Error de reconocimiento:', event.error);
          setIsListening(false);
          if (event.error === 'no-speech') {
            toast.error('No se detectó ninguna voz');
          } else {
            toast.error('Error en el reconocimiento de voz');
          }
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [onProcessedTask]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.success('Escuchando... Habla ahora');
    }
  };

  if (!isSupported) {
    return null; // No mostrar el botón si no hay soporte
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`md:hidden p-3 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
      title={isListening ? 'Detener grabación' : 'Grabar tarea por voz'}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}
