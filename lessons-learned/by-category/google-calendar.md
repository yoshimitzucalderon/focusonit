# Lecciones Aprendidas: Google Calendar

Problemas y soluciones relacionados con la integracion de Google Calendar.

## Descripcion de la Categoria

Esta categoria cubre lecciones aprendidas relacionadas con:

- **Google Calendar API:** Integracion con la API, endpoints, requests/responses
- **OAuth 2.0:** Autenticacion, tokens, refresh tokens, scopes
- **Sincronizacion:** Sync bidireccional entre FocusOnIt y Google Calendar
- **Eventos:** Creacion, actualizacion, eliminacion de eventos
- **Token Management:** Manejo de access tokens, refresh, expiracion
- **Webhooks/Push Notifications:** Notificaciones de cambios en calendario
- **Timezone Handling:** Manejo de zonas horarias en eventos
- **Permisos y Scopes:** calendar.readonly, calendar.events, etc.

---

## Keywords Comunes

google-calendar, google-api, calendar-api, oauth, oauth2, google-oauth, access-token, refresh-token, sync, synchronization, events, calendar-events, timezone, google-cloud, api-credentials

---

## Lecciones Documentadas

### Total: 2

### [Google Calendar token refresh duplicate key error](../by-date/2025-10-22-token-refresh-duplicate-key.md)

**Fecha:** 2025-10-22
**Severidad:** critical
**Keywords:** google-calendar, oauth, token-refresh, supabase, duplicate-key, upsert, constraint-violation

**Problema:** Sistema de sincronizacion fallaba al refrescar tokens OAuth expirados con error de clave duplicada en user_google_tokens.

**Solucion:** Especificar explicitamente onConflict: 'user_id' en operacion upsert de Supabase.

**Aprendizaje clave:** Siempre especificar onConflict en upsert para operaciones predecibles. No confiar en auto-deteccion de Supabase.

---

### [Google Calendar sync configuration and debugging](../by-date/2025-10-22-calendar-sync-config-debugging.md)

**Fecha:** 2025-10-22
**Severidad:** high
**Keywords:** google-calendar, sync, configuration, debugging, google_calendar_sync, feature-flag, due_date, logging

**Problema:** Tareas con fechas no se sincronizaban automaticamente con Google Calendar. El sistema fallaba silenciosamente.

**Solucion:** Agregar flag google_calendar_sync=true al crear tareas con due_date y mejorar logging para debugging.

**Aprendizaje clave:** Feature flags requieren configuracion explicita en todos los entry points. Logging detallado es esencial para debugging de integraciones.

---

---

## Como Agregar una Leccion Aqui

Cuando documentes un problema relacionado con Google Calendar:

1. Crea el archivo completo en `../by-date/YYYY-MM-DD-titulo.md` usando el [TEMPLATE.md](../TEMPLATE.md)
2. Agrega una entrada aqui siguiendo este formato:

```markdown
### [Titulo del Problema](../by-date/YYYY-MM-DD-titulo.md)

**Fecha:** YYYY-MM-DD
**Severidad:** [critica/alta/media/baja]
**Keywords:** google-calendar, keyword2, keyword3

**Problema:** Breve descripcion del problema (1-2 lineas)

**Solucion:** Breve descripcion de la solucion (1-2 lineas)

**Aprendizaje clave:** Principal leccion aprendida (1 linea)

---
```

3. Actualiza el contador "Total" arriba
4. Ordena las lecciones por fecha (mas recientes primero)

---

## Problemas Comunes de Google Calendar

Basado en las lecciones aprendidas, estos son patrones comunes (actualizar conforme se documenten):

### OAuth y Tokens

- *Por documentar: problemas de refresh token*
- *Por documentar: token expiration issues*
- *Por documentar: scope permissions*

### Sincronizacion

- *Por documentar: problemas de sync bidireccional*
- *Por documentar: conflictos de actualizacion*
- *Por documentar: manejo de eliminaciones*

### API Limits y Rate Limiting

- *Por documentar: problemas de rate limits*
- *Por documentar: optimizacion de requests*

### Timezone Issues

- *Por documentar: problemas de zona horaria*
- *Por documentar: conversion de fechas*

---

## Recursos Utiles

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [docs/integrations/google-calendar/](../../docs/integrations/google-calendar/) (cuando exista)
- [docs/integrations/google-oauth/](../../docs/integrations/google-oauth/) (cuando exista)

---

## Patrones Exitosos

Conforme documentemos lecciones, extraeremos patrones exitosos aqui:

### Token Management
- *Por determinar*

### Sync Strategy
- *Por determinar*

### Error Handling
- *Por determinar*

---

## Anti-Patrones Identificados

Cosas que NO se deben hacer (actualizar conforme se documenten):

- *Por determinar*

---

**Ultima actualizacion:** 2025-11-11
**Lecciones documentadas:** 2
**Proxima revision:** 2025-12-11
