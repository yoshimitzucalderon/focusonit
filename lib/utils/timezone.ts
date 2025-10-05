/**
 * Utilidades para manejo de timezones y fechas
 */

/**
 * Obtiene la fecha/hora actual en el timezone LOCAL del navegador
 * @returns string en formato ISO compatible con Supabase timestamptz
 */
export function getLocalTimestamp(): string {
  const now = new Date();

  // Formato: "2025-10-04T14:30:45-07:00" (incluye offset del timezone)
  // Esto es compatible con Supabase timestamptz y usa la hora local del usuario
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Obtener offset del timezone (ej: -07:00 para Pacífico, -05:00 para Este)
  const offset = -now.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const offsetSign = offset >= 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Obtiene la fecha/hora actual en timezone del Pacífico (America/Los_Angeles)
 * @deprecated Usa getLocalTimestamp() para respetar el timezone del usuario
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
 * Parsea una fecha en formato YYYY-MM-DD o ISO 8601 y la convierte a un Date object
 * usando el timezone local del navegador (evita conversión UTC)
 * @param dateString - Fecha en formato "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss+00:00" (ISO 8601)
 * @returns Date object con la fecha correcta a mediodía
 */
export function parseDateString(dateString: string): Date {
  // Manejar diferentes formatos de entrada
  let dateOnly: string;

  if (dateString.includes('T')) {
    // Formato ISO 8601: "2025-10-06T00:00:00+00:00"
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    dateOnly = dateString.split('T')[0];
  } else {
    // Formato simple: "2025-10-06"
    dateOnly = dateString;
  }

  // Separar año, mes, día
  const parts = dateOnly.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validar que los valores son números válidos
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error('❌ ERROR parseDateString: Fecha inválida');
    console.error('  Input:', dateString);
    console.error('  Parseado:', { year, month, day });
    // Retornar fecha actual como fallback
    return new Date();
  }

  // CRÍTICO: Crear fecha a mediodía para evitar problemas de timezone
  // El constructor new Date(year, month, day, hour) usa SIEMPRE el timezone local
  // Usamos 12:00 para que incluso con DST no cambie de día
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  // Verificar que la fecha se creó correctamente
  if (date.getDate() !== day) {
    console.warn('⚠️ WARNING: parseDateString - día incorrecto!');
    console.warn('  Input:', dateString);
    console.warn('  Parseado como:', dateOnly);
    console.warn('  Componentes:', { year, month, day });
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
