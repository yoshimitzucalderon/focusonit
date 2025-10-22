import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';
import { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== SYNC FROM GOOGLE CALENDAR ===');
    console.log('User ID:', user.id);

    // Get authenticated Google Calendar client
    const auth = await getAuthenticatedClient(user.id);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get all tasks that are synced with Google Calendar
    const { data: syncedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('google_calendar_sync', true)
      .not('google_event_id', 'is', null);

    if (tasksError) {
      console.error('Error fetching synced tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasks: Task[] = syncedTasks || [];
    console.log(`Found ${tasks.length} synced tasks`);

    let updatedCount = 0;
    let deletedCount = 0;

    for (const task of tasks) {
      try {
        // Get the event from Google Calendar
        const eventResponse = await calendar.events.get({
          calendarId: 'primary',
          eventId: task.google_event_id!,
        });

        const event = eventResponse.data;

        // Check if event was updated in Google Calendar
        const eventUpdated = new Date(event.updated!);
        const taskUpdated = new Date(task.updated_at!);

        if (eventUpdated > taskUpdated) {
          console.log(`Updating task "${task.title}" from Google Calendar`);

          // Extract updated data from Google Calendar event
          const updates: any = {
            title: event.summary || task.title,
            description: event.description || null,
            updated_at: new Date().toISOString(),
          };

          // Update due_date if changed
          if (event.start?.date) {
            // All-day event
            updates.due_date = event.start.date;
          } else if (event.start?.dateTime) {
            // Timed event - extract date part
            updates.due_date = event.start.dateTime.split('T')[0];
          }

          // Update times if changed
          if (event.start?.dateTime && event.end?.dateTime) {
            const startTime = event.start.dateTime.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
            const endTime = event.end.dateTime.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
            if (startTime) updates.start_time = startTime;
            if (endTime) updates.end_time = endTime;
          }

          // Update task in database
          const { error: updateError } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', task.id);

          if (updateError) {
            console.error(`Error updating task ${task.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      } catch (error: any) {
        if (error.code === 404) {
          // Event was deleted from Google Calendar
          console.log(`Event deleted from Google Calendar, removing google_event_id from task "${task.title}"`);

          const { error: updateError } = await supabase
            .from('tasks')
            .update({
              google_event_id: null,
              synced_with_calendar: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          if (updateError) {
            console.error(`Error updating task ${task.id}:`, updateError);
          } else {
            deletedCount++;
          }
        } else {
          console.error(`Error checking event for task ${task.id}:`, error);
        }
      }
    }

    console.log('=== SYNC FROM GOOGLE SUMMARY ===');
    console.log(`Tasks checked: ${tasks.length}`);
    console.log(`Tasks updated: ${updatedCount}`);
    console.log(`Events deleted: ${deletedCount}`);

    return NextResponse.json({
      success: true,
      checked: tasks.length,
      updated: updatedCount,
      deleted: deletedCount,
      message: `Sincronizadas ${updatedCount} actualizaciones desde Google Calendar`,
    });
  } catch (error: any) {
    console.error('Error syncing from Google Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync from Google Calendar' },
      { status: 500 }
    );
  }
}
