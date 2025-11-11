# Fix: Google Calendar token refresh duplicate key error

**Fecha:** 2025-10-22 20:49:30 -0700
**Keywords:** google-calendar, oauth, token-refresh, supabase, duplicate-key, upsert, constraint-violation
**Severidad:** critical
**Commit:** bdd30db8acfff7a19fad0479b2e8cb583e58e248
**Estado:** resuelto

## Problema

El sistema de sincronización con Google Calendar fallaba cuando intentaba refrescar tokens de OAuth expirados. El error específico era una violación de constraint de clave única (duplicate key constraint violation) en la tabla `user_google_tokens` de Supabase.

**Síntomas:**
- Los usuarios no podían refrescar sus tokens de Google Calendar
- La sincronización fallaba después de que los tokens expiraban (típicamente después de 1 hora)
- Error en logs: "duplicate key value violates unique constraint 'user_google_tokens_user_id_key'"
- Los usuarios tenían que desconectar y reconectar su cuenta de Google Calendar manualmente

**Impacto:**
- **Crítico:** Interrumpía completamente la funcionalidad de sincronización con Google Calendar
- Los usuarios perdían sincronización automática sin darse cuenta
- Eventos dejaban de crearse/actualizarse en Google Calendar
- Degradación severa de la experiencia de usuario

## Causa Raíz

El problema radicaba en cómo se estaba realizando la operación `upsert` en la función `storeTokens` de `lib/google-calendar/oauth.ts`.

```typescript
// CÓDIGO PROBLEMÁTICO (antes del fix)
export async function storeTokens(userId: string, tokens: any) {
  const { error } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
      scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events',
      calendar_id: 'primary',
    } as any)  // ❌ Sin especificar el onConflict!
    .select()
    .single();
}
```

**Análisis técnico:**

1. **Comportamiento de upsert sin onConflict:** Cuando se llama a `.upsert()` sin especificar el parámetro `onConflict`, Supabase intenta determinar automáticamente qué columna(s) usar para detectar conflictos. Sin embargo, esta auto-detección puede fallar o usar la columna incorrecta.

2. **Schema de la tabla:** La tabla `user_google_tokens` tiene una constraint UNIQUE en la columna `user_id` (cada usuario solo puede tener un set de tokens). Esta es la columna correcta para resolver conflictos en un upsert.

3. **El problema:** Sin especificar explícitamente `onConflict: 'user_id'`, Supabase intentaba insertar un nuevo registro cada vez que se refrescaban los tokens, en lugar de actualizar el registro existente. Esto causaba la violación del constraint de clave única.

4. **Timing del error:** El error aparecía específicamente durante el refresh de tokens porque:
   - En el primer login (OAuth flow inicial), no hay registro previo, así que el INSERT funciona
   - Cuando los tokens expiran (1 hora después), el sistema intenta refresharlos
   - El refresh llama a `storeTokens` para guardar los nuevos tokens
   - Como ya existe un registro para ese `user_id`, ocurre el conflicto

## Solución

La solución fue simple pero crítica: especificar explícitamente la columna `user_id` en el parámetro `onConflict` del método `upsert`.

```typescript
// CÓDIGO CORREGIDO
export async function storeTokens(userId: string, tokens: any) {
  const { error } = await supabase
    .from('user_google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
      scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events',
      calendar_id: 'primary',
    } as any, {
      onConflict: 'user_id'  // ✅ Especifica explícitamente la columna de conflicto
    })
    .select()
    .single();
}
```

**Cómo funciona:**

1. **Primera vez (usuario nuevo):**
   - No existe registro con ese `user_id`
   - Supabase realiza un INSERT
   - Los tokens se guardan correctamente

2. **Refresh de tokens (usuario existente):**
   - Ya existe un registro con ese `user_id`
   - Supabase detecta el conflicto en la columna `user_id`
   - En lugar de intentar INSERT (que causaría error), realiza un UPDATE
   - Los tokens se actualizan correctamente

3. **Comportamiento UPSERT correcto:**
   ```sql
   -- SQL equivalente a lo que hace Supabase internamente
   INSERT INTO user_google_tokens (user_id, access_token, ...)
   VALUES ($1, $2, ...)
   ON CONFLICT (user_id)  -- ✅ Esta es la clave
   DO UPDATE SET
     access_token = EXCLUDED.access_token,
     refresh_token = EXCLUDED.refresh_token,
     token_expiry = EXCLUDED.token_expiry,
     ...
   ```

## Código/Cambios

```diff
diff --git a/lib/google-calendar/oauth.ts b/lib/google-calendar/oauth.ts
index fc0dff8..af166ef 100644
--- a/lib/google-calendar/oauth.ts
+++ b/lib/google-calendar/oauth.ts
@@ -57,7 +57,9 @@ export async function storeTokens(userId: string, tokens: any) {
       token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
       scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events',
       calendar_id: 'primary',
-    } as any)
+    } as any, {
+      onConflict: 'user_id'
+    })
     .select()
     .single();
```

## Lecciones Aprendidas

1. **Siempre especificar onConflict en upsert:** Nunca confiar en la auto-detección de Supabase para operaciones upsert. Especificar explícitamente la columna de conflicto evita comportamientos inesperados y hace el código más predecible.

2. **Entender el comportamiento de upsert:** UPSERT no es simplemente "insertar o actualizar". Es una operación atómica que requiere conocer exactamente qué columna(s) determinan si es un INSERT o un UPDATE. La especificación de `onConflict` es crítica para este comportamiento.

3. **Testing de operaciones idempotentes:** Las operaciones que se ejecutan múltiples veces (como refresh de tokens) deben ser idempotentes. Es crucial probar:
   - Primera ejecución (caso INSERT)
   - Segunda ejecución (caso UPDATE)
   - Ejecuciones subsecuentes
   - Comportamiento bajo concurrencia

4. **OAuth token lifecycle:** Los tokens de OAuth tienen un ciclo de vida complejo:
   - Access tokens expiran rápidamente (1 hora típicamente)
   - Refresh tokens son de larga duración
   - El sistema debe manejar seamlessly el refresh automático
   - Los errores en el refresh rompen toda la funcionalidad

5. **Constraints de base de datos como documentación:** Las constraints UNIQUE en la base de datos no solo previenen datos inconsistentes, también documentan la lógica de negocio. En este caso, `UNIQUE(user_id)` indica claramente que debe haber exactamente un set de tokens por usuario.

6. **Error messages como hints:** El mensaje "duplicate key value violates unique constraint" es un hint claro de que:
   - Se está intentando un INSERT cuando debería ser UPDATE
   - Hay que revisar las operaciones upsert
   - Probablemente falta especificar onConflict

7. **Debugging de OAuth flows:** Los problemas de OAuth son difíciles de debuggear porque:
   - Involucran múltiples sistemas (app, Supabase, Google)
   - Los tokens expiran, haciendo difícil reproducir problemas
   - Los errores pueden ocurrir en background sin notificación al usuario
   - Requieren logging detallado en cada paso del flow

8. **Importance of database schema knowledge:** Conocer el schema de la base de datos (constraints, índices, relaciones) es esencial para escribir queries correctas. No se puede abstraer completamente la base de datos detrás de un ORM.

## Prevención

Para evitar problemas similares en el futuro:

1. **Patrón estandarizado para upsert:**
   ```typescript
   // ✅ PATRÓN CORRECTO: Siempre especificar onConflict
   await supabase
     .from('table_name')
     .upsert(data, {
       onConflict: 'unique_column_name'  // Siempre explícito
     })
   ```

2. **Code review checklist para operaciones upsert:**
   - [ ] Se especifica explícitamente el parámetro `onConflict`
   - [ ] La columna en `onConflict` corresponde a una constraint UNIQUE en la BD
   - [ ] Se entiende si será INSERT o UPDATE en cada caso de uso
   - [ ] Se probó la operación múltiples veces (idempotencia)

3. **Testing de OAuth token refresh:**
   ```typescript
   // Test case esencial
   describe('OAuth Token Refresh', () => {
     it('should handle token refresh without duplicate key error', async () => {
       const userId = 'test-user-id'
       const tokens = { access_token: 'token1', ... }

       // First store (INSERT)
       await storeTokens(userId, tokens)

       // Refresh tokens (UPDATE - no debe fallar)
       const newTokens = { access_token: 'token2', ... }
       await storeTokens(userId, newTokens)

       // Verify only one record exists
       const { count } = await supabase
         .from('user_google_tokens')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', userId)

       expect(count).toBe(1)
     })
   })
   ```

4. **Logging en operaciones críticas:**
   ```typescript
   export async function storeTokens(userId: string, tokens: any) {
     console.log('[OAuth] Storing tokens for user:', userId)
     console.log('[OAuth] Token expiry:', new Date(tokens.expiry_date))

     const { data, error } = await supabase
       .from('user_google_tokens')
       .upsert({ ... }, { onConflict: 'user_id' })
       .select()
       .single()

     if (error) {
       console.error('[OAuth] Failed to store tokens:', error)
       throw error
     }

     console.log('[OAuth] Tokens stored successfully')
     return data
   }
   ```

5. **Documentación de schema constraints:**
   ```typescript
   // En el código o README, documentar las constraints importantes
   /**
    * user_google_tokens table schema:
    * - user_id: UUID, UNIQUE constraint (one token set per user)
    * - access_token: string
    * - refresh_token: string
    * - token_expiry: timestamp
    *
    * When upserting, always use onConflict: 'user_id'
    */
   ```

6. **Monitoring de operaciones de tokens:**
   - Implementar alertas para errores de token refresh
   - Trackear métricas: tasa de éxito de refresh, tiempo de expiración promedio
   - Log de errores debe incluir user_id (anonimizado si es necesario) para debugging

7. **Graceful degradation:**
   ```typescript
   // Si falla el token refresh, proporcionar feedback claro al usuario
   try {
     await refreshTokens(userId)
   } catch (error) {
     if (error.code === '23505') {  // Duplicate key
       console.error('Duplicate key error - check upsert implementation')
     }
     // Notificar al usuario que debe reconectar su cuenta
     throw new Error('Please reconnect your Google Calendar account')
   }
   ```

## Referencias

- Commit: bdd30db8acfff7a19fad0479b2e8cb583e58e248
- Archivo modificado: `lib/google-calendar/oauth.ts`
- Supabase upsert documentation: https://supabase.com/docs/reference/javascript/upsert
- PostgreSQL ON CONFLICT: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
- Google OAuth token lifecycle: https://developers.google.com/identity/protocols/oauth2#expiration
- Conceptos relacionados:
  - PostgreSQL UPSERT (INSERT ... ON CONFLICT)
  - OAuth 2.0 token refresh flow
  - Database constraints (UNIQUE, PRIMARY KEY)
  - Idempotent operations
  - Supabase client upsert behavior
