import { NextRequest, NextResponse } from 'next/server';
import { deleteTokens } from '@/lib/google-calendar/oauth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete stored tokens
    await deleteTokens(user.id);

    // Clear Google Calendar sync from all tasks
    await supabase
      .from('tasks')
      // @ts-ignore - google_calendar_sync field exists in tasks table
      .update({
        google_calendar_sync: false,
        synced_with_calendar: false,
      })
      .eq('user_id', user.id)
      .not('google_event_id', 'is', null);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
