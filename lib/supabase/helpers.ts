import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Helper tipado para actualizar tareas
 * Soluciona el problema de inferencia de tipos causado por el custom fetch en client.ts
 */
export const updateTask = async (
  supabase: SupabaseClient<Database>,
  taskId: string,
  updates: Database['public']['Tables']['tasks']['Update']
) => {
  const result = supabase
    .from('tasks')
    // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
    .update(updates)
    .eq('id', taskId)
  return result
}

/**
 * Helper for updating tasks with custom filters
 * Returns a query builder that can be chained with .eq(), .not(), etc.
 */
export const updateTasksQuery = (
  supabase: SupabaseClient<Database>,
  updates: Database['public']['Tables']['tasks']['Update']
) => {
  // @ts-ignore - Bypass Supabase query builder type inference issue
  return supabase.from('tasks').update(updates)
}
