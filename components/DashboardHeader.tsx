'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  userEmail?: string
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 h-16 md:left-64">
      <div className="h-full px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 md:hidden">
          FocusOnIt
        </h1>

        <div className="flex-1 md:flex-initial" />

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
