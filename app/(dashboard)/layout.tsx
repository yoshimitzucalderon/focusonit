import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { BottomNavigation } from '@/components/BottomNavigation'

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

      {/* Mobile Navigation - Bottom Bar con indicador activo */}
      <BottomNavigation />
    </>
  )
}
