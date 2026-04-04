# ⚡ Quick Fix: Teacher "TBA" Issue

## 🎯 Problem
Teacher shows "TBA" instead of actual name.

## ✅ Solution (3 Steps)

---

### 📍 STEP 1: Fix Program Name (5-10 min)
**File**: `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql`

**Run in Supabase SQL Editor**:
```sql
-- 1. Verify (should show 21 students)
SELECT student_id, full_name, program 
FROM users 
WHERE program = 'Campus & Career' AND role = 'student';

-- 2. Update (should say "UPDATE 21")
UPDATE users
SET program = 'English Campus & Career'
WHERE program = 'Campus & Career' AND role = 'student';

-- 3. Verify (should show 0 rows)
SELECT COUNT(*) FROM users 
WHERE program = 'Campus & Career' AND role = 'student';
```

**Result**: ✅ 21 students can now book schedules

---

### 📍 STEP 2: Check Teachers (5 min)
**File**: `booking-system/database/CHECK_TEACHER_ASSIGNMENTS.sql`

**Run in Supabase SQL Editor**:
```sql
-- Count schedules without teacher
SELECT 
    program,
    COUNT(*) as missing_teachers,
    SUM(current_students) as students_affected
FROM schedules
WHERE teacher_id IS NULL AND current_students > 0
GROUP BY program;
```

**If result shows rows**: Continue to STEP 3  
**If result is empty**: Teacher issue is elsewhere (share screenshot)

---

### 📍 STEP 3: Assign Teachers (10-15 min)
**Based on STEP 2 results**, run queries like:

```sql
-- Example: Assign Teacher A to Campus & Career
UPDATE schedules
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Teacher A')
WHERE program = 'English Campus & Career'
  AND teacher_id IS NULL
  AND current_students > 0;

-- Verify (should show 0 rows)
SELECT COUNT(*) FROM schedules 
WHERE teacher_id IS NULL AND current_students > 0;
```

**Result**: ✅ All schedules have teachers assigned

---

## 🧪 Quick Test

1. **Login as Naswa** (EYSA26020225)
2. **Open Booking tab**
3. **Check**: Should see many schedules ✅
4. **Check**: Teacher names show (not "TBA") ✅
5. **Book a schedule**
6. **Check**: Success without errors ✅

---

## ⏱️ Total Time: 20-30 minutes

---

## 📁 Full Documentation

- **Indonesian Guide**: `CARA_FIX_TEACHER_TBA.md`
- **Action Plan**: `FIX_TEACHER_TBA_ACTION_PLAN.md`
- **Session Summary**: `SESSION_SUMMARY_2026-04-04_TEACHER_FIX.md`

---

**Status**: 🔄 Ready to Run  
**Priority**: 🔥 HIGH  
**Safety**: ✅ 100% SAFE
