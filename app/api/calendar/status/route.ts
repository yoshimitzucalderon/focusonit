import { NextRequest, NextResponse } from 'next/server';
import { isGoogleCalendarConnected } from '@/lib/google-calendar/oauth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Check if Google Calendar is connected
    const isConnected = await isGoogleCalendarConnected(user.id);

    return NextResponse.json({
      success: true,
      connected: isConnected,
    });
  } catch (error: any) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check calendar status' },
      { status: 500 }
    );
  }
}
