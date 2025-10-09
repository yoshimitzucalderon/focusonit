'use client'

import { Task } from '@/types/database.types'
import { ListTodo, GripVertical, Clock, Tag, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'

interface UnscheduledTasksProps {
  tasks: Task[]
  onRefresh: () => void
}

export default function UnscheduledTasks({ tasks, onRefresh }: UnscheduledTasksProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-soft-lg overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header con gradiente moderno */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-5 py-4 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <ListTodo size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-tight">
                Sin programar
              </h3>
              <p className="text-xs text-primary-100 mt-0.5">
                Arrastra al calendario
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de tareas con scroll mejorado */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900/20 dark:to-success-800/20 flex items-center justify-center shadow-soft">
              <CheckCircle2 className="text-success-600 dark:text-success-400" size={32} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ¡Todo programado!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Todas las tareas tienen horario asignado
            </p>
          </motion.div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <UnscheduledTaskCard task={task} />
            </motion.div>
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
    opacity: isDragging ? 0.6 : 1,
  }

  // Colores modernos basados en prioridad
  const getPriorityColors = () => {
    switch (task.priority) {
      case 'alta':
        return {
          bg: 'bg-gradient-to-br from-danger-50 via-white to-danger-50/30 dark:from-danger-950/20 dark:via-gray-800 dark:to-danger-950/10',
          border: 'border-l-danger-500',
          badge: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border-danger-300 dark:border-danger-700',
          icon: 'text-danger-500',
          shadow: 'hover:shadow-danger/20'
        }
      case 'media':
        return {
          bg: 'bg-gradient-to-br from-warning-50 via-white to-warning-50/30 dark:from-warning-950/20 dark:via-gray-800 dark:to-warning-950/10',
          border: 'border-l-warning-500',
          badge: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-300 dark:border-warning-700',
          icon: 'text-warning-500',
          shadow: 'hover:shadow-warning-500/20'
        }
      case 'baja':
        return {
          bg: 'bg-gradient-to-br from-success-50 via-white to-success-50/30 dark:from-success-950/20 dark:via-gray-800 dark:to-success-950/10',
          border: 'border-l-success-500',
          badge: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-success-300 dark:border-success-700',
          icon: 'text-success-500',
          shadow: 'hover:shadow-success/20'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900',
          border: 'border-l-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
          icon: 'text-gray-400',
          shadow: 'hover:shadow-gray-400/20'
        }
    }
  }

  const colors = getPriorityColors()

  // Icono según prioridad
  const PriorityIcon = task.priority === 'alta' ? AlertCircle : task.priority === 'media' ? Zap : CheckCircle2

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group relative border-l-4 ${colors.border} ${colors.bg}
        rounded-2xl p-4 cursor-move
        shadow-soft ${colors.shadow} hover:shadow-soft-lg
        transition-all duration-200
        hover:scale-[1.02] active:scale-95
        ${task.completed ? 'opacity-60' : ''}
        ${isDragging ? 'z-50 shadow-soft-2xl scale-105' : ''}
        border-r border-t border-b border-gray-200 dark:border-gray-700
      `}
    >
      <div className="flex items-start gap-3">
        {/* Grip handle */}
        <GripVertical
          size={18}
          className="flex-shrink-0 mt-0.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:text-gray-400"
        />

        <div className="flex-1 min-w-0">
          {/* Badge de prioridad con icono */}
          {task.priority && (
            <div className="flex items-center gap-2 mb-2">
              <span className={`
                inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1
                rounded-full border ${colors.badge}
                shadow-sm
              `}>
                <PriorityIcon size={12} />
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
          )}

          {/* Título */}
          <p className={`
            font-semibold text-sm text-gray-900 dark:text-white leading-snug mb-1
            ${task.completed ? 'line-through opacity-60' : ''}
          `}>
            {task.title}
          </p>

          {/* Descripción */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {task.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-800">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indicador visual de "arrastrando" */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl bg-primary-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-soft-lg border border-primary-300 dark:border-primary-700">
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-2">
              <Clock size={14} />
              Arrastrando...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
