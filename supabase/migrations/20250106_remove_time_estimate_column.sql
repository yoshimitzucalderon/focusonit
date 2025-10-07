-- Remove time_estimate column from tasks table
-- This column is no longer used in the application

ALTER TABLE tasks
DROP COLUMN IF EXISTS time_estimate;
