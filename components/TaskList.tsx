'use client'

import { Task } from '@/types/database.types'
import TaskItem from './TaskItem'
import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
}

export default function TaskList({ tasks, emptyMessage = 'No hay tareas' }: TaskListProps) {
  if (tasks.length === 0) {
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

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </AnimatePresence>
    </div>
  )
}