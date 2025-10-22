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
    const { startDate, endDate, calendarId } = body;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const calendar = calendarId || 'primary';

    console.log('=== IMPORT ROUTE CALLED ===');
    console.log('User ID:', user.id);
    console.log('Calendar ID:', calendar);
    console.log('Start Date:', start?.toISOString());
    console.log('End Date:', end?.toISOString());

    // Import events from Google Calendar
    const result = await importCalendarEvents(user.id, start, end, calendar);

    console.log('=== IMPORT RESULT ===');
    console.log('Success:', result.success);
    console.log('Count:', result.count);
    console.log('Error:', result.error);

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
      debug: {
        calendarId: calendar,
        dateRange: {
          start: start?.toISOString(),
          end: end?.toISOString(),
        },
        resultDetails: result,
      },
    });
  } catch (error: any) {
    console.error('Error importing calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import calendar events' },
      { status: 500 }
    );
  }
}
