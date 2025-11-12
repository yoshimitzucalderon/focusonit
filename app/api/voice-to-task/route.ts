import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION CHECK - Prevent unauthorized access
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      );
    }

    const { transcript, timezone } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'No se proporcionó transcripción' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.N8N_VOICE_TASK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_VOICE_TASK_WEBHOOK_URL no está configurada');
      return NextResponse.json(
        { error: 'Webhook no configurado' },
        { status: 500 }
      );
    }

    // Enviar a n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript, timezone }),
    });

    if (!response.ok) {
      throw new Error('Error al procesar en n8n');
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      tags: data.tags,
    });
  } catch (error) {
    console.error('Error en /api/voice-to-task:', error);
    return NextResponse.json(
      { error: 'Error al procesar la tarea por voz' },
      { status: 500 }
    );
  }
}
