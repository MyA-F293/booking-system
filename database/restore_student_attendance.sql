-- =====================================================
-- RESTORE / ADD ATTENDANCE FOR STUDENT
-- =====================================================
-- Use this to add back attendance records that were deleted
-- or to manually add new attendance records
-- =====================================================

-- Step 1: Check current attendance for this student
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    program,
    level,
    day,
    time_slot,
    week_number,
    year,
    status,
    teacher_name,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY created_at DESC;

-- Step 2: ADD ATTENDANCE RECORD
-- You need to fill in the correct values for:
-- - schedule_id (get from schedules table)
-- - teacher_id (get from teachers table)
-- - teacher_name
-- - class_name
-- - program
-- - level
-- - phase
-- - day
-- - time_slot
-- - week_number
-- - year
-- - status ('present', 'late', or 'absent')

-- TEMPLATE: Add ONE attendance record
INSERT INTO attendance (
    teacher_id,
    teacher_name,
    schedule_id,
    class_name,
    program,
    level,
    phase,
    day,
    time_slot,
    week_number,
    year,
    student_id,
    student_name,
    status
) VALUES (
    'TEACHER_ID_HERE',           -- Replace with actual teacher_id
    'Teacher Name Here',          -- Replace with teacher name
    'SCHEDULE_ID_HERE',          -- Replace with schedule_id
    'Tsinghua Class',            -- Class name
    'Campus & Career',           -- Program
    'Starter',                   -- Level
    'Phase 1',                   -- Phase
    'monday',                    -- Day (lowercase)
    'afternoon',                 -- Time slot (afternoon/evening)
    6,                           -- Week number
    2026,                        -- Year
    'EYSA26010054',             -- Student ID
    'Muh Fikri Syahputra',      -- Student name
    'late'                       -- Status: 'present', 'late', or 'absent'
);

-- =====================================================
-- HOW TO GET THE REQUIRED IDs
-- =====================================================

-- Get schedule_id for Tsinghua Class, Week 6
SELECT 
    id as schedule_id,
    class_id,
    teacher_id,
    program,
    level,
    phase,
    day,
    time_slot,
    week_number,
    year
FROM schedules
WHERE week_number = 6
  AND year = 2026
  AND program = 'Campus & Career'
  AND level = 'Starter'
ORDER BY day, time_slot;

-- Get teacher_id and name
SELECT 
    id as teacher_id,
    teacher_id as teacher_login_id,
    name as teacher_name
FROM teachers
WHERE is_active = true
ORDER BY name;

-- =====================================================
-- EXAMPLE: Add "late" record for Muh Fikri Syahputra
-- =====================================================
-- Replace the values below with actual data from queries above

/*
INSERT INTO attendance (
    teacher_id,
    teacher_name,
    schedule_id,
    class_name,
    program,
    level,
    phase,
    day,
    time_slot,
    week_number,
    year,
    student_id,
    student_name,
    status
) VALUES (
    'abc123-def456-ghi789',      -- Get from teachers table
    'John Doe',                   -- Teacher name
    'xyz789-uvw456-rst123',      -- Get from schedules table
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'monday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'late'
);
*/

-- =====================================================
-- ADD MULTIPLE RECORDS AT ONCE
-- =====================================================
-- If you need to add multiple attendance records:

/*
INSERT INTO attendance (
    teacher_id,
    teacher_name,
    schedule_id,
    class_name,
    program,
    level,
    phase,
    day,
    time_slot,
    week_number,
    year,
    student_id,
    student_name,
    status
) VALUES 
-- Record 1: Late on Monday
(
    'TEACHER_ID',
    'Teacher Name',
    'SCHEDULE_ID_1',
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'monday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'late'
),
-- Record 2: Present on Wednesday
(
    'TEACHER_ID',
    'Teacher Name',
    'SCHEDULE_ID_2',
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'wednesday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'present'
);
*/

-- Step 3: Verify the records were added
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    status,
    day,
    time_slot,
    week_number,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY created_at DESC;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Run the helper queries first to get schedule_id and teacher_id
-- 2. Replace the placeholder values with actual data
-- 3. Make sure the schedule exists for that week
-- 4. Status must be: 'present', 'late', or 'absent'
-- 5. Day must be lowercase: 'monday', 'tuesday', etc.
-- 6. Time slot must be: 'afternoon' or 'evening'
-- =====================================================
