'use client'

import { useState } from 'react'
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
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle - Solo visible en desktop en hover */}
      <div
        {...attributes}
        {...listeners}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>

      {/* Botones móvil - Solo visible en móvil */}
      <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 flex flex-col gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 dark:active:bg-slate-600"
          title="Mover arriba"
        >
          <ChevronUp className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 dark:active:bg-slate-600"
          title="Mover abajo"
        >
          <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {children}
    </div>
  )
}

export default function TaskList({
  tasks,
  emptyMessage = 'No hay tareas',
  enableReorder = true
}: TaskListProps) {
  const [items, setItems] = useState(tasks)
  const supabase = createClient()

  // Sincronizar cuando cambien las tasks desde el padre
  if (tasks.length !== items.length || tasks.some((t, i) => t.id !== items[i]?.id)) {
    setItems(tasks)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px antes de iniciar drag (evita conflictos con swipe)
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

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
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  )
}
