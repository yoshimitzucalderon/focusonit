# Fix: Deletion sync and UI update issues

**Fecha:** 2025-10-23 11:25:35 -0700
**Keywords:** supabase, real-time, sync, deletion, UI, race-condition, optimistic-update
**Severidad:** high
**Commit:** 7ebb9a6f7973d382136c8e9a7e30ae79fe1cca21
**Estado:** resuelto

## Problema

El sistema presentaba dos problemas críticos relacionados con la sincronización y actualización de la UI:

1. **Calendar Deletion Sync Race Condition:** Cuando se eliminaba una tarea que estaba sincronizada con Google Calendar, ocurría una condición de carrera (race condition). El proceso intentaba eliminar el evento del calendario Y actualizar la tarea en Supabase simultáneamente, pero la tarea ya había sido eliminada, causando un error de "task not found" en Supabase.

2. **Task Completion UI Update:** Al marcar una tarea como completada, la interfaz no se actualizaba inmediatamente. Los usuarios tenían que refrescar manualmente la página para ver el cambio de estado, degradando significativamente la experiencia de usuario.

## Causa Raíz

### Problema 1: Race Condition en Eliminación
```typescript
// CÓDIGO PROBLEMÁTICO (antes del fix)
export async function deleteCalendarEvent(userId: string, task: Task): Promise<SyncResult> {
  // ... delete from Google Calendar ...

  // ❌ Intentaba actualizar la tarea después de eliminarla
  const deleteUpdates: TaskUpdate = {
    google_event_id: null,
    synced_with_calendar: false,
    last_synced_at: new Date().toISOString(),
  };

  const supabase = await createServerSupabaseClient();
  await updateTasksQuery(supabase, deleteUpdates)
    .eq('id', task.id); // ❌ Esta tarea ya no existe!

  return { success: true };
}
```

**Causa:** La función `deleteCalendarEvent` intentaba actualizar los campos de sincronización de la tarea después de que el evento de calendario fuera eliminado. Sin embargo, el código que llamaba a esta función también eliminaba la tarea de Supabase, creando una race condition donde ambas operaciones intentaban modificar/eliminar la misma tarea simultáneamente.

### Problema 2: Falta de Optimistic Update
```typescript
// CÓDIGO PROBLEMÁTICO (antes del fix)
const toggleComplete = async () => {
  const toastId = toast.loading('Actualizando...')

  try {
    // ❌ Solo actualiza después de la respuesta del servidor
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)

    if (error) throw error
    toast.success('Tarea actualizada', { id: toastId })
  } catch (error) {
    toast.error('Error', { id: toastId })
  }
  // ❌ No hay actualización optimista del estado local
}
```

**Causa:** El componente `TaskItem` implementaba la actualización de completado directamente contra Supabase sin proporcionar un mecanismo para actualización optimista. El componente padre `TaskList` mantenía el estado de las tareas, pero no tenía forma de actualizarlo inmediatamente cuando el usuario marcaba una tarea como completada.

## Solución

### Solución 1: Eliminar Update de Task en deleteCalendarEvent
Se eliminó la actualización de la tarea dentro de `deleteCalendarEvent`, delegando esa responsabilidad al código que llama a la función. Esto elimina la race condition porque la tarea se elimina completamente en un solo lugar.

```typescript
// CÓDIGO CORREGIDO
export async function deleteCalendarEvent(userId: string, task: Task): Promise<SyncResult> {
  // ... delete from Google Calendar ...

  // ✅ Task will be deleted by the caller - don't update here to avoid race condition
  return {
    success: true,
  };
}
```

**Beneficios:**
- Eliminación atómica de la tarea
- No hay intentos de actualizar una tarea que está siendo eliminada
- La responsabilidad de gestionar el ciclo de vida de la tarea queda en un solo lugar
- Código más predecible y fácil de razonar

### Solución 2: Implementar Callback de Optimistic Update
Se agregó un prop `onToggleComplete` al componente `TaskItem` que permite al componente padre proporcionar su propio manejador con actualización optimista.

```typescript
// 1. Agregar prop al TaskItem
interface TaskItemProps {
  task: Task
  onDoubleClick?: () => void
  onToggleComplete?: () => void  // ✅ Nuevo callback
}

export default function TaskItem({ task, onDoubleClick, onToggleComplete }: TaskItemProps) {
  const toggleComplete = async () => {
    // ✅ If parent provides optimistic handler, use it
    if (onToggleComplete) {
      onToggleComplete()
      return
    }

    // Otherwise fall back to current implementation
    // ... existing code ...
  }
}
```

```typescript
// 2. TaskList pasa el handler con optimistic update
<TaskItem
  key={task.id}
  task={task}
  onDoubleClick={() => onEditTask?.(task)}
  onToggleComplete={() => handleComplete(task)}  // ✅ Pasa handler existente
/>
```

**Cómo funciona `handleComplete` en TaskList:**
El método `handleComplete` ya existía en `TaskList` y realizaba actualización optimista del estado local antes de llamar a Supabase. Al conectarlo con `TaskItem` a través del callback, se logra:

1. **Actualización inmediata de UI:** El estado local se actualiza primero
2. **Persistencia en background:** La actualización a Supabase ocurre después
3. **Rollback en caso de error:** Si falla la operación, se puede revertir el estado
4. **Experiencia de usuario fluida:** Sin esperas ni necesidad de refresh

## Código/Cambios

```diff
diff --git a/components/TaskItem.tsx b/components/TaskItem.tsx
index 5233637..29b02d7 100644
--- a/components/TaskItem.tsx
+++ b/components/TaskItem.tsx
@@ -18,6 +18,7 @@ interface TaskItemProps {
   task: Task
   onDoubleClick?: () => void
+  onToggleComplete?: () => void
 }

-export default function TaskItem({ task, onDoubleClick }: TaskItemProps) {
+export default function TaskItem({ task, onDoubleClick, onToggleComplete }: TaskItemProps) {
   const { selectedIds, toggleSelection } = useSelection()
   const isSelected = selectedIds.has(task.id)

   // Toggle completar tarea con actualización optimista
   const toggleComplete = async () => {
+    // If parent provides optimistic handler, use it
+    if (onToggleComplete) {
+      onToggleComplete()
+      return
+    }
+
+    // Otherwise fall back to current implementation
     const toastId = toast.loading('Actualizando...')

     try {

diff --git a/components/TaskList.tsx b/components/TaskList.tsx
index 44b716c..8417675 100644
--- a/components/TaskList.tsx
+++ b/components/TaskList.tsx
@@ -361,6 +361,7 @@ export default function TaskList({
               key={task.id}
               task={task}
               onDoubleClick={() => onEditTask?.(task)}
+              onToggleComplete={() => handleComplete(task)}
             />
           )

diff --git a/lib/google-calendar/sync.ts b/lib/google-calendar/sync.ts
index bca3d21..d71159a 100644
--- a/lib/google-calendar/sync.ts
+++ b/lib/google-calendar/sync.ts
@@ -191,17 +191,7 @@ export async function deleteCalendarEvent(userId: string, task: Task): Promise<S
       eventId: task.google_event_id,
     });

-    // Clear Google event ID from task
-    const deleteUpdates: TaskUpdate = {
-      google_event_id: null,
-      synced_with_calendar: false,
-      last_synced_at: new Date().toISOString(),
-    };
-
-    const supabase = await createServerSupabaseClient();
-    await updateTasksQuery(supabase, deleteUpdates)
-      .eq('id', task.id);
-
+    // Task will be deleted by the caller - don't update here to avoid race condition
     return {
       success: true,
     };
```

## Lecciones Aprendidas

1. **Race Conditions en Operaciones Delete:** Cuando se eliminan recursos, evitar intentar actualizarlos simultáneamente desde múltiples lugares. La eliminación debe ser atómica y manejada desde un único punto de control.

2. **Separación de Responsabilidades:** Las funciones de utilidad (como `deleteCalendarEvent`) no deben asumir responsabilidades sobre el ciclo de vida de las entidades. Deben hacer su trabajo específico y dejar que el código llamante maneje las consecuencias.

3. **Optimistic UI Updates:** Para operaciones de cambio de estado simples (toggle, complete, etc.), implementar actualización optimista mejora dramáticamente la experiencia de usuario. La UI debe responder inmediatamente mientras la persistencia ocurre en background.

4. **Props como Injection Points:** Usar callbacks opcionales en componentes permite a los componentes padres inyectar comportamiento personalizado sin romper la funcionalidad por defecto. Esto es especialmente útil para optimizaciones como optimistic updates.

5. **Fallback Patterns:** Mantener el comportamiento por defecto cuando no se provee un callback personalizado asegura que el componente funcione correctamente en todos los contextos de uso.

6. **Testing de Race Conditions:** Las race conditions son difíciles de detectar en desarrollo porque dependen del timing. Es importante:
   - Pensar en el orden de las operaciones
   - Considerar qué pasa si las operaciones ocurren simultáneamente
   - Probar en condiciones de red lenta
   - Usar herramientas de debugging para pausar ejecución

7. **Estado Local vs Servidor:** En aplicaciones con sincronización en tiempo real (Supabase Realtime), es crucial coordinar:
   - Cuándo actualizar el estado local (optimistic)
   - Cuándo confiar en las actualizaciones del servidor (realtime subscriptions)
   - Cómo manejar conflictos entre ambos

## Prevención

Para evitar problemas similares en el futuro:

1. **Code Review Checklist para Delete Operations:**
   - Verificar que solo haya un punto donde se elimina el recurso
   - Confirmar que no hay intentos de actualizar el recurso después de eliminarlo
   - Revisar el orden de operaciones para identificar posibles race conditions

2. **Pattern para Operaciones Delete + External Sync:**
   ```typescript
   // ✅ PATRÓN CORRECTO
   async function deleteTaskWithCalendar(taskId: string) {
     // 1. Delete external resources first (calendar event)
     await deleteCalendarEvent(userId, task)

     // 2. Delete from database (single atomic operation)
     await supabase.from('tasks').delete().eq('id', taskId)

     // 3. Update local state
     setTasks(prev => prev.filter(t => t.id !== taskId))
   }
   ```

3. **UI Responsiveness Standards:**
   - Toda interacción del usuario debe tener feedback inmediato (< 100ms)
   - Usar optimistic updates para operaciones predecibles
   - Mostrar loading states solo para operaciones que requieren espera
   - Implementar rollback para cuando fallan las operaciones optimistas

4. **Component API Design:**
   - Proveer callbacks para permitir personalización de comportamiento
   - Mantener comportamiento por defecto funcional
   - Documentar cuándo usar cada approach (local vs callback)

5. **Logging y Debugging:**
   - Agregar logs detallados en operaciones críticas
   - Incluir timestamps para detectar race conditions
   - Log del estado antes y después de operaciones

## Referencias

- Commit: 7ebb9a6f7973d382136c8e9a7e30ae79fe1cca21
- Archivos modificados:
  - `components/TaskItem.tsx` - Agregó callback onToggleComplete
  - `components/TaskList.tsx` - Conectó handleComplete con TaskItem
  - `lib/google-calendar/sync.ts` - Removió update de task en deleteCalendarEvent
- Conceptos relacionados:
  - Race conditions en operaciones de base de datos
  - Optimistic UI updates pattern
  - Supabase Realtime synchronization
  - React component callback patterns
