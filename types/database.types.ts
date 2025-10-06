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
          priority: 'baja' | 'media' | 'alta'
          timezone_offset: number | null
          position: number
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
          priority?: 'baja' | 'media' | 'alta'
          timezone_offset?: number | null
          position?: number
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
          priority?: 'baja' | 'media' | 'alta'
          timezone_offset?: number | null
          position?: number
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
          session_type: 'pomodoro_25' | 'custom'
          is_completed: boolean
          is_active: boolean
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
          session_type?: 'pomodoro_25' | 'custom'
          is_completed?: boolean
          is_active?: boolean
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
          session_type?: 'pomodoro_25' | 'custom'
          is_completed?: boolean
          is_active?: boolean
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