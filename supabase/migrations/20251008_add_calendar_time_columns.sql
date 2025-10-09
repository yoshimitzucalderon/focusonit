-- ============================================
-- ADD CALENDAR TIME COLUMNS
-- ============================================
-- Agregar columnas para gestión de calendario con horarios específicos

-- Agregar columna de hora de inicio
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS start_time TIME;

-- Agregar columna de hora de fin
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Agregar columna para indicar si es tarea de día completo (sin horario específico)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT true;

-- Agregar columna para sincronización con Google Calendar
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_calendar_sync BOOLEAN DEFAULT false;

-- Agregar columna para timestamp de última sincronización
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS tasks_start_time_idx ON tasks(start_time) WHERE start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_end_time_idx ON tasks(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_is_all_day_idx ON tasks(is_all_day);
CREATE INDEX IF NOT EXISTS tasks_google_calendar_sync_idx ON tasks(google_calendar_sync) WHERE google_calendar_sync = true;

-- Agregar constraint para validar que end_time sea posterior a start_time
ALTER TABLE tasks
ADD CONSTRAINT check_time_order CHECK (
  (start_time IS NULL AND end_time IS NULL) OR
  (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time) OR
  (start_time IS NULL OR end_time IS NULL)
);

-- Comentarios para documentación
COMMENT ON COLUMN tasks.start_time IS 'Hora de inicio de la tarea (para vista de calendario)';
COMMENT ON COLUMN tasks.end_time IS 'Hora de finalización de la tarea (para vista de calendario)';
COMMENT ON COLUMN tasks.is_all_day IS 'Indica si la tarea no tiene horario específico (true = sin horario, false = con horario)';
COMMENT ON COLUMN tasks.google_calendar_sync IS 'Indica si la tarea está sincronizada con Google Calendar';
COMMENT ON COLUMN tasks.last_synced_at IS 'Timestamp de la última sincronización con Google Calendar';

-- Nota: Las tareas existentes tendrán is_all_day = true por defecto
-- Esto significa que aparecerán en la sección "sin horario" del calendario
