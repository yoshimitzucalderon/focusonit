import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION CHECK - Prevent unauthorized access
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    const { transcript, currentTask } = await request.json()

    if (!transcript || !currentTask) {
      return NextResponse.json(
        { error: 'Falta transcript o currentTask' },
        { status: 400 }
      )
    }

    console.log('📝 Editando tarea con comando:', transcript)
    console.log('📋 Tarea actual:', currentTask)

    // Enviar a n8n
    const n8nUrl = process.env.N8N_VOICE_TASK_WEBHOOK_URL

    if (!n8nUrl) {
      console.error('N8N_VOICE_TASK_WEBHOOK_URL no está configurada')
      return NextResponse.json(
        { error: 'Webhook no configurado' },
        { status: 500 }
      )
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        currentTask,
        action: 'edit', // flag para diferenciar de creación
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`n8n error: ${response.status}`)
    }

    const result = await response.json()

    console.log('✅ Respuesta de n8n:', result)

    // Verificar que result tenga la estructura correcta
    // n8n puede devolver el objeto directamente o dentro de una propiedad
    const changedFields = result.changedFields || result

    console.log('✅ Cambios procesados:', changedFields)

    return NextResponse.json({
      changedFields,
      original: currentTask
    })
  } catch (error) {
    console.error('❌ Error en voice-edit-task:', error)
    return NextResponse.json(
      { error: 'Error al procesar comando' },
      { status: 500 }
    )
  }
}
