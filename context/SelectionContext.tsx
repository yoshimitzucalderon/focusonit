'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SelectionContextType {
  selectedIds: Set<string>
  isSelectionMode: boolean
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      // Si no hay seleccionados, salir del modo selección
      if (newSet.size === 0) {
        setIsSelectionMode(false)
      }

      return newSet
    })
  }

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids))
    setIsSelectionMode(true)
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  const enterSelectionMode = () => {
    setIsSelectionMode(true)
  }

  const exitSelectionMode = () => {
    setSelectedIds(new Set())
    setIsSelectionMode(false)
  }

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        isSelectionMode,
        toggleSelection,
        selectAll,
        clearSelection,
        enterSelectionMode,
        exitSelectionMode,
      }}
    >
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider')
  }
  return context
}
