import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

// Tipo explícito para las tareas desde la base de datos
type Task = Database['public']['Tables']['tasks']['Row'];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== CLEANUP MALFORMED ROUTE CALLED ===');
    console.log('User ID:', user.id);

    // Find tasks with malformed start_time or end_time
    // These will have timestamps with 'T' or timezone offsets instead of just time
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, start_time, end_time, google_event_id')
      .eq('user_id', user.id)
      .not('google_event_id', 'is', null); // Only imported tasks

    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: fetchError.message },
        { status: 500 }
      );
    }

    // Tipo explícito para el array de tareas
    const typedTasks: Task[] = tasks || [];

    if (typedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No imported tasks found',
        deletedCount: 0,
      });
    }

    console.log(`Found ${typedTasks.length} imported tasks to check`);

    // Filter tasks with malformed time fields
    // Valid time format is "HH:MM:SS" (no date, no timezone)
    const malformedTasks = typedTasks.filter((task) => {
      const hasDate = (timeStr: string | null) => {
        if (!timeStr) return false;
        // Check if time field contains date/timezone characters
        return timeStr.includes('T') || timeStr.includes('-') || timeStr.includes('+') || timeStr.length > 8;
      };

      return hasDate(task.start_time) || hasDate(task.end_time);
    });

    console.log(`Found ${malformedTasks.length} malformed tasks to delete`);

    if (malformedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No malformed tasks found',
        deletedCount: 0,
      });
    }

    // Log which tasks will be deleted
    malformedTasks.forEach((task) => {
      console.log(`Will delete: "${task.title}" (ID: ${task.id})`);
      console.log(`  start_time: ${task.start_time}`);
      console.log(`  end_time: ${task.end_time}`);
    });

    // Delete malformed tasks
    const taskIds = malformedTasks.map((t) => t.id);
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds)
      .eq('user_id', user.id); // Extra safety check

    if (deleteError) {
      console.error('Error deleting malformed tasks:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tasks', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted ${malformedTasks.length} malformed tasks`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${malformedTasks.length} malformed tasks`,
      deletedCount: malformedTasks.length,
      deletedTasks: malformedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        google_event_id: t.google_event_id,
      })),
    });
  } catch (error: any) {
    console.error('Error in cleanup-malformed route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
