-- =====================================================
-- DELETE ATTENDANCE FOR SPECIFIC STUDENT
-- =====================================================
-- This script deletes attendance records for a specific student
-- Use this when you need to remove attendance data for one student
-- =====================================================

-- Step 1: Check attendance records for this student (BEFORE deletion)
-- This shows what will be deleted
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
WHERE student_id = 'EYSA26010054'  -- Muh Fikri Syahputra
ORDER BY created_at DESC;

-- Step 2: Count how many records will be deleted
SELECT 
    COUNT(*) as total_records,
    student_name,
    student_id
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY student_name, student_id;

-- Step 3: DELETE attendance for this student
-- WARNING: This will permanently delete all attendance records!
DELETE FROM attendance
WHERE student_id = 'EYSA26010054';  -- Muh Fikri Syahputra

-- Step 4: Verify deletion (should return 0 rows)
SELECT 
    COUNT(*) as remaining_records
FROM attendance
WHERE student_id = 'EYSA26010054';

-- =====================================================
-- ALTERNATIVE: Delete for specific week only
-- =====================================================
-- If you only want to delete attendance for a specific week:
/*
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND week_number = 6  -- Change week number here
  AND year = 2026;
*/

-- =====================================================
-- ALTERNATIVE: Delete for specific class only
-- =====================================================
-- If you only want to delete attendance for Tsinghua Class:
/*
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND class_name = 'Tsinghua Class';
*/

-- =====================================================
-- MULTIPLE STUDENTS
-- =====================================================
-- If you want to delete for multiple students at once:
/*
DELETE FROM attendance
WHERE student_id IN (
    'EYSA26010054',  -- Muh Fikri Syahputra
    'EYSA26010055',  -- Another student
    'EYSA26010056'   -- Another student
);
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Run Step 1 & 2 first to see what will be deleted
-- 2. Step 3 will permanently delete the records
-- 3. Step 4 verifies the deletion was successful
-- 4. Use alternatives if you only want to delete specific records
-- 5. This does NOT delete the student account, only attendance records
-- =====================================================
