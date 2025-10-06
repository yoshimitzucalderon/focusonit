'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types/database.types'
import TaskItem from './TaskItem'
import SwipeWrapper from './SwipeWrapper'
import { CheckCircle2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getLocalTimestamp, getTimezoneOffset } from '@/lib/utils/timezone'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
  enableReorder?: boolean
}

// Componente sortable para cada tarea
function SortableTaskWrapper({
  task,
  children,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: {
  task: Task
  children: React.ReactNode
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        isDragging
          ? 'scale-105 shadow-2xl ring-2 ring-purple-400 dark:ring-purple-500 rounded-lg z-50'
          : ''
      } transition-all duration-200`}
    >
      <div className="flex items-stretch gap-2">
        {/* Contenido de la tarea */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Drag Handle - Tablet/iPad (md a lg) a la DERECHA */}
        <div
          {...attributes}
          {...listeners}
          className="hidden md:flex lg:hidden items-center justify-center w-10 cursor-grab active:cursor-grabbing hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all group/handle"
          title="Mantén presionado para arrastrar"
        >
          <div className="flex flex-col items-center gap-0.5">
            <GripVertical className="w-5 h-5 text-purple-400 dark:text-purple-500 group-hover/handle:text-purple-600 dark:group-hover/handle:text-purple-400 transition-colors" />
            <span className="text-[10px] text-purple-400 dark:text-purple-500 font-medium opacity-0 group-hover/handle:opacity-100 transition-opacity">
              Mover
            </span>
          </div>
        </div>

        {/* Drag Handle - Desktop (≥lg) a la IZQUIERDA como antes */}
        <div
          {...attributes}
          {...listeners}
          className="hidden lg:flex items-center justify-center w-8 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors order-first"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Botones ↑↓ - Solo Móvil (<md) */}
        <div className="md:hidden flex flex-col gap-1 justify-center py-1 order-first">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp?.()
            }}
            disabled={isFirst}
            className="p-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Mover arriba"
          >
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown?.()
            }}
            disabled={isLast}
            className="p-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Mover abajo"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaskList({
  tasks,
  emptyMessage = 'No hay tareas',
  enableReorder = true
}: TaskListProps) {
  const [items, setItems] = useState(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const supabase = createClient()

  // Sincronizar cuando cambien las tasks desde el padre
  useEffect(() => {
    setItems(tasks)
  }, [tasks])

  const activeTask = activeId ? items.find(task => task.id === activeId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, // 150ms delay para detectar intención (evita conflictos con clicks/swipes)
        tolerance: 5, // Permitir 5px de movimiento durante el delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const updateTaskPositions = async (newItems: Task[]) => {
    try {
      const taskUpdates = newItems.map((task, index) => ({
        id: task.id,
        position: index,
      }))

      const response = await fetch('/api/reorder-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskUpdates }),
      })

      if (!response.ok) throw new Error('Error al reordenar')
    } catch (error) {
      console.error('Error al reordenar:', error)
      // Revertir cambios en caso de error
      setItems(tasks)
      toast.error('Error al guardar nuevo orden')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((task) => task.id === active.id)
      const newIndex = items.findIndex((task) => task.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)

      // Actualizar localmente inmediatamente
      setItems(newItems)

      // Actualizar posiciones en la BD
      await updateTaskPositions(newItems)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const moveTaskUp = async (index: number) => {
    if (index === 0) return // Ya está al principio

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp

    setItems(newItems)
    await updateTaskPositions(newItems)
  }

  const moveTaskDown = async (index: number) => {
    if (index === items.length - 1) return // Ya está al final

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp

    setItems(newItems)
    await updateTaskPositions(newItems)
  }

  const handleComplete = async (task: Task) => {
    try {
      const nowLocal = getLocalTimestamp()
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? nowLocal : null,
          updated_at: nowLocal,
          timezone_offset: getTimezoneOffset()
        })
        .eq('id', task.id)

      if (error) throw error
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
      console.error(error)
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr

      if (error) throw error

      toast.success('Tarea eliminada')
    } catch (error: any) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
      </motion.div>
    )
  }

  const content = (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((task, index) => {
          const taskElement = (
            <SwipeWrapper
              key={task.id}
              taskId={task.id}
              onComplete={() => handleComplete(task)}
              onDelete={() => handleDelete(task.id)}
              isCompleted={task.completed}
            >
              <TaskItem task={task} />
            </SwipeWrapper>
          )

          return enableReorder ? (
            <SortableTaskWrapper
              key={task.id}
              task={task}
              onMoveUp={() => moveTaskUp(index)}
              onMoveDown={() => moveTaskDown(index)}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            >
              {taskElement}
            </SortableTaskWrapper>
          ) : (
            taskElement
          )
        })}
      </AnimatePresence>
    </div>
  )

  if (!enableReorder) {
    return content
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {content}
      </SortableContext>

      {/* DragOverlay permite que el elemento arrastrado flote sobre TODA la página */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-2xl ring-4 ring-purple-500 dark:ring-purple-400 rounded-lg scale-105">
            <SwipeWrapper
              taskId={activeTask.id}
              onComplete={() => {}}
              onDelete={() => {}}
              isCompleted={activeTask.completed}
            >
              <TaskItem task={activeTask} />
            </SwipeWrapper>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
