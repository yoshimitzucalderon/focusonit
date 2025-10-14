'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

type PendingOperation = {
  id: string
  type: 'update' | 'delete' | 'complete'
  originalTask?: Task
  promise: Promise<void>
}

export function useOptimisticTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    // Fetch inicial
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
      } else {
        setTasks(data || [])
      }
      setLoading(false)
    }

    fetchTasks()

    // Suscripción a cambios en tiempo real
    channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          // Solo aplicar cambios del servidor si no hay operación pendiente
          if (payload.eventType === 'INSERT') {
            setTasks((current) => [payload.new as Task, ...current])
          } else if (payload.eventType === 'UPDATE') {
            const taskId = payload.new.id
            // Si no hay operación pendiente para esta tarea, aplicar el cambio
            setPendingOperations((ops) => {
              if (!ops.has(taskId)) {
                setTasks((current) =>
                  current.map((task) =>
                    task.id === taskId ? (payload.new as Task) : task
                  )
                )
              }
              return ops
            })
          } else if (payload.eventType === 'DELETE') {
            const taskId = payload.old.id
            setPendingOperations((ops) => {
              if (!ops.has(taskId)) {
                setTasks((current) =>
                  current.filter((task) => task.id !== taskId)
                )
              }
              return ops
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Actualización optimista de una tarea
  const optimisticUpdate = useCallback(async (
    taskId: string,
    updates: Partial<Task>,
    dbUpdate: () => Promise<void>
  ) => {
    // 1. Guardar el estado original
    const originalTask = tasks.find(t => t.id === taskId)
    if (!originalTask) return

    // 2. Actualizar UI inmediatamente (optimista)
    setTasks(current =>
      current.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )

    // 3. Crear promesa de actualización
    const updatePromise = dbUpdate().catch(error => {
      // 4. Si falla, revertir cambios (rollback)
      setTasks(current =>
        current.map(task =>
          task.id === taskId ? originalTask : task
        )
      )
      toast.error('Error al actualizar. Se revirtieron los cambios.')
      throw error
    })

    // 5. Registrar operación pendiente
    const operation: PendingOperation = {
      id: taskId,
      type: 'update',
      originalTask,
      promise: updatePromise
    }

    setPendingOperations(ops => new Map(ops).set(taskId, operation))

    // 6. Esperar y limpiar
    try {
      await updatePromise
    } finally {
      setPendingOperations(ops => {
        const newOps = new Map(ops)
        newOps.delete(taskId)
        return newOps
      })
    }
  }, [tasks])

  // Eliminación optimista
  const optimisticDelete = useCallback(async (
    taskId: string,
    dbDelete: () => Promise<void>
  ) => {
    // 1. Guardar el estado original
    const originalTask = tasks.find(t => t.id === taskId)
    if (!originalTask) return

    // 2. Eliminar de UI inmediatamente
    setTasks(current => current.filter(task => task.id !== taskId))

    // 3. Crear promesa de eliminación
    const deletePromise = dbDelete().catch(error => {
      // 4. Si falla, restaurar tarea
      setTasks(current => {
        // Insertar en la posición original o al final
        const index = current.findIndex(t => t.id > taskId)
        if (index === -1) return [...current, originalTask]
        return [
          ...current.slice(0, index),
          originalTask,
          ...current.slice(index)
        ]
      })
      toast.error('Error al eliminar. Se restauró la tarea.')
      throw error
    })

    // 5. Registrar operación pendiente
    const operation: PendingOperation = {
      id: taskId,
      type: 'delete',
      originalTask,
      promise: deletePromise
    }

    setPendingOperations(ops => new Map(ops).set(taskId, operation))

    // 6. Esperar y limpiar
    try {
      await deletePromise
    } finally {
      setPendingOperations(ops => {
        const newOps = new Map(ops)
        newOps.delete(taskId)
        return newOps
      })
    }
  }, [tasks])

  // Completar/Incompletar optimista
  const optimisticComplete = useCallback(async (
    taskId: string,
    completed: boolean,
    completedAt: string | null,
    dbUpdate: () => Promise<void>
  ) => {
    await optimisticUpdate(
      taskId,
      { completed, completed_at: completedAt },
      dbUpdate
    )
  }, [optimisticUpdate])

  // Verificar si una tarea tiene operación pendiente
  const isPending = useCallback((taskId: string) => {
    return pendingOperations.has(taskId)
  }, [pendingOperations])

  return {
    tasks,
    loading,
    setTasks,
    optimisticUpdate,
    optimisticDelete,
    optimisticComplete,
    isPending
  }
}
