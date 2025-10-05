'use client'

import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getIcon = () => {
    if (theme === 'light') return <Sun size={20} />
    if (theme === 'dark') return <Moon size={20} />
    return <Monitor size={20} />
  }

  const getLabel = () => {
    if (theme === 'light') return 'Modo claro'
    if (theme === 'dark') return 'Modo oscuro'
    return 'Automático'
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 relative group"
      title={getLabel()}
      aria-label={`Cambiar tema (actual: ${getLabel()})`}
    >
      {getIcon()}

      {/* Tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {getLabel()}
      </span>
    </button>
  )
}
