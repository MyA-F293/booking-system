# Solusi: Tombol Cancel Tidak Muncul di Beberapa HP

## Problem

**Symptoms:**
- ✅ Beberapa siswa bisa lihat tombol "Cancel" (contoh: Tsinghua Class)
- ❌ Beberapa siswa TIDAK bisa lihat tombol "Cancel" (contoh: Tokyo, Harvard, Oxford Class)
- Padahal mereka sudah booking jadwal

## Root Cause

**Counter Mismatch di Database:**
- Database menunjukkan `current_students = 0`
- Tapi sebenarnya ada siswa yang sudah booking
- Schedule dengan counter 0 di-HIDE dari display
- Siswa tidak bisa lihat schedule mereka sendiri
- Tombol Cancel tidak muncul

**Kenapa Bisa Terjadi?**
1. Trigger `update_schedule_student_count` tidak jalan
2. Race condition saat booking
3. Manual delete booking tanpa update counter
4. Database rollback tapi counter tidak rollback

## Quick Fix (5 Menit)

### Step 1: Buka Supabase SQL Editor

1. Login ke Supabase Dashboard
2. Pilih project booking system
3. Klik "SQL Editor" di sidebar
4. Klik "New Query"

### Step 2: Run Diagnosis Query

```sql
-- Cari schedule yang counter-nya salah
SELECT 
    c.name as class_name,
    s.day,
    s.current_students as displayed,
    COUNT(b.id) as actual,
    STRING_AGG(u.full_name, ', ') as affected_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
LEFT JOIN users u ON b.user_id = u.id
WHERE s.week_number = 2  -- Current week
    AND s.current_students = 0
GROUP BY s.id, c.name, s.day, s.current_students
HAVING COUNT(b.id) > 0
ORDER BY c.name;
```

**Expected Output:**
```
class_name    | day      | displayed | actual | affected_students
Tokyo Class   | friday   | 0         | 2      | Andi, Budi
Harvard Class | friday   | 0         | 1      | Citra
Oxford Class  | saturday | 0         | 3      | Dedi, Eka, Fani
```

Ini adalah siswa yang TIDAK BISA lihat tombol Cancel!

### Step 3: Fix Counter Mismatch

```sql
-- Update counter untuk match actual bookings
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
)
WHERE s.week_number = 2
    AND s.current_students != (
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.schedule_id = s.id
    );
```

**Klik "Run"** → Counter akan di-update

### Step 4: Verify Fix

```sql
-- Check apakah sudah fix
SELECT 
    c.name,
    s.day,
    s.current_students as displayed,
    COUNT(b.id) as actual,
    CASE 
        WHEN s.current_students = COUNT(b.id) THEN '✅ OK'
        ELSE '❌ STILL WRONG'
    END as status
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.week_number = 2
GROUP BY s.id, c.name, s.day, s.current_students
ORDER BY c.name;
```

**Expected:** Semua rows menunjukkan "✅ OK"

### Step 5: Minta Siswa Refresh App

**Setelah fix database, siswa perlu refresh untuk lihat perubahan:**

**Option 1: Refresh Button**
- Tekan tombol Refresh (↻) di header app
- Tunggu sampai data reload
- Check apakah tombol Cancel muncul

**Option 2: Logout & Login**
- Logout dari app
- Login lagi
- Data akan fresh dari database

**Option 3: Clear Cache**
- Android: Settings → Apps → Browser → Clear Cache
- iOS: Settings → Safari → Clear History and Website Data
- Buka app lagi

**Option 4: Test di Incognito**
- Buka app di Incognito/Private mode
- Jika tombol Cancel muncul → Confirm it's fixed

## Detailed Explanation

### Kenapa Schedule Tidak Muncul?

**Code Logic (BookingDashboard.jsx line ~120):**
```javascript
const relevantSchedules = data.filter(s =>
    s.current_students > 0 || userBookingScheduleIds.includes(s.id)
);
```

Schedule akan MUNCUL jika:
1. `current_students > 0` (ada siswa), ATAU
2. User sudah booking schedule tersebut

**Problem:**
- Jika `current_students = 0` DAN user bookings belum load
- Schedule langsung di-filter out
- User tidak bisa lihat schedule mereka sendiri
- Tombol Cancel tidak muncul

### Kenapa Tombol Cancel Tidak Muncul?

**Code Logic (BookingDashboard.jsx line ~450):**
```javascript
{userHasBooked ? (
    <>
        <button>View Details</button>
        <button onClick={handleCancelBooking}>Cancel</button>
    </>
) : (
    <button>View Details</button>
)}
```

Tombol Cancel hanya muncul jika `userHasBooked = true`

**Problem:**
- Jika schedule tidak muncul di list
- `userHasBooked` tidak pernah di-check
- Tombol Cancel tidak pernah di-render

## Prevention (Agar Tidak Terjadi Lagi)

### 1. Check Trigger Status

```sql
-- Pastikan trigger masih aktif
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_schedule_student_count';
```

**Expected:** 1 row dengan trigger name

**If empty:** Trigger hilang, perlu reinstall

### 2. Reinstall Trigger (If Needed)

```sql
-- Drop old trigger if exists
DROP TRIGGER IF EXISTS update_schedule_student_count ON bookings;

-- Create new trigger
CREATE OR REPLACE FUNCTION update_schedule_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE schedules
        SET current_students = current_students + 1
        WHERE id = NEW.schedule_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE schedules
        SET current_students = GREATEST(current_students - 1, 0)
        WHERE id = OLD.schedule_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_student_count
AFTER INSERT OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();
```

### 3. Regular Counter Sync (Weekly)

**Run this every week:**
```sql
-- Sync all counters
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id
);
```

**Or create a scheduled job:**
```sql
-- Using pg_cron (if available)
SELECT cron.schedule(
    'sync-schedule-counters',
    '0 0 * * 0',  -- Every Sunday at midnight
    $$
    UPDATE schedules s
    SET current_students = (
        SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id
    );
    $$
);
```

## Testing Checklist

### For Admin:

- [ ] Run diagnosis query (Step 2)
- [ ] Identify affected schedules and students
- [ ] Run fix query (Step 3)
- [ ] Verify all counters synced (Step 4)
- [ ] Inform affected students to refresh

### For Students:

- [ ] Tekan tombol Refresh di app
- [ ] Check apakah tombol Cancel muncul
- [ ] Try logout & login if still not working
- [ ] Report Student ID to admin if still broken

## Troubleshooting

### Issue 1: Query Tidak Fix Counter

**Symptoms:** Counter masih 0 setelah run query

**Possible Causes:**
- RLS policy blocking update
- Trigger conflict
- Database permission issue

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'schedules';

-- Temporarily disable RLS for update
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

-- Run fix query again
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id
)
WHERE s.week_number = 2;

-- Re-enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
```

### Issue 2: Tombol Cancel Masih Tidak Muncul

**Symptoms:** Counter sudah fix tapi tombol masih tidak muncul

**Possible Causes:**
- Browser cache
- Service worker cache
- React state not updating

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear all browser data
3. Open in Incognito mode
4. Try different browser

### Issue 3: Hanya Beberapa Siswa Affected

**Symptoms:** Beberapa siswa bisa lihat, beberapa tidak

**Possible Causes:**
- Different browser cache
- Different login time
- Different network

**Solution:**
- Fix database counter (affects all users)
- Ask all affected students to refresh
- Monitor for 24 hours

## Files

- `database/DEBUG_CANCEL_BUTTON_ISSUE.sql` - Complete diagnosis queries
- `database/FIX_CANCEL_BUTTON_ISSUE_NOW.sql` - Quick fix queries
- `KENAPA_CANCEL_BUTTON_TIDAK_MUNCUL.md` - Detailed explanation
- `src/components/BookingDashboard.jsx` - Frontend code

## Summary

**Root Cause:** Counter mismatch (`current_students = 0` tapi ada bookings)

**Quick Fix:**
1. Run SQL query untuk fix counter
2. Minta siswa refresh app

**Prevention:**
- Check trigger status
- Regular counter sync (weekly)
- Monitor for future issues

**Priority:** HIGH - Affects user experience

---

**Status:** Solution ready  
**Action:** Run `database/FIX_CANCEL_BUTTON_ISSUE_NOW.sql`  
**Time:** 5 minutes to fix
