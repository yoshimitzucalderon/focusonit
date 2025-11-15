# Troubleshooting Guide - Monitoring Issues

**Fecha creacion:** 2025-11-15
**Estado:** Production Ready
**Prioridad:** P1 - HIGH

---

## TABLA DE CONTENIDOS

1. [Sentry Issues](#sentry-issues)
2. [Vercel Analytics Issues](#vercel-analytics-issues)
3. [Logging Issues](#logging-issues)
4. [Alert Issues](#alert-issues)
5. [Performance Issues](#performance-issues)
6. [Common Error Patterns](#common-error-patterns)

---

## SENTRY ISSUES

### Issue: "Sentry not initialized"

**Sintomas:**
- Errores no aparecen en Sentry dashboard
- Console muestra: "Sentry not initialized"
- No hay eventos en Sentry

**Diagnostico:**

```bash
# 1. Verificar variables de entorno
echo $NEXT_PUBLIC_SENTRY_DSN
# Deberia mostrar: https://abc123@o123456.ingest.sentry.io/789012

# 2. Verificar configuracion
cat sentry.client.config.ts | grep dsn
# Deberia tener: dsn: process.env.NEXT_PUBLIC_SENTRY_DSN

# 3. Verificar que Sentry esta instalado
npm list @sentry/nextjs
# Deberia mostrar: @sentry/nextjs@10.25.0
```

**Soluciones:**

1. **Falta DSN:**
   ```bash
   # .env.local
   NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE
   ```

2. **DSN incorrecto:**
   - Verificar en Sentry dashboard → Settings → Client Keys
   - Copiar DSN exacto
   - Pegar en .env.local
   - Reiniciar servidor: `npm run dev`

3. **Sentry no instalado:**
   ```bash
   npm install @sentry/nextjs @sentry/webpack-plugin
   ```

4. **Configuracion no cargada:**
   - Verificar que existe `instrumentation.ts` en raiz
   - Verificar `next.config.js` tiene `instrumentationHook: true`
   - Reiniciar: `rm -rf .next && npm run dev`

---

### Issue: "Source maps not working"

**Sintomas:**
- Stack traces muestran codigo minificado
- Nombres de archivo como `_app-abc123.js` en lugar de `TaskList.tsx`
- Numeros de linea incorrectos

**Diagnostico:**

```bash
# 1. Verificar auth token configurado
echo $SENTRY_AUTH_TOKEN
# Deberia mostrar: sntrys_abc123...

# 2. Verificar build logs
npm run build | grep -i sentry
# Deberia mostrar: "Uploading source maps to Sentry"

# 3. Verificar en Sentry
# Dashboard → Settings → Releases
# Deberia haber release con source maps
```

**Soluciones:**

1. **Falta auth token:**
   ```bash
   # Crear token en Sentry: User Settings → Auth Tokens
   # Scopes: project:releases, project:write

   # Agregar a .env.local (desarrollo)
   SENTRY_AUTH_TOKEN=sntrys_abc123...

   # Agregar a Vercel (produccion)
   # Variables como "Sensitive" (encrypted)
   ```

2. **Source maps no se suben:**
   ```javascript
   // next.config.js - Verificar configuracion
   const sentryWebpackPluginOptions = {
     org: process.env.SENTRY_ORG,
     project: process.env.SENTRY_PROJECT,
     authToken: process.env.SENTRY_AUTH_TOKEN,

     // IMPORTANTE: Habilitar upload
     disableServerWebpackPlugin: false,
     disableClientWebpackPlugin: false,
   };
   ```

3. **Source maps mal configurados:**
   ```bash
   # Rebuild con source maps
   rm -rf .next
   SENTRY_AUTH_TOKEN=your_token npm run build

   # Verificar archivos .map creados
   ls .next/static/chunks/*.map
   ```

4. **Upload manual:**
   ```bash
   # Si automatico falla
   npx @sentry/wizard@latest --upload-source-maps
   ```

---

### Issue: "Too many events (rate limited)"

**Sintomas:**
- Sentry dashboard muestra: "Rate limit exceeded"
- Algunos errores no aparecen
- Email notification: "Quota approaching"

**Diagnostico:**

```bash
# Dashboard → Stats → Usage
# Ver consumo actual vs cuota
# Free tier: 5,000 errors/mes
```

**Soluciones:**

1. **Filtrar errores de bots:**
   ```typescript
   // sentry.client.config.ts
   beforeSend(event, hint) {
     const userAgent = event.request?.headers?.['user-agent'];
     if (userAgent && /bot|crawler|spider/i.test(userAgent)) {
       return null; // No enviar a Sentry
     }
     return event;
   }
   ```

2. **Ignorar errores conocidos:**
   ```typescript
   ignoreErrors: [
     'ResizeObserver loop',
     'Network request failed',
     'Invalid login credentials', // User error, no app bug
   ]
   ```

3. **Reducir sample rate:**
   ```typescript
   // Solo para performance (no errores)
   tracesSampleRate: 0.1, // 10% en vez de 100%
   ```

4. **Agrupar errores similares:**
   - Sentry → Issues → Merge issues
   - Agrupar variaciones del mismo error

5. **Upgrade a plan pago:**
   - Si 5,000/mes no es suficiente
   - Team plan: $26/mes → 50,000 events

---

### Issue: "User context not captured"

**Sintomas:**
- Errors en Sentry no muestran user ID
- No se puede ver "Users affected"
- Dificil correlacionar errores con usuarios

**Diagnostico:**

```typescript
// Verificar si user context esta configurado
// components/auth/AuthProvider.tsx (ejemplo)

useEffect(() => {
  if (user) {
    // Esto deberia existir
    logger.setUser(user.id, user.email);
  }
}, [user]);
```

**Soluciones:**

1. **Configurar user context en auth:**
   ```typescript
   // app/layout.tsx o AuthProvider
   import { logger } from '@/lib/logger';

   useEffect(() => {
     if (user) {
       logger.setUser(user.id, user.email, user.name);
     } else {
       logger.clearUser();
     }
   }, [user]);
   ```

2. **Verificar en Sentry:**
   - Dashboard → Issues → Error especifico
   - Tab "User" deberia mostrar ID y email

---

## VERCEL ANALYTICS ISSUES

### Issue: "No data in Analytics dashboard"

**Sintomas:**
- Vercel Analytics muestra "Waiting for data..."
- Pasaron mas de 24 horas sin datos
- SpeedInsights vacio

**Diagnostico:**

```typescript
// 1. Verificar componente instalado
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

<body>
  {children}
  <SpeedInsights /> {/* Deberia existir */}
</body>
```

**Soluciones:**

1. **SpeedInsights no agregado:**
   ```typescript
   // app/layout.tsx
   import { SpeedInsights } from '@vercel/speed-insights/next';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     );
   }
   ```

2. **Analytics no habilitado en Vercel:**
   - Dashboard → Project → Analytics → Enable
   - Dashboard → Project → Speed Insights → Enable
   - Redeploy proyecto

3. **CSP bloqueando requests:**
   ```javascript
   // next.config.js
   "connect-src 'self' ... https://va.vercel-scripts.com"
   ```

4. **Ad blocker bloqueando:**
   - Deshabilitar ad blocker
   - Probar en incognito
   - Probar en otro browser

---

### Issue: "Web Vitals not tracking"

**Sintomas:**
- Speed Insights muestra "No data"
- Web Vitals scores missing (LCP, FID, CLS)

**Diagnostico:**

```bash
# Browser DevTools → Network tab
# Filtrar por: vitals.vercel-insights.com
# Deberian haber requests POST
```

**Soluciones:**

1. **Verificar package instalado:**
   ```bash
   npm list @vercel/speed-insights
   # Deberia mostrar: @vercel/speed-insights@1.2.0

   # Si no existe:
   npm install @vercel/speed-insights
   ```

2. **Verificar deployment:**
   - Solo funciona en production/preview
   - NO funciona en localhost (development)
   - Deploy a Vercel para ver datos

3. **Esperar datos suficientes:**
   - Minimo 100 pageviews para Web Vitals
   - Esperar 24 horas despues de habilitar

---

## LOGGING ISSUES

### Issue: "Logger not working"

**Sintomas:**
- `logger.error()` no aparece en consola
- Logs no aparecen en Vercel logs
- Sentry no recibe logs

**Diagnostico:**

```typescript
// Test basico
import { logger } from '@/lib/logger';

logger.info('Test info');
logger.error('Test error', new Error('Test'));
logger.warn('Test warning');

// Verificar output en consola
```

**Soluciones:**

1. **Logger no importado:**
   ```typescript
   import { logger } from '@/lib/logger';

   // No usar console.log directamente
   logger.info('Task created', { taskId: '123' });
   ```

2. **Log level incorrecto:**
   ```typescript
   // En development: DEBUG y superior
   // En production: INFO y superior

   // Si no ves debug logs en production, es normal
   logger.debug('This wont show in prod');
   ```

3. **Sentry no inicializado:**
   - Verificar que `NEXT_PUBLIC_SENTRY_DSN` configurado
   - Reiniciar servidor
   - Ver seccion "Sentry not initialized" arriba

---

### Issue: "Logs missing in Vercel"

**Sintomas:**
- Logs aparecen localmente pero no en Vercel dashboard
- Vercel Logs muestra "No results"

**Diagnostico:**

```bash
# Vercel Logs → Filters
# Verificar:
# - Time range: Ultimas 24h
# - Environment: Production
# - No filters aplicados
```

**Soluciones:**

1. **Logs demasiado antiguos:**
   - Free tier: Solo 1 dia de logs
   - Pro tier: 30 dias
   - Ajustar time range

2. **Logs no estructurados:**
   ```typescript
   // ❌ NO hacer esto en produccion
   console.log('Error:', error);

   // ✅ Hacer esto
   logger.error('Failed to create task', error, {
     taskId: '123',
     userId: 'abc',
   });
   ```

3. **Logs filtrados:**
   - Limpiar todos los filtros en dashboard
   - Buscar: `*` (todo)

---

## ALERT ISSUES

### Issue: "No alerts received"

**Sintomas:**
- Error critico ocurrio pero no recibiste alert
- Slack/Email no llegaron
- Sentry muestra error pero no notification

**Diagnostico:**

```bash
# 1. Verificar alert rule existe
# Sentry → Alerts → Rules
# Deberia haber rules creados

# 2. Verificar rule esta enabled
# Click en rule → Status: Active

# 3. Verificar condiciones
# Error cumple condiciones del rule?
```

**Soluciones:**

1. **Alert rule no creado:**
   - Ver [ALERTING.md](./ALERTING.md)
   - Crear rules segun guia

2. **Alert rule disabled:**
   - Sentry → Alerts → Rule → Enable

3. **Error no cumple condiciones:**
   ```yaml
   # Ejemplo: Rule requiere > 10 eventos
   # Pero solo ocurrio 1 error
   # → No alerta

   # Solucion: Ajustar threshold
   Minimum events: 1 (en vez de 10)
   ```

4. **Slack webhook incorrecto:**
   ```bash
   # Test webhook
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text": "Test"}'

   # Deberia aparecer mensaje en Slack
   ```

5. **Email en spam:**
   - Revisar carpeta spam
   - Agregar sentry@sentry.io a contacts

---

### Issue: "Too many alerts (spam)"

**Sintomas:**
- 50+ alerts por dia
- Alert fatigue
- Ignorando alerts importantes

**Diagnostico:**

```bash
# Sentry → Issues
# Ver issues mas frecuentes
# Identificar noise
```

**Soluciones:**

1. **Filtrar errores esperados:**
   ```typescript
   // sentry.config.ts
   ignoreErrors: [
     'Invalid login credentials', // User error
     'Network request failed',    // Client network
   ]
   ```

2. **Agrupar alerts:**
   ```yaml
   # En vez de alertar por cada error
   # Alertar si > 10 errores en 5 minutos
   Alert frequency: Smart (Sentry agrupa similares)
   ```

3. **Reducir sensibilidad:**
   ```yaml
   # Antes: > 1 error
   # Despues: > 10 errores en 5 min
   Threshold: Adjust based on traffic
   ```

4. **Mute temporary issues:**
   - Sentry → Issue → Mute for 1 hour
   - Mientras trabajas en fix

---

## PERFORMANCE ISSUES

### Issue: "High LCP (Largest Contentful Paint)"

**Sintomas:**
- Vercel Speed Insights: LCP > 3s
- Pagina se siente lenta
- Users reportan slow loading

**Diagnostico:**

```bash
# 1. Lighthouse audit local
npm run build
npm start
# Browser → DevTools → Lighthouse → Analyze

# 2. Identificar elemento LCP
# Lighthouse → Diagnostics → Largest Contentful Paint element
```

**Soluciones:**

1. **Imagen grande sin optimizar:**
   ```typescript
   // ❌ NO
   <img src="/hero.png" />

   // ✅ SI
   import Image from 'next/image';
   <Image
     src="/hero.png"
     width={1200}
     height={600}
     priority // Preload
     alt="Hero"
   />
   ```

2. **Fonts bloqueando render:**
   ```typescript
   // next.config.js
   // Usar font-display: optional
   import { Inter } from 'next/font/google';

   const inter = Inter({
     subsets: ['latin'],
     display: 'optional', // No bloquea render
   });
   ```

3. **Server response lento:**
   - Optimizar database queries
   - Agregar indexes
   - Cachear resultados
   - Ver "High TTFB" abajo

4. **Heavy JavaScript:**
   - Code splitting
   - Dynamic imports
   - Lazy load non-critical components

---

### Issue: "High TTFB (Time to First Byte)"

**Sintomas:**
- Speed Insights: TTFB > 1s
- API routes lentos
- Database queries tardados

**Diagnostico:**

```typescript
// Agregar logging en API routes
export async function GET(request: Request) {
  const start = Date.now();

  const data = await supabase.from('tasks').select('*');

  const duration = Date.now() - start;
  logger.info('API /tasks', { duration });

  return Response.json(data);
}
```

**Soluciones:**

1. **Database query lento:**
   ```sql
   -- Agregar indexes
   CREATE INDEX idx_tasks_user_id ON tasks(user_id);
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);

   -- Verificar query plan
   EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = '...';
   ```

2. **No caching:**
   ```typescript
   // Cachear resultados
   export const revalidate = 60; // Revalidar cada 60s

   export async function GET() {
     const data = await supabase.from('tasks').select('*');
     return Response.json(data);
   }
   ```

3. **N+1 queries:**
   ```typescript
   // ❌ NO - N+1
   for (const task of tasks) {
     const user = await supabase
       .from('users')
       .select('*')
       .eq('id', task.user_id)
       .single();
   }

   // ✅ SI - 1 query
   const tasks = await supabase
     .from('tasks')
     .select('*, users(*)'); // Join
   ```

4. **Cold start (serverless):**
   - Mantener functions warm con cron
   - Considerar Edge Functions para critical paths

---

## COMMON ERROR PATTERNS

### Error: "Cannot read property 'id' of undefined"

**Contexto:**
```typescript
const task = tasks.find(t => t.id === taskId);
console.log(task.title); // Error: task is undefined
```

**Solucion:**
```typescript
const task = tasks.find(t => t.id === taskId);
if (!task) {
  logger.error('Task not found', undefined, { taskId });
  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
}
console.log(task.title); // Safe
```

---

### Error: "Hydration failed"

**Contexto:**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

**Causa:**
- Server renderiza una cosa
- Cliente renderiza otra
- React detecta mismatch

**Solucion:**

1. **Date/time rendering:**
   ```typescript
   // ❌ NO
   <p>{new Date().toString()}</p>
   // Server: "Fri Nov 15 2025 10:00:00 GMT-0800"
   // Client: "Fri Nov 15 2025 11:00:00 GMT-0700"

   // ✅ SI
   'use client';
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   if (!mounted) return null;
   return <p>{new Date().toString()}</p>;
   ```

2. **localStorage/sessionStorage:**
   ```typescript
   // ❌ NO - solo existe en client
   const theme = localStorage.getItem('theme');

   // ✅ SI
   const [theme, setTheme] = useState('light');
   useEffect(() => {
     setTheme(localStorage.getItem('theme') || 'light');
   }, []);
   ```

---

### Error: "Failed to fetch"

**Contexto:**
```
TypeError: Failed to fetch
  at fetch (internal)
```

**Causas:**
1. Network error (user offline)
2. CORS blocking
3. CSP blocking
4. API down

**Solucion:**

```typescript
try {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    logger.error('Network error', error, { offline: !navigator.onLine });
    toast.error('Network error. Check your connection.');
  } else {
    // Other error
    logger.error('API error', error);
    toast.error('Something went wrong.');
  }
}
```

---

## DEBUGGING WORKFLOW

### Step 1: Reproduce Locally

```bash
# 1. Verificar variables de entorno
cat .env.local

# 2. Reiniciar servidor
rm -rf .next
npm run dev

# 3. Reproducir error
# Open browser → Trigger action que falla

# 4. Verificar logs
# Console (F12) → Errores?
# Terminal → Errores?
```

### Step 2: Check Sentry

```bash
# Dashboard → Issues → Latest
# Ver:
# - Stack trace
# - Breadcrumbs (actions antes del error)
# - User context
# - Request data
```

### Step 3: Check Vercel Logs

```bash
# Dashboard → Logs
# Filtrar:
# - Time: Cuando ocurrio error
# - Status: 500
# - Path: /api/... (ruta especifica)
```

### Step 4: Check Database

```sql
-- Verificar datos
SELECT * FROM tasks WHERE id = 'problematic_task_id';

-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Verificar logs de Postgres (si tienes acceso)
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### Step 5: Fix and Deploy

```bash
# 1. Fix codigo
# 2. Test localmente
npm run build
npm start

# 3. Verify fix
# Reproducir issue → Deberia estar resuelto

# 4. Deploy
git add .
git commit -m "fix: [descripcion]"
git push

# 5. Monitor
# Sentry → Verificar error no se repite
# Vercel Logs → Verificar requests ok
```

---

## ESCALATION

### When to Escalate

**Escalar a Tech Lead si:**
- Cannot resolve P0 in 1 hora
- Cannot resolve P1 in 4 horas
- Requires infrastructure changes
- Requires database migration
- Affects multiple users
- Unsure of root cause

**Informacion a incluir:**
- Error description
- Steps to reproduce
- Sentry link
- Vercel logs link
- What you tried
- Current impact (users affected)

---

## REFERENCIAS

### Internal Docs

- [SENTRY_SETUP.md](./SENTRY_SETUP.md)
- [VERCEL_ANALYTICS.md](./VERCEL_ANALYTICS.md)
- [ALERTING.md](./ALERTING.md)
- [LOGGING.md](./LOGGING.md) (create if needed)

### External Resources

- Sentry Troubleshooting: https://docs.sentry.io/platforms/javascript/troubleshooting/
- Vercel Logs: https://vercel.com/docs/observability/logs-overview
- Next.js Debugging: https://nextjs.org/docs/advanced-features/debugging

---

**Mantenido por:** Monitoring Specialist
**Ultima revision:** 15 de noviembre de 2025
**Feedback:** Crear issue o PR con mejoras
