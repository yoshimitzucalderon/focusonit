'use client'

import { Task } from '@/types/database.types'
import TaskItem from './TaskItem'
import SwipeWrapper from './SwipeWrapper'
import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
}

export default function TaskList({ tasks, emptyMessage = 'No hay tareas' }: TaskListProps) {
  const supabase = createClient()

  const handleComplete = async (task: Task) => {
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

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) throw error

      toast.success('Tarea eliminada')
    } catch (error: any) {
      toast.error('Error al eliminar tarea')
      console.error(error)
    }
  }

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
          <SwipeWrapper
            key={task.id}
            onComplete={() => handleComplete(task)}
            onDelete={() => handleDelete(task.id)}
            isCompleted={task.completed}
          >
            <TaskItem task={task} />
          </SwipeWrapper>
        ))}
      </AnimatePresence>
    </div>
  )
}