import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';
import { Database } from '@/types/database.types';
import { updateTasksQuery } from '@/lib/supabase/helpers';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export const dynamic = 'force-dynamic';

/**
 * Webhook endpoint para recibir notificaciones de cambios en Google Calendar
 *
 * Este endpoint será llamado por n8n cuando Google Calendar notifique cambios
 *
 * Flujo:
 * 1. Google Calendar → Push Notification → n8n
 * 2. n8n → Procesa evento → Llama a este webhook
 * 3. Este webhook → Actualiza tarea en FocusOnIt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== GOOGLE CALENDAR WEBHOOK ===');
    console.log('Received payload:', JSON.stringify(body, null, 2));

    const { eventId, calendarId, action } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    // Use service role client for all webhook operations to bypass RLS
    const supabase = createServiceRoleClient();

    // Buscar el userId basándose en el google_event_id
    const { data: taskWithEvent, error: searchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('google_event_id', eventId)
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.error('Error searching for task:', searchError);
      return NextResponse.json({ error: 'Failed to find task' }, { status: 500 });
    }

    let userId: string;

    if (!taskWithEvent) {
      console.log(`No task found with google_event_id: ${eventId}. This is a new Google Calendar event.`);

      // For new events, we need to find the user by matching the calendarId (email)
      // Since we don't have the user yet, we'll need to get the event first to find the owner
      // We'll defer creating the task until after we fetch the event details
      userId = ''; // Will be set after fetching event
    } else {
      userId = (taskWithEvent as { user_id: string }).user_id;
    }

    // Handle different actions
    if (action === 'deleted') {
      // Event was deleted from Google Calendar
      console.log(`Event ${eventId} was deleted`);

      // If we don't have a userId (new event that was immediately deleted), ignore it
      if (!userId) {
        return NextResponse.json({
          success: true,
          action: 'ignored',
          message: 'Deleted event was not linked to any task',
        });
      }

      const deleteUpdates: TaskUpdate = {
        google_event_id: null,
        synced_with_calendar: false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await updateTasksQuery(supabase, deleteUpdates)
        .eq('google_event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'deleted',
        message: 'Task unlinked from Google Calendar',
      });
    }

    // For updated/created events, we need to fetch the event details from Google Calendar
    // If we don't have a userId yet, we need to find the user by the calendarId
    if (!userId) {
      // Use service role client to bypass RLS when looking up users
      const serviceSupabase = createServiceRoleClient();

      console.log(`Looking for user with calendarId: ${calendarId || 'primary'}`);

      // Strategy 1: Try to find user by exact calendarId match (email or 'primary')
      let { data: googleTokens, error: tokenError } = await serviceSupabase
        .from('google_calendar_tokens')
        .select('user_id, calendar_id')
        .eq('calendar_id', calendarId || 'primary')
        .maybeSingle();

      if (tokenError) {
        console.error('Error querying google_calendar_tokens:', tokenError);
      }

      // Strategy 2: If calendarId is an email and we didn't find it, try 'primary'
      // (because we store 'primary' but n8n sends the actual email)
      if (!googleTokens && calendarId && calendarId.includes('@')) {
        console.log('CalendarId is an email, trying to find user with calendar_id = "primary"...');
        const result = await serviceSupabase
          .from('google_calendar_tokens')
          .select('user_id, calendar_id')
          .eq('calendar_id', 'primary')
          .maybeSingle();

        googleTokens = result.data;
        if (result.error) {
          console.error('Error querying for primary calendar:', result.error);
        }
      }

      if (!googleTokens) {
        // Strategy 3: Last resort - find any user with Google Calendar connected
        console.log('Could not find user by calendarId, searching for any connected user...');

        const { data: allTokens, error: allTokensError } = await serviceSupabase
          .from('google_calendar_tokens')
          .select('user_id, calendar_id')
          .limit(1);

        if (allTokensError) {
          console.error('Error querying all google_calendar_tokens:', allTokensError);
        }

        console.log(`Found ${allTokens?.length || 0} users with Google Calendar connected`);

        if (allTokens && allTokens.length > 0) {
          userId = (allTokens[0] as any).user_id;
          console.log(`✅ Using fallback user: ${userId} with calendar_id: ${(allTokens[0] as any).calendar_id}`);
        } else {
          console.log('❌ No users with Google Calendar connected');
          return NextResponse.json({
            success: true,
            action: 'ignored',
            message: 'No user found with Google Calendar connected',
          });
        }
      } else {
        userId = (googleTokens as any).user_id;
        console.log(`✅ Found user: ${userId} for calendar: ${(googleTokens as any).calendar_id}`);
      }
    }

    // Now we have a userId, fetch the event from Google Calendar
    // Use service role to bypass RLS when getting tokens
    const auth = await getAuthenticatedClient(userId, true);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const eventResponse = await calendar.events.get({
        calendarId: calendarId || 'primary',
        eventId: eventId,
      });

      const event = eventResponse.data;
      console.log('Fetched event from Google:', event.summary);

      // Find task by google_event_id
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('google_event_id', eventId)
        .eq('user_id', userId);

      const existingTask: Task | null = existingTasks?.[0] ? (existingTasks[0] as Task) : null;

      if (existingTask) {
        // Update existing task
        console.log(`Updating existing task: ${existingTask.title}`);

        const updates: TaskUpdate = {
          title: event.summary || existingTask.title,
          description: event.description || null,
          updated_at: new Date().toISOString(),
        };

        // Update due_date
        if (event.start?.date) {
          updates.due_date = event.start.date;
          updates.is_all_day = true;
        } else if (event.start?.dateTime) {
          updates.due_date = event.start.dateTime.split('T')[0];
          updates.is_all_day = false;
        }

        // Update times if it's a timed event
        if (event.start?.dateTime && event.end?.dateTime) {
          const startTime = event.start.dateTime.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
          const endTime = event.end.dateTime.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
          if (startTime) updates.start_time = startTime;
          if (endTime) updates.end_time = endTime;
        } else {
          // Clear times for all-day events
          updates.start_time = null;
          updates.end_time = null;
        }

        const { error } = await updateTasksQuery(supabase, updates)
          .eq('id', existingTask.id);

        if (error) {
          console.error('Error updating task:', error);
          return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'updated',
          taskId: existingTask.id,
          message: 'Task updated from Google Calendar',
        });
      } else {
        // This is a new event created in Google Calendar - CREATE A NEW TASK
        console.log('✨ Creating new task from Google Calendar event:', event.summary);

        // Get next available position for the task
        const { data: maxPositionTask } = await supabase
          .from('tasks')
          .select('position')
          .eq('user_id', userId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextPosition = maxPositionTask ? ((maxPositionTask as any).position + 1) : 0;

        // Prepare task data from Google Calendar event
        const taskData: Database['public']['Tables']['tasks']['Insert'] = {
          user_id: userId,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          google_event_id: eventId,
          google_calendar_sync: true,
          synced_with_calendar: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: nextPosition,
        };

        // Handle date and time
        if (event.start?.date) {
          // All-day event
          taskData.due_date = event.start.date;
          taskData.is_all_day = true;
        } else if (event.start?.dateTime) {
          // Timed event
          taskData.due_date = event.start.dateTime.split('T')[0];
          taskData.is_all_day = false;

          // Extract times
          const startTime = event.start.dateTime.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
          const endTime = event.end?.dateTime?.match(/T(\d{2}:\d{2}:\d{2})/)?.[1];
          if (startTime) taskData.start_time = startTime;
          if (endTime) taskData.end_time = endTime;
        }

        // Check for duplicate tasks with the same title and date (prevent accidental duplicates)
        const { data: duplicateCheck } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('title', taskData.title)
          .eq('due_date', taskData.due_date || '')
          .maybeSingle();

        if (duplicateCheck) {
          console.log('⚠️  Duplicate task detected, updating existing task instead');

          // Update the existing task with the Google Calendar event ID
          const updateData: TaskUpdate = {
            google_event_id: eventId,
            google_calendar_sync: true,
            synced_with_calendar: true,
            description: taskData.description,
            is_all_day: taskData.is_all_day,
            start_time: taskData.start_time,
            end_time: taskData.end_time,
            updated_at: new Date().toISOString(),
          };

          const { error: updateError } = await updateTasksQuery(supabase, updateData)
            .eq('id', (duplicateCheck as any).id);

          if (updateError) {
            console.error('Error updating duplicate task:', updateError);
            return NextResponse.json({ error: 'Failed to update duplicate task' }, { status: 500 });
          }

          return NextResponse.json({
            success: true,
            action: 'linked_existing',
            taskId: (duplicateCheck as any).id,
            message: 'Linked existing task to Google Calendar event',
          });
        }

        // Create new task
        const { data: newTask, error: insertError } = await supabase
          .from('tasks')
          // @ts-ignore - Bypass Supabase type inference issue
          .insert(taskData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating task from Google Calendar event:', insertError);
          return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
        }

        console.log('✅ Successfully created task:', (newTask as any).id);

        return NextResponse.json({
          success: true,
          action: 'created',
          taskId: (newTask as any).id,
          message: 'Task created from Google Calendar event',
        });
      }
    } catch (error: any) {
      if (error.code === 404) {
        // Event was deleted
        console.log(`Event ${eventId} not found (likely deleted)`);

        const deleteUpdates: TaskUpdate = {
          google_event_id: null,
          synced_with_calendar: false,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await updateTasksQuery(supabase, deleteUpdates)
          .eq('google_event_id', eventId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating task:', updateError);
        }

        return NextResponse.json({
          success: true,
          action: 'deleted',
          message: 'Event deleted from Google Calendar',
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Handle Google Calendar push notification channel verification
export async function GET(request: NextRequest) {
  // Google Calendar sends a sync token for verification
  return NextResponse.json({ message: 'Webhook endpoint active' });
}
