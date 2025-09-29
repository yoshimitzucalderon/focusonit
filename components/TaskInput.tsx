'use client'

import { useState, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface TaskInputProps {
  userId: string
}

export default function TaskInput({ userId }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Crear tarea rápida (solo título)
  const createQuickTask = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
      })

      if (error) throw error

      setTitle('')
      toast.success('Tarea creada')
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
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate('')
      setShowModal(false)
      toast.success('Tarea creada')
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      createQuickTask()
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      setShowModal(true)
    }
  }

  return (
    <>
      {/* Input Rápido */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué necesitas hacer? (Enter para crear, Shift+Enter para detalles)"
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all disabled:opacity-50"
          />
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50"
            title="Agregar con detalles"
          >
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
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
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
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
                  setDueDate('')
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