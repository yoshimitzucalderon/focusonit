'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseNaturalDate, containsNaturalDate } from '@/lib/utils/parseNaturalDate'
import { DatePicker } from './DatePicker'
import VoiceTaskButton from './VoiceTaskButton'
import { getLocalTimestamp, parseDateString, toDateOnlyString, getTimezoneOffset } from '@/lib/utils/timezone'

interface TaskInputProps {
  userId: string
}

export default function TaskInput({ userId }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [naturalDateSuggestion, setNaturalDateSuggestion] = useState<string | null>(null)
  const [voiceCreatedAt, setVoiceCreatedAt] = useState<string | null>(null) // Para guardar createdAt de voz
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Detectar fechas en lenguaje natural mientras escribe
  useEffect(() => {
    const naturalDateText = containsNaturalDate(title)
    setNaturalDateSuggestion(naturalDateText)
  }, [title])

  // Crear tarea rápida (solo título)
  const createQuickTask = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      // Intentar parsear fecha natural del título
      let parsedDate: Date | null = null
      const naturalDateText = containsNaturalDate(title)
      if (naturalDateText) {
        parsedDate = parseNaturalDate(naturalDateText)
      }

      // Obtener la última posición para el usuario
      const { data: lastTask } = (await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: { position: number } | null }

      const nextPosition = (lastTask?.position ?? -1) + 1

      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        due_date: parsedDate ? toDateOnlyString(parsedDate) : null,
        created_at: getLocalTimestamp(),
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setNaturalDateSuggestion(null)
      toast.success(parsedDate ? `Tarea creada para ${format(parsedDate, 'dd/MM/yyyy')}` : 'Tarea creada')

      // Mantener focus en el input
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Crear tarea completa (con descripción y fecha)
  const createFullTask = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      // Obtener la última posición para el usuario
      const { data: lastTask } = (await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: { position: number } | null }

      const nextPosition = (lastTask?.position ?? -1) + 1

      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? toDateOnlyString(dueDate) : null,
        // Usar createdAt de voz si existe, sino generar nuevo con hora local
        created_at: voiceCreatedAt || getLocalTimestamp(),
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate(null)
      setShowModal(false)
      setNaturalDateSuggestion(null)
      setVoiceCreatedAt(null) // Limpiar
      toast.success('Tarea creada')

      // Mantener focus en el input
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter: crear tarea rápida
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      createQuickTask()
    }
    // Shift+Enter: abrir modal con detalles
    else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      setShowModal(true)
    }
    // Cmd/Ctrl+D: crear con fecha de hoy
    else if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setDueDate(new Date())
      setShowModal(true)
    }
  }

  return (
    <>
      {/* Input Rápido */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="¿Qué necesitas hacer?"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all disabled:opacity-50"
              />
              {/* Indicador de carga con skeleton */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] rounded-lg flex items-center px-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Creando...</span>
                  </div>
                </div>
              )}
            </div>
            <VoiceTaskButton
              onProcessedTask={(task) => {
                console.log('📥 Tarea recibida desde voz:', task)
                setTitle(task.title)
                if (task.description) setDescription(task.description)

                // Parsear fecha correctamente (n8n envía "YYYY-MM-DD")
                if (task.dueDate) {
                  const parsedDate = parseDateString(task.dueDate)
                  console.log('📅 Fecha parseada desde voz:', task.dueDate, '→', parsedDate.getDate(), 'de', parsedDate.getMonth() + 1)
                  setDueDate(parsedDate)
                }

                // Guardar el createdAt de n8n (ya en hora del Pacífico)
                if (task.createdAt) {
                  console.log('🕐 CreatedAt desde n8n:', task.createdAt)
                  setVoiceCreatedAt(task.createdAt)
                }

                setShowModal(true)
              }}
            />
            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50"
              title="Agregar con detalles (Shift+Enter)"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Sugerencia de fecha natural */}
          {naturalDateSuggestion && !loading && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
              <Sparkles className="w-3 h-3" />
              <span>
                Se detectó &ldquo;{naturalDateSuggestion}&rdquo; - se asignará automáticamente al crear
              </span>
            </div>
          )}

          {/* Shortcuts visibles */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
              crear
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Shift+Enter</kbd>
              detalles
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Cmd+D</kbd>
              fecha hoy
            </span>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className="italic">Prueba: &ldquo;mañana&rdquo;, &ldquo;lunes&rdquo;, &ldquo;en 3 días&rdquo;</span>
          </div>
        </div>
      </div>

      {/* Modal para tarea completa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold mb-4 dark:text-white">
              Nueva tarea
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Ej: Llamar al cliente"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Detalles adicionales..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Fecha
                </label>
                <DatePicker
                  value={dueDate}
                  onChange={(date) => setDueDate(date)}
                  placeholder="Seleccionar fecha"
                  buttonClassName="w-full justify-start border border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 px-4 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createFullTask}
                disabled={loading || !title.trim()}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear tarea'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setDescription('')
                  setDueDate(null)
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}