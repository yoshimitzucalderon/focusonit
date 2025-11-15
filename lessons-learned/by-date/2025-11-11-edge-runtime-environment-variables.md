# Edge Runtime Cannot Access Encrypted Environment Variables

**Fecha:** 2025-11-11
**Keywords:** vercel, nextjs, edge-runtime, middleware, environment-variables, deployment, production-issue
**Categoria:** nextjs, vercel
**Severidad:** critica
**Tiempo de Resolucion:** 2 horas
**Impacto:** produccion
**Commit:** bb8d3b7

---

## Resumen Ejecutivo

Produccion completamente caida con 500 errors en todas las rutas. El middleware de autenticacion no podia acceder a variables de entorno porque estaban configuradas como "Encrypted" en Vercel. Edge Runtime no puede desencriptar variables - deben estar en Plaintext.

---

## Contexto

### Que estabamos haciendo

- Deployando fixes de seguridad criticos (P0 vulnerabilities)
- Primer deployment a produccion en Vercel
- Configurando variables de entorno en Vercel Dashboard
- Intentando proteger credenciales sensibles usando encriptacion

### Ambiente

- **Entorno:** produccion (focusonit.ycm360.com)
- **Version:** ba1c258 (security fixes)
- **Plataforma:** Vercel
- **Runtime:** Edge Runtime (middleware)
- **Framework:** Next.js 14 (App Router)

---

## El Problema

### Sintomas

Lista de sintomas observados:
- 500 Internal Server Error en todas las rutas de la aplicacion
- Login page no cargaba
- Dashboard no accesible
- Ninguna ruta funcionaba (todas pasaban por middleware)
- Error aparecia instantaneamente (no timeout)

### Como lo detectamos

- Deployment exitoso en Vercel
- Testing manual de https://focusonit.ycm360.com
- Error inmediato al intentar acceder a cualquier pagina
- Vercel Function Logs mostraban el error

```
Error: Supabase URL not configured
    at middleware (middleware.ts:15)
    at <anonymous> (edge-runtime)
TypeError: Cannot read property 'cookies' of undefined
```

### Investigacion Inicial

1. **Primera hipotesis:** Variables de entorno no configuradas en Vercel
   - Que probamos: Revisar Vercel Dashboard → Settings → Environment Variables
   - Resultado: Variables estaban configuradas correctamente
   - Conclusion: No era falta de configuracion

2. **Segunda hipotesis:** Nombres de variables incorrectos
   - Que probamos: Comparar nombres exactos con codigo
   - Resultado: Nombres coincidian exactamente
   - Conclusion: No era un typo

3. **Tercera hipotesis:** Variables no disponibles en runtime
   - Que probamos: Agregar console.log en middleware para verificar acceso
   - Resultado: `process.env.NEXT_PUBLIC_SUPABASE_URL` era `undefined`
   - Conclusion: Variables no estaban disponibles en runtime

4. **Diagnostico final:** Edge Runtime vs Node.js Runtime
   - Investigacion: Buscar en docs de Vercel sobre Edge Runtime constraints
   - Descubrimiento: **Edge Runtime no puede acceder a variables encriptadas**
   - Verificacion: Variables estaban configuradas como "Sensitive" (encrypted)
   - Causa raiz identificada

---

## Causa Raiz

### Explicacion Tecnica

El middleware de Next.js corre en **Vercel Edge Runtime** por defecto. Edge Runtime es un entorno JavaScript ligero diseñado para baja latencia global, pero tiene restricciones importantes:

**Edge Runtime Constraints:**
- No tiene acceso a Node.js APIs completas
- No puede desencriptar variables de entorno marcadas como "Sensitive"
- Solo puede acceder a variables configuradas como "Plaintext"

**Vercel Environment Variables:**

Vercel ofrece dos tipos de almacenamiento de variables:

1. **Plaintext:** Accesible en Edge Runtime, Node.js Runtime, Build Time
2. **Sensitive/Encrypted:** Solo accesible en Node.js Runtime y Build Time

```typescript
// middleware.ts - RUNS IN EDGE RUNTIME
export async function middleware(request: NextRequest) {
  // ❌ ENCRYPTED vars are undefined in Edge Runtime
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL // undefined!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // undefined!

  // This caused the crash
  const supabase = createServerClient(url, key, {...})
  // TypeError: Cannot create client with undefined URL
}
```

### Por que paso

**Razon 1: Configuracion conservadora de seguridad**
- Por seguridad, configuramos TODAS las variables como "Sensitive/Encrypted"
- Asumimos que encriptacion era mejor por defecto
- No consideramos las restricciones del Edge Runtime

**Razon 2: Prefijo NEXT_PUBLIC_ puede confundir**
- Variables con `NEXT_PUBLIC_` se exponen al browser (no son secretas)
- Pero aun asi pueden marcarse como "Encrypted" en Vercel
- La encriptacion impide acceso desde Edge Runtime

**Razon 3: Diferencia entre local y produccion**
- En desarrollo local, `.env.local` funciona sin restricciones
- En Vercel, hay restricciones adicionales segun el runtime
- El problema solo se manifiesta en produccion

### Por que no lo detectamos antes

**Falta de testing en ambiente de staging:**
- No habiamos deployado a Vercel antes
- Testing solo se habia hecho en ambiente local
- Vercel Preview deployments tienen el mismo problema pero no los usamos

**Documentacion de Vercel no es clara:**
- La diferencia entre "Sensitive" y "Plaintext" no esta bien explicada
- No hay warning al configurar NEXT_PUBLIC_ vars como Encrypted
- Edge Runtime constraints no son obvias en la UI

**Asuncion incorrecta sobre seguridad:**
- Asumimos que "Encrypted" era siempre mejor
- No consideramos que variables publicas (`NEXT_PUBLIC_`) no necesitan encriptacion
- No entendimos que Edge Runtime tiene acceso limitado

---

## La Solucion

### Enfoque de Solucion

1. Cambiar configuracion de variables en Vercel (Encrypted → Plaintext)
2. Agregar fallback en middleware para evitar crashes futuros
3. Documentar claramente que variables deben ser plaintext
4. Crear guia de deployment para evitar repetir el error

### Pasos Especificos

**Paso 1: Identificar variables que usa el middleware**
```typescript
// middleware.ts usa estas variables:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Paso 2: Cambiar tipo en Vercel Dashboard**
1. Ir a Vercel Dashboard → focusonit → Settings → Environment Variables
2. Buscar `NEXT_PUBLIC_SUPABASE_URL`
3. Click en los tres puntos → Edit
4. Cambiar de "Sensitive" a "Plaintext"
5. Repetir para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Save changes

**Paso 3: Redeploy para que tome efecto**
```bash
# Opcion 1: Redeploy desde UI
# Vercel Dashboard → Deployments → Latest → Redeploy

# Opcion 2: Redeploy desde CLI
vercel redeploy [deployment-url]
```

**Paso 4: Agregar fallback defensivo en middleware**

```typescript
// Prevenir crashes futuros si configuracion cambia
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback defensivo
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars in Edge Runtime')
    return new NextResponse(
      JSON.stringify({ error: 'Configuration error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  // Continuar con logica normal
  const supabase = createServerClient(supabaseUrl, supabaseKey, {...})
  // ...
}
```

### Codigo/Cambios

**Antes:**
```typescript
// middleware.ts - Sin proteccion
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // ❌ Undefined en produccion
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ❌ Undefined en produccion
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          // ...
        },
      },
    }
  )
  // ...
}
```

**Despues:**
```typescript
// middleware.ts - Con validacion defensiva
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ✅ Validacion antes de usar
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars not available in Edge Runtime')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are Plaintext in Vercel')

    return new NextResponse(
      JSON.stringify({
        error: 'Configuration error',
        details: 'Supabase credentials not available'
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' }
      }
    )
  }

  // ✅ Ahora seguro de que existen
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        // ...
      },
    },
  })
  // ...
}
```

**Explicacion del cambio:**
- Extrae variables a constantes antes de usar
- Valida que existan antes de crear cliente Supabase
- Retorna error claro con instrucciones si faltan
- Previene TypeError y proporciona debugging info

### Archivos Modificados

Lista de archivos que fueron modificados:

- `lib/supabase/middleware.ts` - Agregado fallback defensivo y validacion
- `middleware.ts` - Importa nueva version con validacion
- **Vercel Dashboard** - Variables cambiadas de Encrypted → Plaintext:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Configuracion Actualizada

**Vercel Environment Variables (Production, Preview, Development):**

```bash
# MUST BE PLAINTEXT (used in middleware = Edge Runtime)
NEXT_PUBLIC_SUPABASE_URL=https://api.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://focusonit.ycm360.com

# SHOULD BE ENCRYPTED (server-side only, used in API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

**Regla general:**
- Variables usadas en **middleware** → Plaintext
- Variables con **NEXT_PUBLIC_** → Plaintext (ya son publicas)
- Variables con **secretos/service keys** → Encrypted
- Variables solo para **API routes** → Encrypted

---

## Testing y Verificacion

### Como verificar que funciona

1. Deploy a produccion
2. Esperar que deployment complete (1-2 minutos)
3. Visitar https://focusonit.ycm360.com
4. Verificar que login page carga correctamente
5. Intentar login con usuario de prueba
6. Verificar que dashboard carga
7. Verificar que otras rutas funcionan

**Resultado esperado:**
- Login page carga sin errores
- Autenticacion funciona
- Dashboard muestra tareas
- No hay 500 errors en ninguna ruta

### Tests agregados

No se agregaron tests automatizados, pero se agregaron:

**Runtime checks en middleware:**
```typescript
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars not available in Edge Runtime')
  return new NextResponse(JSON.stringify({ error: 'Config error' }), {
    status: 500
  })
}
```

**Deployment checklist:**
- [ ] Verificar que NEXT_PUBLIC_ vars estan en Plaintext
- [ ] Verificar que service role keys estan Encrypted
- [ ] Test manual despues de deployment
- [ ] Revisar Vercel Function Logs

### Casos Edge Probados

- **Caso 1:** Variables no configuradas → Error 500 con mensaje claro
- **Caso 2:** Variables en Plaintext → Funciona correctamente
- **Caso 3:** Variables en Encrypted → Error 500 (problema original)
- **Caso 4:** Mix de Plaintext/Encrypted → Funciona si las de middleware son Plaintext

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [x] Agregar validacion en middleware (commit 47a6243)
- [x] Documentar en README.md cuales vars deben ser Plaintext
- [x] Crear leccion aprendida con detalles tecnicos
- [ ] Agregar test de smoke en CI que verifique deployment
- [ ] Crear script de verificacion de env vars
- [ ] Agregar alerta en Vercel si variables cambian de tipo

### Best Practices a Seguir

**Practica 1: Clasificar variables por runtime**
- Por que: Edge Runtime tiene restricciones diferentes a Node.js
- Como:
  - Middleware vars → Plaintext
  - API route vars → Puede ser Encrypted
  - Public vars (NEXT_PUBLIC_) → Plaintext

**Practica 2: Validar env vars en runtime**
- Por que: Detectar problemas de configuracion temprano
- Como:
  ```typescript
  if (!process.env.REQUIRED_VAR) {
    throw new Error('Missing REQUIRED_VAR')
  }
  ```

**Practica 3: Documentar requisitos de deployment**
- Por que: Evitar configuracion incorrecta en produccion
- Como: Crear checklist en README.md con instrucciones claras

**Practica 4: Testing en Preview environment**
- Por que: Detectar problemas antes de produccion
- Como: Siempre hacer preview deployment antes de production

### Anti-Patrones a Evitar

**Anti-patron 1: Marcar todas las variables como "Encrypted" por seguridad**
- Por que es malo: Edge Runtime no puede acceder a vars encriptadas
- Que hacer en su lugar: Solo encriptar secretos reales (service keys, client secrets)

**Anti-patron 2: Usar service role keys en middleware**
- Por que es malo:
  - Service role bypasea RLS (demasiado poderoso)
  - Si se filtra, acceso total a la base de datos
- Que hacer en su lugar: Usar anon key + RLS policies

**Anti-patron 3: Asumir que local y produccion se comportan igual**
- Por que es malo: Vercel tiene restricciones adicionales (Edge Runtime)
- Que hacer en su lugar: Siempre test en preview deployment antes de production

**Anti-patron 4: No validar env vars en runtime**
- Por que es malo: Crash con error confuso (TypeError)
- Que hacer en su lugar: Validar explicitamente y dar error claro

### Documentacion Actualizada

Links a documentacion que se creo/actualizo:

- [lessons-learned/by-category/nextjs.md](../by-category/nextjs.md) - Agregada seccion de Edge Runtime
- [lessons-learned/by-category/vercel.md](../by-category/vercel.md) - Documentado problema de env vars
- [README.md](../../README.md) - Agregada seccion de deployment warnings
- [docs/deployments/2025-11-11-emergency-security-fixes.md](../../docs/deployments/2025-11-11-emergency-security-fixes.md) - Change control document

---

## Aprendizajes Clave

1. **Edge Runtime ≠ Node.js Runtime**
   - Aplicacion practica: Siempre verificar en que runtime corre tu codigo. Middleware corre en Edge por defecto.

2. **Encrypted variables no son accesibles en Edge Runtime**
   - Aplicacion practica: Variables para middleware deben estar en Plaintext en Vercel, incluso si son NEXT_PUBLIC_.

3. **NEXT_PUBLIC_ no significa "debe ser encriptado"**
   - Aplicacion practica: Variables publicas (expuestas al browser) no necesitan encriptacion. Solo encriptar secretos verdaderos.

4. **Validar env vars en runtime previene crashes**
   - Aplicacion practica: Siempre validar que variables existen antes de usarlas, especialmente en middleware.

5. **Testing local no es suficiente para deployment**
   - Aplicacion practica: Usar Vercel Preview deployments para probar antes de produccion.

### Conocimiento Adquirido

- **Aprendi sobre:** Diferencias entre Edge Runtime y Node.js Runtime en Vercel
- **Ahora entiendo:** Por que algunas variables deben ser Plaintext y otras Encrypted
- **En el futuro:** Clasificare variables por runtime y validare acceso antes de usar

**Diferencia clave:**
```typescript
// Edge Runtime (middleware)
// ✅ Puede acceder: Plaintext vars
// ❌ No puede acceder: Encrypted vars, Node.js modules

// Node.js Runtime (API routes, Server Components)
// ✅ Puede acceder: Plaintext vars, Encrypted vars, Node.js modules
```

---

## Recursos Relacionados

### Documentacion Oficial

- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime) - Runtime constraints
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) - Types y access
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Runtime info

### Stack Overflow / GitHub Issues

- [Vercel Community: Edge Runtime env vars](https://github.com/orgs/vercel/discussions/3259) - Discusion sobre el problema
- [Next.js Discussions: Middleware environment variables](https://github.com/vercel/next.js/discussions/48110) - Problema similar

### Otras Lecciones Relacionadas

- [../by-category/nextjs.md](../by-category/nextjs.md) - Ver todas las lecciones de Next.js
- [../by-category/vercel.md](../by-category/vercel.md) - Ver todas las lecciones de Vercel

---

## Metricas de Impacto

- **Downtime:** ~45 minutos (desde deployment hasta fix)
- **Usuarios afectados:** 100% de usuarios (produccion completamente caida)
- **Deployments afectados:** 3 deployments (todos fallaron hasta identificar causa)
- **Tiempo de diagnostico:** ~1.5 horas
- **Tiempo de fix:** ~30 minutos (una vez identificado)

**Timeline:**
- 14:30 - Deploy a produccion (ba1c258)
- 14:32 - Primeros reportes de 500 errors
- 14:35 - Investigacion inicial (revisar Vercel logs)
- 15:15 - Hipotesis: problema con env vars
- 15:45 - Causa identificada: Edge Runtime + Encrypted vars
- 16:00 - Variables cambiadas a Plaintext
- 16:05 - Redeploy
- 16:10 - Produccion funcionando
- 16:15 - Verificacion completa

---

## Notas Adicionales

**Consideraciones de seguridad:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` no es un secreto real
- Esta protegida por RLS policies en Supabase
- Es seguro que este expuesta en el browser
- No requiere encriptacion en Vercel

**Por que anon key es segura en Plaintext:**
1. Esta disenada para uso publico (client-side)
2. No puede hacer operaciones privilegiadas
3. Todas las queries pasan por RLS
4. Solo puede hacer lo que un usuario autenticado puede hacer

**Cuando SI usar Encrypted:**
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasea RLS, acceso total
- `GOOGLE_CLIENT_SECRET` - Secreto de OAuth
- `NEXTAUTH_SECRET` - Secret para JWT signing
- Cualquier API key privada

---

## Autor y Metadata

**Quien lo resolvio:** Documentation Specialist + DevOps
**Fecha de creacion:** 2025-11-11
**Ultima actualizacion:** 2025-11-11
**Estado:** resuelto

---

## Checklist de Completitud

- [x] Titulo es descriptivo y claro
- [x] Keywords estan completos y relevantes
- [x] Metadata (fecha, categoria, severidad) esta llena
- [x] Resumen ejecutivo esta completo
- [x] Sintomas del problema estan bien descritos
- [x] Causa raiz esta claramente explicada
- [x] Solucion incluye codigo antes/despues
- [x] Medidas preventivas estan definidas
- [x] Aprendizajes clave estan documentados
- [x] Referencias y recursos estan incluidos
- [x] Agregado a index.md
- [x] Agregado referencia en by-category/nextjs.md
- [x] Agregado referencia en by-category/vercel.md
