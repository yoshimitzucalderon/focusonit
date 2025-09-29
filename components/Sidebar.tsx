'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, CalendarRange, ListTodo, CheckCircle } from 'lucide-react'

const navigation = [
  { name: 'Hoy', href: '/today', icon: Calendar },
  { name: 'Semana', href: '/week', icon: CalendarRange },
  { name: 'Todas', href: '/all', icon: ListTodo },
  { name: 'Completadas', href: '/completed', icon: CheckCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}