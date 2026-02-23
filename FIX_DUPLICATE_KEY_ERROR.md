# 🔧 Fix: Duplicate Key Error

## Error Message
```
ERROR: 23505: duplicate key value violates unique constraint "schedules_unique_booking"
DETAIL: Key (class_id, program, level, phase, day, time_slot, week_number, year, batch)=(88239a1c-ac41-4dbf-91f4-9415c4e846b3, Campus & Career, Starter, phase2, friday, evening, 9, 2026, 1) already exists.
```

## What Happened
The Evening schedule already exists! The original `AUTO_SPLIT_NOW.sql` tried to create a new Evening schedule, but one already exists in the database.

## Root Cause
When the duplicate fix ran earlier, it may have already created some Evening schedules, or they existed from before.

## ✅ Solution
Use the **SMART version** that checks if Evening schedule exists first:

**File:** `database/AUTO_SPLIT_SMART.sql`

This version:
1. ✅ Checks if Evening schedule exists
2. ✅ If exists → Use it
3. ✅ If not exists → Create it
4. ✅ Then move students

## How to Run

### Option 1: Run Smart Version (Recommended)
```
1. Open Supabase SQL Editor
2. Copy-paste entire AUTO_SPLIT_SMART.sql
3. Click "Run"
4. Done!
```

### Option 2: First Check, Then Decide
```sql
-- STEP 1: Check which Evening schedules exist
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.current_students,
    s.id
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9
    AND s.time_slot = 'evening'
ORDER BY c.name, s.day;
```

If Evening schedules exist, use `AUTO_SPLIT_SMART.sql` (it handles both cases).

## What AUTO_SPLIT_SMART Does

### For Each Overcapacity Class:

**1. Check if Evening exists:**
```sql
SELECT id FROM schedules
WHERE class_id = '<class_id>'
    AND day = '<day>'
    AND time_slot = 'evening'
    AND week_number = 9;
```

**2. If NOT exists → Create it:**
```sql
INSERT INTO schedules (...)
SELECT ... FROM schedules WHERE id = '<afternoon_id>';
```

**3. If EXISTS → Use it:**
```sql
-- Just use the existing evening_id
```

**4. Move students:**
```sql
UPDATE bookings SET schedule_id = '<evening_id>'
WHERE id IN (
    SELECT id FROM bookings
    WHERE schedule_id = '<afternoon_id>'
    ORDER BY created_at DESC LIMIT N
);
```

## Expected Result

After running `AUTO_SPLIT_SMART.sql`:

```
✅ Oxford Friday: 10 (Afternoon) + 8 (Evening)
✅ Oxford Tuesday: 10 (Afternoon) + 7 (Evening)
✅ Harvard Friday: 10 (Afternoon) + 4 (Evening)
✅ Harvard Monday: 10 (Afternoon) + 1 (Evening)
```

All classes ≤ 10 students ✅

## Verification

```sql
-- Should return 0 rows
SELECT c.name, s.day, s.time_slot, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9 AND s.current_students > 10;
```

## Why This Happened

The unique constraint `schedules_unique_booking` prevents duplicate schedules with same:
- class_id
- program
- level
- phase
- day
- time_slot
- week_number
- year
- batch

This is GOOD! It's working as intended. We just need to use the smart version that checks first.

## Summary

❌ `AUTO_SPLIT_NOW.sql` - Assumes Evening doesn't exist (causes error)
✅ `AUTO_SPLIT_SMART.sql` - Checks first, then creates or uses existing

**Use AUTO_SPLIT_SMART.sql instead!** 🚀
