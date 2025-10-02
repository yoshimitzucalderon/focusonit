import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

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
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 md:pb-0">
        <Navbar user={user} />
        <div className="flex">
          {/* Sidebar Desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Bar FIJA */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
          <a href="/today" className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-slate-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Hoy</span>
          </a>
          <a href="/week" className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-slate-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Semana</span>
          </a>
          <a href="/all" className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-slate-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">Todas</span>
          </a>
          <a href="/completed" className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-slate-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Completadas</span>
          </a>
        </div>
      </nav>
    </>
  )
}
