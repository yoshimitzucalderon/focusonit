# Manejo de Timezone y Fechas - Documentacion Tecnica

## Resumen

Este documento describe la implementacion completa del manejo de fechas y timezones en FocusOnIt, incluyendo la solucion al problema de discrepancia de fechas entre voz y frontend.

## Problema Original

### Sintoma

Cuando se decia por voz "Ir al veterinario el 15 de octubre", el frontend mostraba "14 de oct" (1 dia menos).

### Causa Raiz

- n8n enviaba correctamente: `dueDate: "2025-10-15"`
- El frontend usaba `new Date("2025-10-15")` que JavaScript interpreta como **medianoche UTC**
- Al convertir a timezone local (Pacifico UTC-7/8), retroced ia 1 dia: **14 de octubre a las 5pm**

## Solucion Implementada

### Estrategia

Reemplazar TODAS las conversiones problematicas con funciones que mantienen el dia correcto sin importar el timezone.

### Funciones Centrales

#### 1. `parseDateString(dateString: string): Date`

Para leer fechas de base de datos.

**Ubicacion**: `lib/utils/timezone.ts` linea 84

```typescript
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  // Verificar que el dia sea correcto
  if (date.getDate() !== day) {
    console.warn('WARNING: parseDateString - dia incorrecto!');
    date.setDate(day); // Forzar correccion
  }

  return date;
}
```

**Por que funciona**:

- Usa el constructor `new Date(year, month, day, hour)` que SIEMPRE usa timezone local
- Hora a mediodia (12:00) evita problemas con DST (Daylight Saving Time)
- Validacion adicional fuerza el dia correcto si hubo algun problema

**Uso**:

```typescript
// Input: "2025-10-15"
// Output: Date object con dia 15 a mediodia (12:00) en timezone local
const taskDueDate = task.due_date ? parseDateString(task.due_date) : null
```

#### 2. `toDateOnlyString(date: Date): string`

Para guardar fechas en base de datos.

**Ubicacion**: `lib/utils/timezone.ts` linea 114

```typescript
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
```

**Por que funciona**:

- Usa `getFullYear()`, `getMonth()`, `getDate()` que leen timezone local
- NO usa `toISOString()` que convierte a UTC

**Uso**:

```typescript
// Input: Date object
// Output: "2025-10-15"
const dueDateString = toDateOnlyString(dueDate)
```

#### 3. `getPacificTimestamp(): string`

Para timestamps completos (created_at, updated_at, completed_at).

**Ubicacion**: `lib/utils/timezone.ts`

```typescript
export function getPacificTimestamp(): string {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles'
  }));

  const year = pacificTime.getFullYear();
  const month = String(pacificTime.getMonth() + 1).padStart(2, '0');
  const day = String(pacificTime.getDate()).padStart(2, '0');
  const hours = String(pacificTime.getHours()).padStart(2, '0');
  const minutes = String(pacificTime.getMinutes()).padStart(2, '0');
  const seconds = String(pacificTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
```

**Uso**:

```typescript
// Crear tarea
const newTask = {
  title: 'Mi tarea',
  created_at: getPacificTimestamp()
}
```

## Archivos Modificados

### 1. components/TaskItem.tsx

**Cambios**:

- Linea 13: Import `parseDateString`
- Linea 119: `const taskDueDate = task.due_date ? parseDateString(task.due_date) : null`
- Linea 317: DatePicker usa `value={taskDueDate}`

**Impacto**: Las tareas ahora muestran el dia correcto en la vista individual.

### 2. components/DashboardHeader.tsx

**Cambios**:

- Linea 12: Import `toDateOnlyString, parseDateString`
- Linea 103: Guardar tarea rapida usa `toDateOnlyString(parsedDate)`
- Linea 144: Guardar tarea completa usa `toDateOnlyString(dueDate)`
- Lineas 223, 310: VoiceTaskButton usa `parseDateString(task.dueDate)`

**Impacto**: Tareas creadas desde el header ya no pierden 1 dia.

### 3. app/(dashboard)/today/page.tsx

**Cambios**:

- Linea 13: Import `parseDateString, toDateOnlyString`
- Linea 41: Comparar fechas usa `parseDateString(task.due_date)`
- Linea 71: Mover tareas a hoy usa `toDateOnlyString(today)`

**Impacto**: La vista "Hoy" clasifica correctamente tareas atrasadas vs tareas de hoy.

### 4. app/(dashboard)/week/page.tsx

**Cambios**:

- Linea 13: Import `parseDateString`
- Linea 33: Filtrar por dia usa `parseDateString(task.due_date)`

**Impacto**: La vista "Semana" agrupa correctamente tareas por dia.

### 5. app/(dashboard)/all/page.tsx

**Cambios**:

- Linea 11: Import `parseDateString`
- Linea 30: Ordenar por fecha usa `parseDateString(a.due_date).getTime()`

**Impacto**: La vista "Todas" ordena correctamente las tareas por fecha.

### 6. n8n-code-bulletproof.js

**Procesamiento de voz**:

- Genera `createdAt: pacificTimestamp` (linea 83)
- Anade `source: 'voice'` para identificar origen
- Fallback tambien usa hora del Pacifico (linea 124)

## Campos de Timestamp en Supabase

| Campo | Cuando se actualiza | Generado por | Timezone |
|-------|---------------------|--------------|----------|
| `created_at` | Al crear tarea | Frontend o n8n | America/Los_Angeles |
| `updated_at` | Al modificar titulo, fecha, descripcion | Frontend | America/Los_Angeles |
| `completed_at` | Al marcar como completada | Frontend | America/Los_Angeles |
| `due_date` | Al asignar fecha | Frontend o n8n | Date-only (sin timezone) |

## Formato de Datos

### Timestamps Completos

```typescript
// Ejemplo de timestamp generado
"2025-10-04T14:30:45"
```

**Caracteristicas**:

- Formato ISO 8601
- Sin zona horaria explicita (se asume Pacifico)
- Compatible con Supabase (columnas `timestamp` o `timestamptz`)

### Fechas sin Hora (due_date)

```typescript
// Ejemplo de fecha
"2025-10-15"
```

**Caracteristicas**:

- Formato YYYY-MM-DD
- Sin hora ni timezone
- Para campos tipo `date` en Supabase

## Testing

### Prueba 1: Crear tarea por voz

```
Decir: "Ir al veterinario el 15 de octubre"

✅ n8n procesa: { dueDate: "2025-10-15" }
✅ Frontend parsea con: parseDateString("2025-10-15")
✅ Modal muestra: "15 de oct" (CORRECTO)
✅ Se guarda en BD: "2025-10-15"
```

### Prueba 2: Ver tarea creada

```
✅ TaskItem lee de BD: "2025-10-15"
✅ Parsea con: parseDateString("2025-10-15")
✅ DatePicker muestra: "15 de oct" (CORRECTO)
✅ Validacion de "atrasada" funciona correctamente
```

### Prueba 3: Editar fecha

```
✅ Usuario selecciona: 15 de octubre
✅ Se guarda con: toDateOnlyString(date) → "2025-10-15"
✅ Al recargar muestra: "15 de oct" (CORRECTO)
```

## Antes vs Despues

| Escenario | ANTES | DESPUES |
|-----------|-------|---------|
| Voz: "15 de octubre" | Modal muestra "14 de oct" | Modal muestra "15 de oct" |
| BD guarda: "2025-10-15" | DatePicker muestra "14 de oct" | DatePicker muestra "15 de oct" |
| Clasificar "Hoy" vs "Atrasadas" | Fecha incorrecta, clasifica mal | Clasifica correctamente |
| Ordenar por fecha | Orden incorrecto | Orden correcto |

## Anti-Patrones Eliminados

### NUNCA hacer

```typescript
// INCORRECTO - convierte a UTC
new Date("2025-10-15")  // → Oct 14, 2025 17:00 (si timezone es UTC-7)

// INCORRECTO - convierte a UTC
dueDate.toISOString()  // → "2025-10-14T19:00:00.000Z"

// INCORRECTO - usa UTC
dueDate.toISOString().split('T')[0]  // → "2025-10-14"
```

### SIEMPRE hacer

```typescript
// CORRECTO - mantiene dia local
parseDateString("2025-10-15")  // → Oct 15, 2025 12:00

// CORRECTO - mantiene dia local
toDateOnlyString(dueDate)  // → "2025-10-15"

// CORRECTO - para timestamps completos
getPacificTimestamp()  // → "2025-10-04T14:30:45"
```

## Reglas de Oro

### Para campos `due_date` (solo fecha, sin hora)

- **Leer de BD**: `parseDateString(task.due_date)`
- **Guardar a BD**: `toDateOnlyString(date)`
- **NUNCA**: `new Date(string)` o `.toISOString()`

### Para timestamps (created_at, updated_at, completed_at)

- **Generar**: `getPacificTimestamp()` (n8n o frontend)
- **OK usar**: `.toISOString()` porque incluye hora y timezone
- **Convertir a Pacific**: `toPacificTimestamp(date)`

## Lecciones Aprendidas

### 1. JavaScript `new Date(string)` es peligroso

- Parsea como UTC si el string no tiene timezone
- Siempre usar constructor con componentes: `new Date(year, month, day)`

### 2. `.toISOString()` convierte a UTC

- Solo usar para timestamps completos (created_at, completed_at)
- NUNCA para fechas sin hora (due_date)

### 3. Timezone local vs UTC

- Para fechas de calendario (cumpleanos, deadlines), usar timezone local
- Para timestamps de eventos (creacion, edicion), usar timezone especifico esta OK

### 4. Testing exhaustivo

- Probar en diferentes timezones
- Probar cerca de medianoche
- Probar con cambio de horario (DST)

## Configuracion de Supabase (Opcional)

### Opcion 1: Dejar que el frontend maneje todo (Implementado)

```sql
-- Columnas sin DEFAULT, el frontend envia el valor
created_at timestamp
updated_at timestamp
completed_at timestamp
due_date date
```

### Opcion 2: Default timezone-aware en Supabase (Opcional)

```sql
-- Si quieres un fallback en la BD
ALTER TABLE tasks
  ALTER COLUMN created_at SET DEFAULT NOW() AT TIME ZONE 'America/Los_Angeles';

ALTER TABLE tasks
  ALTER COLUMN updated_at SET DEFAULT NOW() AT TIME ZONE 'America/Los_Angeles';
```

## Prevencion Futura

Para evitar este problema en futuras features:

1. **Siempre usa funciones de timezone.ts** para fechas
2. **No uses `new Date(string)`** directamente
3. **Distingue entre**:
   - Fechas de calendario (due_date) → `parseDateString/toDateOnlyString`
   - Timestamps de eventos (created_at) → `getPacificTimestamp`
4. **Testea con diferentes timezones** durante desarrollo
5. **Documenta el timezone** esperado en comentarios del codigo

## Referencias

- Commit: `f5065e0` - Fix DEFINITIVO: Reemplazar TODOS los new Date(due_date)...
- Fecha: 2025-10-04
- Archivos cambiados: 5
- Lineas modificadas: +18, -13

## Checklist de Verificacion

- [x] TaskItem.tsx - Corregido
- [x] DashboardHeader.tsx - Corregido
- [x] today/page.tsx - Corregido
- [x] week/page.tsx - Corregido
- [x] all/page.tsx - Corregido
- [x] TaskInput.tsx - Ya estaba correcto
- [x] TaskList.tsx - Ya estaba correcto
- [x] n8n code node - Ya estaba correcto
- [x] Deploy a Vercel - Completo

---

Para mas informacion sobre la implementacion de voz, ver `docs/integrations/n8n/` (placeholder).

Para troubleshooting de fechas, ver `docs/troubleshooting/dates.md` (placeholder).

---

**Ultima actualizacion**: 2025-11-11
