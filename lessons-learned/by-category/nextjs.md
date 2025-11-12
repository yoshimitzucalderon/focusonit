# Next.js - Lessons Learned

Lecciones aprendidas relacionadas con Next.js, App Router, middleware, y runtime environments.

---

## Indice de Lecciones

### 2025-11-11: Middleware Edge Runtime Environment Variables

**Archivo:** [2025-11-11-vercel-edge-runtime-env-vars.md](../by-date/2025-11-11-vercel-edge-runtime-env-vars.md)

**Problema:** Middleware ejecuta en Edge Runtime y no puede acceder a variables de entorno encriptadas en Vercel.

**Solucion:** Configurar variables que usa middleware como Plaintext en Vercel.

**Keywords:** middleware, edge-runtime, environment-variables, vercel

**Severidad:** CRITICAL

**Aprendizaje clave:** El middleware de Next.js corre en Edge Runtime por defecto. Edge Runtime tiene restricciones mas estrictas que Node.js runtime, incluyendo la incapacidad de acceder a variables encriptadas.

---

## Conceptos Importantes

### Next.js Runtimes

Next.js puede ejecutar codigo en diferentes runtimes:

1. **Edge Runtime (Default for Middleware):**
   - Ligero, rapido, global
   - Restricciones: No Node.js APIs, no vars encriptadas
   - Ideal para: Middleware, edge functions

2. **Node.js Runtime (Default for Most Things):**
   - Runtime completo de Node.js
   - Acceso a: File system, crypto, vars encriptadas
   - Ideal para: Server Components, API routes, build

### Middleware Best Practices

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ✅ DO: Use NEXT_PUBLIC_ vars (plaintext in Vercel)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  // ❌ DON'T: Use service role keys (too powerful for Edge)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // ✅ DO: Fail fast with helpful error
  if (!url) {
    return new Response('Config error', { status: 500 })
  }

  // ❌ DON'T: Silent fallbacks that bypass security
  if (!url) {
    return NextResponse.next() // Bypasses auth!
  }
}
```

### Server Components vs Client Components

```typescript
// Server Component (default in App Router)
async function ServerComponent() {
  // Can use encrypted env vars
  const data = await fetch(process.env.INTERNAL_API_URL)
  return <div>{data}</div>
}

// Client Component
'use client'
function ClientComponent() {
  // Only has access to NEXT_PUBLIC_ vars
  const url = process.env.NEXT_PUBLIC_API_URL
  return <div>{url}</div>
}
```

### When to Use Each Runtime

| Use Case | Runtime | Why |
|----------|---------|-----|
| Authentication check | Edge | Fast, global, low latency |
| Database query | Node.js | Needs encrypted connection strings |
| File upload | Node.js | Needs fs module |
| Redirect logic | Edge | Fast, no heavy computation |
| API route with secrets | Node.js | Needs encrypted vars |
| Webhook receiver | Node.js | May need service role keys |

---

## Common Patterns

### 1. Middleware Authentication

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get, set, remove } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

### 2. Server Action with Service Role

```typescript
// app/actions.ts
'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

export async function adminAction() {
  // Server Actions run in Node.js runtime
  // Can use encrypted service role key
  const supabase = createServiceRoleClient()
  // ... admin operation
}
```

### 3. API Route with Webhook

```typescript
// app/api/webhook/route.ts
import { createServiceRoleClient } from '@/lib/supabase/server'

// Runs in Node.js runtime by default
export async function POST(request: Request) {
  // Can use encrypted vars
  const supabase = createServiceRoleClient()
  // ... process webhook
}
```

### 4. Edge API Route

```typescript
// app/api/edge/route.ts
export const runtime = 'edge' // Explicitly set Edge Runtime

export async function GET(request: Request) {
  // Only use NEXT_PUBLIC_ vars (plaintext)
  const url = process.env.NEXT_PUBLIC_API_URL
  // ... fast edge logic
}
```

---

## Troubleshooting

### Problem: Middleware Not Working in Production

**Symptoms:**
- 500 errors on all routes
- "env vars not available" in logs
- Works locally, fails on Vercel

**Solution:**
1. Check Vercel env vars are Plaintext (not Encrypted)
2. Verify variable names match exactly
3. Redeploy after changing env vars

### Problem: "Cannot find module" in Middleware

**Cause:** Trying to import Node.js module in Edge Runtime

**Solution:**
```typescript
// ❌ DON'T: Import Node.js modules
import fs from 'fs'

// ✅ DO: Use Edge-compatible modules
import { createServerClient } from '@supabase/ssr'
```

### Problem: Type Errors with process.env

**Solution:**
```typescript
// Add type assertion for env vars you control
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Or check at runtime
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
```

---

## Quick Reference

### Middleware Configuration

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Include all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Runtime Selection

```typescript
// Force Node.js runtime in API route
export const runtime = 'nodejs'

// Force Edge runtime
export const runtime = 'edge'

// Default:
// - Middleware: Edge
// - API Routes: Node.js
// - Server Components: Node.js
```

---

## Related Documentation

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Runtime Docs](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Vercel Edge Runtime](../../lessons-learned/by-category/vercel.md)

---

**Maintained by:** DevOps Team
**Last Updated:** 2025-11-11
