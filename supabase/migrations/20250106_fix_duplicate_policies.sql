-- ============================================
-- FIX DUPLICATE POLICIES
-- ============================================
-- Eliminar políticas duplicadas si existen

-- Drop existing policies for time_sessions
DROP POLICY IF EXISTS "Users can view their own time sessions" ON time_sessions;
DROP POLICY IF EXISTS "Users can insert their own time sessions" ON time_sessions;
DROP POLICY IF EXISTS "Users can update their own time sessions" ON time_sessions;
DROP POLICY IF EXISTS "Users can delete their own time sessions" ON time_sessions;

-- Recreate policies with correct names
CREATE POLICY "Users can view own time sessions"
  ON time_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time sessions"
  ON time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time sessions"
  ON time_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time sessions"
  ON time_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Drop existing policies for pomodoro_settings if they exist
DROP POLICY IF EXISTS "Users can view their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can insert their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can update their own pomodoro settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "Users can delete their own pomodoro settings" ON pomodoro_settings;

-- Recreate policies for pomodoro_settings
CREATE POLICY "Users can view own pomodoro settings"
  ON pomodoro_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro settings"
  ON pomodoro_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro settings"
  ON pomodoro_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro settings"
  ON pomodoro_settings FOR DELETE
  USING (auth.uid() = user_id);
