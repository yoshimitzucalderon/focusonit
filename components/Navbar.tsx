'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
          FocusOnIt
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </nav>
  )
}