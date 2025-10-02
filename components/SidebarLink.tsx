'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

export function SidebarLink({ href, icon: Icon, children }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-all duration-150 ease-in-out
        ${isActive
          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
          : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <Icon
        size={20}
        strokeWidth={isActive ? 2.5 : 2}
        className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
      />
      <span className="text-sm">{children}</span>

      {/* Active indicator */}
      {isActive && (
        <div className="ml-auto w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full" />
      )}
    </Link>
  )
}
