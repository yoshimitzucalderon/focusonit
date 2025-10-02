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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-sm">{children}</span>
    </Link>
  )
}
