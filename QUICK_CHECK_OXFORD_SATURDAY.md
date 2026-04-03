# Quick Check: Oxford Saturday Evening Booking Error

## 🚨 PROBLEM
Student tidak bisa booking Oxford Saturday Evening
Error: "Duplicate schedule detected!"

## ✅ QUICK FIX - JALANKAN QUERY INI

### 1. Check Current Situation
```sql
SELECT 
    id,
    program,
    level,
    batch,
    current_students,
    max_students,
    created_at
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY program, level, batch, created_at;
```

### 2. Delete Empty Duplicates (if any)
```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

### 3. Verify Fix
```sql
-- Should return only active schedules (current_students > 0)
SELECT 
    program,
    level,
    batch,
    current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026;
```

## 📋 EXPECTED RESULT

**Before Fix:**
- Multiple schedules (some with 0 students)
- Trigger blocks new schedule creation

**After Fix:**
- Only active schedules remain
- Student can book successfully

## 🔍 IF STILL ERROR

Check if Oxford is occupied by other program:
```sql
SELECT 
    c.name as class_name,
    s.program,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2
  AND s.year = 2026
  AND s.current_students > 0
  AND c.name = 'Oxford Class';
```

If Oxford is occupied by another program → Room conflict (expected behavior)
If Oxford is empty → Duplicate issue (run delete query above)

---

**Created:** April 3, 2026
**Action:** Run query 1 first, then decide
