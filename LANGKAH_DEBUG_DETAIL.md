# 🔍 LANGKAH DEBUG DETAIL - Oxford Booking Error

## 🎯 TUJUAN

Cari tau KENAPA Oxford tidak bisa dibook tapi Harvard & Tsinghua bisa.

**3 kemungkinan:**
1. Empty duplicate schedules (schedule lama yang kosong)
2. Trigger terlalu strict (block INSERT yang seharusnya valid)
3. Race condition (2 students book bersamaan)

---

## 📋 LANGKAH 1: CHECK DATABASE (5 menit)

### A. Run SQL ini di Supabase:

**File:** `database/CHECK_ALL_SUNDAY_EVENING.sql`

**Atau copy paste ini:**

```sql
-- Check semua schedules di Sunday Evening Week 2
SELECT 
    (SELECT name FROM classes WHERE id = schedules.class_id) as class_name,
    program,
    level,
    batch,
    current_students,
    created_at
FROM schedules
WHERE day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY class_id, created_at;
```

### B. Lihat hasilnya:

**Jika ada Oxford dengan `current_students = 0`:**
```
class_name: Oxford Class
program: English Campus & Career
level: Upper Starter
batch: 1
current_students: 0  ← 🚨 INI MASALAHNYA!
```
→ **DIAGNOSIS: Empty Duplicate Schedules**
→ **GO TO: LANGKAH 2A**

**Jika TIDAK ada Oxford schedules sama sekali:**
```
(No rows returned for Oxford)
```
→ **DIAGNOSIS: Trigger/Constraint Block**
→ **GO TO: LANGKAH 2B**

**Jika ada multiple Oxford dengan timing dekat:**
```
class_name: Oxford Class
created_at: 2026-04-03 10:00:00.123
created_at: 2026-04-03 10:00:00.196  ← 🚨 < 1 detik!
```
→ **DIAGNOSIS: Race Condition**
→ **GO TO: LANGKAH 2C**

---

## 🔧 LANGKAH 2A: FIX EMPTY DUPLICATES

### Run SQL ini:

```sql
-- Delete empty schedules
DELETE FROM schedules
WHERE day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

### Verify:

```sql
-- Check lagi
SELECT COUNT(*) as empty_schedules
FROM schedules
WHERE day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Expected:** `empty_schedules = 0`

### Test:
1. Hard refresh browser: `Ctrl + Shift + R`
2. Book Oxford Sunday Evening
3. Should work! ✅

---

## 🔧 LANGKAH 2B: FIX TRIGGER/CONSTRAINT

### Check trigger status:

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'schedules'::regclass
  AND tgname LIKE '%duplicate%';
```

**Jika ada trigger dengan `tgenabled = 'O'` (ENABLED):**

```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

### Check constraints:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
  AND contype = 'u'
ORDER BY conname;
```

**Jika ada constraint selain `schedules_unique_booking`:**

```sql
-- Drop extra constraints (adjust name sesuai hasil query)
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_class_id_day_time_slot_phase_week_number_key;

ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS unique_schedule_per_week;
```

### Test:
1. Hard refresh browser: `Ctrl + Shift + R`
2. Book Oxford Sunday Evening
3. Should work! ✅

---

## 🔧 LANGKAH 2C: FIX RACE CONDITION

**Good news:** Code sudah ada retry logic!

### Check console log di browser:

**Jika lihat ini:**
```
❌❌❌ INSERT FAILED!
🔴 ERROR DETAILS:
   - Code: 23505
🔄 STEP 2: Duplicate detected - fetching existing schedule...
✅✅✅ SUCCESS: Found existing schedule!
```
→ **Race condition handled correctly!** ✅

**Jika lihat ini:**
```
❌❌❌ INSERT FAILED!
🔴 ERROR DETAILS:
   - Code: 23505
🔄 STEP 2: Duplicate detected - fetching existing schedule...
⚠️ NO SCHEDULE FOUND!
❌ Failed to fetch schedule after 5 retries
```
→ **Race condition NOT handled!** ❌

### Improve retry logic:

**File:** `src/utils/dbHelpers.js` (line 350-370)

**Add delay before retry:**
```javascript
if (isDuplicateError) {
    console.log('🔄 STEP 2: Duplicate detected - fetching existing schedule...');
    
    // ✅ ADD: Wait for other transaction to commit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Build query to fetch existing schedule
    let query = supabase
        .from('schedules')
        .select('*')
        .eq('class_id', class_id)
        // ... rest of query
```

---

## 📊 QUICK REFERENCE

### File yang perlu dijalankan:

**Diagnosis:**
- `database/CHECK_ALL_SUNDAY_EVENING.sql` ← **START HERE**
- `database/ANALYZE_RACE_CONDITION.sql` (optional, more detail)
- `database/DEBUG_RACE_CONDITION_DETAIL.sql` (optional, super detail)

**Fix:**
- `FIX_CONSTRAINT_SEKARANG.txt` ← **QUICK FIX GUIDE**
- `database/DROP_TRIGGER_NOW.sql` (if trigger block)

**Documentation:**
- `INI_LHO_KENAPA.md` ← **EXPLANATION**
- `RACE_CONDITION_DEEP_DIVE.md` (detailed analysis)

---

## ⏱️ ESTIMATED TIME

- Diagnosis: 5 minutes
- Fix: 2 minutes
- Test: 3 minutes
- **Total: 10 minutes**

---

## 🎯 SUCCESS CRITERIA

✅ Oxford Sunday Evening bisa dibook
✅ Tidak ada error "Duplicate schedule detected!"
✅ Harvard & Tsinghua tetap bisa dibook
✅ Multiple students bisa book bersamaan

---

**Created:** April 3, 2026
**Status:** Step-by-step guide ready
**Next:** Run `CHECK_ALL_SUNDAY_EVENING.sql`

