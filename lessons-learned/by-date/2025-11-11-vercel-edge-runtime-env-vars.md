# Vercel Edge Runtime Cannot Access Encrypted Environment Variables

**Date:** 2025-11-11
**Category:** vercel, nextjs, deployment, edge-runtime
**Severity:** CRITICAL (Production down)
**Time to Resolve:** 2 hours
**Status:** RESOLVED

---

## Resumen Ejecutivo

Produccion completamente caida con error 500 en todas las rutas. El middleware de Next.js no podia inicializar el cliente de Supabase porque las variables de entorno estaban encriptadas en Vercel. Edge Runtime no puede acceder a variables encriptadas. Solucion: configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como Plaintext en Vercel.

---

## Contexto

### Estado del Sistema
- **Aplicacion:** FocusOnIt Task Manager
- **Framework:** Next.js 14 con App Router
- **Backend:** Supabase (self-hosted en api.ycm360.com)
- **Hosting:** Vercel
- **Ambiente:** Produccion (focusonit.ycm360.com)

### Que Estabamos Haciendo
Deployment inicial a produccion en Vercel despues de desarrollo local exitoso. Configuramos todas las variables de entorno en Vercel Dashboard siguiendo best practices de seguridad (marcando variables sensibles como "Sensitive/Encrypted").

---

## El Problema

### Sintomas

1. **Error 500 en Todas las Rutas:**
   - Todas las paginas mostraban "500 Internal Server Error"
   - Landing page: 500 error
   - Login page: 500 error
   - Dashboard: 500 error (esperado por auth, pero no deberia ser 500)

2. **Error Especifico en Vercel Function Logs:**
   ```
   Error: Your project's URL and Key are required to create a Supabase client!
   ```

3. **Middleware Fallback Activado:**
   - Console warning: "Supabase env vars not available in middleware - skipping auth check"
   - Autenticacion completamente bypaseada (security issue)

4. **Server Component Error (Downstream):**
   - Generic error message in production
   - Error details omitted for security
   - Likely caused by middleware failure propagating

### Como lo Detectamos
- Usuario reporto que produccion no cargaba
- Verificamos Vercel Deployment logs
- Revisamos Vercel Function Logs
- Identificamos error en middleware

### Comportamiento Esperado
- Middleware debe inicializar cliente Supabase
- Rutas protegidas deben verificar autenticacion
- Rutas publicas deben cargar normalmente
- Errores de autenticacion deben redirigir a /login (no 500)

### Comportamiento Real
- Middleware no podia acceder a `process.env.NEXT_PUBLIC_SUPABASE_URL`
- Middleware no podia acceder a `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Variables retornaban `undefined` en Edge Runtime
- Fallback temporal permitia bypass de autenticacion
- 500 errors en todas las rutas

---

## Causa Raiz

### Analisis Tecnico

**El problema fundamental:**
Vercel encripta variables marcadas como "Sensitive" o "Secret". Edge Runtime (donde Next.js middleware ejecuta) **no puede desencriptar** estas variables.

**Por que paso:**

1. **Edge Runtime es un entorno restringido:**
   ```
   Edge Runtime (Lightweight)          Node.js Runtime (Full)
   ├── No Node.js APIs                 ├── Full Node.js APIs
   ├── No crypto module                ├── Crypto module available
   ├── No fs module                    ├── File system access
   ├── No encrypted env vars ❌        ├── Encrypted env vars ✅
   └── Fast cold starts                └── Slower cold starts
   ```

2. **Variables con `NEXT_PUBLIC_` prefix NO garantizan acceso:**
   - `NEXT_PUBLIC_*` significa "exponer al browser bundle"
   - NO significa "disponible en Edge Runtime si esta encriptada"
   - Si la variable esta encriptada en Vercel, Edge Runtime no puede acceder

3. **Middleware ejecuta en Edge Runtime por defecto:**
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
     // Este codigo corre en Edge Runtime
     // No tiene acceso a variables encriptadas
   }
   ```

4. **Nuestro middleware intentaba crear Supabase client:**
   ```typescript
   // lib/supabase/middleware.ts
   const supabase = createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,      // ❌ undefined
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ❌ undefined
   )
   ```

5. **Createserverclient lanzaba error cuando recibia undefined:**
   ```
   Error: Your project's URL and Key are required to create a Supabase client!
   ```

### Por Que No Fue Detectado en Local
- Desarrollo local usa `.env.local` (plaintext siempre)
- `npm run dev` y `npm run build && npm run start` funcionaban perfectamente
- Variables siempre disponibles en local
- Edge Runtime constraints solo aplican en Vercel Edge Network

### Por Que No Fue Detectado en Build
- Build process ejecuta en Node.js runtime (no Edge)
- Build-time tiene acceso a todas las variables
- TypeScript compilation paso exitosamente
- Static analysis no detecta runtime environment issues

---

## La Solucion

### Solucion Implementada

**1. Reconfigurar Variables en Vercel Dashboard:**

Para cada variable que usa middleware (Edge Runtime):

**ANTES:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://api.ycm360.com
Type: Sensitive ❌ (Encrypted)
```

**DESPUES:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://api.ycm360.com
Type: Plaintext ✅
```

**Pasos:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Encontrar `NEXT_PUBLIC_SUPABASE_URL`
3. Menu (⋮) → Delete
4. Add New → Environment Variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://api.ycm360.com`
   - Type: **Plaintext** (NO "Sensitive")
   - Environments: Production, Preview, Development (all)
5. Repetir para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**2. Actualizar Middleware para Fail Fast:**

Eliminar fallback que bypaseaba autenticacion:

```typescript
// ANTES (Inseguro)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Skipping auth check')
  return supabaseResponse  // ❌ Allows unauthenticated access
}

// DESPUES (Seguro)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase env vars not available')
  console.error('Solution: Configure as PLAINTEXT in Vercel')
  return new Response('Server configuration error', { status: 500 })
}
```

**Por que esto es mejor:**
- Falla explicitamente si hay misconfiguracion
- No bypasea autenticacion silenciosamente
- Da mensaje claro al developer sobre como arreglar
- Previene security issues

**3. Redeploy:**
```bash
Vercel Dashboard → Deployments → Latest → Redeploy
```

---

## Archivos Modificados

### lib/supabase/middleware.ts
```typescript
// Lines 9-24
// Added: Explicit error handling with helpful message
// Removed: Silent fallback that bypassed auth
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase env vars not available in Edge Runtime')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Solution: Configure these variables as PLAINTEXT (not encrypted) in Vercel')
  console.error('See: docs/deployment/VERCEL_ENV_VARS.md')
  return new Response(
    'Server configuration error. Please check environment variables.',
    { status: 500 }
  )
}
```

### docs/deployment/VERCEL_ENV_VARS.md
- Nuevo documento completo con guia paso a paso
- Explica Edge Runtime constraints
- Tabla de que variables deben ser plaintext vs encrypted
- Troubleshooting guide
- Prevention checklist

---

## Verificacion de la Solucion

### Tests Realizados

1. **Deploy Successful:**
   - Build exitoso
   - No errores en build logs

2. **Middleware Functional:**
   - No 500 errors en ninguna ruta
   - Vercel Function Logs sin errores
   - Middleware logs muestran inicializacion correcta de Supabase

3. **Authentication Working:**
   - Login flow funciona end-to-end
   - Signup flow funciona end-to-end
   - Protected routes redirigen a /login cuando no autenticado
   - Authenticated users acceden a dashboard correctamente

4. **Edge Cases:**
   - /login redirige a /today si ya autenticado ✅
   - /signup redirige a /today si ya autenticado ✅
   - Direct access a /today sin auth redirige a /login ✅
   - Real-time sync funciona correctamente ✅

---

## Prevencion Futura

### Checklist de Deployment a Vercel

Antes de cada deploy, verificar:

1. **Environment Variables Configuration:**
   - [ ] Identificar que codigo corre en Edge Runtime (middleware, edge API routes)
   - [ ] Listar variables que ese codigo necesita
   - [ ] Configurar esas variables como **Plaintext** en Vercel
   - [ ] Configurar variables server-side (service role keys) como **Encrypted**

2. **Testing:**
   - [ ] Build local exitoso: `npm run build`
   - [ ] Run production build localmente: `npm run start`
   - [ ] Test todas las rutas criticas
   - [ ] Test middleware authentication

3. **Documentation:**
   - [ ] Documentar que variables necesita cada runtime
   - [ ] Actualizar README.md con deployment notes
   - [ ] Crear runbook para deployment

### Tabla de Variables por Runtime

| Runtime | Variables Necesarias | Tipo en Vercel |
|---------|---------------------|----------------|
| **Edge (Middleware)** | NEXT_PUBLIC_SUPABASE_URL<br>NEXT_PUBLIC_SUPABASE_ANON_KEY<br>NEXT_PUBLIC_APP_URL | **Plaintext** |
| **Node.js (Server)** | SUPABASE_SERVICE_ROLE_KEY<br>GOOGLE_CLIENT_SECRET<br>NEXTAUTH_SECRET | **Encrypted** |
| **Build Time** | SENTRY_AUTH_TOKEN<br>SENTRY_ORG<br>SENTRY_PROJECT | **Encrypted** |
| **Client (Browser)** | NEXT_PUBLIC_*<br>(automatically included) | **Plaintext** |

### Monitoring

1. **Vercel Function Logs:**
   - Monitor for "env vars not available" errors
   - Set up alerts for 500 errors in middleware

2. **Sentry:**
   - Track middleware errors
   - Alert on auth bypass attempts

3. **Synthetic Monitoring:**
   - Automated tests every 5 minutes
   - Check login flow, protected routes

---

## Aprendizajes Clave

### Technical Insights

1. **Edge Runtime != Node.js Runtime**
   - Edge has stricter constraints
   - Cannot access encrypted environment variables
   - Cannot use Node.js-specific APIs
   - Designed for speed and global distribution

2. **NEXT_PUBLIC_ Prefix Behavior**
   - Makes variables accessible to browser bundle
   - Does NOT guarantee Edge Runtime access if encrypted
   - Still subject to Vercel encryption policies

3. **Middleware Authentication Requirements**
   - Must have access to auth credentials (Supabase keys)
   - Runs on every request (must be fast)
   - Cannot rely on encrypted variables in Vercel

4. **Security vs Availability Tradeoff**
   - `NEXT_PUBLIC_` variables are already exposed to browser
   - No additional security risk from making them plaintext in Vercel
   - Service role keys MUST remain encrypted (different story)

5. **Fail Fast Philosophy**
   - Silent fallbacks hide critical configuration issues
   - Better to fail explicitly with helpful error message
   - Prevents security issues from silent auth bypasses

### Process Improvements

1. **Pre-Deployment Verification:**
   - Test production build locally before deploying
   - Verify environment variables in deployment target
   - Review Vercel/deployment platform constraints

2. **Documentation:**
   - Document runtime requirements for each feature
   - Create deployment runbooks
   - Keep environment variable reference updated

3. **Monitoring:**
   - Set up alerts for middleware failures
   - Monitor 500 error rates
   - Track authentication bypass attempts

---

## Recursos Relacionados

### Documentation
- [docs/deployment/VERCEL_ENV_VARS.md](../../docs/deployment/VERCEL_ENV_VARS.md) - Complete guide
- [Vercel Edge Runtime Docs](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Related Issues
- Vercel GitHub: [Edge Runtime Environment Variables](https://github.com/vercel/next.js/discussions/46722)
- Supabase GitHub: [SSR with Middleware](https://github.com/supabase/auth-helpers/discussions/432)

### Team Knowledge
- lessons-learned/by-category/vercel.md (to be created)
- lessons-learned/by-category/nextjs.md (existing)

---

## Metadata

**Tags:** vercel, nextjs, edge-runtime, middleware, environment-variables, deployment, production-issue

**Related Lessons:**
- None yet (first Vercel Edge Runtime issue)

**Follow-up Actions:**
- [x] Fix middleware to fail fast
- [x] Document Edge Runtime constraints
- [x] Update deployment checklist
- [ ] Create automated test for middleware env var availability
- [ ] Add pre-deployment validation script
- [ ] Set up Vercel Function Logs monitoring/alerts

---

**Documented by:** DevOps Team
**Reviewed by:** Tech Lead
**Last Updated:** 2025-11-11
