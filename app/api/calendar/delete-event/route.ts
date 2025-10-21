import { NextRequest, NextResponse } from 'next/server';
import { deleteCalendarEvent } from '@/lib/google-calendar/sync';
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
    const body = await request.json();
    const { taskId, task } = body;

    let taskToDelete = task;

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

      taskToDelete = fetchedTask;
    }

    if (!taskToDelete) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId or task' },
        { status: 400 }
      );
    }

    const result = await deleteCalendarEvent(user.id, taskToDelete);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
