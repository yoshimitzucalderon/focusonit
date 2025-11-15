# CSP Headers Blocking Supabase Self-Hosted Connections

**Fecha:** 2025-11-11
**Keywords:** nextjs, security, csp, content-security-policy, supabase, self-hosted, headers, networking
**Categoria:** nextjs, supabase, security
**Severidad:** alta
**Tiempo de Resolucion:** 1 hora
**Impacto:** produccion
**Commit:** 84fd5d7

---

## Resumen Ejecutivo

Despues de resolver el problema de Edge Runtime, la aplicacion seguia sin funcionar porque Content Security Policy (CSP) bloqueaba todas las conexiones a Supabase. El CSP solo permitia *.supabase.co pero nuestra instancia self-hosted esta en api.ycm360.com.

---

## Contexto

### Que estabamos haciendo

- Solucionando problemas de produccion post-deployment
- Habiamos resuelto el problema de Edge Runtime env vars
- Configurando security headers en next.config.js
- Intentando conectar a Supabase self-hosted (api.ycm360.com)

### Ambiente

- **Entorno:** produccion (focusonit.ycm360.com)
- **Version:** bb8d3b7 (Edge Runtime fix)
- **Plataforma:** Vercel
- **Supabase:** Self-hosted en api.ycm360.com
- **Browser:** Chrome 119 (Console mostraba errores CSP)

---

## El Problema

### Sintomas

Lista de sintomas observados:
- Aplicacion cargaba pero no habia datos
- Login no funcionaba (sin errores visibles en UI)
- Browser console mostraba errores de CSP
- Network tab mostraba requests bloqueados
- WebSocket connections (real-time) no se establecian

### Como lo detectamos

Errores claros en Chrome DevTools Console:

```
Refused to connect to 'https://api.ycm360.com/rest/v1/...' because it violates the following Content Security Policy directive: "connect-src 'self' *.supabase.co"

Refused to connect to 'wss://api.ycm360.com/realtime/v1/...' because it violates the following Content Security Policy directive: "connect-src 'self' *.supabase.co"
```

### Investigacion Inicial

1. **Primera hipotesis:** Problema de CORS
   - Que probamos: Revisar headers de respuesta de Supabase
   - Resultado: Headers CORS correctos
   - Conclusion: No era CORS

2. **Segunda hipotesis:** Problema de autenticacion
   - Que probamos: Verificar que anon key funcionaba en Postman
   - Resultado: Postman podia hacer requests exitosamente
   - Conclusion: Credenciales estaban bien

3. **Diagnostico final:** CSP blocking connections
   - Investigacion: Revisar errores en browser console
   - Descubrimiento: "violates the following Content Security Policy directive"
   - Verificacion: CSP en next.config.js solo permite *.supabase.co
   - Causa raiz: CSP no incluye nuestro dominio self-hosted

---

## Causa Raiz

### Explicacion Tecnica

**Content Security Policy (CSP)** es un header de seguridad que controla que recursos puede cargar/conectar una pagina web. La directiva `connect-src` especificamente controla conexiones AJAX, Fetch API, y WebSockets.

**Nuestra configuracion original:**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      connect-src 'self' *.supabase.co;
    `
  }
]
```

**El problema:**
- CSP permite conexiones a `*.supabase.co` (Supabase Cloud)
- Nuestra instancia esta en `api.ycm360.com` (Self-hosted)
- `api.ycm360.com` NO coincide con pattern `*.supabase.co`
- Browser bloquea todas las requests a api.ycm360.com

**Tipos de conexion bloqueadas:**

1. **HTTPS REST API calls:**
   ```typescript
   // Bloqueado por CSP
   fetch('https://api.ycm360.com/rest/v1/tasks')
   ```

2. **WebSocket connections (Real-time):**
   ```typescript
   // Bloqueado por CSP
   new WebSocket('wss://api.ycm360.com/realtime/v1/websocket')
   ```

### Por que paso

**Razon 1: Template copiado de Supabase Cloud docs**
- Docs oficiales asumen Supabase Cloud (*.supabase.co)
- No mencionan configuracion diferente para self-hosted
- Copiamos el pattern sin adaptarlo

**Razon 2: Testing insuficiente despues de agregar CSP**
- Agregamos CSP headers como parte de security fixes
- No testeamos que Supabase self-hosted funcionara
- Asumimos que pattern *.supabase.co era generico

**Razon 3: Multiples problemas simultaneos**
- Teniamos problema de Edge Runtime primero
- Una vez resuelto, descubrimos problema de CSP
- Los problemas se enmascaraban entre si

### Por que no lo detectamos antes

**Local development no usa CSP headers de produccion:**
- `npm run dev` no aplica headers de next.config.js igual que produccion
- CSP solo se manifiesta en build de produccion
- No testeamos produccion build localmente

**Browser console no se reviso inmediatamente:**
- Primero intentamos resolver en backend (Vercel logs)
- No checamos frontend console hasta despues
- Error era obvio una vez revisado el console

---

## La Solucion

### Enfoque de Solucion

1. Identificar todas las URLs que necesita conectar la app
2. Agregar dominios especificos al CSP connect-src directive
3. Incluir tanto HTTPS como WSS protocols
4. Mantener otros dominios necesarios (Google, etc)

### Pasos Especificos

**Paso 1: Identificar dominios de Supabase self-hosted**
```
HTTPS: https://api.ycm360.com
WSS:   wss://api.ycm360.com
```

**Paso 2: Actualizar next.config.js**

Modificar la directiva `connect-src` para incluir nuestro dominio:

```javascript
const ContentSecurityPolicy = `
  connect-src 'self'
    https://api.ycm360.com
    wss://api.ycm360.com
    *.google-analytics.com
    *.googletagmanager.com;
`
```

**Paso 3: Rebuild y redeploy**
```bash
# Commit cambios
git add next.config.js
git commit -m "fix(security): add Supabase self-hosted URL to CSP"

# Push y auto-deploy en Vercel
git push origin main
```

**Paso 4: Verificar en browser console**
- Abrir Chrome DevTools
- Ir a Console tab
- Verificar que no hay errores de CSP
- Verificar que requests a api.ycm360.com funcionan

### Codigo/Cambios

**Antes:**
```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self' *.supabase.co *.google-analytics.com;
  // ❌ Solo permite *.supabase.co - bloquea api.ycm360.com
`.replace(/\s{2,}/g, ' ').trim()
```

**Despues:**
```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  connect-src 'self'
    https://api.ycm360.com
    wss://api.ycm360.com
    *.google-analytics.com
    *.googletagmanager.com;
  // ✅ Incluye dominio self-hosted con HTTPS y WSS
`.replace(/\s{2,}/g, ' ').trim()
```

**Explicacion del cambio:**
- Agregado `https://api.ycm360.com` para REST API calls
- Agregado `wss://api.ycm360.com` para Real-time WebSocket connections
- Removido `*.supabase.co` (no lo usamos)
- Mantenido Google Analytics/Tag Manager domains

### Archivos Modificados

- `next.config.js` - Actualizado CSP connect-src directive

### Configuracion Actualizada

**CSP Headers (Production):**

```javascript
// next.config.js - Security Headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

**Regla general para CSP connect-src:**
- Incluir `'self'` (mismo origen)
- Incluir dominios de API externa (con protocolo especifico)
- Para WebSockets: usar `wss://` protocol
- Para HTTPS: usar `https://` protocol
- NO usar wildcards si no es necesario

---

## Testing y Verificacion

### Como verificar que funciona

**Verificacion en Browser Console:**
1. Abrir Chrome DevTools (F12)
2. Ir a Console tab
3. Reload pagina (Ctrl+R)
4. Verificar que NO hay errores de CSP
5. Buscar mensajes "Refused to connect" - no deberia haber ninguno

**Verificacion en Network Tab:**
1. Abrir Chrome DevTools → Network tab
2. Filtrar por "api.ycm360.com"
3. Reload pagina
4. Verificar que requests tienen status 200 (no bloqueados)
5. Verificar que WebSocket connection se establece (status 101)

**Verificacion funcional:**
1. Login con usuario de prueba
2. Dashboard carga con tareas
3. Crear nueva tarea - aparece inmediatamente
4. Editar tarea - cambios se guardan
5. Real-time sync funciona (abrir en otra tab, cambios se reflejan)

**Resultado esperado:**
- No hay errores de CSP en console
- Todas las requests a api.ycm360.com funcionan
- WebSocket connection establecida
- Real-time sync operativo

### Tests agregados

**Manual testing checklist:**
- [ ] Login funciona
- [ ] Dashboard carga datos
- [ ] CRUD operations funcionan
- [ ] Real-time sync funciona
- [ ] No hay errores en console
- [ ] Network requests exitosos

**Browser compatibility:**
- ✅ Chrome 119
- ✅ Firefox 120
- ✅ Safari 17
- ✅ Edge 119

### Casos Edge Probados

- **Caso 1:** CSP sin dominio self-hosted → Bloqueado (problema original)
- **Caso 2:** CSP con https:// pero sin wss:// → REST funciona, Real-time bloqueado
- **Caso 3:** CSP con ambos protocolos → Todo funciona ✅
- **Caso 4:** CSP muy permisivo (`*`) → Funciona pero inseguro

---

## Prevencion Futura

### Como evitar que vuelva a pasar

- [x] Documentar CSP requirements para self-hosted Supabase
- [x] Agregar verificacion en browser console a checklist de deployment
- [ ] Crear test automatizado que verifique CSP no bloquea Supabase
- [ ] Agregar smoke test que verifique conexion WebSocket
- [ ] Documentar diferencias entre Supabase Cloud y Self-hosted

### Best Practices a Seguir

**Practica 1: Verificar CSP en browser console antes de deploy final**
- Por que: CSP errors solo se ven en client-side
- Como:
  1. Build produccion local: `npm run build && npm run start`
  2. Abrir en browser y revisar console
  3. Verificar que no hay errores CSP

**Practica 2: Especificar protocolos exactos en CSP**
- Por que: Mayor seguridad, menos surface de ataque
- Como:
  ```javascript
  // ✅ Especifico
  connect-src https://api.ycm360.com wss://api.ycm360.com

  // ❌ Demasiado permisivo
  connect-src *
  ```

**Practica 3: Documentar dominios externos en CSP comments**
- Por que: Facilitar mantenimiento
- Como:
  ```javascript
  const ContentSecurityPolicy = `
    connect-src 'self'
      https://api.ycm360.com    /* Supabase REST API */
      wss://api.ycm360.com      /* Supabase Real-time */
      *.google-analytics.com    /* Analytics */;
  `
  ```

**Practica 4: Testing separado para self-hosted vs Cloud**
- Por que: Configuracion diferente requiere testing diferente
- Como: Checklist especifico para self-hosted deployments

### Anti-Patrones a Evitar

**Anti-patron 1: Copiar CSP de docs sin adaptar**
- Por que es malo: Docs asumen Supabase Cloud
- Que hacer en su lugar: Adaptar CSP a tu configuracion especifica

**Anti-patron 2: Usar wildcards por conveniencia**
- Por que es malo:
  ```javascript
  connect-src *  // Permite conexion a CUALQUIER dominio
  ```
- Que hacer en su lugar: Especificar dominios exactos

**Anti-patron 3: No incluir protocol en CSP**
- Por que es malo:
  ```javascript
  connect-src api.ycm360.com  // No especifica protocolo
  ```
- Que hacer en su lugar: Incluir protocolo especifico (`https://`, `wss://`)

**Anti-patron 4: Ignorar errores de console en testing**
- Por que es malo: CSP errors solo se ven en console, no en Network tab
- Que hacer en su lugar: Siempre revisar console en testing manual

### Documentacion Actualizada

- [lessons-learned/by-category/nextjs.md](../by-category/nextjs.md) - Agregada seccion CSP
- [lessons-learned/by-category/supabase.md](../by-category/supabase.md) - Documentado self-hosted networking
- [docs/deployments/2025-11-11-emergency-security-fixes.md](../../docs/deployments/2025-11-11-emergency-security-fixes.md) - Incluido en change control
- [README.md](../../README.md) - Agregada nota sobre CSP para self-hosted

---

## Aprendizajes Clave

1. **CSP connect-src controla networking**
   - Aplicacion practica: Si tu app hace requests a API externa, debe estar en CSP connect-src.

2. **Self-hosted Supabase requiere configuracion CSP diferente**
   - Aplicacion practica: No copiar CSP de docs de Supabase Cloud si usas self-hosted.

3. **WebSocket requiere wss:// protocol en CSP**
   - Aplicacion practica: Real-time features necesitan `wss://` ademas de `https://`.

4. **Browser console es critico para debugging CSP**
   - Aplicacion practica: Siempre revisar console en testing, no solo Network tab.

5. **CSP debe especificar protocolos exactos**
   - Aplicacion practica: Usar `https://domain.com` no solo `domain.com`.

### Conocimiento Adquirido

- **Aprendi sobre:** Como funciona Content Security Policy y sus directivas
- **Ahora entiendo:** Diferencia entre `default-src`, `connect-src`, `script-src`, etc.
- **En el futuro:** Verificare CSP en browser console antes de cada deployment

**CSP Directives mas comunes:**
- `default-src` - Fallback para otras directivas
- `script-src` - Controla ejecucion de JavaScript
- `style-src` - Controla carga de CSS
- `connect-src` - Controla fetch/XHR/WebSocket
- `img-src` - Controla carga de imagenes
- `font-src` - Controla carga de fonts

---

## Recursos Relacionados

### Documentacion Oficial

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) - Referencia completa
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Tool para validar CSP
- [Supabase Self-hosting Guide](https://supabase.com/docs/guides/self-hosting) - Networking setup

### Stack Overflow / GitHub Issues

- [CSP blocking WebSocket connections](https://stackoverflow.com/questions/35488029/content-security-policy-blocking-websocket) - Problema similar
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers) - Documentacion oficial

### Otras Lecciones Relacionadas

- [2025-11-11-edge-runtime-environment-variables.md](./2025-11-11-edge-runtime-environment-variables.md) - Problema previo en misma sesion
- [../by-category/nextjs.md](../by-category/nextjs.md) - Ver todas las lecciones de Next.js
- [../by-category/supabase.md](../by-category/supabase.md) - Ver lecciones de Supabase

---

## Metricas de Impacto

- **Downtime adicional:** ~30 minutos (despues de resolver Edge Runtime)
- **Usuarios afectados:** 100% (no podian usar la app)
- **Funcionalidades bloqueadas:**
  - Login/Auth
  - Fetch de datos
  - Real-time sync
  - Cualquier operacion con backend

**Timeline:**
- 16:10 - Edge Runtime fix deployed
- 16:12 - App carga pero sin datos
- 16:15 - Review browser console
- 16:17 - Identificado error CSP
- 16:20 - Root cause identificado
- 16:25 - CSP actualizado en next.config.js
- 16:30 - Deployed y verificado
- 16:35 - Produccion completamente funcional

---

## Notas Adicionales

**Diferencia entre CORS y CSP:**

**CORS (Cross-Origin Resource Sharing):**
- Header enviado por el SERVER
- Controla QUE origenes pueden acceder al recurso
- Error: "No 'Access-Control-Allow-Origin' header"

**CSP (Content Security Policy):**
- Header enviado por tu APP
- Controla A QUE recursos puede conectar tu app
- Error: "violates the following Content Security Policy directive"

**En este caso:**
- Supabase tenia CORS correcto (permitia focusonit.ycm360.com)
- Nuestra app tenia CSP incorrecto (bloqueaba api.ycm360.com)

**Por que necesitamos CSP:**
- Proteccion contra XSS attacks
- Previene carga de scripts maliciosos
- Controla que recursos puede cargar la app
- Security best practice recomendada

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
- [x] Agregado referencia en by-category/supabase.md
