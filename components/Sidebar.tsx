'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, CalendarRange, ListTodo, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Hoy', href: '/today', icon: Calendar, badge: null },
  { name: 'Semana', href: '/week', icon: CalendarRange, badge: null },
  { name: 'Todas', href: '/all', icon: ListTodo, badge: null },
  { name: 'Completadas', href: '/completed', icon: CheckCircle, badge: null },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-700/60 p-4 backdrop-blur-sm">
      <nav className="space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className="block"
            >
              <motion.div
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-100 via-primary-50 to-primary-100 dark:from-primary-900/40 dark:via-primary-800/30 dark:to-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold shadow-sm border-l-4 border-primary-600 dark:border-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-600 dark:bg-primary-500 text-white"
                  >
                    {item.badge}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-l-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}