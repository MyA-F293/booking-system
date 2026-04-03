-- ============================================
-- DEBUG: What Does Trigger See?
-- ============================================
-- Query ini akan tampilkan SEMUA schedules yang MIRIP dengan Oxford Saturday Evening
-- Tapi TANPA filter program/level (seperti yang trigger lakukan)
-- Ini akan show kenapa trigger block INSERT

-- Target schedule yang mau di-book:
-- Class: Oxford Class
-- Day: saturday
-- Time: evening
-- Phase: phase2
-- Week: 2

-- First, get Oxford Class ID
WITH oxford_class AS (
    SELECT id, name
    FROM classes
    WHERE name = 'Oxford Class'
)
SELECT 
    '🔍 What Trigger Sees (WITHOUT program/level filter)' as info,
    s.id,
    s.program,
    s.level,
    s.batch,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    s.current_students,
    s.created_at,
    c.name as class_name
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.class_id = (SELECT id FROM oxford_class)
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase2'
  AND s.week_number = 2
ORDER BY s.created_at DESC;

-- Now check WITH program/level filter (what code checks)
SELECT 
    '✅ What Code Checks (WITH program/level filter)' as info,
    s.id,
    s.program,
    s.level,
    s.batch,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    s.current_students,
    s.created_at,
    c.name as class_name
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND s.program = 'English for Teens'  -- ⬅️ Code checks this
  AND s.level = 'Starter'              -- ⬅️ Code checks this
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase2'
  AND s.week_number = 2
  AND s.batch = '2';  -- ⬅️ Fixed: batch is TEXT, not INTEGER

-- Summary
SELECT 
    '📊 SUMMARY' as info,
    (
        SELECT COUNT(*)
        FROM schedules s
        WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
          AND s.day = 'saturday'
          AND s.time_slot = 'evening'
          AND s.phase = 'phase2'
          AND s.week_number = 2
    ) as schedules_without_program_filter,
    (
        SELECT COUNT(*)
        FROM schedules s
        WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
          AND s.program = 'English for Teens'
          AND s.level = 'Starter'
          AND s.day = 'saturday'
          AND s.time_slot = 'evening'
          AND s.phase = 'phase2'
          AND s.week_number = 2
          AND s.batch = '2'  -- ⬅️ Fixed: batch is TEXT
    ) as schedules_with_program_filter,
    CASE 
        WHEN (
            SELECT COUNT(*)
            FROM schedules s
            WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
              AND s.day = 'saturday'
              AND s.time_slot = 'evening'
              AND s.phase = 'phase2'
              AND s.week_number = 2
        ) > 0 THEN '🚨 TRIGGER WILL BLOCK! Schedule exists (without program filter)'
        ELSE '✅ Trigger will allow (no schedule found)'
    END as trigger_behavior,
    CASE 
        WHEN (
            SELECT COUNT(*)
            FROM schedules s
            WHERE s.class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
              AND s.program = 'English for Teens'
              AND s.level = 'Starter'
              AND s.day = 'saturday'
              AND s.time_slot = 'evening'
              AND s.phase = 'phase2'
              AND s.week_number = 2
              AND s.batch = '2'  -- ⬅️ Fixed: batch is TEXT
        ) > 0 THEN '🚨 Code will use existing schedule'
        ELSE '✅ Code will create new schedule'
    END as code_behavior;
