'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Task } from '@/types/database.types'
import TaskItem from './TaskItem'

interface SortableTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: any) => void
}

export default function SortableTaskItem({
  task,
  onToggle,
  onDelete,
  onUpdate,
}: SortableTaskItemProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Drag Handle - Solo visible en desktop */}
      <div
        {...attributes}
        {...listeners}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* TaskItem original */}
      <TaskItem
        task={task}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    </div>
  )
}
