import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Configuración para evitar CORS error con header 'prefer'
        fetch: (url, options = {}) => {
          // Crear copia de headers sin 'prefer'
          const headers = new Headers(options.headers)

          // Remover el header 'prefer' que causa CORS error
          headers.delete('prefer')

          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
      db: {
        schema: 'public',
      },
    }
  )
}