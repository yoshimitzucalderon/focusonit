'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { parseNaturalDate, containsNaturalDate } from '@/lib/utils/parseNaturalDate'

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

      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        due_date: parsedDate ? parsedDate.toISOString() : null,
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
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? dueDate.toISOString() : null,
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate(null)
      setShowModal(false)
      setNaturalDateSuggestion(null)
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
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                  placeholderText="Selecciona una fecha"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                  calendarClassName="dark:bg-slate-800"
                  wrapperClassName="w-full"
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
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