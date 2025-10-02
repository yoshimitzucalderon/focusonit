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
      <main className="pt-16 pb-24 md:pl-64 md:pb-8 bg-white dark:bg-slate-900">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
