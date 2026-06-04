# 🌲 Stanford Class Friday Creation Issue - Diagnostic Guide

## 📋 Issue Summary
Cannot create Stanford Class schedule on Friday in production.

## 🔍 Diagnostic Steps

### Step 1: Check if Stanford Class exists in database

**Run this query in Supabase SQL Editor:**

```sql
-- Check if Stanford Class exists
SELECT 
    id,
    name,
    min_students,
    max_students,
    is_active,
    created_at
FROM classes
WHERE name = 'Stanford Class';
```

### Step 2: Check existing Friday schedules for Week 1

```sql
-- Check all Friday schedules to see if there's a conflict
SELECT 
    c.name as class_name,
    s.time_slot,
    s.phase,
    s.program,
    s.level,
    s.current_students,
    s.batch
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.day = 'friday'
  AND s.week_number = 1
  AND s.year = 2026
ORDER BY s.time_slot, c.name;
```

## 🛠️ Solutions

### ✅ Solution 1: Stanford Class NOT in database

If the first query returns no results, Stanford Class doesn't exist.

**Fix: Run this SQL in Supabase:**

```sql
-- Add Stanford Class to database
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('Stanford Class', 4, 6, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Verify it was created
SELECT * FROM classes WHERE name = 'Stanford Class';
```

### ✅ Solution 2: Room Conflict with existing schedule

If the second query shows an existing schedule at the same time/phase, there's a room conflict.

**The system prevents:**
- Same classroom being used by different programs at the same time
- Duplicate schedules (same class + day + time + phase + week)

**Fix options:**
1. Choose a different time slot for Stanford Class
2. Choose a different day
3. Delete the conflicting schedule if it's incorrect

### ✅ Solution 3: UI Error or Validation Issue

If Stanford Class exists and no conflicts, check browser console for errors:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try creating the schedule again
4. Look for error messages

Common errors:
- "Duplicate schedule" - means schedule already exists
- "Room conflict" - another program using that room
- "Class is full" - shouldn't happen for new schedule

## 📊 Expected Result

After adding Stanford Class, you should be able to:

1. See "Stanford Class 🌲" in the class dropdown
2. Create schedules with 6 student capacity
3. No conflicts if time slot is available

## 🔄 After Fix Checklist

- [ ] Run `database/add_stanford_class.sql` in Supabase
- [ ] Refresh admin dashboard (F5)
- [ ] Try creating Stanford Class on Friday again
- [ ] Verify capacity shows as "X/6" (not X/10)
- [ ] Test student booking for Stanford Class

## 📝 Notes

- Stanford Class has **6 student capacity** (not 10 like others)
- Badge: 🌲 green color
- Already added to UI code, just needs database entry
- Safe to run SQL multiple times (uses ON CONFLICT DO NOTHING)
