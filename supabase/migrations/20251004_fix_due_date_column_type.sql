-- ============================================
-- FIX: Cambiar due_date de timestamptz a date
-- ============================================
-- Fecha: 2025-10-04
-- Razón: due_date solo debe guardar fechas (YYYY-MM-DD) sin hora/timezone
--        para evitar problemas de conversión UTC

-- 1. Cambiar el tipo de columna de timestamptz a date
-- Esto automáticamente convierte los valores existentes extrayendo solo la fecha
ALTER TABLE tasks
  ALTER COLUMN due_date TYPE date
  USING due_date::date;

-- 2. Verificar que el cambio se aplicó correctamente
-- Ejecuta esta query después de correr la migración:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'tasks' AND column_name = 'due_date';
--
-- Debería mostrar: due_date | date

-- NOTA: Esta migración preserva todos los datos existentes
-- Los timestamps se convierten automáticamente a fechas
-- Ejemplo: "2025-10-06T00:00:00+00:00" → "2025-10-06"
