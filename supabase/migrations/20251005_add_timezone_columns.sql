-- Agregar columnas para guardar el timezone del usuario
-- Esto permite mostrar las fechas en la zona horaria correcta del usuario

-- Agregar columna para el timezone offset (ej: "-07:00" para Pacific, "+00:00" para UTC)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS timezone_offset text;

-- El created_at y updated_at seguirán siendo timestamptz (siempre se guarda como UTC internamente)
-- pero ahora tenemos timezone_offset para saber la zona horaria original del usuario

-- Nota: No es necesario modificar el trigger de updated_at, sigue funcionando igual
