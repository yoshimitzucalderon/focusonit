/**
 * Utilidades para normalizar y validar formatos de tiempo
 * Asegura que todos los tiempos estén en formato HH:MM consistente
 */

/**
 * Valida si un string está en formato de tiempo válido HH:MM o HH:MM:SS
 */
export const isValidTimeFormat = (time: any): boolean => {
  if (!time) return false
  if (typeof time !== 'string') return false

  // Acepta HH:MM o HH:MM:SS
  return /^\d{2}:\d{2}(:\d{2})?$/.test(time)
}

/**
 * Normaliza cualquier formato de tiempo a HH:MM
 * Maneja casos de:
 * - HH:MM:SS → HH:MM
 * - Timestamps → HH:MM
 * - Formatos inválidos → valor por defecto
 */
export const normalizeTime = (time: any, defaultValue: string = '09:00'): string => {
  // Si es null o undefined, retornar default
  if (!time) {
    console.warn('⚠️ Tiempo nulo o indefinido, usando default:', defaultValue)
    return defaultValue
  }

  // Si ya es string válido en formato HH:MM o HH:MM:SS
  if (typeof time === 'string') {
    const timePattern = /^(\d{2}):(\d{2})(:\d{2})?$/
    const match = time.match(timePattern)

    if (match) {
      const hours = parseInt(match[1])
      const minutes = parseInt(match[2])

      // Validar rangos
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Retornar solo HH:MM (sin segundos)
        return `${match[1]}:${match[2]}`
      }
    }

    // Intentar parsear como timestamp ISO
    try {
      const date = new Date(time)
      if (!isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, '0')
        const mins = date.getMinutes().toString().padStart(2, '0')
        console.log('✅ Tiempo parseado de timestamp:', time, '→', `${hours}:${mins}`)
        return `${hours}:${mins}`
      }
    } catch (e) {
      console.error('❌ Error parseando tiempo como timestamp:', time, e)
    }
  }

  // Si es Date object
  if (time instanceof Date && !isNaN(time.getTime())) {
    const hours = time.getHours().toString().padStart(2, '0')
    const mins = time.getMinutes().toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  // Si es número (minutos desde medianoche)
  if (typeof time === 'number' && time >= 0 && time <= 1439) {
    const hours = Math.floor(time / 60).toString().padStart(2, '0')
    const mins = (time % 60).toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  console.error('❌ Formato de tiempo no reconocido:', time, typeof time)
  return defaultValue
}

/**
 * Convierte tiempo HH:MM a minutos desde medianoche
 */
export const timeToMinutes = (time: string): number => {
  const normalized = normalizeTime(time)
  const [hours, minutes] = normalized.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 */
export const minutesToTime = (minutes: number): string => {
  const clampedMinutes = Math.max(0, Math.min(1439, minutes))
  const hours = Math.floor(clampedMinutes / 60)
  const mins = clampedMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Valida y normaliza un objeto Task completo
 */
export const normalizeTaskTimes = (task: any): any => {
  const normalized = { ...task }

  if (task.start_time) {
    const original = task.start_time
    normalized.start_time = normalizeTime(task.start_time)

    if (original !== normalized.start_time) {
      console.log(`🔧 Normalizado start_time para tarea ${task.id}: ${original} → ${normalized.start_time}`)
    }
  }

  if (task.end_time) {
    const original = task.end_time
    normalized.end_time = normalizeTime(task.end_time)

    if (original !== normalized.end_time) {
      console.log(`🔧 Normalizado end_time para tarea ${task.id}: ${original} → ${normalized.end_time}`)
    }
  }

  // Validar que end_time > start_time
  if (normalized.start_time && normalized.end_time) {
    const startMinutes = timeToMinutes(normalized.start_time)
    const endMinutes = timeToMinutes(normalized.end_time)

    if (endMinutes <= startMinutes) {
      console.error('❌ ERROR: end_time debe ser mayor que start_time', {
        taskId: task.id,
        start: normalized.start_time,
        end: normalized.end_time
      })
      // Ajustar end_time a start_time + 1 hora
      normalized.end_time = minutesToTime(startMinutes + 60)
      console.log(`🔧 Ajustado end_time a ${normalized.end_time}`)
    }
  }

  return normalized
}

/**
 * Diagnostica problemas en los tiempos de una tarea
 */
export const diagnoseTaskTimes = (task: any): {
  hasIssues: boolean
  issues: string[]
  normalized: any
} => {
  const issues: string[] = []

  // Verificar start_time
  if (!task.start_time) {
    issues.push('start_time es null o undefined')
  } else if (!isValidTimeFormat(task.start_time)) {
    issues.push(`start_time tiene formato inválido: ${task.start_time} (${typeof task.start_time})`)
  }

  // Verificar end_time
  if (!task.end_time) {
    issues.push('end_time es null o undefined')
  } else if (!isValidTimeFormat(task.end_time)) {
    issues.push(`end_time tiene formato inválido: ${task.end_time} (${typeof task.end_time})`)
  }

  // Verificar orden
  if (task.start_time && task.end_time && isValidTimeFormat(task.start_time) && isValidTimeFormat(task.end_time)) {
    const startMinutes = timeToMinutes(task.start_time)
    const endMinutes = timeToMinutes(task.end_time)

    if (endMinutes <= startMinutes) {
      issues.push(`end_time (${task.end_time}) no es mayor que start_time (${task.start_time})`)
    }
  }

  const normalized = normalizeTaskTimes(task)

  return {
    hasIssues: issues.length > 0,
    issues,
    normalized
  }
}
