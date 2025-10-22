import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncTaskToCalendar } from '@/lib/google-calendar/sync';

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

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log('=== SYNC PERIOD ROUTE CALLED ===');
    console.log('User ID:', user.id);
    console.log('Start Date:', start.toISOString());
    console.log('End Date:', end.toISOString());

    // Get all tasks in the date range that are NOT already synced
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', start.toISOString())
      .lte('due_date', end.toISOString())
      .is('google_event_id', null); // Only tasks not yet in Google Calendar

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    const tasksToSync = tasks || [];
    console.log(`Found ${tasksToSync.length} tasks to sync in period`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const task of tasksToSync) {
      try {
        console.log(`Syncing task: ${task.title}`);
        const result = await syncTaskToCalendar(user.id, task as any);

        if (result.success) {
          console.log(`✅ Successfully synced: ${task.title}`);
          successCount++;
        } else {
          console.error(`❌ Failed to sync: ${task.title}`, result.error);
          failCount++;
        }

        results.push({
          taskId: task.id,
          title: task.title,
          success: result.success,
          error: result.error,
        });
      } catch (error: any) {
        console.error(`❌ Exception syncing task: ${task.title}`, error);
        failCount++;
        results.push({
          taskId: task.id,
          title: task.title,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('=== SYNC SUMMARY ===');
    console.log(`Total tasks found: ${tasksToSync.length}`);
    console.log(`Successfully synced: ${successCount}`);
    console.log(`Failed to sync: ${failCount}`);

    return NextResponse.json({
      success: true,
      totalTasks: tasksToSync.length,
      successCount,
      failCount,
      results,
      message: `Sincronizadas ${successCount} de ${tasksToSync.length} tareas a Google Calendar`,
    });
  } catch (error: any) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync tasks' },
      { status: 500 }
    );
  }
}
