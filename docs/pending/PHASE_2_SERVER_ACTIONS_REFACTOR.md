# Fase 2: Refactorización a Server Actions (PENDIENTE)

**Estado:** PENDIENTE (No urgente - Mejora arquitectural)
**Prioridad:** MEDIA
**Esfuerzo estimado:** 2-3 horas
**Bloqueadores:** Ninguno - Fase 1 ya funciona

---

## Contexto

La **Fase 1** implementó lazy initialization de Supabase client en las páginas de autenticación para resolver el error de pre-rendering en Vercel. Esta solución funciona correctamente y es segura, pero no sigue las mejores prácticas de Next.js 14.

La **Fase 2** refactorizaría la autenticación para usar **Server Actions**, lo cual es el patrón recomendado por Next.js 14 para operaciones de autenticación.

---

## Arquitectura Actual (Fase 1)

```typescript
// Client Component con Supabase client en browser
'use client'

export default function LoginPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient()) // Browser-side initialization
  }, [])

  async function handleLogin(email: string, password: string) {
    // Authentication logic runs in browser
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Handle result
  }
}
```

**Características:**
- ✅ Funcional y seguro (protegido por RLS)
- ✅ Build exitoso en Vercel
- ⚠️ Lógica de autenticación en cliente
- ⚠️ Supabase client expuesto en browser
- ⚠️ No sigue Next.js 14 best practices

---

## Arquitectura Propuesta (Fase 2)

```typescript
// 1. Server Action (server-side)
// app/actions/auth.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signIn(email: string, password: string) {
  const supabase = createServerClient() // Server-side only

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function signUp(email: string, password: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/login')
  return { success: true }
}

// 2. Client Component (UI only)
// app/(auth)/login/page.tsx
'use client'
import { signIn } from '@/app/actions/auth'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Call Server Action (runs on server)
    const result = await signIn(email, password)

    setLoading(false)

    if (result.success) {
      router.push('/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {/* UI only - no authentication logic */}
    </form>
  )
}
```

**Características:**
- ✅ Sigue Next.js 14 best practices
- ✅ Lógica de autenticación en servidor
- ✅ Client Component solo maneja UI
- ✅ Sin Supabase client expuesto en browser
- ✅ Mejor separación de responsabilidades
- ✅ Más fácil de testear
- ✅ Mejor error handling
- ✅ Automatic CSRF protection

---

## Cambios Requeridos

### Archivos a Crear

1. **`app/actions/auth.ts`** (nuevo)
   - `signIn()` - Server Action para login
   - `signUp()` - Server Action para registro
   - `signOut()` - Server Action para logout
   - `signInWithGoogle()` - Server Action para Google OAuth

### Archivos a Modificar

2. **`app/(auth)/login/page.tsx`**
   - Remover lazy Supabase initialization
   - Importar Server Actions
   - Refactorizar form handlers para llamar Server Actions
   - Mejorar error handling

3. **`app/(auth)/signup/page.tsx`**
   - Remover lazy Supabase initialization
   - Importar Server Actions
   - Refactorizar form handlers para llamar Server Actions
   - Mejorar error handling

### Archivos a Actualizar (opcional)

4. **`lib/supabase/server.ts`**
   - Verificar que `createServerClient()` está optimizado
   - Agregar helper functions si es necesario

5. **Types** (si es necesario)
   - Agregar tipos para responses de Server Actions
   - Agregar tipos para form validation

---

## Plan de Implementación

### Step 1: Crear Server Actions (30 min)
```bash
@nextjs-specialist Create app/actions/auth.ts with Server Actions for authentication

Implement:
- signIn(email, password)
- signUp(email, password)
- signOut()
- signInWithGoogle()

Use createServerClient() from @/lib/supabase/server
Return { success: boolean, error?: string } pattern
Add proper TypeScript types
```

### Step 2: Refactorizar Login Page (45 min)
```bash
@nextjs-specialist Refactor app/(auth)/login/page.tsx to use Server Actions

- Remove lazy Supabase initialization
- Import Server Actions from app/actions/auth
- Update handleLogin to call signIn Server Action
- Update handleGoogleLogin to call signInWithGoogle Server Action
- Improve error handling and loading states
- Keep all UI/UX unchanged
```

### Step 3: Refactorizar Signup Page (45 min)
```bash
@nextjs-specialist Refactor app/(auth)/signup/page.tsx to use Server Actions

- Remove lazy Supabase initialization
- Import Server Actions from app/actions/auth
- Update handleSignup to call signUp Server Action
- Update handleGoogleSignup to call signInWithGoogle Server Action
- Improve error handling and loading states
- Keep all UI/UX unchanged
```

### Step 4: Testing (30 min)
- Test login flow (email/password)
- Test signup flow (email/password)
- Test Google OAuth flow
- Test error scenarios
- Verify session management
- Check TypeScript compilation
- Run build: `npm run build`

### Step 5: Security Review (30 min)
```bash
@auth-specialist Review Server Actions implementation for security

Check:
- Input validation (Zod schemas?)
- Error messages don't leak sensitive info
- Session handling is correct
- CSRF protection (automatic with Server Actions)
- Rate limiting considerations
```

---

## Beneficios

### Técnicos
1. **Mejor arquitectura:** Separación clara entre UI y lógica
2. **Más seguro:** Lógica de auth en servidor, no en cliente
3. **Mejor mantenibilidad:** Código más organizado y testeable
4. **Best practices:** Sigue patrones recomendados de Next.js 14
5. **Menos código en cliente:** Bundle size más pequeño
6. **Automatic optimizations:** Next.js optimiza Server Actions

### De Negocio
1. **Reduce deuda técnica:** Código moderno y mantenible
2. **Facilita features futuros:** Base sólida para expansión
3. **Mejor developer experience:** Más fácil onboarding de nuevos devs

---

## Riesgos y Mitigaciones

### Riesgo 1: Breaking Changes
**Probabilidad:** Baja
**Impacto:** Alto
**Mitigación:**
- Testing exhaustivo antes de deploy
- Mantener Fase 1 como backup branch
- Deploy en horario de bajo tráfico

### Riesgo 2: Session Management Issues
**Probabilidad:** Media
**Impacto:** Alto
**Mitigación:**
- Verificar session cookies funcionan correctamente
- Test en múltiples navegadores
- Probar refresh scenarios

### Riesgo 3: Google OAuth Issues
**Probabilidad:** Baja
**Impacto:** Medio
**Mitigación:**
- Test OAuth flow exhaustivamente
- Verificar redirect URLs siguen funcionando
- Mantener callback handling correcto

---

## Criterios de Éxito

- [ ] Build pasa sin errores: `npm run build`
- [ ] Login con email/password funciona
- [ ] Signup con email/password funciona
- [ ] Google OAuth funciona (login + signup)
- [ ] Session management correcto
- [ ] Error handling mejorado
- [ ] TypeScript sin errores
- [ ] No hay regresiones funcionales
- [ ] Security review aprobado
- [ ] Deploy exitoso a producción
- [ ] Monitoring confirma funcionalidad

---

## Referencias

- [Next.js 14 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth with Server Actions](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)

---

## Notas

- Esta fase NO es urgente
- Fase 1 funciona correctamente y es segura
- Puede hacerse cuando haya tiempo disponible (2-3 horas)
- Es una mejora técnica, no un fix de seguridad
- Priorizar otras tareas críticas primero

---

**Fecha de creación:** 2025-11-11
**Última actualización:** 2025-11-11
**Estado:** Documentado, pendiente de implementación
