/**
 * Helper functions for automatic Google Calendar synchronization
 * These functions can be called after task operations to sync with Google Calendar
 */

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

/**
 * Sync a task to Google Calendar after creation or update
 * This is a fire-and-forget operation - errors are logged but don't block the UI
 */
export async function syncTaskToCalendar(task: Task): Promise<void> {
  // Only sync if google_calendar_sync is enabled for this task
  if (!task.google_calendar_sync) {
    return
  }

  try {
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    })

    const data = await response.json()

    if (!data.success) {
      console.warn('Calendar sync failed:', data.error)
    }
  } catch (error) {
    console.warn('Calendar sync failed:', error)
  }
}

/**
 * Delete a task from Google Calendar
 * This is a fire-and-forget operation - errors are logged but don't block the UI
 */
export async function deleteTaskFromCalendar(task: Task): Promise<void> {
  if (!task.google_event_id) {
    return
  }

  try {
    await fetch('/api/calendar/delete-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    })
  } catch (error) {
    console.warn('Calendar delete failed:', error)
  }
}

/**
 * Sync a task after it's created in Supabase
 * Call this after a successful task insert
 */
export async function syncAfterCreate(taskId: string, userId: string): Promise<void> {
  try {
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    })

    const data = await response.json()

    if (!data.success) {
      console.warn('Calendar sync failed:', data.error)
    }
  } catch (error) {
    console.warn('Calendar sync failed:', error)
  }
}

/**
 * Check if user has Google Calendar connected
 */
export async function isCalendarConnected(): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar/status')
    const data = await response.json()
    return data.connected || false
  } catch (error) {
    return false
  }
}
