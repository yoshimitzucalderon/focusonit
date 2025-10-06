import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { taskUpdates } = await request.json()

    if (!Array.isArray(taskUpdates) || taskUpdates.length === 0) {
      return NextResponse.json(
        { error: 'taskUpdates debe ser un array no vacío' },
        { status: 400 }
      )
    }

    // Actualizar posiciones en batch
    const updates = taskUpdates.map(({ id, position }: { id: string; position: number }) =>
      supabase
        .from('tasks')
        // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id) // Seguridad: solo actualizar tareas del usuario
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al reordenar tareas:', error)
    return NextResponse.json(
      { error: 'Error al reordenar tareas' },
      { status: 500 }
    )
  }
}
