'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SelectionContextType {
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  clearSelection: () => void
  hasSelection: boolean
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        toggleSelection,
        clearSelection,
        hasSelection: selectedIds.size > 0,
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
