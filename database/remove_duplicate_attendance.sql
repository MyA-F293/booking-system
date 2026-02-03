-- =====================================================
-- REMOVE DUPLICATE ATTENDANCE RECORDS
-- =====================================================
-- This script removes duplicate attendance records
-- Keeps the NEWEST record (latest created_at) for each duplicate
-- Duplicate is defined as: same schedule_id + student_id combination
-- =====================================================

-- Step 1: Check how many duplicates exist (OPTIONAL - for information only)
-- Run this first to see the problem
SELECT 
    schedule_id,
    student_id,
    student_name,
    COUNT(*) as duplicate_count
FROM attendance
GROUP BY schedule_id, student_id, student_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: See the actual duplicate records (OPTIONAL - for verification)
-- This shows all records that are duplicates
WITH duplicates AS (
    SELECT 
        schedule_id,
        student_id,
        COUNT(*) as count
    FROM attendance
    GROUP BY schedule_id, student_id
    HAVING COUNT(*) > 1
)
SELECT 
    a.id,
    a.schedule_id,
    a.student_id,
    a.student_name,
    a.status,
    a.created_at,
    a.teacher_name,
    a.class_name
FROM attendance a
INNER JOIN duplicates d 
    ON a.schedule_id = d.schedule_id 
    AND a.student_id = d.student_id
ORDER BY a.schedule_id, a.student_id, a.created_at DESC;

-- Step 3: DELETE DUPLICATES (Keep only the newest record)
-- This is the MAIN deletion query
-- WARNING: This will permanently delete duplicate records!
DELETE FROM attendance
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY schedule_id, student_id 
                ORDER BY created_at DESC
            ) as row_num
        FROM attendance
    ) ranked
    WHERE row_num > 1
);

-- Step 4: Verify deletion (OPTIONAL - run after deletion)
-- This should return 0 rows if all duplicates are removed
SELECT 
    schedule_id,
    student_id,
    student_name,
    COUNT(*) as duplicate_count
FROM attendance
GROUP BY schedule_id, student_id, student_name
HAVING COUNT(*) > 1;

-- =====================================================
-- ALTERNATIVE: If you want to keep the OLDEST record instead
-- =====================================================
-- Uncomment this if you prefer to keep the first submission
/*
DELETE FROM attendance
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY schedule_id, student_id 
                ORDER BY created_at ASC  -- ASC instead of DESC
            ) as row_num
        FROM attendance
    ) ranked
    WHERE row_num > 1
);
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. The script keeps the NEWEST record (latest created_at)
-- 2. Duplicate key: schedule_id + student_id
-- 3. Run Step 1 & 2 first to see what will be deleted
-- 4. Backup your data before running Step 3
-- 5. Step 4 verifies that all duplicates are removed
-- =====================================================
