export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
          google_event_id: string | null
          synced_with_calendar: boolean
          priority: 'baja' | 'media' | 'alta' | null
          timezone_offset: number | null
          position: number
          time_estimate: number | null
          tags: string[] | null
          reminder_enabled: boolean
          reminder_at: string | null
          start_time: string | null
          end_time: string | null
          is_all_day: boolean
          google_calendar_sync: boolean
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          google_event_id?: string | null
          synced_with_calendar?: boolean
          priority?: 'baja' | 'media' | 'alta' | null
          timezone_offset?: number | null
          position?: number
          time_estimate?: number | null
          tags?: string[] | null
          reminder_enabled?: boolean
          reminder_at?: string | null
          start_time?: string | null
          end_time?: string | null
          is_all_day?: boolean
          google_calendar_sync?: boolean
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          google_event_id?: string | null
          synced_with_calendar?: boolean
          priority?: 'baja' | 'media' | 'alta' | null
          timezone_offset?: number | null
          position?: number
          time_estimate?: number | null
          tags?: string[] | null
          reminder_enabled?: boolean
          reminder_at?: string | null
          start_time?: string | null
          end_time?: string | null
          is_all_day?: boolean
          google_calendar_sync?: boolean
          last_synced_at?: string | null
        }
      }
      time_sessions: {
        Row: {
          id: string
          task_id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          session_type: 'work' | 'short_break' | 'long_break' | 'pomodoro_25' | 'custom'
          is_completed: boolean
          is_active: boolean
          pomodoro_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          session_type?: 'work' | 'short_break' | 'long_break' | 'pomodoro_25' | 'custom'
          is_completed?: boolean
          is_active?: boolean
          pomodoro_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          session_type?: 'work' | 'short_break' | 'long_break' | 'pomodoro_25' | 'custom'
          is_completed?: boolean
          is_active?: boolean
          pomodoro_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      pomodoro_settings: {
        Row: {
          id: string
          user_id: string
          work_duration: number
          short_break_duration: number
          long_break_duration: number
          pomodoros_until_long_break: number
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          notifications_enabled: boolean
          sound_enabled: boolean
          sound_volume: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          pomodoros_until_long_break?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          notifications_enabled?: boolean
          sound_enabled?: boolean
          sound_volume?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          pomodoros_until_long_break?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          notifications_enabled?: boolean
          sound_enabled?: boolean
          sound_volume?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type TimeSession = Database['public']['Tables']['time_sessions']['Row']
export type TimeSessionInsert = Database['public']['Tables']['time_sessions']['Insert']
export type TimeSessionUpdate = Database['public']['Tables']['time_sessions']['Update']

export type PomodoroSettings = Database['public']['Tables']['pomodoro_settings']['Row']
export type PomodoroSettingsInsert = Database['public']['Tables']['pomodoro_settings']['Insert']
export type PomodoroSettingsUpdate = Database['public']['Tables']['pomodoro_settings']['Update']