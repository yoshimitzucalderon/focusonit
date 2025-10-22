import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = await getAuthenticatedClient(user.id);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get all calendars
    const calendarsResponse = await calendar.calendarList.list();
    const calendars = calendarsResponse.data.items || [];

    // Try to get events from each calendar - focus on October 2025
    const results = [];

    for (const cal of calendars) {
      try {
        const eventsResponse = await calendar.events.list({
          calendarId: cal.id!,
          maxResults: 50,
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: new Date('2025-10-15').toISOString(),
          timeMax: new Date('2025-10-31').toISOString(),
        });

        results.push({
          calendarId: cal.id,
          calendarName: cal.summary,
          isPrimary: cal.primary || false,
          eventCount: eventsResponse.data.items?.length || 0,
          events: eventsResponse.data.items?.map(e => ({
            id: e.id,
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
            isAllDay: !!e.start?.date,
          })) || [],
        });
      } catch (error: any) {
        results.push({
          calendarId: cal.id,
          calendarName: cal.summary,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      totalCalendars: calendars.length,
      results,
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug calendars' },
      { status: 500 }
    );
  }
}
