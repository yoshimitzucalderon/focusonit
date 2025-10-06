-- Migration: Update session types to include breaks
-- Created: 2025-01-06
-- Description: Add break types to time_sessions table

-- Drop existing constraint
ALTER TABLE time_sessions DROP CONSTRAINT IF EXISTS time_sessions_session_type_check;

-- Add new constraint with break types
ALTER TABLE time_sessions ADD CONSTRAINT time_sessions_session_type_check
  CHECK (session_type IN ('work', 'short_break', 'long_break', 'pomodoro_25', 'custom'));

-- Add pomodoro_count column to track position in cycle
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS pomodoro_count integer DEFAULT 0;

-- Comment on new column
COMMENT ON COLUMN time_sessions.pomodoro_count IS 'Number of completed pomodoros in current cycle (resets after long break)';
COMMENT ON COLUMN time_sessions.session_type IS 'Type of session: work, short_break, long_break (new), pomodoro_25 (legacy), custom (legacy)';
