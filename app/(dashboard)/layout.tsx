import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNavigation } from '@/components/BottomNavigation'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { DashboardHeader } from '@/components/DashboardHeader'

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <DashboardHeader userEmail={user.email} />

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="pt-16 pb-24 md:pl-64 md:pb-8 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
        {/* Gradient decorations for dark mode */}
        <div className="hidden dark:block absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-900/10 to-purple-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-900/10 to-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="px-4 md:px-6 lg:px-8 py-6 relative z-10">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
