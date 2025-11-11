# Fix: Google Calendar sync configuration and debugging

**Fecha:** 2025-10-22 20:44:23 -0700 (config fix), 2025-10-22 20:28:59 -0700 (logging)
**Keywords:** google-calendar, sync, configuration, debugging, google_calendar_sync, feature-flag, due_date, logging
**Severidad:** high
**Commits:** 55e2e7b7737f95d07811ba3afc2705f6500f7a6b, 3d75aafd0711cefc9c77cad960db31e585b1ff51
**Estado:** resuelto

## Problema

Las tareas creadas con fechas de vencimiento (due_date) no se sincronizaban automáticamente con Google Calendar, a pesar de que el usuario tenía su cuenta de Google conectada y el sistema de sincronización implementado.

**Síntomas:**
- Los usuarios creaban tareas con fechas (quick tasks, full tasks, modal tasks)
- Las tareas se guardaban correctamente en Supabase con `due_date` populated
- Los eventos NO aparecían en Google Calendar
- No había errores visibles en la UI
- La sincronización manual (desde la UI) funcionaba correctamente
- El sistema parecía "silenciosamente fallar" la sincronización automática

**Impacto:**
- **Alto:** Funcionalidad principal del producto no funcionaba como esperado
- Los usuarios no recibían notificaciones de calendario para sus tareas
- Degradación de la propuesta de valor principal (task manager con calendar sync)
- Pérdida de confianza en la confiabilidad del sistema
- Dificultad para diagnosticar por falta de logging detallado

## Causa Raíz

El problema tenía dos componentes interrelacionados:

### 1. Feature Flag no configurado (55e2e7b)

El sistema usaba un campo `google_calendar_sync` en la tabla `tasks` como feature flag para determinar qué tareas debían sincronizarse con Google Calendar. Sin embargo, este campo no se estaba estableciendo correctamente al crear tareas.

```typescript
// CÓDIGO PROBLEMÁTICO en DashboardHeader.tsx (quick task creation)
const { data: newTask, error } = await supabase
  .from('tasks')
  .insert({
    user_id: userId,
    title: taskTitle,
    due_date: parsedDate ? toDateOnlyString(parsedDate) : null,
    timezone_offset: getTimezoneOffset(),
    position: nextPosition,
    // ❌ FALTA: google_calendar_sync: parsedDate ? true : false
  } as any)
```

```typescript
// CÓDIGO PROBLEMÁTICO en AddTaskModal.tsx
const newTask = {
  user_id: userId,
  title: taskTitle.trim(),
  description: description.trim() || null,
  due_date: dueDate,
  priority,
  tags: taskTags,
  completed: false,
  created_at: getLocalTimestamp(),
  updated_at: getLocalTimestamp(),
  position: nextPosition,
  // ❌ FALTA: google_calendar_sync: dueDate ? true : false
}
```

**Análisis del flujo:**

1. Usuario crea tarea con fecha → tarea se guarda con `due_date` pero `google_calendar_sync = false` (default)
2. Sistema intenta sincronizar después del INSERT
3. Código de sincronización verifica: `if (task.google_calendar_sync && task.due_date)`
4. Condición falla porque `google_calendar_sync = false`
5. Sincronización no ocurre, pero no hay error porque es un "skip" intencional

**Por qué no se detectó antes:**
- El default de `google_calendar_sync` es `false` en el schema de Supabase
- El código de sincronización respeta este flag sin generar errores
- Parecía comportamiento intencional, no un bug
- Sin logging detallado, era imposible ver dónde se detenía el flujo

### 2. Falta de logging detallado (3d75aaf)

El código de sincronización tenía logging mínimo, dificultando el troubleshooting:

```typescript
// CÓDIGO PROBLEMÁTICO en TaskInput.tsx
if (newTask && (newTask as any).google_calendar_sync && (newTask as any).due_date) {
  console.log('🔄 Attempting to sync quick task:', (newTask as any).id)
  // ❌ No logging de qué datos se están enviando
  // ❌ No logging de por qué NO se sincroniza si la condición falla
  fetch('/api/calendar/sync', { ... })
}
```

**Problemas con logging insuficiente:**
- No se podía ver el estado exacto de la tarea al momento de intentar sincronizar
- No se sabía si la condición `google_calendar_sync && due_date` estaba pasando o fallando
- No se podía distinguir entre "no intentó sincronizar" vs "intentó pero falló"
- Debugging requería agregar console.logs manualmente y reproducir el problema

## Solución

La solución consistió en dos commits relacionados:

### Solución 1: Configurar google_calendar_sync correctamente (55e2e7b)

Se agregó la configuración del flag `google_calendar_sync` en todos los puntos donde se crean tareas con fechas.

```typescript
// ✅ CORREGIDO en DashboardHeader.tsx - Quick task
const { data: newTask, error } = await supabase
  .from('tasks')
  .insert({
    user_id: userId,
    title: taskTitle,
    due_date: parsedDate ? toDateOnlyString(parsedDate) : null,
    timezone_offset: getTimezoneOffset(),
    position: nextPosition,
    google_calendar_sync: parsedDate ? true : false,  // ✅ Agregado
  } as any)
```

```typescript
// ✅ CORREGIDO en DashboardHeader.tsx - Full task
const { data: newTask, error } = await supabase
  .from('tasks')
  .insert({
    user_id: userId,
    title: title.trim(),
    description: description.trim() || null,
    priority: priority || 'medium',
    due_date: dueDate ? toDateOnlyString(dueDate) : null,
    timezone_offset: getTimezoneOffset(),
    position: nextPosition,
    google_calendar_sync: dueDate ? true : false,  // ✅ Agregado
  } as any)
```

```typescript
// ✅ CORREGIDO en AddTaskModal.tsx
const newTask = {
  user_id: userId,
  title: taskTitle.trim(),
  description: description.trim() || null,
  due_date: dueDate,
  priority,
  tags: taskTags,
  completed: false,
  created_at: getLocalTimestamp(),
  updated_at: getLocalTimestamp(),
  position: nextPosition,
  google_calendar_sync: dueDate ? true : false,  // ✅ Agregado
}
```

**Lógica de la configuración:**
- Si la tarea tiene `due_date` → `google_calendar_sync = true` (sincronizar)
- Si la tarea NO tiene `due_date` → `google_calendar_sync = false` (no sincronizar)
- Esto es lógico porque solo tiene sentido crear eventos de calendario para tareas con fechas

**Tres lugares corregidos:**
1. **DashboardHeader quick task:** Input rápido en el header
2. **DashboardHeader full task:** Modal completo desde el header
3. **AddTaskModal:** Modal de agregar tarea (usado en varios lugares)

### Solución 2: Agregar logging detallado (3d75aaf)

Se mejoró el logging en el código de sincronización para facilitar troubleshooting futuro:

```typescript
// ✅ CORREGIDO en TaskInput.tsx - Quick task sync
if (newTask && (newTask as any).google_calendar_sync && (newTask as any).due_date) {
  console.log('🔄 [SYNC] Attempting to sync quick task:', (newTask as any).id)
  console.log('🔄 [SYNC] Task data:', {
    id: (newTask as any).id,
    title: (newTask as any).title,
    due_date: (newTask as any).due_date
  })  // ✅ Log detallado de datos
  fetch('/api/calendar/sync', { ... })
}
```

```typescript
// ✅ CORREGIDO en TaskInput.tsx - Full task sync
if (newTask && (newTask as any).google_calendar_sync && (newTask as any).due_date) {
  console.log('🔄 [SYNC] Attempting to sync full task:', (newTask as any).id)
  console.log('🔄 [SYNC] Task data:', {
    id: (newTask as any).id,
    title: (newTask as any).title,
    due_date: (newTask as any).due_date
  })  // ✅ Log detallado de datos
  fetch('/api/calendar/sync', { ... })
}
```

**Mejoras en logging:**
1. **Prefijo [SYNC]:** Hace fácil filtrar logs relacionados con sincronización
2. **Task ID:** Permite trackear una tarea específica a través del flujo
3. **Datos completos:** title y due_date visibles para verificar que están correctos
4. **Timing:** Los logs aparecen justo antes de intentar sincronizar

**Beneficios del logging mejorado:**
- Troubleshooting más rápido: se puede ver inmediatamente si la condición pasa
- Debugging de producción: logs en browser console ayudan a diagnosticar problemas reportados
- Verificación de datos: se puede confirmar que los datos son los esperados
- Audit trail: historial de qué tareas se intentaron sincronizar y cuándo

## Código/Cambios

### Commit 55e2e7b - Configuration fix

```diff
diff --git a/components/AddTaskModal.tsx b/components/AddTaskModal.tsx
index 8247b83..4bb1370 100644
--- a/components/AddTaskModal.tsx
+++ b/components/AddTaskModal.tsx
@@ -209,7 +209,8 @@ export default function AddTaskModal({ isOpen, onClose, userId, mode = 'text', o
         completed: false,
         created_at: getLocalTimestamp(),
         updated_at: getLocalTimestamp(),
-        position: nextPosition
+        position: nextPosition,
+        google_calendar_sync: dueDate ? true : false,
       }

       // Add optional fields only if they have values

diff --git a/components/DashboardHeader.tsx b/components/DashboardHeader.tsx
index 74a7935..cc7de97 100644
--- a/components/DashboardHeader.tsx
+++ b/components/DashboardHeader.tsx
@@ -115,6 +115,7 @@ export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
         due_date: parsedDate ? toDateOnlyString(parsedDate) : null,
         timezone_offset: getTimezoneOffset(),
         position: nextPosition,
+        google_calendar_sync: parsedDate ? true : false,
       } as any)

       if (error) throw error
@@ -168,6 +169,7 @@ export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
         due_date: dueDate ? toDateOnlyString(dueDate) : null,
         timezone_offset: getTimezoneOffset(),
         position: nextPosition,
+        google_calendar_sync: dueDate ? true : false,
       } as any)

       if (error) throw error
```

### Commit 3d75aaf - Logging improvements

```diff
diff --git a/components/TaskInput.tsx b/components/TaskInput.tsx
index 25ba971..38a4b0c 100644
--- a/components/TaskInput.tsx
+++ b/components/TaskInput.tsx
@@ -79,7 +79,8 @@ export default function TaskInput({ userId }: TaskInputProps) {

       // 🔄 Sincronizar inmediatamente con Google Calendar
       if (newTask && (newTask as any).google_calendar_sync && (newTask as any).due_date) {
-        console.log('🔄 Attempting to sync quick task:', (newTask as any).id)
+        console.log('🔄 [SYNC] Attempting to sync quick task:', (newTask as any).id)
+        console.log('🔄 [SYNC] Task data:', { id: (newTask as any).id, title: (newTask as any).title, due_date: (newTask as any).due_date })
         fetch('/api/calendar/sync', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
@@ -162,7 +163,8 @@ export default function TaskInput({ userId }: TaskInputProps) {

       // 🔄 Sincronizar inmediatamente con Google Calendar si está activado
       if (newTask && (newTask as any).google_calendar_sync && (newTask as any).due_date) {
-        console.log('🔄 Attempting to sync full task:', (newTask as any).id)
+        console.log('🔄 [SYNC] Attempting to sync full task:', (newTask as any).id)
+        console.log('🔄 [SYNC] Task data:', { id: (newTask as any).id, title: (newTask as any).title, due_date: (newTask as any).due_date })
         fetch('/api/calendar/sync', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
```

## Lecciones Aprendidas

1. **Feature Flags requieren inicialización correcta:** Los feature flags en base de datos deben configurarse explícitamente en TODOS los puntos de creación. No confiar en defaults implícitos, especialmente cuando el default es "deshabilitado".

2. **Grep es tu amigo:** Cuando se encuentra un bug de configuración, hacer grep de todos los lugares donde se crea/modifica esa entidad. En este caso:
   ```bash
   grep -r "\.insert(" components/ | grep "tasks"
   ```
   Esto habría revelado los tres lugares que necesitaban el fix.

3. **Silent failures son los peores:** Cuando una funcionalidad no ocurre pero no genera error, es extremadamente difícil de debuggear. Es mejor:
   - Generar un error si algo inesperado pasa
   - O loggear explícitamente por qué no se ejecutó una acción

4. **Logging strategy:** Un buen logging debe responder:
   - ¿Se intentó la operación? (log al inicio)
   - ¿Con qué datos? (log de input)
   - ¿Pasó o no? (log de resultado)
   - ¿Por qué no pasó? (log de condiciones fallidas)

5. **Conditional logic needs visibility:** Cuando hay condicionales complejas (`if (a && b && c)`), es crucial loggear qué parte está fallando:
   ```typescript
   // ❌ MAL: No se sabe qué condición falla
   if (task.google_calendar_sync && task.due_date && task.user_id) {
     sync()
   }

   // ✅ BIEN: Se puede ver qué condición falla
   if (!task.google_calendar_sync) {
     console.log('[SYNC] Skipped: google_calendar_sync=false')
     return
   }
   if (!task.due_date) {
     console.log('[SYNC] Skipped: no due_date')
     return
   }
   console.log('[SYNC] Syncing task:', task.id)
   sync()
   ```

6. **Feature consistency:** Si se agrega un campo a una entidad, hay que auditarlo en TODOS los lugares donde se crea esa entidad. Usar TypeScript types puede ayudar a forzar esto.

7. **Database defaults vs application logic:** Los defaults de base de datos son para casos edge, no para lógica de negocio. La aplicación debe establecer explícitamente los valores según la lógica de negocio.

8. **Prefijos en logs:** Usar prefijos como `[SYNC]`, `[AUTH]`, `[DB]` hace extremadamente fácil filtrar logs en producción:
   ```javascript
   // En browser console:
   // Solo ver logs de sync
   const oldLog = console.log
   console.log = (...args) => {
     if (args[0]?.includes('[SYNC]')) oldLog(...args)
   }
   ```

9. **Progressive debugging:** Este caso muestra la importancia de agregar logging ANTES de intentar fixes complejos:
   - Primero: agregar logging (3d75aaf)
   - Segundo: reproducir el problema y leer los logs
   - Tercero: identificar el problema exacto
   - Cuarto: implementar el fix (55e2e7b)

10. **Feature flags architecture:** Aprendizajes sobre feature flags:
    - Deben ser explícitos, no implícitos
    - Deben ser fáciles de auditar (query para ver cuántas tasks tienen el flag)
    - Deben ser configurables por el usuario eventualmente
    - Deben ser verificables en debugging

## Prevención

Para evitar problemas similares en el futuro:

1. **TypeScript types estrictos:**
   ```typescript
   // ✅ Definir type completo para Task creation
   interface CreateTaskInput {
     user_id: string
     title: string
     due_date: string | null
     google_calendar_sync: boolean  // ✅ Requerido, no opcional
     // ... otros campos
   }

   // TypeScript forzará incluir google_calendar_sync
   const newTask: CreateTaskInput = {
     user_id: userId,
     title: title,
     due_date: dueDate,
     google_calendar_sync: !!dueDate,  // ✅ Debe ser provisto
   }
   ```

2. **Helper function para crear tareas:**
   ```typescript
   // ✅ Centralizar lógica de creación
   function buildTaskInput(data: {
     userId: string
     title: string
     dueDate?: string | null
     // ... otros campos
   }): CreateTaskInput {
     return {
       user_id: data.userId,
       title: data.title,
       due_date: data.dueDate || null,
       // ✅ Lógica de google_calendar_sync centralizada
       google_calendar_sync: !!data.dueDate,
       // ... otros campos con defaults consistentes
     }
   }

   // Usar en todos los lugares
   const newTask = await supabase
     .from('tasks')
     .insert(buildTaskInput({ userId, title, dueDate }))
   ```

3. **Logging utilities:**
   ```typescript
   // lib/logging.ts
   export const syncLog = {
     attempt: (taskId: string, data: any) => {
       console.log(`🔄 [SYNC] Attempting sync for task: ${taskId}`)
       console.log('🔄 [SYNC] Data:', data)
     },
     skip: (taskId: string, reason: string) => {
       console.log(`⏭️ [SYNC] Skipped task ${taskId}: ${reason}`)
     },
     success: (taskId: string, eventId: string) => {
       console.log(`✅ [SYNC] Successfully synced task ${taskId} → event ${eventId}`)
     },
     error: (taskId: string, error: any) => {
       console.error(`❌ [SYNC] Failed to sync task ${taskId}:`, error)
     }
   }

   // Usar en código
   if (!task.google_calendar_sync) {
     syncLog.skip(task.id, 'google_calendar_sync=false')
     return
   }
   syncLog.attempt(task.id, { title: task.title, due_date: task.due_date })
   ```

4. **Tests para creación de tareas:**
   ```typescript
   describe('Task Creation with Calendar Sync', () => {
     it('should set google_calendar_sync=true when due_date is provided', () => {
       const taskInput = buildTaskInput({
         userId: 'user-123',
         title: 'Test task',
         dueDate: '2025-10-25'
       })
       expect(taskInput.google_calendar_sync).toBe(true)
     })

     it('should set google_calendar_sync=false when no due_date', () => {
       const taskInput = buildTaskInput({
         userId: 'user-123',
         title: 'Test task',
         dueDate: null
       })
       expect(taskInput.google_calendar_sync).toBe(false)
     })
   })
   ```

5. **Database check constraint:**
   ```sql
   -- Agregar constraint en Supabase para validar lógica
   ALTER TABLE tasks
   ADD CONSTRAINT google_calendar_sync_requires_due_date
   CHECK (
     (google_calendar_sync = true AND due_date IS NOT NULL)
     OR
     (google_calendar_sync = false)
   );
   ```
   Esto previene a nivel de BD que se active sync sin fecha.

6. **Code audit checklist:**
   Cuando se agrega un nuevo campo a una entidad, auditar:
   - [ ] Todos los `INSERT` statements
   - [ ] Todos los `UPDATE` statements
   - [ ] Todos los constructores/builders
   - [ ] Tests unitarios
   - [ ] Documentación
   - [ ] TypeScript types

7. **Feature flag dashboard:**
   Crear una vista administrativa para ver distribución de feature flags:
   ```sql
   -- Query útil para auditar
   SELECT
     google_calendar_sync,
     COUNT(*) as task_count,
     COUNT(CASE WHEN due_date IS NOT NULL THEN 1 END) as with_due_date
   FROM tasks
   GROUP BY google_calendar_sync;
   ```

8. **Logging en diferentes niveles:**
   ```typescript
   const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

   function shouldLog(level: string): boolean {
     const levels = ['error', 'warn', 'info', 'debug']
     return levels.indexOf(level) <= levels.indexOf(LOG_LEVEL)
   }

   // Solo en development se ven todos los detalles
   if (shouldLog('debug')) {
     console.log('[SYNC] Task data:', fullTaskObject)
   }
   ```

## Referencias

- Commits:
  - Config fix: 55e2e7b7737f95d07811ba3afc2705f6500f7a6b
  - Logging: 3d75aafd0711cefc9c77cad960db31e585b1ff51
- Archivos modificados:
  - `components/AddTaskModal.tsx` - Agregó google_calendar_sync en creación
  - `components/DashboardHeader.tsx` - Agregó google_calendar_sync en quick y full task
  - `components/TaskInput.tsx` - Mejoró logging de sincronización
- Conceptos relacionados:
  - Feature flags / feature toggles
  - Logging strategies y observability
  - Silent failures y error handling
  - TypeScript strict typing
  - Database constraints
  - Code consistency y DRY principle
- Herramientas útiles:
  - grep/ripgrep para code search
  - Browser console filtering
  - Supabase table inspector
