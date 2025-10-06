import { createClient } from './client'
import { PomodoroSettings, PomodoroSettingsInsert, PomodoroSettingsUpdate } from '@/types/database.types'

/**
 * Pomodoro Settings Queries
 * Manages user-specific Pomodoro timer configuration
 */

/**
 * Get user's Pomodoro settings
 * Creates default settings if they don't exist
 */
export async function getPomodoroSettings(userId: string): Promise<PomodoroSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('pomodoro_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching pomodoro settings:', error)
    throw error
  }

  // If no settings exist, create default ones
  if (!data) {
    return await createDefaultPomodoroSettings(userId)
  }

  return data as PomodoroSettings
}

/**
 * Create default Pomodoro settings for a user
 */
export async function createDefaultPomodoroSettings(userId: string): Promise<PomodoroSettings> {
  const supabase = createClient()

  const defaultSettings: PomodoroSettingsInsert = {
    user_id: userId,
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    pomodoros_until_long_break: 4,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
    notifications_enabled: true,
    sound_enabled: true,
    sound_volume: 50,
  }

  const { data, error } = await supabase
    .from('pomodoro_settings')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .insert(defaultSettings)
    .select()
    .single()

  if (error) {
    console.error('Error creating default pomodoro settings:', error)
    throw error
  }

  return data as PomodoroSettings
}

/**
 * Update user's Pomodoro settings
 */
export async function updatePomodoroSettings(
  userId: string,
  updates: PomodoroSettingsUpdate
): Promise<PomodoroSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('pomodoro_settings')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating pomodoro settings:', error)
    throw error
  }

  return data as PomodoroSettings
}
