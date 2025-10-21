import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Task {
  id: string
  user_id: string
  title: string
  description?: string | null
  due_date?: string | null
  start_time?: string | null
  end_time?: string | null
  is_all_day?: boolean
  completed: boolean
  google_event_id?: string | null
  google_calendar_sync?: boolean
  synced_with_calendar?: boolean
}

export function useGoogleCalendarSync() {
  const [syncing, setSyncing] = useState(false)

  // Sync a task to Google Calendar (create or update)
  const syncTask = useCallback(async (task: Task) => {
    // Only sync if google_calendar_sync is enabled for this task
    if (!task.google_calendar_sync) {
      return { success: true }
    }

    setSyncing(true)

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      })

      const data = await response.json()

      if (data.success) {
        return { success: true, eventId: data.eventId }
      } else {
        console.error('Sync error:', data.error)
        toast.error('Error al sincronizar con Google Calendar')
        return { success: false, error: data.error }
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      toast.error('Error al sincronizar con Google Calendar')
      return { success: false, error: error.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  // Delete a task from Google Calendar
  const deleteTask = useCallback(async (task: Task) => {
    if (!task.google_event_id) {
      return { success: true }
    }

    setSyncing(true)

    try {
      const response = await fetch('/api/calendar/delete-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        console.error('Delete error:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  // Batch sync multiple tasks
  const batchSync = useCallback(async (taskIds: string[]) => {
    setSyncing(true)

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskIds }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✓ ${taskIds.length} tarea(s) sincronizada(s)`)
        return { success: true, results: data.results }
      } else {
        toast.error('Error al sincronizar tareas')
        return { success: false, error: data.error }
      }
    } catch (error: any) {
      toast.error('Error al sincronizar tareas')
      return { success: false, error: error.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  // Import events from Google Calendar
  const importEvents = useCallback(async () => {
    setSyncing(true)

    try {
      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`✓ ${data.count} evento(s) importado(s)`)
        return { success: true, count: data.count }
      } else {
        toast.error('Error al importar eventos')
        return { success: false, error: data.error }
      }
    } catch (error: any) {
      toast.error('Error al importar eventos')
      return { success: false, error: error.message }
    } finally {
      setSyncing(false)
    }
  }, [])

  return {
    syncing,
    syncTask,
    deleteTask,
    batchSync,
    importEvents,
  }
}
