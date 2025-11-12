# Critical Security Findings - FocusOnIt Task Manager

**Audit Date:** 2025-11-11
**Severity:** CRITICAL
**Status:** REQUIRES IMMEDIATE REMEDIATION

---

## CRITICAL: Missing Authentication on Voice API Endpoints

### Affected Endpoints

1. **`/api/voice-to-task`** - CRITICAL
2. **`/api/voice-edit-task`** - CRITICAL

### Vulnerability Description

Both voice-related API endpoints are completely **unauthenticated**. Any attacker can:

1. Create tasks for any user (if they know the user_id)
2. Edit tasks for any user
3. Flood the system with malicious task data
4. Cause denial of service by overwhelming n8n webhook

### Proof of Concept

```bash
# Anyone can call this endpoint without authentication
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Hack the system", "timezone": "America/Los_Angeles"}'

# Response: 200 OK (SHOULD BE 401 Unauthorized)
```

### Impact

- **Severity:** CRITICAL
- **CVSS Score:** 9.1 (Critical)
- **Attack Vector:** Network (Remote)
- **Authentication Required:** None
- **User Interaction:** None

**Worst Case Scenario:**
- Attacker creates thousands of spam tasks for all users
- Attacker modifies/deletes legitimate tasks
- Service becomes unusable (DoS)
- User data integrity compromised

---

## Remediation

### Option 1: User Authentication (Recommended)

Add Supabase authentication to both endpoints:

**File: `app/api/voice-to-task/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION CHECK (CRITICAL)
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
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

    // Send to n8n with user_id
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        timezone,
        user_id: user.id, // ✅ Include authenticated user ID
      }),
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
```

**File: `app/api/voice-edit-task/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 🔒 AUTHENTICATION CHECK (CRITICAL)
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
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

    // ✅ AUTHORIZATION: Verify task belongs to user
    const { data: taskOwner } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', currentTask.id)
      .single()

    if (!taskOwner || taskOwner.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this task' },
        { status: 403 }
      )
    }

    console.log('📝 Editando tarea con comando:', transcript)
    console.log('📋 Tarea actual:', currentTask)

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
        user_id: user.id, // ✅ Include authenticated user ID
        action: 'edit',
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`n8n error: ${response.status}`)
    }

    const result = await response.json()

    console.log('✅ Respuesta de n8n:', result)

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
```

---

### Option 2: API Key Authentication (If n8n needs direct access)

If n8n needs to call these endpoints directly (without user session), use an API key:

**Environment Variable:**
```bash
N8N_API_KEY=your-long-random-secret-key-here
```

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('x-api-key')

    if (apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Must include user_id in request body
    const { user_id, transcript, timezone } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Continue processing...
  } catch (error) {
    // Error handling...
  }
}
```

**n8n Configuration:**
```javascript
// In n8n HTTP Request node
{
  "method": "POST",
  "url": "https://focusonit.ycm360.com/api/voice-to-task",
  "headers": {
    "x-api-key": "{{$env.N8N_API_KEY}}"
  },
  "body": {
    "user_id": "{{$json.user_id}}",
    "transcript": "{{$json.transcript}}",
    "timezone": "America/Los_Angeles"
  }
}
```

---

### Option 3: Hybrid Approach (Best of Both)

1. **If request has valid Supabase session:** Use user from session
2. **If request has valid API key:** Use `user_id` from request body

```typescript
export async function POST(request: NextRequest) {
  let userId: string | null = null

  // Try Supabase auth first
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    userId = user.id
  } else {
    // Try API key
    const apiKey = request.headers.get('x-api-key')

    if (apiKey === process.env.N8N_API_KEY) {
      const body = await request.json()
      userId = body.user_id
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Continue processing with userId...
}
```

---

## Timeline

**IMMEDIATE ACTION REQUIRED:**

1. **Within 24 hours:** Implement authentication (Option 1 recommended)
2. **Within 48 hours:** Deploy fix to production
3. **Within 72 hours:** Audit logs for unauthorized access

---

## Verification

After implementing fix, verify with:

```bash
# Should return 401 Unauthorized
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Test"}'

# Expected: {"error":"Unauthorized - Please log in"}
# Status: 401
```

---

## Additional Recommendations

1. **Add rate limiting** to all API endpoints
2. **Implement request logging** for security monitoring
3. **Add CORS restrictions** to prevent cross-origin abuse
4. **Monitor for suspicious activity** in production logs

---

**Security Analyst:** Security Tester Specialist
**Report Generated:** 2025-11-11
**Classification:** CONFIDENTIAL - INTERNAL USE ONLY
