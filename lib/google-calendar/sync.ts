import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from './oauth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_all_day?: boolean;
  completed: boolean;
  google_event_id?: string | null;
  synced_with_calendar?: boolean;
  google_calendar_sync?: boolean;
  reminder_enabled?: boolean;
  reminder_at?: string | null;
}

interface SyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

// Convert Task to Google Calendar Event
function taskToCalendarEvent(task: Task): calendar_v3.Schema$Event {
  const event: calendar_v3.Schema$Event = {
    summary: task.title,
    description: task.description || '',
  };

  // Handle all-day events
  if (task.is_all_day && task.due_date) {
    event.start = {
      date: task.due_date.split('T')[0], // Format: YYYY-MM-DD
    };
    event.end = {
      date: task.due_date.split('T')[0],
    };
  }
  // Handle timed events
  else if (task.start_time && task.end_time) {
    event.start = {
      dateTime: task.start_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    event.end = {
      dateTime: task.end_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  // Handle due date only
  else if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    event.start = {
      dateTime: dueDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    event.end = {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Add reminders
  if (task.reminder_enabled && task.reminder_at) {
    const reminderTime = new Date(task.reminder_at);
    const eventTime = task.start_time ? new Date(task.start_time) : task.due_date ? new Date(task.due_date) : null;

    if (eventTime) {
      const minutesBefore = Math.floor((eventTime.getTime() - reminderTime.getTime()) / (1000 * 60));

      event.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: minutesBefore > 0 ? minutesBefore : 30 },
        ],
      };
    }
  }

  // Mark completed tasks
  if (task.completed) {
    event.status = 'cancelled'; // Or use colorId to visually mark as completed
    event.transparency = 'transparent';
  }

  return event;
}

// Create event in Google Calendar
export async function createCalendarEvent(userId: string, task: Task): Promise<SyncResult> {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = taskToCalendarEvent(task);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    // Update task with Google event ID
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('tasks')
      // @ts-ignore - google_event_id field exists in tasks table
      .update({
        google_event_id: response.data.id,
        synced_with_calendar: true,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    return {
      success: true,
      eventId: response.data.id || undefined,
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
  }
}

// Update event in Google Calendar
export async function updateCalendarEvent(userId: string, task: Task): Promise<SyncResult> {
  try {
    if (!task.google_event_id) {
      return {
        success: false,
        error: 'No Google event ID found',
      };
    }

    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = taskToCalendarEvent(task);

    await calendar.events.update({
      calendarId: 'primary',
      eventId: task.google_event_id,
      requestBody: event,
    });

    // Update sync timestamp
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('tasks')
      // @ts-ignore - synced_with_calendar field exists in tasks table
      .update({
        synced_with_calendar: true,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    return {
      success: true,
      eventId: task.google_event_id,
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to update calendar event',
    };
  }
}

// Delete event from Google Calendar
export async function deleteCalendarEvent(userId: string, task: Task): Promise<SyncResult> {
  try {
    if (!task.google_event_id) {
      return {
        success: true, // Nothing to delete
      };
    }

    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: task.google_event_id,
    });

    // Clear Google event ID from task
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('tasks')
      // @ts-ignore - google_event_id field exists in tasks table
      .update({
        google_event_id: null,
        synced_with_calendar: false,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete calendar event',
    };
  }
}

// Import events from Google Calendar
export async function importCalendarEvents(userId: string, startDate?: Date, endDate?: Date, calendarId: string = 'primary') {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const timeMin = startDate || new Date();
    const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const debugInfo = {
      timestamp: new Date().toISOString(),
      userId,
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    };

    console.log('=== SYNC.TS: Importing events from Google Calendar ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    let response;
    try {
      response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime',
      });
    } catch (apiError: any) {
      console.error('=== GOOGLE API ERROR ===');
      console.error('Error:', apiError.message);
      console.error('Code:', apiError.code);
      console.error('Details:', JSON.stringify(apiError, null, 2));
      throw apiError;
    }

    const events = response.data.items || [];
    console.log(`=== SYNC.TS: Found ${events.length} events in Google Calendar from calendar: ${calendarId} ===`);

    if (events.length > 0) {
      console.log('First event sample:', JSON.stringify(events[0], null, 2));
    } else {
      console.log('=== NO EVENTS FOUND - Checking all calendars for debugging ===');
      // Try to list from 'primary' explicitly
      try {
        const primaryTest = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          maxResults: 5,
        });
        console.log(`Primary calendar check: ${primaryTest.data.items?.length || 0} events`);
      } catch (e) {
        console.log('Could not check primary calendar');
      }
    }
    const supabase = await createServerSupabaseClient();

    const importedTasks: any[] = [];
    let skippedCount = 0;

    for (const event of events) {
      console.log('Processing event:', event.summary, 'ID:', event.id);

      // Skip events that are already imported
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('google_event_id', event.id || '')
        .eq('user_id', userId)
        .single();

      if (existingTask) {
        console.log('✓ Event already imported, skipping:', event.summary);
        skippedCount++;
        continue;
      }

      console.log('→ NEW EVENT - will import:', event.summary);

      // Helper function to extract time from ISO datetime
      const extractTime = (dateTimeString: string | null | undefined): string | null => {
        if (!dateTimeString) return null;
        // Extract time portion from "2025-10-16T13:30:00-07:00" -> "13:30:00"
        const match = dateTimeString.match(/T(\d{2}:\d{2}:\d{2})/);
        return match ? match[1] : null;
      };

      // Get next available position
      const { data: maxPositionTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = maxPositionTask ? (maxPositionTask as any).position + 1 : 0;

      // Convert event to task
      const task = {
        user_id: userId,
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        due_date: event.start?.dateTime || event.start?.date || null,
        start_time: extractTime(event.start?.dateTime),
        end_time: extractTime(event.end?.dateTime),
        is_all_day: !!event.start?.date,
        completed: event.status === 'cancelled',
        google_event_id: event.id,
        synced_with_calendar: true,
        google_calendar_sync: true,
        last_synced_at: new Date().toISOString(),
        position: nextPosition,
      };

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(task as any)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to insert task for event "${event.summary}":`, error);
        console.error('Task data:', JSON.stringify(task, null, 2));
      } else if (newTask) {
        console.log(`✅ Successfully imported: ${event.summary}`);
        importedTasks.push(newTask);
      } else {
        console.warn(`⚠️  No error but no task created for: ${event.summary}`);
      }
    }

    console.log(`=== IMPORT SUMMARY ===`);
    console.log(`Total events found: ${events.length}`);
    console.log(`Already imported (skipped): ${skippedCount}`);
    console.log(`New events imported: ${importedTasks.length}`);

    return {
      success: true,
      count: importedTasks.length,
      tasks: importedTasks,
      totalEvents: events.length,
      skippedCount: skippedCount,
    };
  } catch (error: any) {
    console.error('Error importing calendar events:', error);
    return {
      success: false,
      error: error.message || 'Failed to import calendar events',
      count: 0,
      tasks: [],
    };
  }
}

// Sync task with Google Calendar (create or update)
export async function syncTaskToCalendar(userId: string, task: Task): Promise<SyncResult> {
  if (!task.google_calendar_sync) {
    return { success: true }; // Sync is disabled for this task
  }

  if (task.google_event_id) {
    return await updateCalendarEvent(userId, task);
  } else {
    return await createCalendarEvent(userId, task);
  }
}

// Batch sync multiple tasks
export async function batchSyncTasks(userId: string, taskIds: string[]) {
  const supabase = await createServerSupabaseClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .in('id', taskIds)
    .eq('user_id', userId);

  if (error || !tasks) {
    return {
      success: false,
      error: 'Failed to fetch tasks',
      results: [],
    };
  }

  const results = [];

  for (const task of tasks) {
    const result = await syncTaskToCalendar(userId, task as Task);
    results.push({
      taskId: (task as any).id,
      ...result,
    });
  }

  return {
    success: true,
    results,
  };
}
