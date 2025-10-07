-- ============================================
-- ADD TASK METADATA COLUMNS
-- ============================================
-- Agregar columnas para prioridad, tiempo estimado, etiquetas y recordatorios

-- Agregar columna de prioridad
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('baja', 'media', 'alta'));

-- Agregar columna de tiempo estimado (en minutos)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS time_estimate integer;

-- Agregar columna de etiquetas (array de texto)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS tags text[];

-- Agregar columna de recordatorio
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false;

-- Agregar columna de fecha/hora del recordatorio
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS reminder_at timestamptz;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_tags_idx ON tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS tasks_reminder_at_idx ON tasks(reminder_at) WHERE reminder_enabled = true;

-- Comentarios para documentación
COMMENT ON COLUMN tasks.priority IS 'Prioridad de la tarea: baja, media, alta';
COMMENT ON COLUMN tasks.time_estimate IS 'Tiempo estimado para completar la tarea en minutos';
COMMENT ON COLUMN tasks.tags IS 'Etiquetas o categorías de la tarea';
COMMENT ON COLUMN tasks.reminder_enabled IS 'Si está activado el recordatorio para esta tarea';
COMMENT ON COLUMN tasks.reminder_at IS 'Fecha y hora del recordatorio';
