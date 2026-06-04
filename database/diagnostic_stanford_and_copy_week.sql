-- ============================================
-- DIAGNOSTIC: Stanford Class + Copy Week Issues
-- Run this to diagnose both problems at once
-- ============================================

-- ====================
-- PART 1: STANFORD CLASS CHECK
-- ====================

SELECT 
    '=== STANFORD CLASS CHECK ===' as section,
    '' as info;

-- Check if Stanford Class exists
SELECT 
    'Stanford Class Exists?' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Stanford Class found in database'
        ELSE '❌ NO - Stanford Class NOT FOUND! Run: database/add_stanford_class.sql'
    END as result,
    COUNT(*) as count
FROM classes
WHERE name = 'Stanford Class';

-- Show all classes for reference
SELECT 
    'All Classes' as section,
    id,
    name,
    min_students,
    max_students,
    is_active
FROM classes
ORDER BY name;

-- Check Friday schedules for potential conflicts
SELECT 
    'Friday Schedules (Week 1)' as section,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.program,
    s.level,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.day = 'friday'
  AND s.week_number = 1
  AND s.year = 2026
ORDER BY s.time_slot, c.name;

-- ====================
-- PART 2: COPY WEEK CHECK
-- ====================

SELECT 
    '=== COPY WEEK CHECK ===' as section,
    '' as info;

-- Check recent schedules (last 10 minutes)
SELECT 
    'Recent Schedules (Last 10 min)' as check_type,
    COUNT(*) as schedules_created,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Schedules were created! Check UI filters (Hide Empty toggle, Week tab)'
        ELSE 'ℹ️ No schedules created in last 10 minutes'
    END as result,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM schedules
WHERE created_at > NOW() - INTERVAL '10 minutes';

-- Show schedules with NULL batch (from Copy Week)
SELECT 
    'Schedules with NULL Batch' as section,
    COUNT(*) as total_count,
    week_number,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Found schedules with NULL batch (normal after Copy Week)'
        ELSE 'ℹ️ No NULL batch schedules'
    END as info
FROM schedules
WHERE batch IS NULL
  AND year = 2026
GROUP BY week_number
ORDER BY week_number;

-- Show Week 2 schedules (typical target for Copy Week)
SELECT 
    'Week 2 Schedules' as section,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.program,
    s.level,
    s.current_students,
    s.batch,
    s.created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2
  AND s.year = 2026
ORDER BY s.created_at DESC, s.day, s.time_slot
LIMIT 20;

-- ====================
-- PART 3: BATCH AUTO-DETECTION CHECK
-- ====================

SELECT 
    '=== BATCH AUTO-DETECTION CHECK ===' as section,
    '' as info;

-- Check batch distribution of active students
SELECT 
    'Student Batch Distribution' as section,
    batch,
    COUNT(*) as student_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage,
    CASE 
        WHEN COUNT(*) = MAX(COUNT(*)) OVER () THEN '👑 MAJORITY (This will be auto-detected batch)'
        ELSE ''
    END as is_majority
FROM students
WHERE is_active = TRUE
GROUP BY batch
ORDER BY student_count DESC;

-- ====================
-- PART 4: RPC FUNCTION CHECK
-- ====================

SELECT 
    '=== SMART_COPY_WEEK FUNCTION CHECK ===' as section,
    '' as info;

-- Check if smart_copy_week function exists and uses NULL batch
SELECT 
    'smart_copy_week Function' as check_type,
    CASE 
        WHEN prosrc LIKE '%batch = NULL%' THEN '✅ Function correctly sets batch = NULL'
        WHEN prosrc LIKE '%batch = source.batch%' THEN '❌ Function copies old batch! Run: database/FIX_SMART_COPY_WEEK_BATCH.sql'
        ELSE '⚠️ Function behavior unclear'
    END as result,
    LENGTH(prosrc) as function_size
FROM pg_proc 
WHERE proname = 'smart_copy_week';

-- ====================
-- SUMMARY & RECOMMENDATIONS
-- ====================

SELECT 
    '=== SUMMARY & NEXT ACTIONS ===' as section,
    '' as info;

-- Generate action items based on findings
SELECT 
    'Action Items' as section,
    CASE 
        -- Stanford Class check
        WHEN NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Stanford Class')
        THEN '1️⃣ URGENT: Run database/add_stanford_class.sql to add Stanford Class'
        ELSE '✅ Stanford Class exists in database'
    END as stanford_action,
    
    CASE 
        -- Copy Week check
        WHEN EXISTS (
            SELECT 1 FROM schedules 
            WHERE created_at > NOW() - INTERVAL '10 minutes'
            AND week_number = 2
        )
        THEN '2️⃣ Copy Week created schedules! Check UI: Turn OFF "Hide Empty" toggle, switch to "Next Week" tab, hard refresh (Ctrl+Shift+R)'
        ELSE '2️⃣ No recent Copy Week detected. Try copying again from admin dashboard.'
    END as copy_week_action,
    
    CASE 
        -- Batch check
        WHEN EXISTS (
            SELECT 1 FROM students 
            WHERE is_active = TRUE 
            GROUP BY batch 
            HAVING COUNT(*) > 0
        )
        THEN '3️⃣ Batch auto-detection working. Majority batch will be displayed in UI.'
        ELSE '⚠️ No active students found!'
    END as batch_action;

-- Show current settings
SELECT 
    'Current System Settings' as section,
    id,
    current_week,
    academic_year
FROM settings
WHERE id = 1;
