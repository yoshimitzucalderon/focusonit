import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    console.log('=== CLEANUP SYNCED EVENTS ===');
    console.log('User ID:', user.id);
    console.log('Date range:', startDate, 'to', endDate);

    // Get all tasks in the date range that HAVE google_event_id
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .not('google_event_id', 'is', null);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    const tasksToClean = tasks || [];
    console.log(`Found ${tasksToClean.length} tasks to clean up`);

    const auth = await getAuthenticatedClient(user.id);
    const calendar = google.calendar({ version: 'v3', auth });

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const task of tasksToClean as any[]) {
      try {
        console.log(`Deleting event for task: ${task.title} (Event ID: ${task.google_event_id})`);

        // Delete from Google Calendar
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: task.google_event_id,
        });

        // Clear google_event_id from database
        await supabase
          .from('tasks')
          .update({
            google_event_id: null,
            synced_with_calendar: false,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        console.log(`✅ Successfully deleted: ${task.title}`);
        successCount++;
        results.push({
          taskId: task.id,
          title: task.title,
          success: true,
        });
      } catch (error: any) {
        console.error(`❌ Failed to delete: ${task.title}`, error.message);
        failCount++;
        results.push({
          taskId: task.id,
          title: task.title,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('=== CLEANUP SUMMARY ===');
    console.log(`Total tasks: ${tasksToClean.length}`);
    console.log(`Successfully cleaned: ${successCount}`);
    console.log(`Failed to clean: ${failCount}`);

    return NextResponse.json({
      success: true,
      totalTasks: tasksToClean.length,
      successCount,
      failCount,
      results,
      message: `Limpiadas ${successCount} de ${tasksToClean.length} tareas de Google Calendar`,
    });
  } catch (error: any) {
    console.error('Error cleaning up synced events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clean up events' },
      { status: 500 }
    );
  }
}
