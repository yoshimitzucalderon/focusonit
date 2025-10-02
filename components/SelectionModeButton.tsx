'use client'

import { CheckSquare } from 'lucide-react'
import { useSelection } from '@/context/SelectionContext'

export function SelectionModeButton() {
  const { isSelectionMode, enterSelectionMode } = useSelection()

  if (isSelectionMode) return null

  return (
    <button
      onClick={enterSelectionMode}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      aria-label="Modo selección"
    >
      <CheckSquare size={18} />
      <span className="hidden sm:inline">Seleccionar</span>
    </button>
  )
}
