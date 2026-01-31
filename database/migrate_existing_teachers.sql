-- Migration script to add teacher_id to existing teachers
-- This script will generate TCHR IDs for teachers that don't have one yet

-- Step 1: Add teacher_id column (if not exists)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teacher_id TEXT UNIQUE;

-- Step 2: Create a function to generate sequential teacher IDs
CREATE OR REPLACE FUNCTION generate_teacher_ids()
RETURNS void AS $$
DECLARE
    teacher_record RECORD;
    sequence_num INTEGER := 1;
    new_teacher_id TEXT;
BEGIN
    -- Loop through all teachers that don't have teacher_id yet
    FOR teacher_record IN 
        SELECT id 
        FROM teachers 
        WHERE teacher_id IS NULL 
        ORDER BY created_at ASC
    LOOP
        -- Generate new teacher_id
        new_teacher_id := 'TCHR' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Update the teacher
        UPDATE teachers 
        SET teacher_id = new_teacher_id 
        WHERE id = teacher_record.id;
        
        -- Increment sequence
        sequence_num := sequence_num + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the function to generate IDs
SELECT generate_teacher_ids();

-- Step 4: Drop the function (cleanup)
DROP FUNCTION IF EXISTS generate_teacher_ids();

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);

-- Step 6: Verify the migration
SELECT 
    id,
    teacher_id,
    name,
    email,
    is_active,
    created_at
FROM teachers
ORDER BY teacher_id;

-- Expected result:
-- All teachers should now have teacher_id (TCHR0001, TCHR0002, etc.)
-- Ordered by creation date (oldest first)
