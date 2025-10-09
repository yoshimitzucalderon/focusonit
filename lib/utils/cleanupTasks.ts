/**
 * Script de limpieza de datos para tareas
 * Normaliza todos los formatos de tiempo en la base de datos
 */

import { createClient } from '@/lib/supabase/client'
import { normalizeTaskTimes, diagnoseTaskTimes, isValidTimeFormat } from './timeNormalization'

export interface CleanupResult {
  totalTasks: number
  tasksWithIssues: number
  tasksUpdated: number
  errors: Array<{ taskId: string; error: string }>
  details: Array<{
    taskId: string
    title: string
    issues: string[]
    changes: {
      start_time?: { old: string; new: string }
      end_time?: { old: string; new: string }
    }
  }>
}

/**
 * Limpia y normaliza todas las tareas de un usuario
 */
export const cleanupAllTasks = async (userId?: string): Promise<CleanupResult> => {
  console.log('🧹 Iniciando limpieza de tareas...')

  const supabase = createClient()

  const result: CleanupResult = {
    totalTasks: 0,
    tasksWithIssues: 0,
    tasksUpdated: 0,
    errors: [],
    details: []
  }

  try {
    // Obtener todas las tareas (del usuario si se especifica)
    let query = supabase.from('tasks').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('❌ Error obteniendo tareas:', error)
      throw error
    }

    if (!tasks || tasks.length === 0) {
      console.log('ℹ️ No hay tareas para limpiar')
      return result
    }

    result.totalTasks = tasks.length
    console.log(`📊 Analizando ${result.totalTasks} tareas...`)

    // Analizar y normalizar cada tarea
    for (const task of tasks) {
      // Diagnóstico
      const diagnosis = diagnoseTaskTimes(task)
      const taskAny = task as any

      if (diagnosis.hasIssues) {
        result.tasksWithIssues++

        console.log(`⚠️ Tarea con problemas encontrada:`, {
          id: taskAny.id,
          title: taskAny.title,
          issues: diagnosis.issues
        })

        // Preparar cambios
        const updates: any = {
          updated_at: new Date().toISOString()
        }
        const changes: any = {}

        // Verificar y actualizar start_time
        if (taskAny.start_time !== diagnosis.normalized.start_time) {
          updates.start_time = diagnosis.normalized.start_time
          changes.start_time = {
            old: taskAny.start_time,
            new: diagnosis.normalized.start_time
          }
        }

        // Verificar y actualizar end_time
        if (taskAny.end_time !== diagnosis.normalized.end_time) {
          updates.end_time = diagnosis.normalized.end_time
          changes.end_time = {
            old: taskAny.end_time,
            new: diagnosis.normalized.end_time
          }
        }

        // Si hay cambios, actualizar en BD
        if (Object.keys(changes).length > 0) {
          console.log(`🔧 Actualizando tarea ${taskAny.id} (${taskAny.title}):`, changes)

          const { error: updateError } = await supabase
            .from('tasks')
            // @ts-ignore - Temporary fix for Supabase type inference
            .update(updates)
            .eq('id', taskAny.id)

          if (updateError) {
            console.error(`❌ Error actualizando tarea ${taskAny.id}:`, updateError)
            result.errors.push({
              taskId: taskAny.id,
              error: updateError.message
            })
          } else {
            result.tasksUpdated++
            console.log(`✅ Tarea ${taskAny.id} actualizada correctamente`)
          }

          result.details.push({
            taskId: taskAny.id,
            title: taskAny.title,
            issues: diagnosis.issues,
            changes
          })
        } else {
          console.log(`ℹ️ Tarea ${taskAny.id} tiene problemas pero no requiere cambios en BD`)
        }
      }
    }

    console.log('✅ Limpieza completada:', {
      total: result.totalTasks,
      conProblemas: result.tasksWithIssues,
      actualizadas: result.tasksUpdated,
      errores: result.errors.length
    })

    return result
  } catch (error) {
    console.error('❌ Error fatal en limpieza:', error)
    throw error
  }
}

/**
 * Limpia una tarea específica
 */
export const cleanupSingleTask = async (taskId: string): Promise<{
  success: boolean
  changes?: any
  error?: string
}> => {
  console.log(`🧹 Limpiando tarea individual: ${taskId}`)

  const supabase = createClient()

  try {
    // Obtener la tarea
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return { success: false, error: 'Tarea no encontrada' }
    }

    // Diagnosticar
    const diagnosis = diagnoseTaskTimes(task)
    const taskAny = task as any

    if (!diagnosis.hasIssues) {
      console.log('✅ Tarea no tiene problemas')
      return { success: true }
    }

    // Preparar cambios
    const updates: any = {
      updated_at: new Date().toISOString()
    }
    const changes: any = {}

    if (taskAny.start_time !== diagnosis.normalized.start_time) {
      updates.start_time = diagnosis.normalized.start_time
      changes.start_time = {
        old: taskAny.start_time,
        new: diagnosis.normalized.start_time
      }
    }

    if (taskAny.end_time !== diagnosis.normalized.end_time) {
      updates.end_time = diagnosis.normalized.end_time
      changes.end_time = {
        old: taskAny.end_time,
        new: diagnosis.normalized.end_time
      }
    }

    // Actualizar
    if (Object.keys(changes).length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        // @ts-ignore
        .update(updates)
        .eq('id', taskId)

      if (updateError) {
        console.error('❌ Error actualizando:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log('✅ Tarea actualizada:', changes)
      return { success: true, changes }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Genera reporte de todas las tareas con problemas sin modificar la BD
 */
export const analyzeTasksOnly = async (userId?: string): Promise<CleanupResult> => {
  console.log('🔍 Analizando tareas (sin modificar)...')

  const supabase = createClient()

  const result: CleanupResult = {
    totalTasks: 0,
    tasksWithIssues: 0,
    tasksUpdated: 0,
    errors: [],
    details: []
  }

  try {
    let query = supabase.from('tasks').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: tasks, error } = await query

    if (error) throw error
    if (!tasks) return result

    result.totalTasks = tasks.length

    for (const task of tasks) {
      const diagnosis = diagnoseTaskTimes(task)
      const taskAny = task as any

      if (diagnosis.hasIssues) {
        result.tasksWithIssues++

        const changes: any = {}

        if (taskAny.start_time !== diagnosis.normalized.start_time) {
          changes.start_time = {
            old: taskAny.start_time,
            new: diagnosis.normalized.start_time
          }
        }

        if (taskAny.end_time !== diagnosis.normalized.end_time) {
          changes.end_time = {
            old: taskAny.end_time,
            new: diagnosis.normalized.end_time
          }
        }

        result.details.push({
          taskId: taskAny.id,
          title: taskAny.title,
          issues: diagnosis.issues,
          changes
        })

        console.log('⚠️ Problema encontrado:', {
          id: taskAny.id,
          title: taskAny.title,
          issues: diagnosis.issues,
          changes
        })
      }
    }

    console.log('📊 Análisis completado:', {
      total: result.totalTasks,
      conProblemas: result.tasksWithIssues
    })

    return result
  } catch (error) {
    console.error('❌ Error en análisis:', error)
    throw error
  }
}
