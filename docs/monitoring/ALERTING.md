# Alerting Configuration - FocusOnIt Task Manager

**Fecha creacion:** 2025-11-15
**Estado:** Production Ready
**Prioridad:** P1 - HIGH

---

## TABLA DE CONTENIDOS

1. [Overview](#overview)
2. [Alert Levels](#alert-levels)
3. [Sentry Alerts](#sentry-alerts)
4. [Vercel Alerts](#vercel-alerts)
5. [Slack Integration](#slack-integration)
6. [Email Alerts](#email-alerts)
7. [Alert Response](#alert-response)

---

## OVERVIEW

### Alert Philosophy

**Principios:**
1. **Actionable:** Solo alertar si requiere accion inmediata
2. **No Spam:** Evitar alert fatigue (max 5 alerts por dia)
3. **Context:** Incluir suficiente info para debuggear
4. **Escalation:** Severidad apropiada (P0, P1, P2)

**Evitar:**
- ❌ Alertar por errores esperados (ej: usuario invalido)
- ❌ Alertar por metricas que no requieren accion
- ❌ Duplicar alerts (Sentry + Email + Slack del mismo issue)
- ❌ Alertar durante maintenance windows

---

## ALERT LEVELS

### P0 - CRITICAL (Immediate Action)

**Criterios:**
- App completamente caida (> 50% error rate)
- Data loss o corrupcion
- Security breach
- Auth completamente roto

**Response time:** < 15 minutos
**Notification:** Slack + Email + SMS (si configurado)
**Escalation:** Si no resuelto en 1 hora, escalar a Tech Lead

**Ejemplos:**
- "All API routes returning 500"
- "Database connection lost"
- "Auth service down - users cannot login"

### P1 - HIGH (Action Required)

**Criterios:**
- Feature critica rota (ej: no se pueden crear tareas)
- High error rate (> 10%)
- Performance degradation (LCP > 5s)
- Integration down (Google Calendar sync)

**Response time:** < 1 hora
**Notification:** Slack + Email
**Escalation:** Si no resuelto en 4 horas, escalar

**Ejemplos:**
- "Calendar sync failing for all users"
- "Task creation failing (50% error rate)"
- "Homepage LCP increased to 6s"

### P2 - MEDIUM (Monitor)

**Criterios:**
- Feature secundaria rota
- Moderate error rate (5-10%)
- Performance degradation leve (LCP 3-4s)
- Integration intermittent

**Response time:** < 4 horas
**Notification:** Email only
**Escalation:** Review in next standup

**Ejemplos:**
- "Export CSV failing for some users"
- "Weekly view loading slowly"
- "Occasional calendar sync errors"

### P3 - LOW (Fix Eventually)

**Criterios:**
- Edge case errors
- Low error rate (< 5%)
- Performance OK but could improve
- Non-critical features

**Response time:** < 1 semana
**Notification:** Dashboard only (no alerts)
**Escalation:** Add to backlog

**Ejemplos:**
- "Dark mode toggle animation glitchy on old Safari"
- "Task drag-drop occasionally laggy on mobile"

---

## SENTRY ALERTS

### Alert Rules Configuration

**Dashboard:** Sentry → Alerts → Create New Alert Rule

#### Rule 1: Critical Errors (P0)

```yaml
Name: "P0 - Critical Error Rate"
Trigger: Error rate > 10% in 5 minutes
Filter: environment:production AND level:error
Actions:
  - Send to Slack (#alerts)
  - Send email to oncall@focusonit.com
  - Create PagerDuty incident (si configurado)

Conditions:
  - Minimum events: 10 (evitar false positives)
  - Time window: 5 minutes
  - Comparison: Compared to 1 hour ago
```

**Crear en Sentry:**
1. Alerts → Create Alert Rule
2. **When:** "An event is captured"
3. **Conditions:**
   - Environment: production
   - Error rate: > 10%
   - Time window: 5 minutes
4. **Then:** Send notification to:
   - Slack: #alerts
   - Email: team@focusonit.com

#### Rule 2: New Error Types (P1)

```yaml
Name: "P1 - New Error Type"
Trigger: First occurrence of new error
Filter: environment:production AND is:unresolved
Actions:
  - Send to Slack (#errors)
  - Send email

Conditions:
  - First seen: Yes
  - Issue state: Unresolved
```

**Configuracion:**
- Alert on every new issue: YES
- Ignore during deploy: YES (30 minutos post-deploy)
- Alert frequency: Once per issue

#### Rule 3: High Frequency Errors (P1)

```yaml
Name: "P1 - High Frequency Error"
Trigger: Same error > 100 times in 1 hour
Filter: environment:production
Actions:
  - Send to Slack (#errors)
  - Send email

Conditions:
  - Event count: > 100
  - Time window: 1 hour
  - Same fingerprint: Yes
```

**Uso:**
- Detectar regression rapido
- Alertar si deploy introduce bug que afecta muchos usuarios

#### Rule 4: Performance Degradation (P2)

```yaml
Name: "P2 - Performance Degradation"
Trigger: p95 transaction duration > 3s
Filter: environment:production AND transaction:/api/*
Actions:
  - Send to Slack (#performance)

Conditions:
  - Percentile: p95
  - Duration: > 3000ms
  - Time window: 10 minutes
```

### Alert Filters

**Evitar noise - Ignorar estos errores:**

```javascript
// sentry.config.ts
ignoreErrors: [
  // User errors (expected)
  'Invalid login credentials',
  'User not found',
  'Task not found',

  // Network errors (client-side)
  'NetworkError',
  'Failed to fetch',
  'Network request failed',

  // Browser extensions
  'ResizeObserver loop',
  'atomicFindClose',
]
```

### User Impact Alerts

**Rule 5: Users Affected (P0)**

```yaml
Name: "P0 - Multiple Users Affected"
Trigger: Same error affects > 50 users in 10 minutes
Filter: environment:production
Actions:
  - Send to Slack (#alerts)
  - Email + SMS

Conditions:
  - Unique users: > 50
  - Time window: 10 minutes
```

**Configuracion:**
- Requires Sentry to track user IDs (via `Sentry.setUser()`)
- Only alerts if widespread impact

---

## VERCEL ALERTS

### Function Timeout Alerts

**Dashboard:** Vercel → Settings → Notifications

**Configuration:**

```yaml
Alert: Function Timeout
Trigger: Any function exceeds 10s (max timeout)
Notification: Email
Frequency: Immediately

Critical Functions:
  - /api/calendar/import (puede tardar con muchos eventos)
  - /api/calendar/sync
  - /api/voice-to-task (si usa AI processing)
```

**Action:**
1. Identificar funcion afectada
2. Revisar logs: Vercel → Logs → Filter by function
3. Optimizar query o paginar resultados
4. Aumentar timeout si necesario (Vercel Pro plan)

### Build Failure Alerts

**Configuration:**

```yaml
Alert: Build Failed
Trigger: Any production build fails
Notification: Email + Slack
Frequency: Immediately

Actions:
  - Auto-rollback: Enabled
  - Keep previous version live
  - Block deployment
```

**Response:**
1. Revisar build logs
2. Fix error localmente
3. Test: `npm run build`
4. Push fix
5. Verify deploy succeeds

### Domain Errors

**Configuration:**

```yaml
Alert: Domain Error
Trigger:
  - SSL certificate expiring (< 7 days)
  - DNS resolution failing
  - Domain misconfigured
Notification: Email
Frequency: Daily until resolved
```

**Response:**
1. Verify domain settings: Vercel → Domains
2. Check DNS records
3. Renew SSL if needed (auto-renewed by Vercel)

---

## SLACK INTEGRATION

### Setup Slack Workspace

**Prerequisitos:**
- Slack workspace existente
- Admin access

**Pasos:**

1. **Crear canales:**
   ```
   #alerts - P0 critical alerts
   #errors - P1/P2 errors
   #performance - Performance issues
   #deploys - Deployment notifications
   ```

2. **Crear Slack App:**
   - https://api.slack.com/apps → Create New App
   - Name: "FocusOnIt Alerts"
   - Workspace: Your workspace

3. **Configure Incoming Webhooks:**
   - Features → Incoming Webhooks → ON
   - Add New Webhook to Workspace
   - Select channel: #alerts
   - Copy webhook URL

4. **Guardar Webhook URL:**
   ```bash
   # .env.local (NO commitear)
   SLACK_WEBHOOK_ALERTS=https://hooks.slack.com/services/T00/B00/xxx
   SLACK_WEBHOOK_ERRORS=https://hooks.slack.com/services/T00/B00/yyy
   SLACK_WEBHOOK_PERFORMANCE=https://hooks.slack.com/services/T00/B00/zzz
   ```

### Integrar Sentry con Slack

**Dashboard:** Sentry → Settings → Integrations → Slack

1. Click **"Add Installation"**
2. Authorize Slack workspace
3. Configure notifications:
   - Channel: #errors
   - Alert rules: Select rules creados anteriormente
   - Format: Detailed

**Test:**
1. Trigger error de prueba: `/api/test-sentry`
2. Verificar mensaje en #errors

**Mensaje esperado:**
```
🚨 [PRODUCTION] New Error: Sentry Test Error

Environment: production
Level: error
First seen: 2025-11-15 10:30:00
Count: 1
Users affected: 0

View in Sentry: [Link]
```

### Custom Slack Notifications

**Ejemplo: Alertar en deploys**

```typescript
// lib/slack.ts
export async function sendSlackNotification(
  webhook: string,
  message: string,
  severity: 'info' | 'warning' | 'error'
) {
  const colors = {
    info: '#36a64f',    // Green
    warning: '#ff9900', // Orange
    error: '#ff0000',   // Red
  };

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color: colors[severity],
          text: message,
          footer: 'FocusOnIt Task Manager',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }),
  });
}

// Uso en API route
await sendSlackNotification(
  process.env.SLACK_WEBHOOK_DEPLOYS!,
  '✅ Deployment successful: v1.2.3',
  'info'
);
```

---

## EMAIL ALERTS

### Configurar Email Notifications

#### Sentry Email Alerts

**Dashboard:** Sentry → Settings → Notifications

1. **Personal Notifications:**
   - My Projects → task-manager-prod
   - Alert Settings: Custom
   - Enable:
     - New issues: YES
     - Issue reopened: YES
     - Issue assigned to me: YES
     - Weekly reports: YES

2. **Team Notifications:**
   - Team Settings → Notifications
   - Add team members
   - Configure per-member preferences

#### Vercel Email Alerts

**Dashboard:** Vercel → Settings → Notifications

Enable:
- Build failed: YES
- Deployment failed: YES
- Domain errors: YES
- Function timeouts: YES (Pro plan)

**Email frequency:**
- Immediate: Critical alerts
- Daily digest: Performance issues
- Weekly report: Analytics summary

### Email Templates

**Critical Error:**
```
Subject: 🚨 [P0] Critical Error in Production

Environment: production
Error Rate: 25% (500 errors in 5 minutes)
Users Affected: 150+

Top Error:
  TypeError: Cannot read property 'id' of undefined
  File: app/api/tasks/route.ts:45

Actions Required:
  1. Rollback to previous version
  2. Investigate root cause
  3. Deploy fix

Dashboard: [Link to Sentry]
Logs: [Link to Vercel Logs]
```

**Performance Degradation:**
```
Subject: ⚠️ [P2] Performance Degradation Detected

Metric: LCP (Largest Contentful Paint)
Current: 4.2s (was 2.1s yesterday)
Page: /dashboard
Users Affected: All

Possible Causes:
  - Recent deployment (v1.2.3)
  - Database query slow
  - Image optimization issue

Action: Review Speed Insights dashboard
Link: [Vercel Speed Insights]
```

---

## ALERT RESPONSE

### Response Workflow

#### P0 - Critical (< 15 minutos)

```
1. ACKNOWLEDGE (1 min)
   - Reply in Slack: "Investigating"
   - Assign to yourself in Sentry

2. ASSESS (3 min)
   - Check Vercel status: All services up?
   - Check Sentry: Error count increasing?
   - Check logs: What's failing?

3. MITIGATE (5 min)
   - Rollback: Vercel → Deployments → Previous → Redeploy
   - OR: Quick fix if obvious

4. COMMUNICATE (2 min)
   - Slack: "Rolled back to v1.2.2, investigating root cause"
   - Users: Status page update (si existe)

5. FIX (30 min)
   - Reproduce locally
   - Implement fix
   - Test thoroughly
   - Deploy

6. DOCUMENT (10 min)
   - Post-mortem: lessons-learned/by-date/YYYY-MM-DD-issue.md
   - Update runbook
```

#### P1 - High (< 1 hora)

```
1. ACKNOWLEDGE (5 min)
   - Assign issue in Sentry
   - Comment: "Working on it"

2. INVESTIGATE (20 min)
   - Reproduce issue
   - Check logs, metrics
   - Identify root cause

3. FIX (30 min)
   - Implement fix
   - Test locally
   - Deploy to staging
   - Deploy to production

4. VERIFY (10 min)
   - Monitor Sentry for new errors
   - Check metrics
   - Mark as resolved

5. DOCUMENT (optional)
   - If complex: Create lesson learned
```

### On-Call Rotation

**Setup:**
1. Define on-call schedule (ej: weekly rotation)
2. Document who is on-call: Notion/Confluence
3. Ensure on-call has access to:
   - Sentry
   - Vercel
   - Slack
   - Production environment variables

**On-Call Responsibilities:**
- Monitor #alerts channel
- Respond to P0 within 15 minutes
- Respond to P1 within 1 hour
- Escalate if cannot resolve in SLA

---

## BEST PRACTICES

### DO:
- ✅ Test alerts before going to production
- ✅ Document response procedures (runbooks)
- ✅ Review alerts weekly (too many? too few?)
- ✅ Update alert thresholds based on real data
- ✅ Acknowledge alerts quickly (even if not fixing yet)
- ✅ Post-mortem for all P0 incidents

### DON'T:
- ❌ Ignore alerts (leads to alert fatigue)
- ❌ Alert on everything (noise)
- ❌ Use same channel for all severities
- ❌ Forget to test alert rules
- ❌ Leave alerts unacknowledged
- ❌ Skip post-mortems

### Alert Hygiene

**Weekly Review:**
1. Count alerts last 7 days
2. False positives? → Adjust thresholds
3. Missed issues? → Add new alert rule
4. Too noisy? → Filter or combine

**Monthly Review:**
1. Review all alert rules
2. Disable unused rules
3. Update thresholds based on traffic growth
4. Review response times (meeting SLA?)

---

## TESTING ALERTS

### Test Sentry Alert

```bash
# Trigger test error
curl https://focusonit.ycm360.com/api/test-sentry

# Verificar:
# - Alert en Sentry dashboard
# - Notificacion en Slack (si configurado)
# - Email recibido
```

### Test Slack Webhook

```bash
# Test desde terminal
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Test alert from FocusOnIt",
    "attachments": [{
      "color": "#ff0000",
      "text": "This is a test alert"
    }]
  }'
```

### Test Email Alert

1. Sentry → Settings → Notifications → Send Test Email
2. Verificar recepcion
3. Verificar formato (no spam folder)

---

## REFERENCIAS

### Documentacion Oficial

- Sentry Alerts: https://docs.sentry.io/product/alerts/
- Vercel Notifications: https://vercel.com/docs/concepts/observability/notifications
- Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks

### Documentos Relacionados

- [SENTRY_SETUP.md](./SENTRY_SETUP.md) - Sentry configuration
- [VERCEL_ANALYTICS.md](./VERCEL_ANALYTICS.md) - Analytics setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debug guide

---

**Mantenido por:** Monitoring Specialist
**Ultima revision:** 15 de noviembre de 2025
**Feedback:** Crear issue o PR con mejoras
