/**
 * Utilidades para manejo de timezone del Pacífico (America/Los_Angeles)
 */

/**
 * Obtiene la fecha/hora actual en timezone del Pacífico
 * @returns string en formato ISO: "2025-10-04T14:30:45"
 */
export function getPacificTimestamp(): string {
  const now = new Date();

  const pacificTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const parts: Record<string, string> = {};
  pacificTime.forEach(part => {
    parts[part.type] = part.value;
  });

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Convierte una fecha a timestamp del Pacífico
 * @param date - Fecha a convertir
 * @returns string en formato ISO: "2025-10-04T14:30:45"
 */
export function toPacificTimestamp(date: Date): string {
  const pacificTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const parts: Record<string, string> = {};
  pacificTime.forEach(part => {
    parts[part.type] = part.value;
  });

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * Obtiene solo la fecha (sin hora) en timezone del Pacífico
 * @returns string en formato: "2025-10-04"
 */
export function getPacificDate(): string {
  const now = new Date();

  const pacificTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const parts: Record<string, string> = {};
  pacificTime.forEach(part => {
    parts[part.type] = part.value;
  });

  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Parsea una fecha en formato YYYY-MM-DD y la convierte a un Date object
 * usando el timezone local del navegador (evita conversión UTC)
 * @param dateString - Fecha en formato "YYYY-MM-DD"
 * @returns Date object con la fecha correcta a mediodía
 */
export function parseDateString(dateString: string): Date {
  // Separar año, mes, día
  const [year, month, day] = dateString.split('-').map(Number);

  // CRÍTICO: Crear fecha a mediodía para evitar problemas de timezone
  // El constructor new Date(year, month, day, hour) usa SIEMPRE el timezone local
  // Usamos 12:00 para que incluso con DST no cambie de día
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  // Verificar que la fecha se creó correctamente
  if (date.getDate() !== day) {
    console.warn('⚠️ WARNING: parseDateString - día incorrecto!');
    console.warn('  Input:', dateString, '→ día esperado:', day);
    console.warn('  Date object creado:', date);
    console.warn('  getDate():', date.getDate(), '(debería ser', day, ')');

    // Forzar el día correcto
    date.setDate(day);
    console.warn('  Corregido a:', date, '→ getDate():', date.getDate());
  }

  return date;
}

/**
 * Convierte un Date object a string en formato YYYY-MM-DD
 * usando el timezone local (NO convierte a UTC)
 * @param date - Date object a convertir
 * @returns string en formato "YYYY-MM-DD"
 */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
// Fix timezone parsing - $(date)
