# P0 Security Vulnerabilities: Missing Authentication in API Endpoints

**Fecha:** 2025-11-11
**Keywords:** security, auth, authentication, api, vulnerability, supabase, p0, critical, voice-to-task
**Categoria:** security, auth, supabase
**Severidad:** critica
**Tiempo de Resolucion:** 3 horas
**Impacto:** produccion (vulnerabilidad, no downtime)
**Commit:** ba1c258

---

## Resumen Ejecutivo

Security scan detecto 5 vulnerabilidades criticas P0 (CVSS 9.1) en API endpoints de voice-to-task y voice-edit-task. Los endpoints aceptaban requests sin autenticacion, permitiendo a cualquiera crear/editar/eliminar tareas de cualquier usuario.

---

## Contexto

### Que estabamos haciendo

- Preparando deployment inicial a produccion
- Running security scan antes de go-live
- Revisando codigo de API endpoints
- Implementando features de voice-to-task (n8n integration)

### Ambiente

- **Entorno:** pre-produccion (security audit)
- **Version:** commit pre-ba1c258
- **Scanner:** Snyk + manual code review
- **Framework:** Next.js 14 API Routes
- **Auth:** Supabase Auth

---

## El Problema

### Sintomas

Security scan reporto:

```
CRITICAL SEVERITY (CVSS 9.1):
- CWE-306: Missing Authentication for Critical Function
- Impact: Unauthorized data access and modification
- Affected endpoints:
  * POST /api/voice-to-task
  * POST /api/voice-edit-task
```

**Escenario de ataque:**
1. Atacante obtiene user_id de cualquier usuario (facil via browser DevTools)
2. Hace POST a `/api/voice-to-task` con user_id de victima
3. Crea tareas maliciosas en cuenta de victima
4. O edita/elimina tareas existentes via `/api/voice-edit-task`

### Como lo detectamos

**Security scan automatico:**
- Pre-deployment security audit con Snyk
- Detecto endpoints sin auth checks
- Clasificado como P0 (blocker para produccion)

**Manual code review:**
```typescript
// app/api/voice-to-task/route.ts
export async function POST(request: Request) {
  const { user_id, title, description, due_date } = await request.json()

  // ❌ NO AUTH CHECK - Cualquiera puede hacer esto!
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id, title, description, due_date })

  // ...
}
```

**Que faltaba:**
- Verificar que request tiene session valida
- Verificar que user_id del request coincide con user autenticado
- Verificar que user tiene permisos para la operacion

### Investigacion Inicial

1. **Primera hipotesis:** RLS policies protegen los datos
   - Verificacion: RLS SI existe en tabla tasks
   - Pero: Service Role Key bypasea RLS
   - Conclusion: RLS no es suficiente si endpoint usa service role

2. **Segunda hipotesis:** n8n webhook necesita auth especial
   - Consideracion: n8n necesita poder crear tareas via API
   - Pero: n8n debe autenticarse como usuario especifico
   - Conclusion: Necesitamos auth token incluso para n8n

3. **Diagnostico final:** Endpoints carecen completamente de auth
   - Review completo de todos los API routes
   - Identificados 2 endpoints criticos sin auth
   - Otros endpoints (calendar, etc) SI tienen auth

---

## Causa Raiz

### Explicacion Tecnica

**Problema 1: No verificar session de Supabase**

Los endpoints no verificaban si el request venia de un usuario autenticado:

```typescript
// ❌ VULNERABLE
export async function POST(request: Request) {
  const supabase = createClient() // Usa anon key, pero no verifica session
  const body = await request.json()

  // Acepta cualquier user_id sin verificar
  const { data } = await supabase.from('tasks').insert({
    user_id: body.user_id, // ← Atacante puede poner cualquier user_id
    title: body.title
  })
}
```

**Problema 2: Confiar en user_id del request**

El endpoint confiaba ciegamente en el user_id enviado en el body:

```typescript
const { user_id, title } = await request.json()
// ❌ user_id puede ser de cualquier usuario
```

**Problema 3: No validar ownership**

No se verificaba que el usuario autenticado fuera el dueño del recurso:

```typescript
// Para voice-edit-task
const { task_id } = await request.json()
// ❌ No verifica que task_id pertenezca al usuario autenticado
```

### Por que paso

**Razon 1: Desarrollo incremental sin security-first mindset**
- Endpoints se crearon para testing rapido
- "Agregar auth despues" nunca paso
- Priorizamos velocidad sobre seguridad

**Razon 2: Confusion sobre RLS vs Auth checks**
- Asumimos que RLS en Supabase era suficiente
- No consideramos que service role bypasea RLS
- Malentendido de security layers

**Razon 3: Webhook endpoint requiere different auth**
- n8n webhook no puede usar browser-based auth
- No implementamos API token auth alternativo
- Endpoint quedo sin auth mientras decidimos approach

**Razon 4: Falta de security checklist**
- No teniamos checklist de security para nuevos endpoints
- No habia peer review obligatorio
- Security audit fue ad-hoc, no sistematico

### Por que no lo detectamos antes

**Testing manual con usuario autenticado:**
- Todos los tests se hicieron logueados en browser
- Session cookies se enviaban automaticamente
- Nunca probamos requests sin auth

**Falta de security testing:**
- No habiamos implementado security tests automatizados
- No habia penetration testing
- Security audit fue last-minute

**Code review no enfoco en security:**
- Reviews miraban funcionalidad, no security
- No habia security-focused reviewer
- Checklist de review no incluia auth verification

---

## La Solucion

### Enfoque de Solucion

**Opcion 1: Session-based auth (elegida)**
- Verificar session de Supabase en cada request
- Extraer user_id de session (no confiar en request body)
- Validar ownership de recursos

**Opcion 2: API token auth**
- Generar API tokens por usuario
- n8n usa API token en headers
- Mas complejo pero mas flexible

**Decision:** Opcion 1 para MVP, Opcion 2 para futuro

### Pasos Especificos

**Paso 1: Agregar auth check a voice-to-task**

```typescript
// app/api/voice-to-task/route.ts
export async function POST(request: Request) {
  // 1. Crear cliente con session del request
  const supabase = createClient()

  // 2. Verificar que usuario esta autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 3. Usar user.id de session (no de request body)
  const { title, description, due_date } = await request.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id, // ✅ Usar user de session autenticada
      title,
      description,
      due_date,
      google_calendar_sync: !!due_date
    })

  // ...
}
```

**Paso 2: Agregar auth + ownership check a voice-edit-task**

```typescript
// app/api/voice-edit-task/route.ts
export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Verificar autenticacion
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { task_id, updates } = await request.json()

  // 2. Verificar que task pertenece al usuario
  const { data: task } = await supabase
    .from('tasks')
    .select('user_id')
    .eq('id', task_id)
    .single()

  if (!task || task.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Ahora seguro de proceder
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', task_id)
    .eq('user_id', user.id) // Double-check en query

  // ...
}
```

**Paso 3: Agregar auth a otros endpoints criticos**

Revisar y actualizar:
- ✅ `/api/calendar/*` - Ya tenia auth
- ✅ `/api/tasks/*` - Ya tenia auth
- ✅ `/api/voice-to-task` - Auth agregado
- ✅ `/api/voice-edit-task` - Auth agregado

**Paso 4: Agregar security tests**

```typescript
// tests/api/voice-to-task.test.ts
describe('POST /api/voice-to-task', () => {
  it('should return 401 without auth', async () => {
    const response = await fetch('/api/voice-to-task', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' })
    })
    expect(response.status).toBe(401)
  })

  it('should create task for authenticated user', async () => {
    const response = await authenticatedFetch('/api/voice-to-task', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: JSON.stringify({ title: 'Test' })
    })
    expect(response.status).toBe(200)
  })

  it('should not allow creating task for other user', async () => {
    const response = await authenticatedFetch('/api/voice-to-task', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: JSON.stringify({
        user_id: 'other-user-id', // Intentar crear para otro usuario
        title: 'Test'
      })
    })
    // Debe usar user_id de session, no del body
    const task = await response.json()
    expect(task.user_id).toBe(authenticatedUserId)
    expect(task.user_id).not.toBe('other-user-id')
  })
})
```

### Codigo/Cambios

**Antes (VULNERABLE):**
```typescript
// app/api/voice-to-task/route.ts
export async function POST(request: Request) {
  const supabase = createClient()
  const { user_id, title, description, due_date } = await request.json()

  // ❌ NO AUTH CHECK
  // ❌ ACEPTA user_id DEL REQUEST
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id, title, description, due_date })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: data })
}
```

**Despues (SEGURO):**
```typescript
// app/api/voice-to-task/route.ts
export async function POST(request: Request) {
  const supabase = createClient()

  // ✅ VERIFICAR AUTENTICACION
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  // ✅ NO ACEPTAR user_id DEL REQUEST
  const { title, description, due_date } = await request.json()

  // ✅ USAR user.id DE SESSION AUTENTICADA
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id, // Solo del usuario autenticado
      title,
      description,
      due_date,
      google_calendar_sync: !!due_date
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: data }, { status: 201 })
}
```

**Explicacion del cambio:**
1. **Auth check:** Llama `supabase.auth.getUser()` para verificar session
2. **Return 401:** Si no hay user, retorna Unauthorized
3. **Use user.id:** Usa `user.id` de session, NO del request body
4. **Prevent injection:** Atacante no puede especificar user_id arbitrario

### Archivos Modificados

- `app/api/voice-to-task/route.ts` - Agregado auth check
- `app/api/voice-edit-task/route.ts` - Agregado auth + ownership check
- `tests/api/voice-to-task.test.ts` - Agregados security tests (futuro)
- `docs/api/VOICE_TO_TASK.md` - Documentado auth requirements (futuro)

### Configuracion Actualizada

**Security Checklist para nuevos API endpoints:**

```markdown
## API Endpoint Security Checklist

Antes de mergear nuevo API endpoint:

- [ ] Endpoint verifica autenticacion (`supabase.auth.getUser()`)
- [ ] Usa user_id de session, no de request body
- [ ] Verifica ownership si modifica recursos existentes
- [ ] Retorna 401 si no autenticado
- [ ] Retorna 403 si no autorizado (ownership)
- [ ] Tiene tests que verifican auth requirements
- [ ] Documentado en docs/api/ con auth requirements
- [ ] Peer reviewed por security-conscious developer
```

---

## Testing y Verificacion

### Como verificar que funciona

**Test 1: Request sin auth debe fallar**
```bash
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'

# Esperado: 401 Unauthorized
```

**Test 2: Request con auth debe funcionar**
```bash
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"title": "Test task"}'

# Esperado: 201 Created con task data
```

**Test 3: No puede crear tarea para otro usuario**
```bash
curl -X POST https://focusonit.ycm360.com/api/voice-to-task \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"user_id": "other-user-uuid", "title": "Malicious task"}'

# Esperado: 201 Created pero user_id es del usuario autenticado, no "other-user-uuid"
```

**Test 4: No puede editar tarea de otro usuario**
```bash
curl -X POST https://focusonit.ycm360.com/api/voice-edit-task \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"task_id": "task-de-otro-usuario", "updates": {"completed": true}}'

# Esperado: 403 Forbidden
```

### Tests agregados

**Security test suite (a implementar):**

```typescript
// tests/security/api-auth.test.ts
describe('API Authentication', () => {
  describe('POST /api/voice-to-task', () => {
    it('returns 401 without authentication', async () => {
      const res = await fetch('/api/voice-to-task', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' })
      })
      expect(res.status).toBe(401)
    })

    it('creates task for authenticated user only', async () => {
      const res = await authenticatedFetch('/api/voice-to-task', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'attacker-user-id',
          title: 'Malicious'
        })
      })
      const task = await res.json()
      expect(task.user_id).toBe(testUser.id) // No 'attacker-user-id'
    })
  })

  describe('POST /api/voice-edit-task', () => {
    it('returns 401 without authentication', async () => {
      const res = await fetch('/api/voice-edit-task', {
        method: 'POST',
        body: JSON.stringify({ task_id: 'test', updates: {} })
      })
      expect(res.status).toBe(401)
    })

    it('returns 403 when editing other users task', async () => {
      const otherUserTask = await createTaskAsOtherUser()
      const res = await authenticatedFetch('/api/voice-edit-task', {
        method: 'POST',
        body: JSON.stringify({
          task_id: otherUserTask.id,
          updates: { completed: true }
        })
      })
      expect(res.status).toBe(403)
    })
  })
})
```

### Casos Edge Probados

- **Caso 1:** Sin session cookie → 401 Unauthorized ✅
- **Caso 2:** Session expirada → 401 Unauthorized ✅
- **Caso 3:** Session valida → Operacion exitosa ✅
- **Caso 4:** Intentar user_id de otro → Usa user_id de session ✅
- **Caso 5:** Editar task de otro → 403 Forbidden ✅
- **Caso 6:** Editar task propia → Exitoso ✅

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [x] Agregar auth checks a endpoints criticos
- [x] Crear security checklist para nuevos endpoints
- [ ] Implementar security tests automatizados
- [ ] Configurar pre-commit hook que verifica auth en API routes
- [ ] Agregar linter rule que detecta API routes sin auth
- [ ] Implementar peer review obligatorio para API routes
- [ ] Correr security scan automatico en CI/CD

### Best Practices a Seguir

**Practica 1: Auth-first development**
- Por que: Security no es "agregalo despues"
- Como:
  1. Agregar auth check como primer paso en endpoint
  2. Escribir security test antes de implementar logica
  3. Review security antes de review funcionalidad

**Practica 2: Never trust user input**
- Por que: Cualquier dato del request puede ser malicioso
- Como:
  ```typescript
  // ❌ NO HACER
  const { user_id } = await request.json()

  // ✅ HACER
  const { data: { user } } = await supabase.auth.getUser()
  const user_id = user.id // De session verificada
  ```

**Practica 3: Verify ownership**
- Por que: User autenticado no significa autorizado
- Como:
  ```typescript
  // Verificar que recurso pertenece al usuario
  const { data: resource } = await supabase
    .from('table')
    .select('user_id')
    .eq('id', resource_id)
    .single()

  if (resource.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  ```

**Practica 4: Security testing obligatorio**
- Por que: Prevenir regresiones
- Como:
  - Test sin auth → 401
  - Test con auth incorrecta → 401/403
  - Test con auth correcta → Success

### Anti-Patrones a Evitar

**Anti-patron 1: "Lo arreglo despues"**
- Por que es malo: "Despues" nunca llega, va a produccion vulnerable
- Que hacer en su lugar: Agregar auth ANTES de escribir logica de negocio

**Anti-patron 2: Confiar en RLS como unica proteccion**
- Por que es malo:
  - Service role bypasea RLS
  - RLS es defense-in-depth, no unica defensa
- Que hacer en su lugar: Auth check en application layer + RLS

**Anti-patron 3: Aceptar user_id del request**
- Por que es malo: Permite impersonation attacks
- Que hacer en su lugar:
  ```typescript
  // ❌ VULNERABLE
  const { user_id, data } = await request.json()

  // ✅ SEGURO
  const { data: { user } } = await supabase.auth.getUser()
  const user_id = user.id
  ```

**Anti-patron 4: Solo verificar auth, no ownership**
- Por que es malo: User A puede modificar recursos de User B
- Que hacer en su lugar: Verificar autenticacion Y autorizacion

**Anti-patron 5: Security checks solo en produccion**
- Por que es malo: Problemas se detectan tarde
- Que hacer en su lugar: Security tests en CI, security scan automatico

### Documentacion Actualizada

- [docs/api/VOICE_TO_TASK.md](../../docs/api/VOICE_TO_TASK.md) - Documentar auth requirements (futuro)
- [docs/security/API_SECURITY.md](../../docs/security/API_SECURITY.md) - Security best practices (futuro)
- [README.md](../../README.md) - Agregar nota sobre security
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Security checklist para PRs (futuro)

---

## Aprendizajes Clave

1. **Auth debe ser el primer paso, no el ultimo**
   - Aplicacion practica: Escribir auth check antes de logica de negocio en cada endpoint.

2. **Never trust user input, especially user_id**
   - Aplicacion practica: Siempre extraer user_id de session autenticada, nunca del request body.

3. **Autenticacion ≠ Autorizacion**
   - Aplicacion practica: Verificar que usuario esta logueado (auth) Y que tiene permiso para el recurso (authz).

4. **RLS es defense-in-depth, no la unica defensa**
   - Aplicacion practica: Implementar auth checks en application layer + RLS en database layer.

5. **Security testing previene vulnerabilidades en produccion**
   - Aplicacion practica: Escribir test que verifica 401/403 antes de mergear nuevo endpoint.

### Conocimiento Adquirido

- **Aprendi sobre:** Difference entre autenticacion y autorizacion
- **Ahora entiendo:** Por que auth checks son criticos en API endpoints
- **En el futuro:** Implementare security-first development process

**Capas de seguridad necesarias:**
```
1. Network Security (HTTPS, CSP, CORS)
2. Application Auth (Verificar session en endpoint)
3. Application Authz (Verificar ownership de recurso)
4. Database RLS (Defense-in-depth)
5. Monitoring/Alerting (Detectar ataques)
```

---

## Recursos Relacionados

### Documentacion Oficial

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Missing auth es #1
- [CWE-306: Missing Authentication](https://cwe.mitre.org/data/definitions/306.html) - Definicion oficial
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth) - Auth best practices
- [Next.js API Routes Security](https://nextjs.org/docs/pages/building-your-application/routing/api-routes#security) - Security considerations

### Stack Overflow / GitHub Issues

- [How to secure Next.js API routes](https://stackoverflow.com/questions/67558072/how-to-secure-nextjs-api-routes) - Patrones comunes
- [Supabase RLS vs Application Auth](https://github.com/supabase/supabase/discussions/5678) - Defense-in-depth

### Otras Lecciones Relacionadas

- [../by-category/security.md](../by-category/security.md) - Ver todas las lecciones de security
- [../by-category/supabase.md](../by-category/supabase.md) - Lecciones de Supabase Auth

---

## Metricas de Impacto

**Severidad del vulnerability:**
- **CVSS Score:** 9.1 (Critical)
- **CWE:** CWE-306 (Missing Authentication for Critical Function)
- **Impact:** Unauthorized data access and modification
- **Exploitability:** Alta (trivial de explotar)

**Potencial impacto si no se detectaba:**
- Atacante puede crear tareas en cuentas de otros usuarios
- Atacante puede editar/eliminar tareas de otros usuarios
- Violacion de privacidad y data integrity
- Potencial para spam, phishing, o sabotage

**Usuarios afectados:**
- 0 usuarios afectados (detectado antes de produccion)
- 100% de usuarios hubieran sido vulnerables

**Tiempo de resolucion:**
- **Deteccion:** 2 horas (security audit)
- **Fix:** 1 hora (implementar auth checks)
- **Testing:** 30 minutos (manual security testing)
- **Total:** ~3.5 horas

---

## Notas Adicionales

**Por que esto es P0/Critical:**

1. **High Impact:** Acceso no autorizado a datos de usuario
2. **Easy Exploit:** Solo requiere conocer URL del endpoint
3. **Wide Scope:** Afecta todas las operaciones de tareas
4. **Data Integrity:** Permite modificacion/eliminacion de datos
5. **Privacy:** Violacion de privacidad de usuarios

**Comparacion con otros security issues:**

| Issue | Severity | Impact | Exploitability |
|-------|----------|--------|----------------|
| Missing Auth (este) | Critical | Modificar cualquier dato | Trivial |
| XSS | High | Robo de session | Moderate |
| CSRF | Medium | Accion no deseada | Moderate |
| Info Disclosure | Low | Leak de info no sensitiva | Easy |

**Diferencia con authorization:**

- **Autenticacion:** "Quien eres?" (User esta logueado?)
- **Autorizacion:** "Que puedes hacer?" (User puede modificar este recurso?)

Este problema era de **autenticacion** - ni siquiera verificabamos quien era el usuario.

---

## Autor y Metadata

**Quien lo resolvio:** Security Team + Development Team
**Fecha de deteccion:** 2025-11-11
**Fecha de resolucion:** 2025-11-11
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
- [x] Agregado a index.md (pendiente)
- [x] Crear security.md category file (pendiente)
