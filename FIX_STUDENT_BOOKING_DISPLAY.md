# 🔍 Fix: Student Booking Display Shows 0/10 When There Are Students

## Problem Description

User reported that the booking display sometimes shows all classes as "0/10" and "WAITING" status when there should be students already booked.

Screenshot shows:
- All classes (Fahd, Harvard, Oxford, Tokyo, Tsinghua) displaying "0/10"
- All showing "WAITING" status
- This is incorrect - there should be students already booked

## Possible Root Causes

### 1. Browser Cache Issue ⚠️
**Most Likely Cause**

The browser is showing cached/stale data from an older version of the page.

**Symptoms:**
- Display shows 0/10 for all classes
- Refresh button doesn't update the data
- Data is correct in database but not on screen

**Solution:**
```
Hard refresh the browser:
- Windows: Ctrl + Shift + R or Ctrl + F5
- Mac: Cmd + Shift + R
- Or clear browser cache completely
```

### 2. current_students Counter Not Synced

The `current_students` field in schedules table doesn't match actual booking count.

**Check with SQL:**
```sql
-- Run: booking-system/database/DEBUG_BOOKING_DISPLAY.sql
-- Section 3: Check mismatch between current_students and actual bookings
```

**Solution:**
```sql
-- Fix counter mismatch
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
      AND b.status = 'confirmed'
)
WHERE s.week_number = 9
  AND s.year = 2026;
```

### 3. Batch Format Mismatch

User batch = "Batch 1" but Schedule batch = "1" causing filter to hide schedules.

**Status:** ✅ ALREADY FIXED in previous session
- Fixed in `getUserBookings()` - removed strict batch filter
- Fixed in `getSchedules()` - normalize batch format
- Fixed in `hasUserBookedPhase()` - normalize batch format

**Verify:**
```sql
-- Check batch formats
SELECT 
    s.id,
    c.name,
    s.batch,
    s.current_students
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9
  AND s.year = 2026
  AND s.batch ~ 'Batch';  -- Should return 0 rows
```

### 4. Duplicate Schedules

Multiple schedules exist for same class/day/time/phase, showing wrong one.

**Status:** ✅ ALREADY FIXED in previous session
- Ran `COMPREHENSIVE_DUPLICATE_FIX.sql`
- Reduced from 600 schedules to 52 unique schedules

**Verify:**
```sql
-- Check for duplicates
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.phase,
    COUNT(*) as count
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9
  AND s.year = 2026
GROUP BY c.name, s.day, s.time_slot, s.phase
HAVING COUNT(*) > 1;  -- Should return 0 rows
```

### 5. Week Filter Issue

Frontend is showing wrong week (e.g., showing week 10 data when week 9 is selected).

**Check:**
- Look at browser console logs
- Check `displayWeek` variable in React DevTools
- Verify week toggle buttons are working

### 6. Data Fetching Issue

Frontend is not fetching data correctly or filtering too strictly.

**Current Code Analysis:**

```javascript
// In BookingDashboard.jsx - loadUserBookings()
const filters = {
    week_number: displayWeek,
    year: currentYear
    // ✅ GOOD: No batch filter here - shows all schedules
};
const data = await getSchedules(filters);
const activeSchedules = data.filter(s => s.current_students > 0);
```

**Potential Issue:**
```javascript
// This line filters OUT schedules with 0 students
const activeSchedules = data.filter(s => s.current_students > 0);
```

If `current_students` is not synced with actual bookings, this will hide schedules that have bookings but `current_students = 0`.

## Diagnostic Steps

### Step 1: Run Diagnostic SQL

```bash
# Open Supabase SQL Editor
# Run: booking-system/database/DEBUG_BOOKING_DISPLAY.sql
```

This will show:
1. Current week number
2. All schedules for week 9
3. Mismatch between current_students and actual bookings
4. Duplicate schedules
5. Batch format issues
6. Schedules with 0 students but have bookings

### Step 2: Check Browser Console

```javascript
// Open browser DevTools (F12)
// Look for these logs in Console:

// Should see:
✅ All schedules loaded: 52
📋 Schedules: [{id: 123, class: "Oxford Class", batch: "1", students: 28}, ...]
✅ User bookings loaded: 3

// Should NOT see:
❌ Error loading schedules
❌ All schedules loaded: 0
```

### Step 3: Hard Refresh Browser

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Step 4: Check Network Tab

```
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for Supabase API calls
5. Check response data - does it have schedules with students?
```

## Solutions

### Solution 1: Fix current_students Counter (Most Likely)

If diagnostic shows mismatch between `current_students` and actual bookings:

```sql
-- Fix all schedules for week 9
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
      AND b.status = 'confirmed'
)
WHERE s.week_number = 9
  AND s.year = 2026;

-- Verify fix
SELECT 
    s.id,
    c.name,
    s.current_students,
    COUNT(b.id) as actual_count
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON b.schedule_id = s.id AND b.status = 'confirmed'
WHERE s.week_number = 9
  AND s.year = 2026
GROUP BY s.id, c.name, s.current_students
HAVING s.current_students != COUNT(b.id);
-- Should return 0 rows
```

### Solution 2: Clear Browser Cache

```
1. Open browser settings
2. Clear browsing data
3. Select "Cached images and files"
4. Clear data
5. Refresh page
```

### Solution 3: Remove Strict Filter in Frontend

If schedules have bookings but `current_students = 0`, modify frontend:

```javascript
// In BookingDashboard.jsx - loadUserBookings()

// BEFORE (too strict):
const activeSchedules = data.filter(s => s.current_students > 0);

// AFTER (show all schedules):
const activeSchedules = data; // Show all schedules, let user see availability
```

### Solution 4: Add Trigger to Auto-Update current_students

Prevent future mismatches by adding database trigger:

```sql
-- Create trigger to auto-update current_students
CREATE OR REPLACE FUNCTION update_schedule_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_students count
    UPDATE schedules
    SET current_students = (
        SELECT COUNT(*)
        FROM bookings
        WHERE schedule_id = COALESCE(NEW.schedule_id, OLD.schedule_id)
          AND status = 'confirmed'
    )
    WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER booking_insert_update_count
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();

-- Trigger on UPDATE
CREATE TRIGGER booking_update_update_count
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_schedule_student_count();

-- Trigger on DELETE
CREATE TRIGGER booking_delete_update_count
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();
```

## Quick Fix (Run This Now)

```sql
-- 1. Fix current_students counter
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
      AND b.status = 'confirmed'
)
WHERE s.week_number = 9
  AND s.year = 2026;

-- 2. Verify fix
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.phase,
    s.current_students,
    COUNT(b.id) as actual_bookings
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON b.schedule_id = s.id AND b.status = 'confirmed'
WHERE s.week_number = 9
  AND s.year = 2026
GROUP BY s.id, c.name, s.day, s.time_slot, s.phase, s.current_students
ORDER BY c.name, s.phase;
```

Then:
1. Hard refresh browser (Ctrl + Shift + R)
2. Check if display is now correct

## Prevention

To prevent this issue in the future:

1. ✅ Install database trigger (Solution 4 above)
2. ✅ Run duplicate prevention system (already created)
3. ✅ Use batch normalization (already implemented)
4. Add cache busting to frontend (version check)

## Files Created

- `booking-system/database/DEBUG_BOOKING_DISPLAY.sql` - Diagnostic queries
- `booking-system/FIX_STUDENT_BOOKING_DISPLAY.md` - This guide

## Next Steps

1. Run `DEBUG_BOOKING_DISPLAY.sql` in Supabase
2. Share results with me
3. I'll identify exact root cause
4. Apply appropriate solution
5. Verify fix works

## Status

- ⏳ Waiting for diagnostic results
- Need to identify which of the 6 possible causes is the actual problem
