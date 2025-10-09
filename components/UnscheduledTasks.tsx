'use client'

import { Task } from '@/types/database.types'
import { ListTodo, GripVertical, Clock } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface UnscheduledTasksProps {
  tasks: Task[]
  onRefresh: () => void
}

export default function UnscheduledTasks({ tasks, onRefresh }: UnscheduledTasksProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-gray-700 dark:text-gray-300" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Sin programar
          </h3>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Arrastra al calendario para programar
        </p>
      </div>

      {/* Lista de tareas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <Clock className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Todas las tareas están programadas
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <UnscheduledTaskCard
              key={task.id}
              task={task}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface UnscheduledTaskCardProps {
  task: Task
}

function UnscheduledTaskCard({ task }: UnscheduledTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }
  // Color basado en prioridad
  const getPriorityStyles = () => {
    switch (task.priority) {
      case 'alta':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case 'baja':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
      default:
        return 'border-l-gray-400 bg-gray-50 dark:bg-slate-700/50'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative border-l-4 ${getPriorityStyles()} rounded-lg p-3 cursor-move hover:shadow-md transition-shadow ${
        task.completed ? 'opacity-50' : ''
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          size={16}
          className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm text-gray-900 dark:text-white ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indicador de prioridad */}
      {task.priority && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            task.priority === 'alta'
              ? 'bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              : task.priority === 'media'
              ? 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
              : 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400'
          }`}>
            {task.priority}
          </span>
        </div>
      )}
    </div>
  )
}
