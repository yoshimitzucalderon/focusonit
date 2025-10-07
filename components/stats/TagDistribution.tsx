'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TagStats {
  name: string
  totalMinutes: number
  percentage: number
  taskCount: number
  color: string
}

interface TagDistributionProps {
  sessions: any[]
  tasks: any[]
  maxDisplay?: number
}

export function TagDistribution({ sessions, tasks, maxDisplay = 5 }: TagDistributionProps) {
  const [showAll, setShowAll] = useState(false)

  const tagStats = useMemo(() => calculateTagStats(sessions, tasks), [sessions, tasks])
  const displayTags = showAll ? tagStats : tagStats.slice(0, maxDisplay)
  const hasMore = tagStats.length > maxDisplay

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏷️</span>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Distribución por Etiquetas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tiempo invertido por categoría
          </p>
        </div>
      </div>

      {/* Lista de etiquetas */}
      {tagStats.length > 0 ? (
        <>
          <div className="space-y-4">
            <AnimatePresence>
              {displayTags.map((tag, index) => (
                <TagItem key={tag.name} tag={tag} rank={index + 1} />
              ))}
            </AnimatePresence>
          </div>

          {/* Ver más/menos */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {showAll ? (
                <>
                  Ver menos
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Ver todas las etiquetas ({tagStats.length})
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </>
      ) : (
        // Empty state
        <div className="text-center py-8">
          <p className="text-gray-400 dark:text-gray-500">No hay etiquetas aún</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Agrega etiquetas a tus tareas para ver el análisis
          </p>
        </div>
      )}
    </motion.div>
  )
}

// Sub-componente para cada etiqueta
function TagItem({ tag, rank }: { tag: TagStats; rank: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      {/* Nombre y ranking */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6">#{rank}</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color
            }}
          >
            {tag.name}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDuration(tag.totalMinutes)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tag.taskCount} {tag.taskCount === 1 ? 'tarea' : 'tareas'}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="relative h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${tag.percentage}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-y-0 left-0 rounded-full transition-opacity group-hover:opacity-80"
          style={{
            backgroundColor: tag.color
          }}
        />
        <span className="absolute right-2 top-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
          {tag.percentage}%
        </span>
      </div>
    </motion.div>
  )
}

// Función de cálculo de estadísticas por etiqueta
function calculateTagStats(sessions: any[], tasks: any[]): TagStats[] {
  const tagMap = new Map<string, { minutes: number; taskIds: Set<string> }>()

  // Acumular tiempo por etiqueta desde las sesiones
  sessions.forEach(session => {
    const task = tasks.find(t => t.id === session.task_id)
    if (!task || !task.tags || task.tags.length === 0) return

    const minutes = Math.floor(session.duration / 60)

    task.tags.forEach((tagName: string) => {
      const existing = tagMap.get(tagName) || { minutes: 0, taskIds: new Set() }
      existing.minutes += minutes
      existing.taskIds.add(task.id)
      tagMap.set(tagName, existing)
    })
  })

  // Calcular total para porcentajes
  const totalMinutes = Array.from(tagMap.values())
    .reduce((sum, tag) => sum + tag.minutes, 0)

  // Convertir a array y calcular porcentajes
  const stats: TagStats[] = Array.from(tagMap.entries()).map(([name, data]) => ({
    name,
    totalMinutes: data.minutes,
    percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
    taskCount: data.taskIds.size,
    color: generateColorForTag(name)
  }))

  // Ordenar por tiempo (mayor a menor)
  return stats.sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// Generar color único para cada tag (hash simple)
function generateColorForTag(tag: string): string {
  const colors = [
    '#8B5CF6', // violet
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#6366F1'  // indigo
  ]

  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Helper para formatear duración
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}
