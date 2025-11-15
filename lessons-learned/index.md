# Indice de Lecciones Aprendidas

Indice maestro de todas las lecciones aprendidas del proyecto FocusOnIt, organizadas cronologicamente (mas recientes primero).

## Como Usar Este Indice

- **Buscar por keyword:** Usa Ctrl+F para buscar palabras clave
- **Filtrar por categoria:** Mira la columna "Keywords"
- **Filtrar por severidad:** Mira la columna "Severidad"
- **Ver detalle:** Click en el titulo para ir a la leccion completa
- **Ver por categoria:** Visita [by-category/](./by-category/) para ver agrupadas por tecnologia

---

## Estadisticas Generales

- **Total de lecciones:** 7
- **Criticas:** 3
- **Altas:** 3
- **Medias:** 1
- **Bajas:** 0
- **Horas estimadas ahorradas:** 28+

Actualiza estas estadisticas al agregar nuevas lecciones.

---

## Lecciones Aprendidas (Cronologico)

| Fecha | Titulo | Keywords | Severidad | Tiempo Resolucion |
|-------|--------|----------|-----------|-------------------|
| 2025-11-11 | [P0 Security Vulnerabilities: Missing Authentication](./by-date/2025-11-11-security-vulnerabilities-auth.md) | security, auth, api, vulnerability, p0, critical, supabase | critical | 3 horas |
| 2025-11-11 | [CSP Headers Blocking Supabase Self-Hosted](./by-date/2025-11-11-csp-supabase-blocking.md) | nextjs, security, csp, supabase, self-hosted, headers | high | 1 hora |
| 2025-11-11 | [Vercel Edge Runtime Cannot Access Encrypted Environment Variables](./by-date/2025-11-11-vercel-edge-runtime-env-vars.md) | vercel, nextjs, edge-runtime, middleware, environment-variables, deployment, production-issue | critical | 2 horas |
| 2025-10-23 | [Deletion sync and UI update issues](./by-date/2025-10-23-deletion-sync-ui-update.md) | supabase, real-time, sync, deletion, UI, race-condition, optimistic-update | high | 3-4 horas |
| 2025-10-22 | [Google Calendar token refresh duplicate key error](./by-date/2025-10-22-token-refresh-duplicate-key.md) | google-calendar, oauth, token-refresh, supabase, duplicate-key, upsert | critical | 2-3 horas |
| 2025-10-22 | [Google Calendar sync configuration and debugging](./by-date/2025-10-22-calendar-sync-config-debugging.md) | google-calendar, sync, configuration, debugging, feature-flag, due_date, logging | medium | 4-5 horas |

---

## Lecciones por Categoria

### Supabase
[Ver todas las lecciones de Supabase](./by-category/supabase.md)

- [Deletion sync and UI update issues](./by-date/2025-10-23-deletion-sync-ui-update.md) - Race condition en eliminacion y actualizacion de UI

### Google Calendar
[Ver todas las lecciones de Google Calendar](./by-category/google-calendar.md)

- [Token refresh duplicate key error](./by-date/2025-10-22-token-refresh-duplicate-key.md) - Error de clave duplicada al refrescar tokens OAuth
- [Sync configuration and debugging](./by-date/2025-10-22-calendar-sync-config-debugging.md) - Configuracion de flag de sync y debugging

### Docker
[Ver todas las lecciones de Docker](./by-category/docker.md)

- *Aun no hay lecciones documentadas*

### Kong
[Ver todas las lecciones de Kong](./by-category/kong.md)

- *Aun no hay lecciones documentadas*

### n8n
[Ver todas las lecciones de n8n](./by-category/n8n.md)

- *Aun no hay lecciones documentadas*

### Vercel
[Ver todas las lecciones de Vercel](./by-category/vercel.md)

- [Edge Runtime Cannot Access Encrypted Environment Variables](./by-date/2025-11-11-vercel-edge-runtime-env-vars.md) - Produccion caida por variables encriptadas

### Security
[Ver todas las lecciones de Security](./by-category/security.md)

- [P0 Security Vulnerabilities: Missing Authentication](./by-date/2025-11-11-security-vulnerabilities-auth.md) - API endpoints sin auth (CVSS 9.1)
- [CSP Headers Blocking Supabase Self-Hosted](./by-date/2025-11-11-csp-supabase-blocking.md) - CSP bloqueando conexiones

### Next.js
[Ver todas las lecciones de Next.js](./by-category/nextjs.md)

- [CSP Headers Blocking Supabase](./by-date/2025-11-11-csp-supabase-blocking.md) - Content Security Policy misconfiguration
- [Middleware Edge Runtime Environment Variables](./by-date/2025-11-11-vercel-edge-runtime-env-vars.md) - Middleware no puede acceder a variables encriptadas

---

## Keywords Mas Comunes

Cuando tengas suficientes lecciones, esta seccion mostrara los keywords mas frecuentes.

_Actualizar manualmente conforme crezca la base de conocimiento_

---

## Lecciones por Severidad

### Criticas
Problemas que causaron downtime o impacto severo en produccion.

- [P0 Security Vulnerabilities: Missing Authentication](./by-date/2025-11-11-security-vulnerabilities-auth.md) - API sin auth, CVSS 9.1, acceso no autorizado
- [Vercel Edge Runtime Cannot Access Encrypted Environment Variables](./by-date/2025-11-11-vercel-edge-runtime-env-vars.md) - Produccion completamente caida, 500 errors en todas las rutas
- [Google Calendar token refresh duplicate key error](./by-date/2025-10-22-token-refresh-duplicate-key.md) - Interrumpia completamente la sincronizacion con Google Calendar

### Altas
Problemas complejos que tomaron tiempo significativo resolver.

- [CSP Headers Blocking Supabase Self-Hosted](./by-date/2025-11-11-csp-supabase-blocking.md) - CSP bloqueando todas las conexiones a backend
- [Deletion sync and UI update issues](./by-date/2025-10-23-deletion-sync-ui-update.md) - Race condition y problemas de actualizacion de UI

### Medias
Problemas no triviales pero con solucion relativamente rapida.

- [Google Calendar sync configuration and debugging](./by-date/2025-10-22-calendar-sync-config-debugging.md) - Tareas no se sincronizaban automaticamente

### Bajas
Problemas menores pero instructivos para el equipo.

- *Aun no hay lecciones de baja severidad documentadas*

---

## Lecciones Mas Valiosas

Basado en impacto y utilidad para el equipo (actualizar periodicamente).

1. [P0 Security Vulnerabilities: Missing Authentication](./by-date/2025-11-11-security-vulnerabilities-auth.md) - CRITICO para API security, previene vulnerabilidades CVSS 9.1
2. [Vercel Edge Runtime Cannot Access Encrypted Environment Variables](./by-date/2025-11-11-vercel-edge-runtime-env-vars.md) - CRITICO para deployments en Vercel con middleware
3. [CSP Headers Blocking Supabase Self-Hosted](./by-date/2025-11-11-csp-supabase-blocking.md) - CRITICO para self-hosted Supabase con CSP
4. [Google Calendar token refresh duplicate key error](./by-date/2025-10-22-token-refresh-duplicate-key.md) - Critico para OAuth y operaciones upsert
5. [Deletion sync and UI update issues](./by-date/2025-10-23-deletion-sync-ui-update.md) - Patron importante para race conditions
6. [Google Calendar sync configuration](./by-date/2025-10-22-calendar-sync-config-debugging.md) - Debugging de integraciones complejas

---

## Como Agregar una Nueva Leccion

1. Copia [TEMPLATE.md](./TEMPLATE.md)
2. Rellena todas las secciones
3. Guarda en `by-date/YYYY-MM-DD-titulo-corto.md`
4. Agrega referencia en `by-category/[categoria].md`
5. Actualiza esta tabla con nueva entrada (insertar al inicio)
6. Actualiza estadisticas generales
7. Commit: `docs: add lesson learned - [titulo]`

---

## Formato de Entrada en la Tabla

```markdown
| YYYY-MM-DD | [Titulo del Problema](./by-date/YYYY-MM-DD-titulo.md) | keyword1, keyword2, keyword3 | critica/alta/media/baja | X horas/dias |
```

---

## Mantenimiento del Indice

Este indice debe actualizarse cada vez que se agrega una nueva leccion aprendida.

**Responsable:** Desarrollador que documenta la leccion
**Revision:** DevOps Engineer (mensual)
**Actualizacion de estadisticas:** DevOps Engineer (mensual)

---

**Ultima actualizacion:** 2025-11-11
**Proxima revision programada:** 2025-12-11
