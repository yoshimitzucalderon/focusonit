-- Add position column to tasks table for manual ordering
ALTER TABLE tasks
ADD COLUMN position INTEGER;

-- Set default position based on created_at (older tasks first)
WITH ranked_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as pos
  FROM tasks
)
UPDATE tasks
SET position = ranked_tasks.pos
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id;

-- Make position NOT NULL now that all rows have values
ALTER TABLE tasks
ALTER COLUMN position SET NOT NULL;

-- Create index for better performance when ordering
CREATE INDEX idx_tasks_user_position ON tasks(user_id, position);

-- Add comment
COMMENT ON COLUMN tasks.position IS 'Manual ordering position for tasks within user scope';
