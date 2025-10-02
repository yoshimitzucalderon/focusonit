'use client'

import { LogOut, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface DashboardHeaderProps {
  userEmail?: string
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()
  const [showMobileInput, setShowMobileInput] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 md:left-64">
      <div className="h-16 px-4 md:px-6 flex items-center gap-4">
        {/* Logo mobile */}
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 md:hidden">
          FocusOnIt
        </h1>

        {/* Input de tarea - visible en desktop */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-2xl">
          <input
            type="text"
            placeholder="Que necesitas hacer?"
            className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>

        {/* Boton para abrir input en mobile */}
        <button
          onClick={() => setShowMobileInput(!showMobileInput)}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Nueva tarea"
        >
          <Plus size={20} />
        </button>

        <div className="flex-1 md:flex-initial" />

        {/* User info */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden lg:inline">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Input expandible en mobile */}
      {showMobileInput && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-slate-800">
          <input
            type="text"
            placeholder="Que necesitas hacer?"
            autoFocus
            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setShowMobileInput(false)
              }
              if (e.key === 'Escape') {
                setShowMobileInput(false)
              }
            }}
            onBlur={() => setTimeout(() => setShowMobileInput(false), 200)}
          />
          <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Enter: crear</span>
            <span>Esc: cancelar</span>
          </div>
        </div>
      )}
    </header>
  )
}
