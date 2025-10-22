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

    // Test 2: Try to get events from primary calendar with very wide date range
    const eventsResponse = await calendar.events.list({
      calendarId: 'yoshimitzu.calderon@gmail.com',
      timeMin: new Date('2025-01-01').toISOString(),
      timeMax: new Date('2025-12-31').toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];

    // Test 3: Get raw response data
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
      eventsSample: events.slice(0, 5).map(e => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        status: e.status,
      })),
      rawRequestParams: {
        calendarId: 'yoshimitzu.calderon@gmail.com',
        timeMin: new Date('2025-01-01').toISOString(),
        timeMax: new Date('2025-12-31').toISOString(),
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
