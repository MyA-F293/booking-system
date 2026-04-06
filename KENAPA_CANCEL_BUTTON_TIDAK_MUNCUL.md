# Kenapa Tombol Cancel Tidak Muncul di Beberapa HP?

## Problem Statement

**Symptoms:**
- Beberapa siswa bisa lihat tombol "Cancel" untuk membatalkan booking mereka
- Beberapa siswa lain TIDAK bisa lihat tombol "Cancel" di HP mereka
- Padahal mereka sudah booking jadwal yang sama

**Dari Screenshot:**
- ✅ Tsinghua Class → Ada tombol "Cancel" (WORKING)
- ❌ Tokyo Class, Harvard Class, Oxford Class → Tidak ada tombol "Cancel" (NOT WORKING)

## Root Cause Analysis

### 1. Code Logic (BookingDashboard.jsx)

```javascript
// Line ~120: Filter schedules yang akan ditampilkan
const relevantSchedules = data.filter(s =>
    s.current_students > 0 || userBookingScheduleIds.includes(s.id)
);
```

**Artinya:**
- Schedule akan MUNCUL jika:
  1. `current_students > 0` (ada siswa yang booking), ATAU
  2. User sudah booking schedule tersebut

**Tombol Cancel akan MUNCUL jika:**
```javascript
// Line ~450: Render Cancel button
{userHasBooked ? (
    <>
        <button>View Details</button>
        <button onClick={handleCancelBooking}>Cancel</button>
    </>
) : (
    <button>View Details</button>
)}
```

### 2. The Problem

**Scenario yang menyebabkan tombol Cancel TIDAK muncul:**

1. **Counter Mismatch:**
   - Database: `current_students = 0`
   - Actual bookings: Ada 1-2 siswa yang sudah booking
   - Result: Schedule HIDDEN karena `current_students = 0`
   - Effect: Siswa tidak bisa lihat schedule mereka sendiri → Tombol Cancel tidak muncul

2. **Race Condition:**
   - User bookings load SETELAH schedules load
   - Jika `current_students = 0`, schedule langsung di-filter out
   - Saat user bookings load, schedule sudah tidak ada di list
   - Effect: Tombol Cancel tidak muncul

3. **Browser Cache:**
   - Browser cache data lama dengan `current_students = 0`
   - Padahal di database sudah update
   - Effect: User lihat data lama → Tombol Cancel tidak muncul

## Diagnosis Steps

### Step 1: Check Database Counter

```sql
-- Cari schedule yang counter-nya tidak sync
SELECT 
    s.id,
    c.name as class_name,
    s.day,
    s.current_students as displayed_count,
    COUNT(b.id) as actual_bookings,
    CASE 
        WHEN s.current_students = 0 AND COUNT(b.id) > 0 
        THEN '❌ MISMATCH - Schedule hidden but has bookings!'
        ELSE '✅ OK'
    END as status
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.week_number = 2  -- Current week
GROUP BY s.id, c.name, s.day, s.current_students
HAVING s.current_students != COUNT(b.id)
ORDER BY c.name, s.day;
```

**Expected Result:**
- Jika ada rows dengan status "❌ MISMATCH" → INI ROOT CAUSE!
- Siswa yang booking schedule ini TIDAK BISA lihat tombol Cancel

### Step 2: Check Specific Student

```sql
-- Ganti 'EYSA26020XXX' dengan Student ID yang bermasalah
SELECT 
    u.student_id,
    u.full_name,
    c.name as class_name,
    s.day,
    s.current_students,
    CASE 
        WHEN s.current_students = 0 THEN '❌ HIDDEN - No Cancel button'
        WHEN s.current_students > 0 THEN '✅ VISIBLE - Cancel button appears'
    END as status
FROM users u
JOIN bookings b ON u.id = b.user_id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.student_id = 'EYSA26020XXX'
    AND s.week_number = 2;
```

### Step 3: Compare Working vs Not Working

```sql
-- Siswa yang BISA lihat Cancel
SELECT 
    'CAN SEE' as status,
    u.full_name,
    c.name as class_name,
    s.current_students
FROM users u
JOIN bookings b ON u.id = b.user_id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2 AND s.current_students > 0

UNION ALL

-- Siswa yang TIDAK BISA lihat Cancel
SELECT 
    'CANNOT SEE' as status,
    u.full_name,
    c.name as class_name,
    s.current_students
FROM users u
JOIN bookings b ON u.id = b.user_id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2 AND s.current_students = 0

ORDER BY status, full_name;
```

## Solutions

### Solution 1: Fix Counter Mismatch (Database)

**Run this SQL query:**

```sql
-- Update current_students untuk match actual bookings
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
)
WHERE s.week_number = 2  -- Current week
    AND s.current_students != (
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.schedule_id = s.id
    );
```

**Verify:**
```sql
-- Check if fixed
SELECT 
    c.name,
    s.day,
    s.current_students,
    COUNT(b.id) as actual_bookings
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.week_number = 2
GROUP BY s.id, c.name, s.day, s.current_students
HAVING s.current_students != COUNT(b.id);
```

**Expected:** No rows (semua sudah sync)

### Solution 2: Clear Browser Cache (User Side)

**Minta siswa yang bermasalah untuk:**

1. **Option 1: Refresh App**
   - Tekan tombol Refresh (icon ↻) di header
   - Tunggu sampai data reload
   - Check apakah tombol Cancel muncul

2. **Option 2: Hard Refresh**
   - Android: Settings → Apps → Browser → Clear Cache
   - iOS: Settings → Safari → Clear History and Website Data
   - Buka app lagi

3. **Option 3: Logout & Login**
   - Logout dari app
   - Login lagi
   - Data akan fresh dari database

4. **Option 4: Incognito Mode**
   - Buka app di Incognito/Private mode
   - Jika tombol Cancel muncul → Confirm it's cache issue

### Solution 3: Code Fix (Prevent Future Issues)

**Update BookingDashboard.jsx:**

```javascript
// BEFORE (line ~120):
const relevantSchedules = data.filter(s =>
    s.current_students > 0 || userBookingScheduleIds.includes(s.id)
);

// AFTER (improved):
const relevantSchedules = data.filter(s => {
    // Always show if user has booked this schedule
    if (userBookingScheduleIds.includes(s.id)) {
        return true;
    }
    // Otherwise, only show if has students
    return s.current_students > 0;
});
```

**This ensures:**
- User's bookings ALWAYS visible, regardless of counter
- Prevents race condition issues
- Tombol Cancel always appears for user's bookings

## Testing Checklist

### For Admin:

1. ✅ Run Step 1 query to find mismatched schedules
2. ✅ Run Solution 1 SQL to fix counters
3. ✅ Verify all counters are synced
4. ✅ Ask affected students to refresh

### For Students:

1. ✅ Tekan tombol Refresh di app
2. ✅ Check apakah tombol Cancel muncul
3. ✅ Jika masih tidak muncul, logout & login
4. ✅ Jika masih tidak muncul, report Student ID ke admin

## Quick Fix Commands

### 1. Find Problematic Schedules
```sql
SELECT c.name, s.day, s.current_students, COUNT(b.id) as actual
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.week_number = 2
GROUP BY s.id, c.name, s.day, s.current_students
HAVING s.current_students = 0 AND COUNT(b.id) > 0;
```

### 2. Fix All Mismatches
```sql
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id
)
WHERE s.week_number = 2;
```

### 3. Verify Fix
```sql
SELECT 
    c.name,
    s.day,
    s.current_students,
    COUNT(b.id) as bookings,
    CASE 
        WHEN s.current_students = COUNT(b.id) THEN '✅ OK'
        ELSE '❌ STILL WRONG'
    END as status
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.week_number = 2
GROUP BY s.id, c.name, s.day, s.current_students;
```

## Prevention

### 1. Database Trigger (Already Exists)

Trigger `update_schedule_student_count` should automatically update `current_students` when booking is created/deleted.

**Check if trigger is working:**
```sql
-- Check trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'update_schedule_student_count';
```

**If trigger not working, reinstall:**
```sql
-- See database/FIX_CURRENT_STUDENTS_COUNTER.sql
```

### 2. Regular Counter Sync

**Run this weekly:**
```sql
-- Sync all counters
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id
);
```

### 3. Cache Busting

Code already has cache busting (line ~95):
```javascript
const timestamp = Date.now();
const filters = {
    week_number: displayWeek,
    _cacheBust: timestamp  // Force fresh data
};
```

## Summary

**Root Cause:**
- Counter mismatch: `current_students = 0` tapi ada bookings
- Schedule dengan counter 0 di-filter out dari display
- User tidak bisa lihat schedule mereka sendiri
- Tombol Cancel tidak muncul

**Quick Fix:**
1. Run SQL query untuk fix counter mismatch
2. Minta siswa refresh app atau logout/login
3. Verify tombol Cancel muncul

**Long-term Fix:**
- Improve code logic untuk always show user's bookings
- Monitor trigger untuk ensure counter always sync
- Regular counter sync (weekly)

---

**Files:**
- `database/DEBUG_CANCEL_BUTTON_ISSUE.sql` - Complete diagnosis queries
- `database/FIX_CURRENT_STUDENTS_COUNTER.sql` - Counter sync queries
- `src/components/BookingDashboard.jsx` - Frontend code

**Status:** Ready to fix  
**Priority:** HIGH - Affects user experience  
**Action:** Run diagnosis queries and fix counter mismatch
