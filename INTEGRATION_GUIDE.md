# Guía de Integraciones Futuras

Esta guía documenta cómo implementar las integraciones planificadas para FocusOnIt.

## 📅 Integración con Google Calendar (Fase 3)

### Arquitectura Recomendada

Existen dos enfoques principales:

#### Opción A: n8n Workflow (Recomendado para MVP)
Ventajas: Sin código adicional, visual, fácil de mantener

```
Flujo:
1. Webhook recibe evento de tarea creada/actualizada
2. n8n transforma datos
3. n8n crea/actualiza evento en Google Calendar
4. n8n guarda google_event_id en Supabase
```

#### Opción B: Supabase Edge Function
Ventajas: Todo integrado, más control

### Implementación con n8n

#### 1. Crear webhook en la aplicación

```typescript
// app/api/webhooks/task-sync/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // Verificar webhook secret
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskId, action } = await request.json()

  // Obtener tarea completa
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Enviar a n8n
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  await fetch(n8nUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, action }),
  })

  return NextResponse.json({ success: true })
}
```

#### 2. Modificar TaskInput y TaskItem

Agregar llamada al webhook después de crear/actualizar:

```typescript
// En TaskInput.tsx, después de crear tarea
const { data: newTask } = await supabase
  .from('tasks')
  .insert({ ... })
  .select()
  .single()

if (newTask) {
  // Trigger webhook async (no esperar respuesta)
  fetch('/api/webhooks/task-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET!
    },
    body: JSON.stringify({ taskId: newTask.id, action: 'created' })
  }).catch(console.error)
}
```

#### 3. Crear workflow en n8n

```
1. Webhook Trigger
   - URL: https://n8n.tudominio.com/webhook/focusonit

2. Google Calendar Node
   - Operation: Create Event / Update Event
   - Calendar ID: primary
   - Start: {{ $json.task.due_date }}
   - Summary: {{ $json.task.title }}
   - Description: {{ $json.task.description }}

3. Supabase Node
   - Operation: Update
   - Table: tasks
   - Filter: id = {{ $json.task.id }}
   - Data:
     - google_event_id: {{ $node["Google Calendar"].json.id }}
     - synced_with_calendar: true
```

#### 4. Variables de entorno adicionales

```env
# .env.local
WEBHOOK_SECRET=tu-secret-super-seguro
NEXT_PUBLIC_WEBHOOK_SECRET=tu-secret-super-seguro
N8N_WEBHOOK_URL=https://n8n.tudominio.com/webhook/focusonit
```

### Sync Bidireccional

Para que cambios en Google Calendar se reflejen en FocusOnIt:

```
n8n Workflow #2:
1. Google Calendar Trigger (polling cada 5 min)
2. Loop sobre eventos modificados
3. Buscar en Supabase por google_event_id
4. Actualizar tarea si existe
```

---

## 🤖 Integración con n8n (Fase 2)

### Casos de Uso

1. **Notificaciones por email** cuando se completa tarea importante
2. **Crear tareas automáticamente** desde emails/Slack/Telegram
3. **Reportes semanales** por email con tareas completadas
4. **Integración con Notion/Obsidian** para journaling

### Webhook de tarea completada

```typescript
// app/api/webhooks/task-completed/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskId } = await request.json()

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task?.completed) {
    return NextResponse.json({ error: 'Task not completed' }, { status: 400 })
  }

  // Enviar a n8n para procesamiento
  const n8nUrl = process.env.N8N_COMPLETED_WEBHOOK_URL
  await fetch(n8nUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  })

  return NextResponse.json({ success: true })
}
```

### Ejemplo de workflow n8n: Email de felicitación

```
1. Webhook Trigger (task completed)
2. Filter: task.title contains "importante" OR task.due_date < tomorrow
3. Gmail Node
   - To: {{ $json.task.user.email }}
   - Subject: ¡Bien hecho! Completaste: {{ $json.task.title }}
   - Body: HTML template con celebración
```

---

## 📊 Database Triggers para Webhooks

Para automatizar completamente sin modificar código frontend:

```sql
-- Crear función para llamar webhook
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS trigger AS $$
DECLARE
  webhook_url text := 'https://tuapp.com/api/webhooks/task-completed';
BEGIN
  -- Solo si cambió de incompleto a completo
  IF OLD.completed = false AND NEW.completed = true THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', current_setting('app.webhook_secret')
      ),
      body := jsonb_build_object('taskId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER task_completed_webhook
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();
```

**Nota:** Requiere extensión `pg_net` en Supabase (disponible en todos los planes)

---

## 🔮 Ideas para Automatizaciones

### 1. Email de resumen semanal

**n8n Workflow:**
- Trigger: Schedule (cada lunes 8 AM)
- Supabase: Query tareas completadas última semana
- Template: HTML email con stats y lista
- Gmail: Enviar

### 2. Crear tarea desde email

**n8n Workflow:**
- Trigger: Gmail (emails con etiqueta "Todo")
- Extract: Asunto = título, body = descripción
- Supabase: Insert task
- Gmail: Mover a "Procesado"

### 3. Integración con Telegram Bot

**n8n Workflow:**
- Trigger: Telegram Bot command "/todo"
- Extract: Mensaje del usuario
- Supabase: Insert task
- Telegram: Confirmar "Tarea creada ✓"

### 4. Backup diario a Google Drive

**n8n Workflow:**
- Trigger: Schedule (cada día 2 AM)
- Supabase: Export todas las tareas
- Google Drive: Crear CSV con timestamp
- Gmail: Enviar confirmación

---

## 🛡️ Seguridad en Webhooks

### Validar requests

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  )
}

// En tu route handler
const payload = await request.text()
const signature = request.headers.get('x-webhook-signature')!

if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

### Rate limiting

Usar `@vercel/edge-rate-limit` o similar para prevenir abuso.

---

## 📝 Checklist de Implementación

### Google Calendar Sync
- [ ] Crear Google Cloud Project
- [ ] Activar Google Calendar API
- [ ] Obtener OAuth credentials
- [ ] Configurar n8n con credenciales
- [ ] Crear workflow de sync
- [ ] Agregar webhook endpoints
- [ ] Probar sync bidireccional
- [ ] Documentar para usuarios

### n8n Webhooks
- [ ] Configurar n8n self-hosted o cloud
- [ ] Crear webhook endpoints en Next.js
- [ ] Implementar autenticación de webhooks
- [ ] Crear workflows base (email, notificaciones)
- [ ] Documentar workflows disponibles
- [ ] Agregar UI para activar/desactivar integraciones

---

## 🚀 Deploy de n8n

### Docker Compose (Recomendado)

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=tu-password
      - N8N_HOST=n8n.tudominio.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.tudominio.com/
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

---

¿Preguntas? Revisa la [documentación oficial de n8n](https://docs.n8n.io) y [Supabase Edge Functions](https://supabase.com/docs/guides/functions)