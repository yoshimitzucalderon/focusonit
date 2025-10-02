-- Migration: Add time_sessions table for Pomodoro timer functionality
-- Created: 2025-01-02
-- Description: Tracks time sessions for tasks with Pomodoro timer

-- Create time_sessions table
CREATE TABLE IF NOT EXISTS time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Timer fields
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer, -- Stored in seconds for precision
  session_type text DEFAULT 'pomodoro_25' CHECK (session_type IN ('pomodoro_25', 'custom')),
  is_completed boolean DEFAULT false,
  is_active boolean DEFAULT true, -- Track if session is currently running

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_sessions_task_id ON time_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_started_at ON time_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_sessions_active ON time_sessions(is_active) WHERE is_active = true;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_task ON time_sessions(user_id, task_id);

-- Enable Row Level Security
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own time sessions
CREATE POLICY "Users can view their own time sessions"
  ON time_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only create their own time sessions
CREATE POLICY "Users can create their own time sessions"
  ON time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own time sessions
CREATE POLICY "Users can update their own time sessions"
  ON time_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own time sessions
CREATE POLICY "Users can delete their own time sessions"
  ON time_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER time_sessions_updated_at
  BEFORE UPDATE ON time_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_time_sessions_updated_at();

-- Comment on table
COMMENT ON TABLE time_sessions IS 'Stores Pomodoro timer sessions for tasks';
COMMENT ON COLUMN time_sessions.duration_seconds IS 'Duration in seconds (null while session is active)';
COMMENT ON COLUMN time_sessions.is_active IS 'True if session is currently running, false if paused or completed';
COMMENT ON COLUMN time_sessions.is_completed IS 'True if session completed full duration (25 min for pomodoro)';
