'use client'

import { LogOut, Plus, Sparkles, Calendar, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, KeyboardEvent } from 'react'
import toast from 'react-hot-toast'
import { parseNaturalDate, containsNaturalDate } from '@/lib/utils/parseNaturalDate'
import { format } from 'date-fns'
import { DatePicker } from './DatePicker'
import VoiceTaskButton from './VoiceTaskButton'
import { ThemeToggle } from './ThemeToggle'
import { toDateOnlyString, parseDateString, getTimezoneOffset } from '@/lib/utils/timezone'

interface DashboardHeaderProps {
  userEmail?: string
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  // State para input rápido
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [naturalDateSuggestion, setNaturalDateSuggestion] = useState<string | null>(null)

  // State para modal completo
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)

  // State para mobile
  const [showMobileInput, setShowMobileInput] = useState(false)

  // State para UX hints progresivos
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false)
  const [showContextualHint, setShowContextualHint] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  // Obtener userId
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [supabase])

  // Nivel 1: First-time hint (solo primera vez)
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('focusonit-shift-enter-hint-seen')
    if (!hasSeenHint) {
      const timer = setTimeout(() => {
        setShowFirstTimeHint(true)
      }, 1500) // Aparece después de 1.5s
      return () => clearTimeout(timer)
    }
  }, [])

  // Nivel 2: Contextual hint (primeras 5 veces que escribe)
  useEffect(() => {
    if (title.length > 0 && inputFocused) {
      const hintCount = parseInt(localStorage.getItem('focusonit-hint-count') || '0')
      if (hintCount < 5) {
        setShowContextualHint(true)
        const timer = setTimeout(() => {
          setShowContextualHint(false)
        }, 3000) // Desaparece después de 3s
        return () => clearTimeout(timer)
      }
    }
  }, [title, inputFocused])

  // Detectar fechas en lenguaje natural mientras escribe
  useEffect(() => {
    const naturalDateText = containsNaturalDate(title)
    setNaturalDateSuggestion(naturalDateText)
  }, [title])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Crear tarea rápida (solo título)
  const createQuickTask = async () => {
    if (!title.trim() || !userId) return

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
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setNaturalDateSuggestion(null)
      setShowMobileInput(false)

      // Incrementar contador de hints contextuales
      const hintCount = parseInt(localStorage.getItem('focusonit-hint-count') || '0')
      if (hintCount < 5) {
        localStorage.setItem('focusonit-hint-count', (hintCount + 1).toString())
      }

      toast.success(parsedDate ? `Tarea creada para ${format(parsedDate, 'dd/MM/yyyy')}` : 'Tarea creada')
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Cerrar first-time hint
  const dismissFirstTimeHint = () => {
    setShowFirstTimeHint(false)
    localStorage.setItem('focusonit-shift-enter-hint-seen', 'true')
  }

  // Crear tarea completa (con descripción y fecha)
  const createFullTask = async () => {
    if (!title.trim() || !userId) return

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
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate(null)
      setShowModal(false)
      setNaturalDateSuggestion(null)
      toast.success('Tarea creada')
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
    // Escape: cerrar en mobile
    else if (e.key === 'Escape') {
      setShowMobileInput(false)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 md:left-64" style={{ position: 'fixed' }}>
        <div className="h-16 px-4 md:px-6 flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 md:hidden">
            FocusOnIt
          </h1>

          {/* Desktop input */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-2xl relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Que necesitas hacer?"
                disabled={loading}
                className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors disabled:opacity-50"
              />

              {/* Natural date suggestion */}
              {naturalDateSuggestion && !loading && !showContextualHint && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{naturalDateSuggestion}</span>
                </div>
              )}

              {/* Nivel 2: Contextual hint (mientras escribe) */}
              {showContextualHint && !naturalDateSuggestion && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 animate-fade-in">
                  <span>💡 Presiona Shift+Enter para añadir detalles</span>
                </div>
              )}
            </div>

            <VoiceTaskButton
              onProcessedTask={(task) => {
                setTitle(task.title)
                if (task.description) setDescription(task.description)
                if (task.dueDate) setDueDate(parseDateString(task.dueDate))
                setShowModal(true)
              }}
            />

            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50 relative group"
              title="Agregar con detalles (Shift+Enter)"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />

              {/* Nivel 3: Badge permanente sutil */}
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
                ⇧↵
              </span>
            </button>
          </div>

          {/* Mobile plus button */}
          <button
            onClick={() => setShowMobileInput(!showMobileInput)}
            className={`md:hidden p-2 rounded-lg transition-colors relative ${
              showMobileInput
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 z-[60]'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500 z-[60]'
            }`}
            aria-label="Nueva tarea"
          >
            <Plus size={20} />
          </button>

          <div className="flex-1" />

          {/* Email, Settings, Theme Toggle y Logout alineados a la derecha */}
          <div className="flex items-center gap-3 pr-4 md:pr-6">
            {userEmail && (
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline font-medium">
                {userEmail}
              </span>
            )}

            {/* Settings button - solo visible en móvil */}
            <Link
              href="/settings"
              className="md:hidden group relative p-2.5 rounded-full transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-110"
              aria-label="Configuración"
              title="Configuración"
            >
              <Settings
                size={20}
                className="text-blue-600 dark:text-blue-500 transition-all duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 group-hover:rotate-45"
              />
            </Link>

            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="group relative p-2.5 rounded-full transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:scale-110"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut
                size={20}
                className="text-rose-600 dark:text-rose-500 transition-all duration-300 group-hover:text-rose-700 dark:group-hover:text-rose-400 group-hover:rotate-12"
              />
            </button>
          </div>
        </div>

        {/* Mobile expandable input */}
        {showMobileInput && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-slate-800">
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Que necesitas hacer?"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {naturalDateSuggestion && !loading && !showContextualHint && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Se detectó &quot;{naturalDateSuggestion}&quot;</span>
                </div>
              )}

              {/* Contextual hint en mobile */}
              {showContextualHint && !naturalDateSuggestion && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 animate-fade-in">
                  <span>💡 Usa el botón &quot;Con detalles&quot; para añadir descripción y fecha</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <VoiceTaskButton
                onProcessedTask={(task) => {
                  setTitle(task.title)
                  if (task.description) setDescription(task.description)
                  if (task.dueDate) setDueDate(parseDateString(task.dueDate))
                  setShowModal(true)
                }}
              />
              <button
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Con detalles
              </button>
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Enter: crear</span>
              <span>Shift+Enter: detalles</span>
            </div>
          </div>
        )}
      </header>

      {/* Modal para tarea completa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
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
                  buttonClassName="w-full justify-start border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 px-4 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createFullTask}
                disabled={loading || !title.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Nivel 1: First-time hint tooltip (solo primera vez) */}
      {showFirstTimeHint && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4 pointer-events-none">
          <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md pointer-events-auto animate-bounce-gentle">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">💡</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">¡Tip rápido!</h4>
                <p className="text-sm leading-relaxed">
                  Presiona <kbd className="px-2 py-1 bg-blue-700 rounded font-mono text-xs">Shift+Enter</kbd> en el input para crear tareas con descripción y fecha.
                </p>
              </div>
              <button
                onClick={dismissFirstTimeHint}
                className="flex-shrink-0 text-white hover:text-blue-100 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
