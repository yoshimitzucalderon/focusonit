# Vercel Analytics Setup - FocusOnIt Task Manager

**Fecha creacion:** 2025-11-15
**Estado:** Production Ready
**Prioridad:** P0 - CRITICO

---

## TABLA DE CONTENIDOS

1. [Overview](#overview)
2. [Habilitar Vercel Analytics](#habilitar-vercel-analytics)
3. [Web Vitals Monitoring](#web-vitals-monitoring)
4. [Real User Monitoring (RUM)](#real-user-monitoring-rum)
5. [Configurar Alertas](#configurar-alertas)
6. [Dashboards](#dashboards)
7. [Interpretacion de Metricas](#interpretacion-de-metricas)

---

## OVERVIEW

### Que es Vercel Analytics

Vercel Analytics proporciona:

- **Web Vitals monitoring** (LCP, FID, CLS, TTFB)
- **Real User Monitoring** (RUM) - datos de usuarios reales, no sinteticos
- **Performance insights** por pagina
- **Traffic analytics** (pageviews, unique visitors)
- **Audience insights** (devices, browsers, locations)

### Por Que Vercel Analytics

**Beneficios:**
- Integrado nativamente con Next.js y Vercel
- Cero configuracion adicional (ya incluido en el proyecto)
- Datos en tiempo real
- Free tier generoso (100,000 events/mes)
- No afecta performance (lazy loading)

**Alternativas consideradas:**
- Google Analytics (mas complejo, privacy concerns)
- Plausible (self-hosted, mas trabajo)
- Mixpanel (mas caro, overkill para MVP)

---

## HABILITAR VERCEL ANALYTICS

### Paso 1: Verificar Instalacion

El paquete ya esta instalado en el proyecto:

```json
// package.json
{
  "dependencies": {
    "@vercel/speed-insights": "^1.2.0"
  }
}
```

### Paso 2: Verificar Integracion

El componente ya esta integrado en el layout:

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

**IMPORTANTE:** Si no ves `<SpeedInsights />` en tu layout, agregarlo.

### Paso 3: Habilitar en Vercel Dashboard

1. Ir a: https://vercel.com/[team]/focusonit/analytics
2. Click en **"Enable Analytics"**
3. Seleccionar plan **Free** (100,000 events/mes)
4. Confirmar

**Verificacion:**
- Deberia aparecer mensaje: "Analytics enabled successfully"
- Dashboard mostrara "Waiting for data..." (datos aparecen en ~10 minutos)

### Paso 4: Configurar Speed Insights

1. Ir a: https://vercel.com/[team]/focusonit/speed-insights
2. Click en **"Enable Speed Insights"**
3. Free tier incluye Web Vitals tracking

**Verificacion:**
- Navegar a tu app: https://focusonit.ycm360.com
- Abrir DevTools → Network tab
- Deberia haber requests a: `vitals.vercel-insights.com`

---

## WEB VITALS MONITORING

### Metricas Clave (Core Web Vitals)

#### 1. LCP (Largest Contentful Paint)
**Que mide:** Tiempo hasta que el elemento mas grande es visible

**Targets:**
- ✅ Good: < 2.5s
- ⚠️ Needs Improvement: 2.5s - 4s
- ❌ Poor: > 4s

**Como mejorar:**
- Optimizar imagenes (Next.js Image component)
- Preload critical assets
- Server-side rendering
- CDN para assets estaticos

#### 2. FID (First Input Delay)
**Que mide:** Tiempo desde primera interaccion hasta respuesta

**Targets:**
- ✅ Good: < 100ms
- ⚠️ Needs Improvement: 100ms - 300ms
- ❌ Poor: > 300ms

**Como mejorar:**
- Code splitting
- Reducir JavaScript bundle size
- Web Workers para heavy tasks
- Optimizar event handlers

#### 3. CLS (Cumulative Layout Shift)
**Que mide:** Estabilidad visual (cambios inesperados de layout)

**Targets:**
- ✅ Good: < 0.1
- ⚠️ Needs Improvement: 0.1 - 0.25
- ❌ Poor: > 0.25

**Como mejorar:**
- Reservar espacio para imagenes/ads
- Evitar insertar contenido dinamico arriba de contenido existente
- Usar font-display: optional
- Skeleton screens mientras carga

#### 4. TTFB (Time to First Byte)
**Que mide:** Tiempo hasta primer byte desde servidor

**Targets:**
- ✅ Good: < 800ms
- ⚠️ Needs Improvement: 800ms - 1800ms
- ❌ Poor: > 1800ms

**Como mejorar:**
- Optimizar backend queries
- Database indexing
- Caching (Redis, CDN)
- Edge functions

### Monitorear Web Vitals

**Dashboard:**
1. Vercel Dashboard → Speed Insights
2. Ver metricas por pagina:
   - `/` (landing)
   - `/dashboard` (main app)
   - `/week` (calendar view)

**Thresholds de Alerta:**
- LCP > 3s → Warning
- FID > 200ms → Warning
- CLS > 0.15 → Warning
- TTFB > 1.2s → Warning

**Reportes semanales:**
- Configurar email reports en Vercel Settings
- Revisar tendencias (mejorando/empeorando)

---

## REAL USER MONITORING (RUM)

### Que es RUM

RUM captura datos de usuarios reales (no tests sinteticos):
- Devices reales (mobile, desktop, tablet)
- Browsers reales (Chrome, Safari, Firefox)
- Networks reales (3G, 4G, WiFi, broadband)
- Locations reales (paises, regiones)

### Metricas RUM Disponibles

**Traffic:**
- Total pageviews
- Unique visitors
- Bounce rate
- Session duration

**Devices:**
- Desktop vs Mobile vs Tablet
- Screen resolutions
- Operating systems

**Browsers:**
- Chrome, Safari, Firefox, Edge
- Browser versions

**Geography:**
- Top countries
- Top cities
- Latency by region

### Uso de Datos RUM

**Optimizacion por Device:**
```typescript
// Ejemplo: Detectar mobile y optimizar
if (window.innerWidth < 768) {
  // Mobile: cargar menos datos inicialmente
  loadInitialTasks(10);
} else {
  // Desktop: cargar mas
  loadInitialTasks(50);
}
```

**Optimizacion por Region:**
- Si mayoria de usuarios en US: Optimizar para US timezone
- Si mayoria en Europe: Considerar GDPR compliance
- Si latency alto en LATAM: Considerar CDN regional

---

## CONFIGURAR ALERTAS

### Function Timeouts

**Dashboard:** Vercel → Functions → Settings

1. **Timeout Threshold:** 10s (default serverless timeout)
2. **Alert on:** Functions exceeding 8s (80% del limite)
3. **Notification:** Email + Slack (si configurado)

**Funciones criticas a monitorear:**
- `/api/calendar/sync` - Puede tardar con muchos eventos
- `/api/calendar/import` - Importacion masiva
- `/api/voice-to-task` - Procesamiento de audio

**Como reducir timeouts:**
- Paginar resultados
- Background jobs para operaciones largas
- Caching agresivo
- Database query optimization

### High Error Rates

**Dashboard:** Vercel → Logs → Filters

1. **Error Rate Threshold:** > 5% (5 errors de cada 100 requests)
2. **Alert on:** Sustained high error rate (5+ minutos)
3. **Notification:** Immediate email + Slack

**Errores a monitorear:**
- 500 Internal Server Error
- 503 Service Unavailable
- 429 Too Many Requests
- 401 Unauthorized (posible security issue)

### Build Failures

**Dashboard:** Vercel → Deployments → Settings

1. **Alert on:** Any build failure
2. **Notification:** Email + Slack
3. **Auto-rollback:** Enabled (si build falla, mantener version anterior)

---

## DASHBOARDS

### Dashboard Principal (Vercel Analytics)

**URL:** https://vercel.com/[team]/focusonit/analytics

**Metricas visibles:**
- Total visitors (ultimas 24h, 7d, 30d)
- Top pages
- Traffic sources
- Devices breakdown

**Uso:**
- Revisar diariamente: Detectar caidas de trafico
- Revisar semanalmente: Analizar tendencias
- Comparar periodos: Pre/post deployment

### Dashboard Speed Insights

**URL:** https://vercel.com/[team]/focusonit/speed-insights

**Metricas visibles:**
- Web Vitals score (0-100)
- Distribucion LCP, FID, CLS
- Performance by page
- Performance trends (mejorando/empeorando)

**Uso:**
- Revisar despues de cada deploy
- Comparar con version anterior
- Identificar paginas lentas

### Dashboard Logs

**URL:** https://vercel.com/[team]/focusonit/logs

**Filtros utiles:**
```
# Solo errores
status:500

# API especifica
route:/api/calendar/sync

# Rango de tiempo
timestamp:[2025-11-15 TO 2025-11-16]

# Usuario especifico (si logeas user_id)
user_id:abc123
```

**Uso:**
- Debugging produccion
- Analizar errores especificos
- Correlacionar errores con deploys

---

## INTERPRETACION DE METRICAS

### Ejemplo: Dashboard Web Vitals

```
Performance Score: 78/100

LCP: 2.8s (⚠️ Needs Improvement)
- 75th percentile: 3.2s
- 95th percentile: 4.1s

FID: 45ms (✅ Good)
- 75th percentile: 62ms
- 95th percentile: 98ms

CLS: 0.05 (✅ Good)
- 75th percentile: 0.08
- 95th percentile: 0.12
```

**Interpretacion:**
- **LCP es el problema:** 2.8s esta en zona amarilla
- **Priorizar optimizacion de LCP**
- **Posibles causas:**
  - Imagenes grandes sin optimizar
  - Fonts bloqueando render
  - Server response lento

**Proximos pasos:**
1. Identificar que elemento es el LCP (usar Lighthouse)
2. Optimizar ese elemento especificamente
3. Redeploy y medir nuevamente

### Ejemplo: Dashboard Traffic

```
Last 7 days:
- Visitors: 1,234
- Pageviews: 5,678
- Bounce rate: 32%

Top Pages:
1. /dashboard - 3,456 views (60%)
2. / - 1,234 views (22%)
3. /week - 988 views (18%)

Devices:
- Desktop: 65%
- Mobile: 30%
- Tablet: 5%
```

**Interpretacion:**
- **Dashboard es la pagina principal** (60% del trafico)
- **Optimizar desktop primero** (65% de usuarios)
- **Mobile es significativo** (30%) → No ignorar
- **Bounce rate 32% es aceptable** (< 40% es bueno para SaaS)

**Proximos pasos:**
1. Optimizar performance de `/dashboard` (mas impact)
2. Mejorar mobile experience (30% es mucho)
3. A/B test landing page (`/`) para reducir bounce

---

## BEST PRACTICES

### DO:
- ✅ Revisar dashboard diariamente (5 minutos)
- ✅ Comparar metricas antes/despues de deploys
- ✅ Configurar alerts para errores criticos
- ✅ Monitorear Web Vitals trends
- ✅ Usar datos RUM para priorizar optimizaciones
- ✅ Correlacionar Vercel Analytics con Sentry errors

### DON'T:
- ❌ Ignorar warnings de Web Vitals
- ❌ Obsesionarse con score 100/100 (78+ es suficiente)
- ❌ Optimizar sin medir primero (measure → optimize → measure)
- ❌ Comparar con sitios diferentes (cada app es unica)
- ❌ Olvidar mobile optimization (30%+ del trafico)

### Workflow Recomendado

**Pre-Deploy:**
1. Lighthouse audit local
2. Verificar bundle size (`npm run build`)
3. Test en mobile/desktop

**Post-Deploy:**
1. Esperar 1 hora (data sufficient)
2. Revisar Speed Insights
3. Comparar con deploy anterior
4. Verificar no regression en Web Vitals

**Semanal:**
1. Revisar Analytics (traffic trends)
2. Revisar Speed Insights (performance trends)
3. Identificar paginas lentas
4. Priorizar optimizaciones

---

## REFERENCIAS

### Documentacion Oficial

- Vercel Analytics: https://vercel.com/docs/analytics
- Speed Insights: https://vercel.com/docs/speed-insights
- Web Vitals: https://web.dev/vitals/
- Core Web Vitals: https://web.dev/articles/vitals

### Herramientas Utiles

- Lighthouse: https://developers.google.com/web/tools/lighthouse
- PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- Chrome DevTools Performance: Built-in browser tool

### Documentos Relacionados

- [SENTRY_SETUP.md](./SENTRY_SETUP.md) - Error tracking
- [LOGGING.md](./LOGGING.md) - Structured logging
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debug issues

---

## PROXIMOS PASOS

1. ✅ Habilitar Vercel Analytics
2. ✅ Habilitar Speed Insights
3. ✅ Configurar alertas
4. ✅ Revisar dashboard diariamente
5. ✅ Optimizar paginas lentas
6. ✅ Monitorear tendencias semanalmente

---

**Mantenido por:** Monitoring Specialist
**Ultima revision:** 15 de noviembre de 2025
**Feedback:** Crear issue o PR con mejoras
