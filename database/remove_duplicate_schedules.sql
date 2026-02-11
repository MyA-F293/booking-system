-- =====================================================
-- REMOVE DUPLICATE SCHEDULES FROM DATABASE
-- =====================================================
-- This script removes duplicate schedule entries
-- keeping only ONE unique schedule per combination of:
-- (class_id, day, time_slot, phase, week_number, year)
-- =====================================================

-- Step 1: Find and display duplicates
SELECT 
    class_id,
    day,
    time_slot,
    phase,
    week_number,
    year,
    COUNT(*) as duplicate_count
FROM schedules
GROUP BY class_id, day, time_slot, phase, week_number, year
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicates, keeping only the OLDEST record (lowest id)
-- This uses a CTE (Common Table Expression) to identify duplicates
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY class_id, day, time_slot, phase, week_number, year 
            ORDER BY id ASC
        ) as row_num
    FROM schedules
)
DELETE FROM schedules
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE row_num > 1
);

-- Step 3: Verify - should return 0 rows if successful
SELECT 
    class_id,
    day,
    time_slot,
    phase,
    week_number,
    year,
    COUNT(*) as duplicate_count
FROM schedules
GROUP BY class_id, day, time_slot, phase, week_number, year
HAVING COUNT(*) > 1;

-- Step 4: Add UNIQUE constraint to prevent future duplicates
-- Note: This will fail if there are still duplicates, so run Step 2 first!
ALTER TABLE schedules
ADD CONSTRAINT unique_schedule_slot 
UNIQUE (class_id, day, time_slot, phase, week_number, year);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check total schedules before and after
SELECT COUNT(*) as total_schedules FROM schedules;

-- Check schedules for a specific week
SELECT 
    s.id,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    s.current_students,
    t.name as teacher_name
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN teachers t ON s.teacher_id = t.id
WHERE s.week_number = 7 AND s.year = 2025
ORDER BY s.phase, s.day, s.time_slot;
