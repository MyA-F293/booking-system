-- =====================================================
-- DELETE ATTENDANCE FOR SPECIFIC STUDENT - SPECIFIC STATUS
-- =====================================================
-- This script deletes attendance records for a specific student
-- with a specific status (present/late/absent)
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
ORDER BY status, created_at DESC;

-- Step 2: Count records by status
SELECT 
    status,
    COUNT(*) as total_records,
    student_name
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY status, student_name;

-- Step 3: DELETE ONLY "present" records (KEEP "late" records!)
-- This will delete the green (present) but keep yellow (late)
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'present';  -- Only delete "present" status

-- Step 4: Verify deletion - check remaining records
SELECT 
    status,
    COUNT(*) as remaining_records
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY status;

-- Should show:
-- late: 1 (or however many late records exist)
-- present: 0 (deleted)

-- =====================================================
-- ALTERNATIVE: Delete specific status for specific week
-- =====================================================
-- If you only want to delete "present" for Week 6:
/*
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'present'
  AND week_number = 6
  AND year = 2026;
*/

-- =====================================================
-- ALTERNATIVE: Delete "absent" records only
-- =====================================================
-- If you want to delete "absent" records:
/*
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'absent';
*/

-- =====================================================
-- MULTIPLE STUDENTS - Delete "present" only
-- =====================================================
-- If you want to delete "present" for multiple students:
/*
DELETE FROM attendance
WHERE student_id IN (
    'EYSA26010054',  -- Muh Fikri Syahputra
    'EYSA26010055',  -- Another student
    'EYSA26010056'   -- Another student
)
AND status = 'present';
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Run Step 1 & 2 first to see what will be deleted
-- 2. Step 3 will ONLY delete "present" records
-- 3. "late" and "absent" records will be KEPT
-- 4. Step 4 verifies the deletion was successful
-- 5. This does NOT delete the student account
-- =====================================================
