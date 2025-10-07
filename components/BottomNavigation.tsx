'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTasks } from '@/lib/hooks/useTasks'

export function BottomNavigation() {
  const pathname = usePathname()
  const { tasks } = useTasks()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path)
  }

  // Contar tareas pendientes para badges
  const todayTasksCount = tasks.filter(t => !t.completed && t.due_date).length
  const completedCount = tasks.filter(t => t.completed).length

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe" style={{ position: 'fixed' }}>
      <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
        {/* Hoy */}
        <Link
          href="/today"
          className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all
            ${
              isActive('/today')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-semibold'
                : 'text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-slate-600'
            }`}
        >
          {/* Indicador activo */}
          {isActive('/today') && (
            <motion.div
              layoutId="activeTab"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          <motion.div whileTap={{ scale: 0.9 }} className="relative">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={isActive('/today') ? 2.5 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {todayTasksCount > 0 && !isActive('/today') && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {todayTasksCount > 9 ? '9+' : todayTasksCount}
              </span>
            )}
          </motion.div>
          <span className="text-xs">Hoy</span>
        </Link>

        {/* Semana */}
        <Link
          href="/week"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all
            ${
              isActive('/week')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600'
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isActive('/week') ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Semana</span>
        </Link>

        {/* Todas */}
        <Link
          href="/all"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all
            ${
              isActive('/all')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600'
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isActive('/all') ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs">Todas</span>
        </Link>

        {/* Completadas */}
        <Link
          href="/completed"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all
            ${
              isActive('/completed')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600'
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isActive('/completed') ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs">Completadas</span>
        </Link>

        {/* Estadísticas */}
        <Link
          href="/stats"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all
            ${
              isActive('/stats')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600'
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isActive('/stats') ? 2.5 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs">Stats</span>
        </Link>
      </div>
    </nav>
  )
}
