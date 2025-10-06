import { createClient } from './client'
import { TimeSessionInsert, TimeSessionUpdate } from '@/types/database.types'

/**
 * Time Session Queries
 * Manages Pomodoro timer sessions for tasks
 */

/**
 * Create a new time session
 */
export async function createTimeSession(
  taskId: string,
  userId: string,
  sessionType: 'pomodoro_25' | 'custom' = 'pomodoro_25'
): Promise<import('@/types/database.types').TimeSession> {
  const supabase = createClient()

  try {
    // First, pause any active sessions for this user (one timer at a time)
    await pauseAllActiveSessions(userId)

    const sessionData: TimeSessionInsert = {
      task_id: taskId,
      user_id: userId,
      session_type: sessionType,
      started_at: new Date().toISOString(),
      is_active: true,
      is_completed: false,
    }

    console.log('Creating time session with data:', sessionData)

    const { data, error } = await supabase
      .from('time_sessions')
      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating time session:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // Provide user-friendly error messages
      if (error.code === '42P01') {
        throw new Error('La tabla time_sessions no existe. Por favor ejecuta la migración SQL primero.')
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para crear sesiones de tiempo. Verifica las políticas RLS.')
      }

      throw new Error(error.message || 'Error al crear sesión de tiempo')
    }

    console.log('Time session created successfully:', data)
    return data as import('@/types/database.types').TimeSession
  } catch (error: any) {
    console.error('Exception in createTimeSession:', error)
    throw error
  }
}

/**
 * Update an existing time session
 */
export async function updateTimeSession(
  sessionId: string,
  updates: TimeSessionUpdate
): Promise<import('@/types/database.types').TimeSession> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating time session:', error)
    throw error
  }

  return data as import('@/types/database.types').TimeSession
}

/**
 * Pause/end a time session
 * Calculates duration and marks as inactive
 */
export async function pauseTimeSession(sessionId: string) {
  const supabase = createClient()

  // Get current session to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    console.error('Error fetching session:', fetchError)
    throw fetchError
  }

  const startTime = new Date((session as import('@/types/database.types').TimeSession).started_at)
  const endTime = new Date()
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

  const updates: TimeSessionUpdate = {
    ended_at: endTime.toISOString(),
    duration_seconds: durationSeconds,
    is_active: false,
  }

  return updateTimeSession(sessionId, updates)
}

/**
 * Complete a time session (finished full 25 minutes)
 */
export async function completeTimeSession(sessionId: string) {
  const supabase = createClient()

  // Get current session to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    console.error('Error fetching session:', fetchError)
    throw fetchError
  }

  const startTime = new Date((session as import('@/types/database.types').TimeSession).started_at)
  const endTime = new Date()
  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

  const updates: TimeSessionUpdate = {
    ended_at: endTime.toISOString(),
    duration_seconds: durationSeconds,
    is_active: false,
    is_completed: true,
  }

  return updateTimeSession(sessionId, updates)
}

/**
 * Get all active sessions for a user (should be max 1)
 */
export async function getActiveTimeSession(userId: string): Promise<import('@/types/database.types').TimeSession | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active session:', error)
    throw error
  }

  return data as import('@/types/database.types').TimeSession | null
}

/**
 * Get total time spent on a task (sum of all sessions)
 * Returns total seconds
 */
export async function getTotalTimeForTask(taskId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .select('duration_seconds')
    .eq('task_id', taskId)
    .not('duration_seconds', 'is', null)

  if (error) {
    console.error('Error fetching total time:', error)
    return 0
  }

  if (!data || data.length === 0) {
    return 0
  }

  return (data as Array<{ duration_seconds: number | null }>).reduce((total, session) => total + (session.duration_seconds || 0), 0)
}

/**
 * Get all sessions for a task
 */
export async function getTaskSessions(taskId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching task sessions:', error)
    throw error
  }

  return data || []
}

/**
 * Pause all active sessions for a user
 * Enforces one-timer-at-a-time rule
 */
export async function pauseAllActiveSessions(userId: string) {
  const supabase = createClient()

  const { data: activeSessions, error: fetchError } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (fetchError) {
    console.error('Error fetching active sessions:', fetchError)
    throw fetchError
  }

  if (!activeSessions || activeSessions.length === 0) {
    return []
  }

  // Pause each active session
  const updates = (activeSessions as import('@/types/database.types').TimeSession[]).map(async (session) => {
    const startTime = new Date(session.started_at)
    const endTime = new Date()
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    return supabase
      .from('time_sessions')
      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      .update({
        ended_at: endTime.toISOString(),
        duration_seconds: durationSeconds,
        is_active: false,
      })
      .eq('id', session.id)
  })

  const results = await Promise.all(updates)
  return results
}

/**
 * Get all time sessions with task details
 */
export async function getTimeSessionsWithTasks(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_sessions')
    .select(`
      *,
      tasks (
        title,
        description
      )
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions with tasks:', error)
    throw error
  }

  return data || []
}

/**
 * Delete a time session
 */
export async function deleteTimeSession(sessionId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('time_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting time session:', error)
    throw error
  }

  return true
}

/**
 * Heartbeat update - called every 30 seconds while timer is active
 * Updates the updated_at timestamp to track activity
 */
export async function heartbeatTimeSession(sessionId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('time_sessions')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    console.error('Error updating heartbeat:', error)
    // Don't throw - heartbeat failures shouldn't stop the timer
  }

  return !error
}
