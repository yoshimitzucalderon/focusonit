# 🍅 Pomodoro Timer - Setup Guide

Sistema de time tracking tipo Pomodoro integrado en FocusOnIt.

## 📋 Fase 1: Base de Datos (REQUERIDA)

### Aplicar Migración en Supabase

**Archivo:** `supabase/migrations/20250102_add_time_sessions.sql`

**Opciones para aplicar:**

#### Opción 1: Supabase CLI (Recomendado)
```bash
# Navegar al directorio del proyecto
cd task-manager

# Aplicar migración
supabase db push
```

#### Opción 2: Supabase Dashboard
1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. SQL Editor → New Query
4. Copiar y pegar el contenido de `20250102_add_time_sessions.sql`
5. Clic en **Run**

### Verificar Migración

Ejecuta este query en SQL Editor para verificar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'time_sessions';

-- Debería retornar 1 fila con: time_sessions
```

## 🎯 Funcionalidades Implementadas

### 1. Timer de 25 Minutos
- Botón Play/Pause integrado en cada tarea
- Countdown visible: `25:00` → `24:59` → ... → `00:00`
- Solo 1 timer activo a la vez por usuario
- Al iniciar un nuevo timer, pausa automáticamente cualquier timer activo

### 2. Persistencia Robusta
- **Supabase**: Almacena todas las sesiones completadas y en progreso
- **LocalStorage**: Backup del timer activo (sobrevive a refreshes)
- **Heartbeat**: Actualiza Supabase cada 30 segundos mientras corre

### 3. Tiempo Total Acumulado
- Badge que muestra tiempo total por tarea: `2h 15m`
- Suma automática de todas las sesiones de la tarea
- Visible solo si hay tiempo acumulado

### 4. UX Mejorada
- ✅ Animación de pulse cuando timer está activo
- ✅ Toast de éxito al completar Pomodoro
- ✅ Sonido opcional (si archivo existe en `/public/sounds/pomodoro-complete.mp3`)
- ✅ Timer solo visible en tareas no completadas
- ✅ Diseño minimalista que no rompe layout

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
```
supabase/migrations/
  └── 20250102_add_time_sessions.sql      # Migración de DB

types/
  └── database.types.ts                   # Actualizado con TimeSession

lib/supabase/
  └── timeSessionQueries.ts               # Queries para time sessions

lib/hooks/
  └── usePomodoroTimer.ts                 # Hook principal del timer

components/
  └── PomodoroTimer.tsx                   # Componente UI del timer
```

### Archivos Modificados
```
components/TaskItem.tsx                   # Integración del timer
```

## 🔐 Seguridad y RLS

### Políticas Implementadas

Todas las políticas están en la migración y siguen el patrón existente de la app:

```sql
-- SELECT: Solo ver tus propias sesiones
CREATE POLICY "Users can view their own time sessions"
  ON time_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Solo crear sesiones propias
CREATE POLICY "Users can create their own time sessions"
  ON time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo actualizar sesiones propias
CREATE POLICY "Users can update their own time sessions"
  ON time_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Solo eliminar sesiones propias
CREATE POLICY "Users can delete their own time sessions"
  ON time_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

## 🧪 Testing

### Test Manual - Flujo Básico

1. **Iniciar Timer**
   - Abrir tarea sin completar
   - Clic en botón Play
   - Verificar countdown inicia: `25:00`
   - Verificar animación de pulse

2. **Pausar Timer**
   - Clic en botón Pause
   - Verificar tiempo se guarda en badge total
   - Verificar timer se detiene

3. **Completar Pomodoro**
   - Iniciar timer nuevo
   - Esperar 25 minutos (o modificar `POMODORO_DURATION` temporalmente)
   - Verificar toast de éxito
   - Verificar tiempo se suma al total

4. **One Timer at a Time**
   - Iniciar timer en Tarea A
   - Sin pausar, iniciar timer en Tarea B
   - Verificar que timer de Tarea A se pausa automáticamente

5. **Persistencia**
   - Iniciar timer
   - Refrescar página (F5)
   - Verificar timer continúa desde donde estaba

### Test Edge Cases

**Eliminar tarea con timer activo:**
```sql
-- Manual: Eliminar tarea desde Supabase Dashboard
-- Verificar: CASCADE elimina sesiones asociadas
SELECT * FROM time_sessions WHERE task_id = '<id_tarea_eliminada>';
-- Debería retornar 0 filas
```

**Usuario sin sesiones:**
- Verificar badge total NO aparece
- Verificar solo aparece botón Play

## 🎨 Personalización

### Cambiar Duración del Pomodoro

Editar `lib/hooks/usePomodoroTimer.ts`:

```typescript
// Cambiar de 25 minutos a otro valor
const POMODORO_DURATION = 15 * 60 // 15 minutos
```

### Agregar Sonido de Completado

1. Crear archivo `public/sounds/pomodoro-complete.mp3`
2. El hook ya tiene el código para reproducirlo

### Colores del Timer

Editar `components/PomodoroTimer.tsx`:

```typescript
// Timer activo (línea 23-24)
bg-blue-50 dark:bg-blue-900/20 text-blue-600

// Timer inactivo (línea 25-26)
bg-gray-50 dark:bg-slate-700 text-gray-600
```

## 📊 Queries Útiles

### Ver todas las sesiones de un usuario
```sql
SELECT
  ts.id,
  t.title,
  ts.duration_seconds / 60 as duration_minutes,
  ts.is_completed,
  ts.started_at
FROM time_sessions ts
JOIN tasks t ON t.id = ts.task_id
WHERE ts.user_id = auth.uid()
ORDER BY ts.started_at DESC;
```

### Estadísticas de productividad
```sql
SELECT
  DATE(started_at) as date,
  COUNT(*) as pomodoros_completed,
  SUM(duration_seconds) / 3600 as total_hours
FROM time_sessions
WHERE user_id = auth.uid()
  AND is_completed = true
GROUP BY DATE(started_at)
ORDER BY date DESC
LIMIT 30;
```

## 🚀 Próximos Pasos (Fase 2 - Opcional)

- [ ] Auto-start de breaks (5 min break después de Pomodoro)
- [ ] Estadísticas semanales/mensuales
- [ ] Gráficos de productividad
- [ ] Sesiones personalizadas (custom duration)
- [ ] Integración con Google Calendar (sesiones como eventos)
- [ ] Notificaciones push cuando termina Pomodoro

## 🐛 Troubleshooting

### Timer no aparece
- ✅ Verificar migración aplicada: `SELECT * FROM time_sessions LIMIT 1;`
- ✅ Verificar tipos TypeScript actualizados
- ✅ Refresh hard: Ctrl+Shift+R

### Timer no guarda progreso
- ✅ Verificar localStorage habilitado
- ✅ Verificar RLS policies: `SELECT * FROM time_sessions WHERE user_id = auth.uid();`
- ✅ Revisar console de errores

### Multiple timers activos
- ✅ Ejecutar: `SELECT * FROM time_sessions WHERE is_active = true AND user_id = auth.uid();`
- ✅ Si hay más de 1, pausar manualmente:
```sql
UPDATE time_sessions
SET is_active = false, ended_at = now()
WHERE user_id = auth.uid() AND is_active = true;
```

## 📞 Soporte

Si encuentras problemas:
1. Revisar console del browser (F12)
2. Revisar logs de Supabase Dashboard
3. Verificar políticas RLS
4. Comprobar que migración se aplicó correctamente
