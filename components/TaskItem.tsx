'use client'

import { useState } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Check, Trash2, Calendar, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const supabase = createClient()

  // Toggle completado
  const toggleComplete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id)

      if (error) throw error
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
      console.error(error)
    }
  }

  // Editar título
  const saveTitle = async () => {
    if (title.trim() === task.title || !title.trim()) {
      setEditing(false)
      setTitle(task.title)
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: title.trim() })
        .eq('id', task.id)

      if (error) throw error

      setEditing(false)
      toast.success('Tarea actualizada')
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
      console.error(error)
    }
  }

  // Cambiar fecha
  const updateDate = async (newDate: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          due_date: newDate ? new Date(newDate).toISOString() : null,
        })
        .eq('id', task.id)

      if (error) throw error

      setShowDatePicker(false)
      toast.success('Fecha actualizada')
    } catch (error: any) {
      toast.error('Error al actualizar fecha')
      console.error(error)
    }
  }

  // Eliminar tarea
  const deleteTask = async () => {
    if (!confirm('¿Eliminar esta tarea?')) return

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)

      if (error) throw error

      toast.success('Tarea eliminada')
    } catch (error: any) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

  // Verificar si está atrasada
  const isOverdue =
    task.due_date && !task.completed && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))

  return (
    <div
      className={`task-item group flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${
        task.completed ? 'opacity-60' : ''
      } ${isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
          task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
        }`}
      >
        {task.completed && <Check className="w-4 h-4 text-white" />}
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') {
                setEditing(false)
                setTitle(task.title)
              }
            }}
            className="w-full px-2 py-1 border border-primary-500 rounded focus:outline-none dark:bg-slate-700 dark:text-white"
            autoFocus
          />
        ) : (
          <h3
            onClick={() => !task.completed && setEditing(true)}
            className={`text-base cursor-pointer dark:text-white ${
              task.completed ? 'line-through' : ''
            } ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
          >
            {task.title}
          </h3>
        )}

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {task.description}
          </p>
        )}

        {/* Fecha */}
        {task.due_date && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`} />
            <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              {format(new Date(task.due_date), "d 'de' MMMM", { locale: es })}
              {isOverdue && ' (Atrasada)'}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Cambiar fecha */}
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          title="Cambiar fecha"
        >
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Eliminar */}
        <button
          onClick={deleteTask}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="absolute mt-8 right-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-20">
          <input
            type="date"
            defaultValue={task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''}
            onChange={(e) => updateDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-600 dark:text-white"
          />
          <button
            onClick={() => updateDate('')}
            className="mt-2 w-full text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Quitar fecha
          </button>
        </div>
      )}
    </div>
  )
}