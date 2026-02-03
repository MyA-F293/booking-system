-- =====================================================
-- REMOVE DUPLICATE ATTENDANCE FOR SPECIFIC STUDENTS
-- =====================================================
-- This script removes duplicates ONLY for specific students
-- Safer than deleting all duplicates at once
-- =====================================================

-- Step 1: Check duplicates for these specific students
SELECT 
    student_id,
    student_name,
    schedule_id,
    class_name,
    COUNT(*) as duplicate_count,
    MAX(created_at) as latest_submission,
    MIN(created_at) as first_submission
FROM attendance
WHERE student_name IN (
    'Nurul Jumriani S',
    'Tami Utami',
    'Amanda Putri',
    'Egha Adiarti Desitasari Indar',
    'Mahful Hidayatullah Saleh',
    'Humaerah Nur Fatih S',
    'Nur Dwifanni',
    'Asrul'
)
GROUP BY student_id, student_name, schedule_id, class_name
HAVING COUNT(*) > 1
ORDER BY student_name, schedule_id;

-- Step 2: See all duplicate records (before deletion)
WITH target_students AS (
    SELECT DISTINCT student_id
    FROM attendance
    WHERE student_name IN (
        'Nurul Jumriani S',
        'Tami Utami',
        'Amanda Putri',
        'Egha Adiarti Desitasari Indar',
        'Mahful Hidayatullah Saleh',
        'Humaerah Nur Fatih S',
        'Nur Dwifanni',
        'Asrul'
    )
),
duplicates AS (
    SELECT 
        schedule_id,
        student_id,
        COUNT(*) as count
    FROM attendance
    WHERE student_id IN (SELECT student_id FROM target_students)
    GROUP BY schedule_id, student_id
    HAVING COUNT(*) > 1
)
SELECT 
    a.id,
    a.student_id,
    a.student_name,
    a.class_name,
    a.schedule_id,
    a.status,
    a.created_at,
    a.teacher_name
FROM attendance a
INNER JOIN duplicates d 
    ON a.schedule_id = d.schedule_id 
    AND a.student_id = d.student_id
ORDER BY a.student_name, a.schedule_id, a.created_at DESC;

-- Step 3: DELETE DUPLICATES for specific students only
-- Keeps the NEWEST record (latest created_at)
DELETE FROM attendance
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            a.id,
            ROW_NUMBER() OVER (
                PARTITION BY a.schedule_id, a.student_id 
                ORDER BY a.created_at DESC
            ) as row_num
        FROM attendance a
        WHERE a.student_name IN (
            'Nurul Jumriani S',
            'Tami Utami',
            'Amanda Putri',
            'Egha Adiarti Desitasari Indar',
            'Mahful Hidayatullah Saleh',
            'Humaerah Nur Fatih S',
            'Nur Dwifanni',
            'Asrul'
        )
    ) ranked
    WHERE row_num > 1
);

-- Step 4: Verify deletion for these students
SELECT 
    student_id,
    student_name,
    schedule_id,
    class_name,
    COUNT(*) as duplicate_count
FROM attendance
WHERE student_name IN (
    'Nurul Jumriani S',
    'Tami Utami',
    'Amanda Putri',
    'Egha Adiarti Desitasari Indar',
    'Mahful Hidayatullah Saleh',
    'Humaerah Nur Fatih S',
    'Nur Dwifanni',
    'Asrul'
)
GROUP BY student_id, student_name, schedule_id, class_name
HAVING COUNT(*) > 1;

-- Should return 0 rows if successful!

-- =====================================================
-- ALTERNATIVE: Delete duplicates for ONE student only
-- =====================================================
-- If you want to test with just one student first:
/*
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
        WHERE student_name = 'Nurul Jumriani S'  -- Change name here
    ) ranked
    WHERE row_num > 1
);
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Only affects the 8 students listed above
-- 2. Other students' data is NOT touched
-- 3. Keeps the NEWEST record (latest created_at)
-- 4. Run Step 1 & 2 first to see what will be deleted
-- 5. Step 4 verifies deletion was successful
-- =====================================================
