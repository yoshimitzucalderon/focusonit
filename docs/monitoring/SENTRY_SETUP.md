# Sentry Setup Guide - FocusOnIt Task Manager

**Fecha creacion:** 2025-11-15
**Estado:** Production Ready
**Prioridad:** P0 - CRITICO

---

## TABLA DE CONTENIDOS

1. [Overview](#overview)
2. [Crear Cuenta Sentry](#crear-cuenta-sentry)
3. [Configurar Proyecto](#configurar-proyecto)
4. [Variables de Entorno](#variables-de-entorno)
5. [Configuracion Local](#configuracion-local)
6. [Configuracion Vercel](#configuracion-vercel)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## OVERVIEW

### Que es Sentry

Sentry es una plataforma de error tracking y performance monitoring que nos permite:

- Detectar errores en produccion en tiempo real
- Capturar stack traces completos con source maps
- Monitorear performance (Web Vitals, API response times)
- Alertar automaticamente cuando ocurren errores criticos
- Agrupar errores similares para facilitar debugging
- Ver contexto completo (user, browser, request data)

### Por Que Sentry

**Beneficios:**
- Free tier generoso (5,000 errors/mes, 10,000 transactions/mes)
- Source maps support para debugging codigo minificado
- Integracion nativa con Next.js y Vercel
- Alertas via email, Slack, PagerDuty
- Release tracking para correlacionar errores con deploys
- Performance monitoring incluido

**Alternativas consideradas:**
- LogRocket (mas caro, enfoque en session replay)
- Datadog (overkill para MVP, mas caro)
- Custom logging (no tiene UI, dificil analizar)

---

## CREAR CUENTA SENTRY

### Paso 1: Registro

1. Ir a https://sentry.io/signup/
2. Opciones de registro:
   - **Recomendado:** Sign up with GitHub (linking automatico con repo)
   - Email/password tambien funciona
3. Seleccionar plan **Free** (suficiente para MVP)

### Paso 2: Crear Organizacion

1. Nombre de organizacion: `focusonit` o tu preferencia
2. Slug: `focusonit` (se usara en URLs)
3. Region: **US** o **EU** (segun tus usuarios)
   - US: Mas rapido para usuarios en Americas
   - EU: Cumple GDPR por defecto

### Paso 3: Crear Proyecto

1. Platform: **Next.js**
2. Project name: `task-manager-prod`
3. Alert frequency: **Alert me on every new issue**
4. GUARDAR el DSN que aparece (lo necesitaras despues)

**Formato del DSN:**
```
https://abc123def456@o123456.ingest.sentry.io/789012
```

**IMPORTANTE:**
- NO commitear el DSN al repositorio
- Guardarlo en .env.local y Vercel environment variables

---

## CONFIGURAR PROYECTO

### Team Settings

1. **Notifications:**
   - Email notifications: ON para errores criticos
   - Slack integration: Opcional (ver [ALERTING.md](./ALERTING.md))

2. **Data Scrubbing:**
   - Enable by default: ON
   - Scrub IP addresses: ON (privacidad)
   - Sensitive field names: password, token, secret, api_key, access_token

3. **Rate Limits:**
   - Free tier: 5,000 errors/mes
   - Alert when approaching limit: ON

### Performance Monitoring

1. **Transaction Sampling:**
   - Production: 10% (suficiente para detectar issues)
   - Development: 100% (debugging)
   - Staging: 50%

2. **Traces:**
   - Track Database Queries: ON
   - Track HTTP Requests: ON
   - Track API Routes: ON

### Source Maps

1. **Upload Source Maps:** ON (critico para debugging)
2. **Hide source code:** ON (no exponer codigo en Sentry dashboard)
3. **Auth Token:** Crear en User Settings → Auth Tokens

**Crear Auth Token:**
1. User Settings → Auth Tokens → Create New Token
2. Scopes: `project:releases`, `project:write`
3. COPIAR token (solo se muestra una vez)
4. Guardar en `SENTRY_AUTH_TOKEN`

---

## VARIABLES DE ENTORNO

### Variables Requeridas

**Configuracion minima:**

```bash
# Sentry DSN (public, safe to expose)
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789012

# Environment identifier
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production  # o development, staging

# Optional: Organization and Project (para source maps upload)
SENTRY_ORG=focusonit
SENTRY_PROJECT=task-manager-prod

# Optional: Auth token (solo para build, NO en runtime)
SENTRY_AUTH_TOKEN=sntrys_abc123def456...
```

**Configuracion avanzada:**

```bash
# Sample rates
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% en production
NEXT_PUBLIC_SENTRY_REPLAYS_SAMPLE_RATE=0.1  # Session replays

# Debug mode (SOLO development)
NEXT_PUBLIC_SENTRY_DEBUG=false  # true solo en dev

# Release tracking
NEXT_PUBLIC_SENTRY_RELEASE=${VERCEL_GIT_COMMIT_SHA}  # Auto en Vercel
```

### Donde Configurar

**Local (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**Vercel (Production):**
Ver seccion "Configuracion Vercel" abajo

**Vercel (Preview):**
```bash
NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging
```

---

## CONFIGURACION LOCAL

### Paso 1: Crear .env.local

```bash
# En task-manager/
cp .env.example .env.local

# Editar .env.local y agregar:
NEXT_PUBLIC_SENTRY_DSN=TU_DSN_AQUI
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_DEBUG=true
```

### Paso 2: Verificar Configuracion

Los archivos de configuracion ya estan creados:
- `sentry.client.config.ts` - Cliente (browser)
- `sentry.server.config.ts` - Servidor (API routes, SSR)
- `sentry.edge.config.ts` - Edge Runtime (middleware)
- `instrumentation.ts` - Hook de Next.js

**NO necesitas crearlos manualmente** - ya estan en el proyecto.

### Paso 3: Iniciar Servidor

```bash
npm run dev
```

**Verificar en consola:**
```
✓ Ready in 2.3s
○ Sentry initialized (development)
```

### Paso 4: Trigger Test Error

1. Navegar a: http://localhost:3000/api/test-sentry
2. Deberia retornar: `{"error":"Sentry test error triggered"}`
3. Ir a Sentry dashboard → Issues
4. Deberia aparecer error: "Sentry Test Error (API)"

**Si no aparece:**
- Verificar DSN en .env.local
- Verificar consola de browser (F12) por errores
- Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## CONFIGURACION VERCEL

### Paso 1: Agregar Environment Variables

1. Vercel Dashboard → Project → Settings → Environment Variables

2. **Production:**
   ```
   NEXT_PUBLIC_SENTRY_DSN = https://abc123@o123456.ingest.sentry.io/789012
   NEXT_PUBLIC_SENTRY_ENVIRONMENT = production
   NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = 0.1
   SENTRY_ORG = focusonit
   SENTRY_PROJECT = task-manager-prod
   SENTRY_AUTH_TOKEN = sntrys_abc123...
   ```

3. **Preview (opcional):**
   - Copiar todas las variables de Production
   - Cambiar `NEXT_PUBLIC_SENTRY_ENVIRONMENT = staging`
   - Cambiar `SENTRY_PROJECT = task-manager-staging` (si tienes proyecto separado)

4. **IMPORTANTE:**
   - `NEXT_PUBLIC_SENTRY_DSN`: **Plaintext** (Edge Runtime compatible)
   - `SENTRY_AUTH_TOKEN`: **Sensitive** (solo build time)
   - Todas las `NEXT_PUBLIC_*`: **Plaintext**

### Paso 2: Redeploy

```bash
git push origin main
```

O en Vercel Dashboard: Deployments → Latest → Redeploy

**Verificar deployment:**
1. Ir a https://focusonit.ycm360.com/api/test-sentry
2. Deberia aparecer error en Sentry dashboard (tagged como `production`)
3. Verificar que environment = production

### Paso 3: Configurar Alertas

Ver [ALERTING.md](./ALERTING.md) para configuracion completa de Slack, email, etc.

---

## TESTING

### Test 1: Client-Side Error

**Trigger:**
```javascript
// En browser console (F12)
throw new Error("Test client error");
```

**Verificar:**
- Sentry dashboard → Issues → Nuevo issue
- Tagged como `mechanism:generic`, `handled:no`
- Stack trace apunta a console

### Test 2: Server-Side Error

**Trigger:**
```bash
curl https://focusonit.ycm360.com/api/test-sentry
```

**Verificar:**
- Sentry dashboard → Issues → Nuevo issue
- Tagged como `transaction:/api/test-sentry`
- Environment = production

### Test 3: Performance Monitoring

**Verificar:**
1. Sentry → Performance → Transactions
2. Deberian aparecer:
   - Page loads (`/`, `/dashboard`, `/week`)
   - API calls (`/api/calendar/*`, `/api/voice-to-task`)
3. Metricas:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

### Test 4: User Context

**Crear tarea en app:**
1. Login como usuario
2. Crear tarea
3. Trigger error (ej: crear tarea con titulo muy largo)

**Verificar en Sentry:**
- User ID capturado
- Email capturado (si disponible)
- Request context (URL, headers)

### Test 5: Source Maps

**Verificar stack trace legible:**
1. Trigger error en produccion
2. Ir a Sentry → Issues → Error especifico
3. Stack trace deberia mostrar:
   - Nombres de archivo originales (no `_app-abc123.js`)
   - Numeros de linea correctos
   - Codigo fuente (si `hideSourceMaps = false`)

**Si no funciona:**
- Verificar `SENTRY_AUTH_TOKEN` configurado
- Verificar build logs: "Uploading source maps to Sentry"
- Ver troubleshooting seccion "Source Maps"

---

## TROUBLESHOOTING

### Issue: "Sentry not initialized"

**Sintomas:**
- Errores no aparecen en Sentry
- Consola muestra: "Sentry not initialized"

**Solucion:**
1. Verificar `NEXT_PUBLIC_SENTRY_DSN` configurado
2. Verificar formato DSN correcto (https://...)
3. Reiniciar servidor: `npm run dev`
4. Clear cache: `.next/` folder

```bash
rm -rf .next
npm run dev
```

### Issue: "Source maps not uploaded"

**Sintomas:**
- Stack traces muestran codigo minificado
- Archivos `_app-abc123.js` en lugar de nombres originales

**Solucion:**
1. Verificar `SENTRY_AUTH_TOKEN` configurado
2. Verificar permisos del token: `project:releases`, `project:write`
3. Verificar build logs:
   ```
   ✓ Sentry source maps uploaded successfully
   ```
4. Intentar upload manual:
   ```bash
   npx @sentry/wizard@latest --upload-source-maps
   ```

### Issue: "Too many events (rate limited)"

**Sintomas:**
- Sentry muestra: "Rate limit exceeded"
- Algunos errores no aparecen

**Solucion:**
1. Revisar que errores estan consumiendo cuota
2. Filtrar errores de bots/scrapers:
   ```typescript
   beforeSend(event, hint) {
     if (event.request?.headers?.['user-agent']?.includes('bot')) {
       return null; // Ignorar
     }
     return event;
   }
   ```
3. Aumentar sample rate solo para errores criticos
4. Considerar upgrade a plan pago

### Issue: "Environment variable not found in Edge Runtime"

**Sintomas:**
- Middleware falla con "process.env.X is undefined"
- Solo en produccion (Vercel)

**Solucion:**
1. Verificar que variables usan prefijo `NEXT_PUBLIC_`
2. Configurar como **Plaintext** en Vercel (no Encrypted)
3. Redeploy despues de cambiar variables

**Ver mas:**
- lessons-learned/by-date/2025-11-11-edge-runtime-environment-variables.md

### Issue: "CSP blocking Sentry requests"

**Sintomas:**
- Browser console: "Blocked by Content Security Policy"
- Errores no llegan a Sentry

**Solucion:**
1. Verificar CSP headers en `next.config.js`
2. Agregar dominios Sentry:
   ```javascript
   connect-src 'self' https://*.ingest.sentry.io
   ```
3. Redeploy

**Dominios Sentry requeridos:**
- `*.ingest.sentry.io` - Error reporting
- `browser.sentry-cdn.com` - SDK (si usas CDN)

---

## BEST PRACTICES

### DO:
- ✅ Configurar `beforeSend` para filtrar PII (passwords, tokens)
- ✅ Tag errores con contexto util (user_id, feature, component)
- ✅ Usar diferentes sample rates por environment
- ✅ Subir source maps en produccion
- ✅ Configurar alertas para errores criticos
- ✅ Revisar Sentry dashboard diariamente
- ✅ Resolver issues rapidamente (no dejar acumular)

### DON'T:
- ❌ Commitear DSN o Auth Token al repo
- ❌ Capturar TODO (filtrar noise)
- ❌ Ignorar warning de rate limit
- ❌ Exponer codigo fuente en Sentry (usar hideSourceMaps)
- ❌ Usar production DSN en development
- ❌ Olvidar configurar data scrubbing (PII)

### Sample Rates Recomendados

```typescript
// sentry.client.config.ts
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      // Error tracking: 100% (todos los errores)
      // Performance: Segun environment
      tracesSampleRate:
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === 'production' ? 0.1 :
        process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === 'staging' ? 0.5 :
        1.0, // development: 100%

      // Session replays (opcional, consume cuota)
      replaysSessionSampleRate: 0.1, // 10% de sesiones normales
      replaysOnErrorSampleRate: 1.0, // 100% de sesiones con error
    });
  }
}
```

---

## REFERENCIAS

### Documentacion Oficial

- Sentry Next.js Guide: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Source Maps Upload: https://docs.sentry.io/platforms/javascript/sourcemaps/
- Performance Monitoring: https://docs.sentry.io/product/performance/
- Alerting: https://docs.sentry.io/product/alerts/

### Documentos Relacionados

- [ALERTING.md](./ALERTING.md) - Configuracion de alertas
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debugging monitoring issues
- [LOGGING.md](./LOGGING.md) - Sistema de logging centralizado
- lessons-learned/by-date/2025-11-11-security-vulnerabilities-auth.md

### Dashboards Utiles

**Sentry:**
- Issues: https://sentry.io/organizations/focusonit/issues/
- Performance: https://sentry.io/organizations/focusonit/performance/
- Releases: https://sentry.io/organizations/focusonit/releases/

**Vercel:**
- Analytics: https://vercel.com/[team]/focusonit/analytics
- Logs: https://vercel.com/[team]/focusonit/logs

---

## PROXIMOS PASOS

Una vez Sentry este configurado:

1. ✅ Configurar alertas (ver [ALERTING.md](./ALERTING.md))
2. ✅ Implementar logger centralizado (ver [LOGGING.md](./LOGGING.md))
3. ✅ Habilitar Vercel Analytics
4. ✅ Configurar uptime monitoring (opcional)
5. ✅ Crear dashboard de metricas clave

---

**Mantenido por:** Monitoring Specialist
**Ultima revision:** 15 de noviembre de 2025
**Feedback:** Crear issue o PR con mejoras
