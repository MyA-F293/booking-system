-- Add teacher_id column for readable ID format
-- Format: TCHR0001, TCHR0002, etc.

-- Add teacher_id column
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teacher_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);

-- Add comment
COMMENT ON COLUMN teachers.teacher_id IS 'Readable teacher ID format (TCHR0001, TCHR0002, etc.)';

-- Note: teacher_id will be auto-generated when creating new teachers
-- Existing teachers will need to be updated manually or via migration script
