'use client'

import { useState } from 'react'
import { Task } from '@/types/database.types'
import { ListTodo, GripVertical, Clock, Tag, CheckCircle2, Edit3, AlertCircle, Zap } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'

interface UnscheduledTasksProps {
  tasks: Task[]
  onRefresh: () => void
  onScheduleTask?: (task: Task) => void
}

export default function UnscheduledTasks({ tasks, onRefresh, onScheduleTask }: UnscheduledTasksProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">

      {/* HEADER COMPACTO */}
      <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">Sin programar</h2>
              <p className="text-white/80 text-[10px] leading-tight">
                Doble click o arrastra al calendario
              </p>
            </div>
          </div>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* LISTA DE TAREAS - COMPACTA */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              No hay tareas sin programar
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Todas tus tareas están en el calendario
            </p>
          </motion.div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <UnscheduledTaskCard task={task} onSchedule={onScheduleTask} />
            </motion.div>
          ))
        )}
      </div>

      {/* FOOTER CON TIP */}
      <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          💡 Arrastra tareas al calendario o haz doble click para programar
        </p>
      </div>
    </div>
  )
}

interface UnscheduledTaskCardProps {
  task: Task
  onSchedule?: (task: Task) => void
}

function UnscheduledTaskCard({ task, onSchedule }: UnscheduledTaskCardProps) {
  const [hoveredTask, setHoveredTask] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  // Handler HTML5 drag start
  const handleNativeDragStart = (e: React.DragEvent) => {
    console.log('🚀 HTML5 Drag Start:', task.title)
    e.dataTransfer.effectAllowed = 'move'

    // Calcular duración si tiene horarios
    let duration = 60 // Default 1 hora
    if (task.start_time && task.end_time) {
      const [startHour, startMin] = task.start_time.split(':').map(Number)
      const [endHour, endMin] = task.end_time.split(':').map(Number)
      duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    }

    e.dataTransfer.setData('application/json', JSON.stringify({
      id: task.id,
      title: task.title,
      duration,
      priority: task.priority,
      description: task.description
    }))
  }

  // Manejador de doble click
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Doble click en tarea:', task.title)

    if (onSchedule) {
      console.log('✅ Abriendo modal para programar tarea:', task.title)
      onSchedule(task)
    } else {
      console.error('❌ ERROR: onSchedule no está definido como prop')
    }
  }

  // Manejador para el botón de editar
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('✏️ Click en botón editar:', task.title)

    if (onSchedule) {
      console.log('✅ Abriendo modal desde botón editar:', task.title)
      onSchedule(task)
    }
  }

  // Estilos por prioridad - COMPACTOS
  const priorityConfig = {
    alta: {
      icon: '🔥',
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-l-3 border-red-500',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/20',
      PriorityIcon: AlertCircle
    },
    media: {
      icon: '⚡',
      bg: 'bg-yellow-50 dark:bg-yellow-900/10',
      border: 'border-l-3 border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20',
      PriorityIcon: Zap
    },
    baja: {
      icon: '✓',
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-l-3 border-green-500',
      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/20',
      PriorityIcon: CheckCircle2
    }
  }

  const config = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.baja

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHoveredTask(true)}
      onMouseLeave={() => setHoveredTask(false)}
      className={`
        group relative
        ${config.bg} ${config.border} ${config.hover}
        rounded-lg p-2.5
        cursor-move
        transition-all duration-150
        hover:shadow-md hover:scale-[1.01]
        active:scale-[0.98] active:shadow-sm
        ${task.completed ? 'opacity-60' : ''}
      `}
    >
      {/* INDICADOR DE ARRASTRABLE - MUY VISIBLE */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-100 transition-all group-hover:scale-110 duration-200">
        <GripVertical className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>

      {/* Badge "ARRASTRA" en hover - MÁS GRANDE Y VISIBLE */}
      {hoveredTask && !isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-2xl pointer-events-none z-20 border-2 border-white dark:border-gray-800"
        >
          🖱️ ARRASTRA
        </motion.div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex items-start gap-2 pl-2">

        {/* ICONO DE PRIORIDAD - MÁS PEQUEÑO */}
        <span className="text-sm mt-0.5 flex-shrink-0">{config.icon}</span>

        {/* INFORMACIÓN DE LA TAREA */}
        <div className="flex-1 min-w-0">

          {/* TÍTULO */}
          <h3 className={`
            font-semibold text-sm text-gray-900 dark:text-white leading-tight mb-0.5
            ${task.completed ? 'line-through opacity-60' : ''}
          `}>
            {task.title}
          </h3>

          {/* DESCRIPCIÓN - TRUNCADA */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1.5 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* FILA INFERIOR: Badge prioridad + fecha + tags */}
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Badge de prioridad - COMPACTO */}
            <span className={`
              ${config.badge}
              px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
            `}>
              {task.priority}
            </span>

            {/* Fecha de deadline si existe */}
            {task.due_date && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            )}

            {/* Tags si existen - MINI */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 items-center">
                {task.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTÓN DE EDITAR - APARECE EN HOVER */}
        {hoveredTask && onSchedule && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleEditClick}
            className="
              p-1.5 bg-white dark:bg-gray-700
              rounded-md shadow-sm
              hover:bg-primary-100 dark:hover:bg-gray-600
              transition-colors
              flex-shrink-0
            "
            title="Click para programar"
          >
            <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          </motion.button>
        )}
      </div>

      {/* INDICADOR DE DOBLE CLICK - APARECE EN HOVER */}
      {hoveredTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          className="absolute inset-0 rounded-lg border-2 border-primary-400 border-dashed pointer-events-none"
        />
      )}

      {/* INDICADOR VISUAL DE "ARRASTRANDO" */}
      {isDragging && (
        <div className="absolute inset-0 rounded-lg bg-primary-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-lg border border-primary-300 dark:border-primary-700">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Arrastrando...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
