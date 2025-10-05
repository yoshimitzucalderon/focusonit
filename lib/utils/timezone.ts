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
