'use client'

import { Task } from '@/types/database.types'
import TaskItem from './TaskItem'
import { CheckCircle2 } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
}

export default function TaskList({ tasks, emptyMessage = 'No hay tareas' }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}