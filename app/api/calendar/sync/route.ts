import { NextRequest, NextResponse } from 'next/server';
import { syncTaskToCalendar, batchSyncTasks } from '@/lib/google-calendar/sync';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

// Tipo explícito para las tareas desde la base de datos
type Task = Database['public']['Tables']['tasks']['Row'];

export const dynamic = 'force-dynamic';

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
    const body = await request.json();
    const { taskId, taskIds, task } = body;

    // Handle batch sync
    if (taskIds && Array.isArray(taskIds)) {
      const result = await batchSyncTasks(user.id, taskIds);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to sync tasks' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        results: result.results,
        message: `Synced ${taskIds.length} task(s)`,
      });
    }

    // Handle single task sync
    if (task || taskId) {
      let taskToSync = task;

      // If only taskId provided, fetch the task
      if (taskId && !task) {
        const { data: fetchedTask, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !fetchedTask) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          );
        }

        taskToSync = fetchedTask as Task;
      }

      const result = await syncTaskToCalendar(user.id, taskToSync as Task);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to sync task' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        eventId: result.eventId,
        message: 'Task synced successfully',
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameters: taskId, taskIds, or task' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error syncing to calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync to calendar' },
      { status: 500 }
    );
  }
}
