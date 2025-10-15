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
            console.log('🐛 DEBUG [useTasks Realtime] ===== INSERT DETECTADO =====')
            console.log('🐛 DEBUG [useTasks Realtime] Payload:', payload)

            // ✅ Verificar si la tarea ya existe antes de agregarla (evita duplicados)
            setTasks((current) => {
              const newTask = payload.new as Task
              console.log('🐛 DEBUG [useTasks Realtime] Nueva tarea:', newTask)
              console.log('🐛 DEBUG [useTasks Realtime] ID:', newTask.id)
              console.log('🐛 DEBUG [useTasks Realtime] Título:', newTask.title)
              console.log('🐛 DEBUG [useTasks Realtime] Estado actual:', current)
              console.log('🐛 DEBUG [useTasks Realtime] Cantidad de tareas actual:', current.length)

              const exists = current.some(task => task.id === newTask.id)
              console.log('🐛 DEBUG [useTasks Realtime] ¿Tarea ya existe?:', exists)

              if (exists) {
                console.log('🔄 [useTasks Realtime] INSERT detectado pero tarea ya existe:', newTask.id, newTask.title, '- Ignorando para evitar duplicado')
                return current // Ya existe, no agregar
              }

              console.log('🔄 [useTasks Realtime] INSERT detectado, agregando tarea:', newTask.id, newTask.title)
              const updated = [newTask, ...current]
              console.log('🐛 DEBUG [useTasks Realtime] Nuevo estado:', updated)
              console.log('🐛 DEBUG [useTasks Realtime] Nueva cantidad de tareas:', updated.length)
              console.log('🐛 DEBUG [useTasks Realtime] ===== INSERT TERMINADO =====')
              return updated
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