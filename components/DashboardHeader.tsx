'use client'

import { LogOut, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface DashboardHeaderProps {
  userEmail?: string
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 h-16 md:left-64">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo - visible solo en mobile */}
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 md:hidden">
          FocusOnIt
        </h1>

        {/* Spacer */}
        <div className="flex-1 md:flex-initial" />

        {/* User info y logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{userEmail}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  )
}
