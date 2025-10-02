import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNavigation } from '@/components/BottomNavigation'
import { SidebarLink } from '@/components/SidebarLink'
import { Calendar, CalendarDays, List, CheckCircle, LogOut, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header - FIJO, en desktop deja espacio para sidebar */}
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
              <span className="hidden sm:inline">{user.email}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar - FIJO solo en desktop, OCULTO en mobile */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 z-40">
        <div className="h-full flex flex-col">
          {/* Logo en sidebar */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">FocusOnIt</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-3 space-y-1">
              <SidebarLink href="/today" icon={Calendar}>
                Hoy
              </SidebarLink>
              <SidebarLink href="/week" icon={CalendarDays}>
                Semana
              </SidebarLink>
              <SidebarLink href="/all" icon={List}>
                Todas
              </SidebarLink>
              <SidebarLink href="/completed" icon={CheckCircle}>
                Completadas
              </SidebarLink>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content - con padding para sidebar y header */}
      <main className="pt-16 pb-24 md:pl-64 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation - SOLO en mobile */}
      <BottomNavigation />
    </div>
  )
}
