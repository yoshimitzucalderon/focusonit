# Lecciones Aprendidas: Security

Problemas y soluciones relacionados con seguridad de la aplicacion (autenticacion, autorizacion, vulnerabilities, CSP, CORS, etc).

## Descripcion de la Categoria

Esta categoria cubre lecciones aprendidas relacionadas con:

- **Autenticacion:** Login, sessions, OAuth, JWT, password security
- **Autorizacion:** Permisos, RBAC, ownership verification
- **API Security:** Auth checks, input validation, rate limiting
- **Web Security:** XSS, CSRF, CSP, security headers
- **Vulnerabilities:** CWE, CVSS, security audits, penetration testing
- **Data Protection:** Encryption, secrets management, PII handling
- **Compliance:** OWASP Top 10, security best practices

---

## Keywords Comunes

security, auth, authentication, authorization, vulnerability, cwe, cvss, xss, csrf, csp, cors, api-security, secrets, encryption, oauth, jwt, penetration-testing, security-audit

---

## Lecciones Documentadas

### Total: 2

### [P0 Security Vulnerabilities: Missing Authentication in API Endpoints](../by-date/2025-11-11-security-vulnerabilities-auth.md)

**Fecha:** 2025-11-11
**Severidad:** critica
**Keywords:** security, auth, authentication, api, vulnerability, supabase, p0, critical, voice-to-task

**Problema:** API endpoints de voice-to-task carecian completamente de autenticacion, permitiendo a cualquiera crear/editar/eliminar tareas de cualquier usuario (CVSS 9.1, CWE-306).

**Solucion:** Agregar verificacion de autenticacion (`supabase.auth.getUser()`) y ownership en todos los endpoints. Usar user_id de session autenticada, no del request body.

**Aprendizaje clave:** Auth debe ser el primer paso en cada endpoint, no "agregarlo despues". Never trust user input, especialmente user_id. Implementar auth checks en application layer + RLS en database layer.

---

### [CSP Headers Blocking Supabase Self-Hosted Connections](../by-date/2025-11-11-csp-supabase-blocking.md)

**Fecha:** 2025-11-11
**Severidad:** alta
**Keywords:** nextjs, security, csp, content-security-policy, supabase, self-hosted, headers, networking

**Problema:** Content Security Policy (CSP) bloqueaba todas las conexiones a Supabase self-hosted porque CSP solo permitia `*.supabase.co` pero nuestra instancia esta en `api.ycm360.com`.

**Solucion:** Actualizar CSP `connect-src` directive para incluir dominio self-hosted con protocolos especificos (`https://api.ycm360.com` y `wss://api.ycm360.com`).

**Aprendizaje clave:** CSP connect-src controla networking. Self-hosted Supabase requiere configuracion diferente a Cloud. WebSocket requiere `wss://` protocol. Siempre revisar browser console para errores CSP.

---

---

## Como Agregar una Leccion Aqui

Cuando documentes un problema relacionado con Security:

1. Crea el archivo completo en `../by-date/YYYY-MM-DD-titulo.md` usando el [TEMPLATE.md](../TEMPLATE.md)
2. Agrega una entrada aqui siguiendo este formato:

```markdown
### [Titulo del Problema](../by-date/YYYY-MM-DD-titulo.md)

**Fecha:** YYYY-MM-DD
**Severidad:** [critica/alta/media/baja]
**Keywords:** security, keyword2, keyword3

**Problema:** Breve descripcion del problema (1-2 lineas)

**Solucion:** Breve descripcion de la solucion (1-2 lineas)

**Aprendizaje clave:** Principal leccion aprendida (1 linea)

---
```

3. Actualiza el contador "Total" arriba
4. Ordena las lecciones por fecha (mas recientes primero)

---

## Problemas Comunes de Security

Basado en las lecciones aprendidas, estos son patrones comunes:

### Missing Authentication

**Sintoma:** API endpoints aceptan requests sin verificar identidad del usuario.

**Causa raiz:**
- "Agregar auth despues" nunca paso
- Confusion entre RLS y application-level auth
- Testing solo con usuario autenticado

**Solucion:**
```typescript
export async function POST(request: Request) {
  // ✅ SIEMPRE verificar auth primero
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Continuar con logica de negocio
}
```

**Prevencion:**
- [ ] Agregar auth check como primer paso en endpoint
- [ ] Test sin auth debe retornar 401
- [ ] Code review obligatorio para API routes
- [ ] Security checklist en PR template

### Missing Authorization (Ownership)

**Sintoma:** Usuario autenticado puede modificar recursos de otros usuarios.

**Causa raiz:**
- Verificar autenticacion pero no ownership
- Confiar en IDs del request body
- No validar que recurso pertenece al usuario

**Solucion:**
```typescript
export async function PUT(request: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resource_id } = await request.json()

  // ✅ Verificar ownership
  const { data: resource } = await supabase
    .from('resources')
    .select('user_id')
    .eq('id', resource_id)
    .single()

  if (!resource || resource.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceder con update
}
```

### CSP Misconfigurations

**Sintoma:** Browser bloquea requests legitimos con errores CSP.

**Causa raiz:**
- CSP copiado sin adaptar a configuracion especifica
- No incluir todos los dominios necesarios
- No especificar protocolos correctos

**Solucion:**
```javascript
// next.config.js
const ContentSecurityPolicy = `
  connect-src 'self'
    https://api.yourdomain.com    /* API REST */
    wss://api.yourdomain.com      /* WebSocket */
    *.analytics.com               /* Analytics */;
`.replace(/\s{2,}/g, ' ').trim()
```

**Prevencion:**
- [ ] Revisar browser console en testing
- [ ] Incluir protocolos especificos (https://, wss://)
- [ ] Documentar cada dominio en CSP
- [ ] Test con DevTools Network tab

---

## Security Checklist

### Para Nuevos API Endpoints

Antes de mergear nuevo API endpoint:

- [ ] Endpoint verifica autenticacion (`supabase.auth.getUser()`)
- [ ] Usa user_id de session, no de request body
- [ ] Verifica ownership si modifica recursos existentes
- [ ] Retorna 401 si no autenticado
- [ ] Retorna 403 si no autorizado (ownership)
- [ ] Input validation implementada
- [ ] Tiene tests que verifican auth requirements
- [ ] Tiene tests que verifican no puede modificar recursos de otros
- [ ] Documentado en docs/api/ con auth requirements
- [ ] Peer reviewed por security-conscious developer
- [ ] No usa service role key innecesariamente
- [ ] RLS policies configuradas en database

### Para Deployment a Produccion

- [ ] Security audit realizado (automated scan)
- [ ] Penetration testing basico completado
- [ ] No hay vulnerabilities P0/P1 sin resolver
- [ ] Environment variables de secrets en Encrypted
- [ ] CSP headers configurados correctamente
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configurados (X-Frame-Options, etc)
- [ ] Rate limiting implementado en endpoints criticos
- [ ] Logging de eventos de seguridad habilitado
- [ ] Incident response plan documentado

### Para Self-Hosted Services

- [ ] CSP incluye dominio self-hosted con protocolos
- [ ] CORS configurado correctamente
- [ ] SSL certificates validos
- [ ] Firewall rules configuradas
- [ ] Backup strategy implementada
- [ ] Monitoring y alerting configurado

---

## Recursos Utiles

### OWASP Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Top 10 web security risks
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) - API-specific risks
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) - Security best practices
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) - Testing methodology

### CWE/CVE References

- [CWE-306: Missing Authentication](https://cwe.mitre.org/data/definitions/306.html)
- [CWE-862: Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)
- [CWE-79: Cross-site Scripting (XSS)](https://cwe.mitre.org/data/definitions/79.html)
- [CWE-352: Cross-Site Request Forgery (CSRF)](https://cwe.mitre.org/data/definitions/352.html)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1) - Calculate severity scores

### Security Tools

- [Snyk](https://snyk.io/) - Automated security scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration testing tool
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Validate CSP headers
- [Security Headers](https://securityheaders.com/) - Scan security headers

### Framework-Specific

- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers) - Security headers
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security) - Row Level Security
- [Vercel Security](https://vercel.com/docs/security) - Platform security

### Internal Documentation

- [docs/security/API_SECURITY.md](../../docs/security/API_SECURITY.md) (futuro)
- [docs/security/DEPLOYMENT_CHECKLIST.md](../../docs/security/DEPLOYMENT_CHECKLIST.md) (futuro)
- [docs/deployments/2025-11-11-emergency-security-fixes.md](../../docs/deployments/2025-11-11-emergency-security-fixes.md)

---

## Patrones Exitosos

### Pattern 1: Auth-First Development

```typescript
// ✅ Template para nuevos endpoints
export async function POST(request: Request) {
  // 1. AUTH CHECK (siempre primero)
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. PARSE INPUT
  const body = await request.json()

  // 3. VALIDATE INPUT
  if (!body.title || body.title.length > 500) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // 4. BUSINESS LOGIC (usando user.id de session)
  const { data } = await supabase
    .from('resources')
    .insert({ user_id: user.id, ...body })

  return NextResponse.json({ data })
}
```

### Pattern 2: Ownership Verification

```typescript
// ✅ Verificar ownership antes de modificar
export async function PUT(request: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { id, updates } = await request.json()

  // Verificar ownership
  const { data: resource } = await supabase
    .from('resources')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!resource || resource.user_id !== user.id) {
    return forbidden()
  }

  // Update solo si ownership verificado
  await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Double-check

  return success()
}
```

### Pattern 3: Defense in Depth

```typescript
// Layer 1: API Auth Check
const { data: { user } } = await supabase.auth.getUser()
if (!user) return unauthorized()

// Layer 2: Ownership Verification
if (resource.user_id !== user.id) return forbidden()

// Layer 3: RLS Policy (in database)
CREATE POLICY "Users can only access own resources"
ON resources FOR ALL
USING (auth.uid() = user_id);

// Layer 4: Input Validation
if (!isValidInput(input)) return badRequest()
```

---

## Anti-Patrones a Evitar

### ❌ Anti-Pattern 1: "Security Later"

```typescript
// ❌ NO HACER
export async function POST(request: Request) {
  // TODO: Add auth later
  const { user_id, data } = await request.json()
  await db.insert({ user_id, data })
}
```

**Por que es malo:** "Later" nunca llega, va a produccion vulnerable.

**Hacer en su lugar:** Auth primero, logica despues.

### ❌ Anti-Pattern 2: Confiar en User Input

```typescript
// ❌ NO HACER
export async function POST(request: Request) {
  const { user_id, data } = await request.json()
  // Acepta user_id del request - atacante puede poner cualquier user_id
  await db.insert({ user_id, data })
}
```

**Por que es malo:** Permite impersonation attacks.

**Hacer en su lugar:** Extraer user_id de session autenticada.

### ❌ Anti-Pattern 3: Solo RLS, Sin Auth Check

```typescript
// ❌ NO HACER
export async function POST(request: Request) {
  const supabase = createServiceRoleClient() // Bypasea RLS!
  const { user_id, data } = await request.json()
  await supabase.from('table').insert({ user_id, data })
}
```

**Por que es malo:** Service role bypasea RLS completamente.

**Hacer en su lugar:** Auth check + usar anon key con RLS, o auth check + verificar ownership.

### ❌ Anti-Pattern 4: Wildcard CSP

```javascript
// ❌ NO HACER
const CSP = `connect-src *;` // Permite conexion a CUALQUIER dominio
```

**Por que es malo:** Elimina la proteccion de CSP completamente.

**Hacer en su lugar:** Especificar dominios exactos con protocolos.

---

## Security Incident Response

### Si detectas vulnerability en produccion

**Immediate Actions:**
1. Evaluar severidad (CVSS score)
2. Si es P0/P1: Considerar takedown temporal
3. Notificar a Tech Lead y Security Team
4. Documentar en incident log

**Investigation:**
1. Identificar scope (que endpoints/features afectados)
2. Revisar logs para evidencia de explotacion
3. Identificar data potencialmente comprometida
4. Documentar timeline

**Remediation:**
1. Desarrollar fix
2. Test exhaustivo del fix
3. Deploy a produccion (emergency deployment si P0)
4. Verificar que vulnerability esta resuelta
5. Monitorear por 24-48h

**Post-Incident:**
1. Crear lesson learned detallada
2. Notificar a usuarios si data fue comprometida
3. Implementar prevencion (tests, monitoring)
4. Update security checklist

---

## Glosario de Terminos

| Termino | Definicion |
|---------|-----------|
| **Authentication** | Verificar identidad del usuario ("quien eres?") |
| **Authorization** | Verificar permisos del usuario ("que puedes hacer?") |
| **CVSS** | Common Vulnerability Scoring System - Escala 0-10 para severidad |
| **CWE** | Common Weakness Enumeration - Catalogo de tipos de vulnerabilities |
| **CSP** | Content Security Policy - Header que controla que recursos puede cargar la pagina |
| **CORS** | Cross-Origin Resource Sharing - Controla requests entre dominios |
| **XSS** | Cross-Site Scripting - Inyeccion de scripts maliciosos |
| **CSRF** | Cross-Site Request Forgery - Forzar acciones no deseadas |
| **RLS** | Row Level Security - Politicas a nivel de fila en PostgreSQL |
| **JWT** | JSON Web Token - Token para autenticacion |
| **OAuth** | Open Authorization - Protocolo de autorizacion |
| **P0/P1/P2** | Prioridad (0=critica, 1=alta, 2=media) |

---

**Ultima actualizacion:** 2025-11-11
**Lecciones documentadas:** 2
**Proxima revision:** 2025-12-11
