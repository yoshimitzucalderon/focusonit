'use client'

import { useState } from 'react'
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
} from '@dnd-kit/sortable'
import { Task } from '@/types/database.types'
import SortableTaskItem from './SortableTaskItem'

interface DraggableTaskListProps {
  tasks: Task[]
  onTasksReorder: (tasks: Task[]) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: any) => void
}

export default function DraggableTaskList({
  tasks,
  onTasksReorder,
  onToggle,
  onDelete,
  onUpdate,
}: DraggableTaskListProps) {
  const [items, setItems] = useState(tasks)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement antes de iniciar drag (evita conflictos con clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((task) => task.id === active.id)
      const newIndex = items.findIndex((task) => task.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)

      // Actualizar posiciones localmente
      const updatedItems = newItems.map((task, index) => ({
        ...task,
        position: index,
      }))

      setItems(updatedItems)
      onTasksReorder(updatedItems)
    }
  }

  // Sincronizar cuando cambien las tasks desde el padre
  if (tasks.length !== items.length || tasks.some((t, i) => t.id !== items[i]?.id)) {
    setItems(tasks)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
