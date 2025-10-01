import { addDays, addWeeks, setDay, startOfWeek, startOfDay, setHours, setMinutes } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Parsea texto en lenguaje natural a una fecha
 * Ejemplos: "mañana", "lunes", "en 3 dias", "viernes", "próxima semana"
 */
export function parseNaturalDate(text: string): Date | null {
  const normalized = text.toLowerCase().trim()
  const today = startOfDay(new Date())

  // Hoy
  if (normalized.match(/^hoy$/)) {
    return today
  }

  // Mañana
  if (normalized.match(/^ma[ñn]ana$/)) {
    return addDays(today, 1)
  }

  // Pasado mañana
  if (normalized.match(/^pasado\s*ma[ñn]ana$/)) {
    return addDays(today, 2)
  }

  // En X días
  const daysMatch = normalized.match(/^en\s+(\d+)\s+d[ií]as?$/)
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    return addDays(today, days)
  }

  // Próxima semana
  if (normalized.match(/^pr[oó]xima\s+semana$/)) {
    return addWeeks(startOfWeek(today, { locale: es }), 1)
  }

  // Días de la semana
  const dayNames: { [key: string]: number } = {
    'lunes': 1,
    'martes': 2,
    'mi[eé]rcoles': 3,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'v[ií]ernes': 5,
    's[aá]bado': 6,
    'sabado': 6,
    'domingo': 0,
  }

  for (const [pattern, dayNum] of Object.entries(dayNames)) {
    const regex = new RegExp(`^(este\\s+|pr[oó]ximo\\s+)?${pattern}$`)
    if (normalized.match(regex)) {
      const currentDay = today.getDay()
      let targetDate = setDay(today, dayNum, { locale: es })

      // Si el día ya pasó esta semana, mover a la próxima semana
      if (targetDate <= today) {
        targetDate = addWeeks(targetDate, 1)
      }

      return targetDate
    }
  }

  // Fin de semana
  if (normalized.match(/^fin\s+de\s+semana$/)) {
    return setDay(today, 6, { locale: es }) // Sábado
  }

  return null
}

/**
 * Detecta si el input contiene una posible fecha natural
 */
export function containsNaturalDate(text: string): string | null {
  const patterns = [
    /\b(hoy|ma[ñn]ana|pasado\s*ma[ñn]ana)\b/i,
    /\b(lunes|martes|mi[eé]rcoles|jueves|vi[eé]rnes|s[aá]bado|domingo)\b/i,
    /\ben\s+\d+\s+d[ií]as?\b/i,
    /\bpr[oó]xima\s+semana\b/i,
    /\bfin\s+de\s+semana\b/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return null
}
