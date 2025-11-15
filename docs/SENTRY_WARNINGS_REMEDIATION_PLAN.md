# Sentry Warnings - Plan de Remediacion

**Fecha:** 2025-11-15
**Estado:** Deployment exitoso, warnings pendientes
**Prioridad:** Media (no bloqueante)

---

## Resumen Ejecutivo

Despues de resolver errores criticos de TypeScript en Sentry, quedan 4 warnings no bloqueantes. Este documento prioriza y planifica su resolucion.

---

## Warnings Identificados

### 1. React Hooks exhaustive-deps (2 instancias)

**Severidad:** Baja
**Impacto:** Posibles bugs de React hooks, re-renders innecesarios
**Prioridad:** Media

**Archivos afectados:**

```
./components/CalendarTaskBlock.tsx
87:6  Warning: React Hook useEffect has a missing dependency: 'task'.
      Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./components/TimeScheduleModal.tsx
100:6  Warning: React Hook useEffect has missing dependencies: 'handleSave' and 'onClose'.
       Either include them or remove the dependency array. If 'onClose' changes too often,
       find the parent component that defines it and wrap that definition in useCallback.
       react-hooks/exhaustive-deps
```

**Analisis:**

**CalendarTaskBlock.tsx (linea 87):**
- useEffect depende de 'task' pero no esta en dependency array
- Posible bug: efecto no se re-ejecuta cuando task cambia
- Solucion: agregar 'task' a deps o verificar si es intencional

**TimeScheduleModal.tsx (linea 100):**
- useEffect depende de 'handleSave' y 'onClose' pero no estan en deps
- Posible bug: efecto usa versiones stale de estas funciones
- Solucion: agregar a deps o wrap parent definitions con useCallback

**Plan de accion:**

1. Revisar CalendarTaskBlock.tsx linea 87:
```typescript
// Antes
useEffect(() => {
  // usa task pero no esta en deps
}, [otherDeps]) // ← falta 'task'

// Opcion 1: Agregar a deps
useEffect(() => {
  // usa task
}, [otherDeps, task]) // ✅

// Opcion 2: Si es intencional (solo ejecutar en mount)
useEffect(() => {
  // usa version inicial de task
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [otherDeps])
```

2. Revisar TimeScheduleModal.tsx linea 100:
```typescript
// Parent component - wrap callbacks con useCallback
const handleSave = useCallback(() => {
  // save logic
}, [/* deps */])

const onClose = useCallback(() => {
  // close logic
}, [/* deps */])

// Child component - agregar a deps
useEffect(() => {
  // usa handleSave y onClose
}, [deps, handleSave, onClose]) // ✅
```

**Timeline:** Sprint actual (baja urgencia)

---

### 2. Supabase realtime-js Usa Node.js APIs en Edge Runtime

**Severidad:** Media
**Impacto:** Warnings en build, no afecta funcionalidad
**Prioridad:** Baja

**Warning completo:**

```
./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
A Node.js API is used (process.versions at line: 35) which is not supported
in the Edge Runtime.

./node_modules/@supabase/supabase-js/dist/module/index.js
A Node.js API is used (process.version at line: 24) which is not supported
in the Edge Runtime.

Import trace:
./node_modules/@supabase/supabase-js/dist/module/index.js
./node_modules/@supabase/ssr/dist/module/createBrowserClient.js
./node_modules/@supabase/ssr/dist/module/index.js
./lib/supabase/middleware.ts
```

**Analisis:**

- Supabase realtime-js usa `process.versions` en websocket-factory
- Supabase supabase-js usa `process.version` en index
- Warnings aparecen porque middleware.ts importa Supabase en Edge Runtime
- **Funcionalidad NO afectada:** Supabase funciona correctamente

**Por que sucede:**

Next.js middleware corre en Edge Runtime (lightweight, no Node.js completo). Supabase detecta ambiente con `process.version`, pero Edge Runtime no lo soporta.

**Soluciones posibles:**

**Opcion 1: Ignorar (RECOMENDADO)**
- Warning es informativo, no critico
- Funcionalidad no afectada
- Supabase team aware del issue
- Esperan fix en futura version

**Opcion 2: Suprimir warning**
```javascript
// next.config.js
module.exports = {
  eslint: {
    ignoreDuringBuilds: true, // ❌ NO recomendado (oculta otros warnings)
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: false, // ❌ Puede romper otras librerias
      }
    }
    return config
  }
}
```

**Opcion 3: Mover Supabase fuera de middleware**
- Requiere refactor significativo
- No vale la pena solo por warning

**Recomendacion:** Ignorar warning, monitorear updates de Supabase

**Timeline:** No accion inmediata, revisar en Q1 2026

---

### 3. Sentry Recomienda global-error.js

**Severidad:** Media
**Impacto:** React render errors no reportados a Sentry
**Prioridad:** Media-Alta

**Warning completo:**

```
[@sentry/nextjs] It seems like you don't have a global error handler set up.
It is recommended that you add a 'global-error.js' file with Sentry
instrumentation so that React rendering errors are reported to Sentry.
Read more: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
```

**Analisis:**

Next.js 14 App Router requiere `app/global-error.js` para capturar errores de React rendering. Sin este archivo, errores de componentes no llegan a Sentry.

**Ejemplos de errores no capturados:**

- Component rendering exceptions
- Suspense boundary errors
- Error boundary exceptions

**Solucion:**

Crear `app/global-error.js`:

```typescript
// app/global-error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1>Algo salio mal</h1>
          <p>Lo sentimos, ocurrio un error inesperado.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error details (solo en desarrollo)</summary>
              <pre style={{
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '5px',
                overflow: 'auto',
                maxWidth: '600px'
              }}>
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
            <Link
              href="/"
              style={{
                padding: '10px 20px',
                background: '#666',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
```

**Beneficios:**

- Todos los errores de React llegan a Sentry
- UI amigable para usuarios
- Opcion de recovery (boton "Intentar de nuevo")
- Debug info en desarrollo

**Timeline:** Proximo sprint (alta prioridad para monitoring completo)

---

### 4. Sentry Recomienda Migrar a instrumentation Hook

**Severidad:** Baja
**Impacto:** Turbopack no soportara sentry.client.config.ts
**Prioridad:** Baja (futuro)

**Warning completo:**

```
[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your
`sentry.client.config.ts` file, or moving its content to `instrumentation-client.ts`.
When using Turbopack `sentry.client.config.ts` will no longer work.
Read more: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
```

**Analisis:**

- Next.js 15 introduce Turbopack como nuevo bundler
- Turbopack no carga `sentry.client.config.ts` automaticamente
- Migracion futura necesaria a `instrumentation-client.ts`
- **NO urgente:** seguimos usando Webpack (Next.js 14)

**Plan de migracion (futuro):**

**Paso 1: Crear instrumentation.ts (root)**
```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
```

**Paso 2: Crear instrumentation-client.ts**
```typescript
// instrumentation-client.ts
import * as Sentry from '@sentry/nextjs'

// Copiar contenido de sentry.client.config.ts aqui
Sentry.init({
  // ... configuracion
})
```

**Paso 3: Eliminar archivos antiguos**
- Eliminar sentry.client.config.ts
- Eliminar sentry.server.config.ts
- Eliminar sentry.edge.config.ts

**Paso 4: Habilitar instrumentation en next.config.js**
```javascript
// next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true, // ya esta habilitado
  },
}
```

**Recomendacion:** Esperar a Next.js 15 upgrade

**Timeline:** Q2 2026 (cuando migremos a Next.js 15)

---

## Plan de Accion Priorizado

### Sprint Actual (Noviembre 2025)

**Alta prioridad:**
- [ ] Crear `app/global-error.tsx` (1 hora)
- [ ] Test global error handler con error simulado (30 min)
- [ ] Verificar que errores llegan a Sentry dashboard (15 min)

**Media prioridad:**
- [ ] Fix React hooks exhaustive-deps en CalendarTaskBlock (30 min)
- [ ] Fix React hooks exhaustive-deps en TimeScheduleModal (30 min)
- [ ] Suprimir warning global-error.js agregando env var (5 min)

### Proximo Sprint (Diciembre 2025)

**Baja prioridad:**
- [ ] Documentar Supabase Edge Runtime warning (15 min)
- [ ] Verificar si Supabase lanzo fix para Node.js API usage

### Futuro (Q1-Q2 2026)

**Muy baja prioridad:**
- [ ] Revisar Next.js 15 release notes
- [ ] Planear migracion a Turbopack + instrumentation hook
- [ ] Test migracion en branch feature/turbopack

---

## Como Suprimir Warnings (Temporal)

Si necesitas suprimir warnings para logs mas limpios:

**Suprimir warning global-error.js:**
```bash
# .env.local o Vercel
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1
```

**Suprimir ESLint hooks warnings (NO recomendado):**
```javascript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

**Suprimir webpack warnings (NO recomendado):**
```javascript
// next.config.js
webpack: (config, { isServer }) => {
  config.ignoreWarnings = [
    /A Node.js API is used/,
  ]
  return config
}
```

---

## Comandos de Validacion

```bash
# Type-check (no warnings)
npm run type-check

# Build completo (muestra warnings)
npm run build

# Lint (muestra ESLint warnings)
npm run lint

# Build + validacion completa
npm run ci
```

---

## Recursos

### Documentacion Oficial

- [Sentry global-error.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router)
- [Next.js instrumentation hook](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
- [React hooks exhaustive-deps](https://react.dev/reference/react/useEffect#my-effect-runs-after-every-re-render)
- [Edge Runtime limitations](https://nextjs.org/docs/app/api-reference/edge)

### Issues Relacionados

- [Supabase Edge Runtime support](https://github.com/supabase/supabase-js/issues)
- [Sentry Turbopack migration](https://github.com/getsentry/sentry-javascript/issues)

---

**Ultima actualizacion:** 2025-11-15
**Proximo review:** 2025-12-01
