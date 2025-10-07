# Migración de Base de Datos - Nuevos Campos de Tarea

## Columnas agregadas

Esta migración agrega las siguientes columnas a la tabla `tasks`:

1. **`priority`** (text): Prioridad de la tarea (`'baja'`, `'media'`, `'alta'`)
2. **`time_estimate`** (integer): Tiempo estimado en minutos
3. **`tags`** (text[]): Array de etiquetas/categorías
4. **`reminder_enabled`** (boolean): Si el recordatorio está activado
5. **`reminder_at`** (timestamptz): Fecha y hora del recordatorio

## Cómo ejecutar la migración

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia el contenido de `20250106_add_task_metadata_columns.sql`
4. Pégalo en el editor y haz clic en **Run**

### Opción 2: Supabase CLI

```bash
# Asegúrate de estar en el directorio del proyecto
cd task-manager

# Ejecuta la migración
npx supabase db push
```

## Verificar la migración

Ejecuta esta query en el SQL Editor para verificar que las columnas se agregaron correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

Deberías ver las nuevas columnas listadas.

## Funcionalidad de Recordatorios

**Nota**: La columna `reminder_enabled` solo guarda si el usuario quiere un recordatorio. La funcionalidad real de enviar notificaciones requiere:

1. **Supabase Edge Functions** - Para ejecutar código en el servidor
2. **Cron Job** - Para verificar recordatorios pendientes
3. **Email/Push Notifications** - Para enviar las notificaciones

Por ahora, solo se guarda la preferencia del usuario. La implementación de notificaciones es un TODO futuro.

## Rollback

Si necesitas revertir esta migración:

```sql
ALTER TABLE tasks
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS time_estimate,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS reminder_enabled,
  DROP COLUMN IF EXISTS reminder_at;

DROP INDEX IF EXISTS tasks_priority_idx;
DROP INDEX IF EXISTS tasks_tags_idx;
DROP INDEX IF EXISTS tasks_reminder_at_idx;
```
