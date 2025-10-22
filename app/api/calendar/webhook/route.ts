import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedClient } from '@/lib/google-calendar/oauth';
import { google } from 'googleapis';
import { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

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

    const { userId, eventId, calendarId, action } = body;

    if (!userId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, eventId' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Handle different actions
    if (action === 'deleted') {
      // Event was deleted from Google Calendar
      console.log(`Event ${eventId} was deleted`);

      const { error } = await supabase
        .from('tasks')
        .update({
          google_event_id: null,
          synced_with_calendar: false,
          updated_at: new Date().toISOString(),
        })
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

    // For updated/created events, fetch the event details from Google Calendar
    const auth = await getAuthenticatedClient(userId);
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

      const existingTask = existingTasks?.[0] as Task | null;

      if (existingTask) {
        // Update existing task
        console.log(`Updating existing task: ${existingTask.title}`);

        const updates: any = {
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

        const { error } = await supabase
          .from('tasks')
          .update(updates)
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
        // This is a new event created in Google Calendar
        // We could optionally create a new task, but for now just log it
        console.log('New event created in Google Calendar (not yet a task):', event.summary);

        return NextResponse.json({
          success: true,
          action: 'ignored',
          message: 'Event exists in Google Calendar but not in FocusOnIt',
        });
      }
    } catch (error: any) {
      if (error.code === 404) {
        // Event was deleted
        console.log(`Event ${eventId} not found (likely deleted)`);

        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            google_event_id: null,
            synced_with_calendar: false,
            updated_at: new Date().toISOString(),
          })
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
