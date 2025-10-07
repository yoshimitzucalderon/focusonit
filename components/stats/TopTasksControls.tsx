'use client'

import { SortBy, FilterBy } from '@/lib/hooks/useTopTasks'

interface TopTasksControlsProps {
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  filter: FilterBy
  setFilter: (filter: FilterBy) => void
}

export function TopTasksControls({
  sortBy,
  setSortBy,
  filter,
  setFilter
}: TopTasksControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
      {/* Ordenar por */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Ordenar por:
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="time">Tiempo total</option>
          <option value="sessions">Sesiones</option>
          <option value="completion">% Completitud</option>
        </select>
      </div>

      {/* Filtrar por */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Filtrar:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>
    </div>
  )
}
