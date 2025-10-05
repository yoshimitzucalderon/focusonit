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
