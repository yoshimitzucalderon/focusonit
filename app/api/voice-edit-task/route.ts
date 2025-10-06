import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
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

    console.log('✅ Cambios detectados:', result)

    return NextResponse.json({
      changedFields: result,
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
