import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = await getAuthenticatedClient(user.id);
    const calendar = google.calendar({ version: 'v3', auth });

    // Test 1: Get calendar list
    const calendarsResponse = await calendar.calendarList.list();
    const calendars = calendarsResponse.data.items || [];

    // Test 2: Try to get events from primary calendar - focus on October 23
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date('2025-10-22T00:00:00').toISOString(),
      timeMax: new Date('2025-10-24T23:59:59').toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];

    // Test 3: Get tasks from database for Oct 23
    const { data: dbTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', '2025-10-23')
      .lte('due_date', '2025-10-23')
      .not('google_event_id', 'is', null);

    // Test 4: Get raw response data
    return NextResponse.json({
      success: true,
      userId: user.id,
      calendars: calendars.map(c => ({
        id: c.id,
        summary: c.summary,
        primary: c.primary,
        accessRole: c.accessRole,
      })),
      eventsFound: events.length,
      allEvents: events.map(e => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        status: e.status,
      })),
      tasksInDB: dbTasks || [],
      rawRequestParams: {
        calendarId: 'primary',
        timeMin: new Date('2025-10-22T00:00:00').toISOString(),
        timeMax: new Date('2025-10-24T23:59:59').toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to test calendar',
        details: error.response?.data || error.toString(),
      },
      { status: 500 }
    );
  }
}
