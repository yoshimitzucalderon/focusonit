import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '@/components/CalendarView'

export const metadata = {
  title: 'Calendario | FocusOnIt',
  description: 'Vista de calendario con horarios específicos para tus tareas',
}

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <CalendarView userId={user.id} />
    </div>
  )
}
