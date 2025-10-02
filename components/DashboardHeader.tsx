'use client'

import { LogOut, Plus, Sparkles, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, KeyboardEvent } from 'react'
import toast from 'react-hot-toast'
import { parseNaturalDate, containsNaturalDate } from '@/lib/utils/parseNaturalDate'
import { format } from 'date-fns'
import { DatePicker } from './DatePicker'

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

  // Obtener userId
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [supabase])

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

      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        due_date: parsedDate ? parsedDate.toISOString() : null,
      })

      if (error) throw error

      setTitle('')
      setNaturalDateSuggestion(null)
      setShowMobileInput(false)
      toast.success(parsedDate ? `Tarea creada para ${format(parsedDate, 'dd/MM/yyyy')}` : 'Tarea creada')
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Crear tarea completa (con descripción y fecha)
  const createFullTask = async () => {
    if (!title.trim() || !userId) return

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
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Que necesitas hacer?"
              disabled={loading}
              className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors disabled:opacity-50"
            />
            {naturalDateSuggestion && !loading && (
              <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Sparkles className="w-3 h-3" />
                <span>{naturalDateSuggestion}</span>
              </div>
            )}
            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50"
              title="Agregar con detalles (Shift+Enter)"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Mobile plus button */}
          <button
            onClick={() => setShowMobileInput(!showMobileInput)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Nueva tarea"
          >
            <Plus size={20} />
          </button>

          <div className="flex-1 md:flex-initial" />

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden lg:inline">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} className="text-gray-600 dark:text-gray-300" />
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
                placeholder="Que necesitas hacer?"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {naturalDateSuggestion && !loading && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Se detectó "{naturalDateSuggestion}"</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
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
