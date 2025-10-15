'use client'

import { useEffect, useState } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    // Fetch inicial
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })  // Ordenar por position manual
        .order('created_at', { ascending: false })  // Fallback por fecha

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
          if (payload.eventType === 'INSERT') {
            // ✅ Verificar si la tarea ya existe antes de agregarla (evita duplicados)
            setTasks((current) => {
              const newTask = payload.new as Task
              const exists = current.some(task => task.id === newTask.id)

              if (exists) {
                console.log('🔄 [useTasks Realtime] INSERT detectado pero tarea ya existe:', newTask.id, newTask.title, '- Ignorando para evitar duplicado')
                return current // Ya existe, no agregar
              }

              console.log('🔄 [useTasks Realtime] INSERT detectado, agregando tarea:', newTask.id, newTask.title)
              return [newTask, ...current]
            })
          } else if (payload.eventType === 'UPDATE') {
            setTasks((current) =>
              current.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((current) =>
              current.filter((task) => task.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return { tasks, loading, setTasks }
}