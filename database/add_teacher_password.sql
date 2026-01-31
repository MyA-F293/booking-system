-- Add password column to teachers table for login
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'teacher123';

-- Update existing teachers with default password
UPDATE teachers SET password = 'teacher123' WHERE password IS NULL;

-- Make password NOT NULL after setting defaults
ALTER TABLE teachers ALTER COLUMN password SET NOT NULL;

-- Add comment
COMMENT ON COLUMN teachers.password IS 'Teacher login password (default: teacher123)';
