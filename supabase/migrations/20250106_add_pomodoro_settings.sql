-- Migration: Add pomodoro_settings table for user preferences
-- Created: 2025-01-06
-- Description: Stores user-specific Pomodoro timer configuration

-- Create pomodoro_settings table
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Timer durations (in minutes)
  work_duration integer DEFAULT 25 CHECK (work_duration >= 1 AND work_duration <= 120),
  short_break_duration integer DEFAULT 5 CHECK (short_break_duration >= 1 AND short_break_duration <= 30),
  long_break_duration integer DEFAULT 15 CHECK (long_break_duration >= 5 AND long_break_duration <= 60),

  -- Pomodoro cycle settings
  pomodoros_until_long_break integer DEFAULT 4 CHECK (pomodoros_until_long_break >= 2 AND pomodoros_until_long_break <= 10),

  -- Auto-start settings
  auto_start_breaks boolean DEFAULT false,
  auto_start_pomodoros boolean DEFAULT false,

  -- Notification settings
  notifications_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  sound_volume integer DEFAULT 50 CHECK (sound_volume >= 0 AND sound_volume <= 100),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pomodoro_settings_user_id ON pomodoro_settings(user_id);

-- Enable Row Level Security
ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can create their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can update their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can delete their own pomodoro settings" ON pomodoro_settings;

-- RLS Policy: Users can only view their own settings
CREATE POLICY "Users can view their own pomodoro settings"
  ON pomodoro_settings FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only create their own settings
CREATE POLICY "Users can create their own pomodoro settings"
  ON pomodoro_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own settings
CREATE POLICY "Users can update their own pomodoro settings"
  ON pomodoro_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own settings
CREATE POLICY "Users can delete their own pomodoro settings"
  ON pomodoro_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pomodoro_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS pomodoro_settings_updated_at ON pomodoro_settings;

-- Trigger to call the function
CREATE TRIGGER pomodoro_settings_updated_at
  BEFORE UPDATE ON pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pomodoro_settings_updated_at();

-- Comment on table
COMMENT ON TABLE pomodoro_settings IS 'Stores user-specific Pomodoro timer configuration and preferences';
COMMENT ON COLUMN pomodoro_settings.work_duration IS 'Duration of work session in minutes (default: 25)';
COMMENT ON COLUMN pomodoro_settings.short_break_duration IS 'Duration of short break in minutes (default: 5)';
COMMENT ON COLUMN pomodoro_settings.long_break_duration IS 'Duration of long break in minutes (default: 15)';
COMMENT ON COLUMN pomodoro_settings.pomodoros_until_long_break IS 'Number of pomodoros before a long break (default: 4)';
