'use client'

import { Calendar, CalendarDays, List, CheckCircle } from 'lucide-react'
import { SidebarLink } from './SidebarLink'

export function DashboardSidebar() {
  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 z-40">
      <div className="h-full flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">FocusOnIt</h1>
        </div>

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
  )
}
