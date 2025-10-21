import { NextRequest, NextResponse } from 'next/server';
import { importCalendarEvents } from '@/lib/google-calendar/sync';
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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Import events from Google Calendar
    const result = await importCalendarEvents(user.id, start, end);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to import events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully imported ${result.count} event(s) from Google Calendar`,
    });
  } catch (error: any) {
    console.error('Error importing calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import calendar events' },
      { status: 500 }
    );
  }
}
