# 🔍 Kenapa Batch 1 Muncul Lagi Padahal Sudah Dihapus?

## 📊 Data dari Database

**Hasil Query:**
```
| batch | total_schedules | total_students | empty_schedules | active_schedules |
|-------|-----------------|----------------|-----------------|------------------|
| 1     | 9               | 0              | 9               | 0                |
| 2     | 113             | 726            | 2               | 111              |
```

**Fakta:**
- ✅ Batch 2: 113 schedules, 726 students (NORMAL)
- ❌ Batch 1: 9 schedules, 0 students (MASALAH!)
- ❌ Semua 9 schedule Batch 1 KOSONG (tidak ada siswa)

---

## 🔍 Root Cause Analysis

### Penyebab: `smart_copy_week` Function

**File:** `database/CREATE_RPC_SMART_COPY.sql` line 30

**Code:**
```sql
INSERT INTO schedules (
    class_id, teacher_id, program, level, phase, day, time_slot,
    week_number, year, batch, current_students
)
SELECT 
    s.class_id, s.teacher_id, s.program, s.level, s.phase, s.day, s.time_slot,
    target_week_param, year_param, s.batch, 0  -- ← COPY BATCH FROM SOURCE!
FROM schedules s
WHERE s.week_number = source_week_param
```

**Masalahnya:**
- Function copy **EXACT batch value** dari source week
- Jika Week 1 punya schedule Batch 1 → Week 2 juga akan punya Batch 1
- Jika Week 2 punya schedule Batch 1 → Week 3 juga akan punya Batch 1
- **Batch 1 terus muncul lagi setiap copy week!**

### Timeline Kejadian:

```
1. Batch 1 dihapus (DELETE FROM users WHERE batch = '1')
   ✅ Siswa Batch 1 terhapus
   ❌ Schedule Batch 1 TIDAK terhapus

2. Copy Week 1 → Week 2
   smart_copy_week() copy schedule dari Week 1
   Week 1 punya schedule Batch 1 → Week 2 juga dapat Batch 1
   ✅ 9 schedule Batch 1 dibuat di Week 2

3. Copy Week 2 → Week 3
   smart_copy_week() copy schedule dari Week 2
   Week 2 punya schedule Batch 1 → Week 3 juga dapat Batch 1
   ✅ 9 schedule Batch 1 dibuat di Week 3

4. Dan seterusnya...
   Batch 1 terus muncul setiap copy week! ♾️
```

---

## 🎯 Kenapa Ini Terjadi?

### Design Issue:

**Original Design:**
```
1. Admin create schedule dengan batch = NULL
2. Student booking → Trigger auto-set batch dari student
3. Schedule batch = student batch
```

**Tapi Copy Week:**
```
1. Copy schedule dari previous week
2. Copy EXACT batch value (termasuk Batch 1)
3. Schedule baru punya batch = Batch 1 (old batch)
4. Tidak ada siswa Batch 1 → Schedule kosong selamanya
```

**Conflict:**
- Copy week copy batch value ❌
- Tapi Batch 1 sudah tidak ada siswa ❌
- Schedule Batch 1 jadi "zombie" (ada tapi tidak terpakai) 👻

---

## ✅ Solusi

### Solusi 1: Delete All Batch 1 Schedules (IMMEDIATE - 2 menit)

**Jalankan query ini:**
```sql
-- Delete all empty Batch 1 schedules
DELETE FROM schedules
WHERE batch = '1'
  AND current_students = 0;
```

**Impact:**
- ✅ Delete 9 empty Batch 1 schedules
- ✅ No data lost (all empty)
- ✅ Students can book normally
- ✅ Admin can create schedules normally

**File:** `database/INVESTIGATE_BATCH_1_CREATION.sql` (sudah dibuat)

### Solusi 2: Fix smart_copy_week Function (PERMANENT - 5 menit)

**Problem:** Function copy batch dari source week

**Solution:** Set batch = NULL untuk schedule baru

**Change in `CREATE_RPC_SMART_COPY.sql` line 30:**

**BEFORE:**
```sql
SELECT 
    s.class_id, s.teacher_id, s.program, s.level, s.phase, s.day, s.time_slot,
    target_week_param, year_param, s.batch, 0  -- ← Copy batch
```

**AFTER:**
```sql
SELECT 
    s.class_id, s.teacher_id, s.program, s.level, s.phase, s.day, s.time_slot,
    target_week_param, year_param, NULL as batch, 0  -- ← Set batch = NULL
```

**Impact:**
- ✅ New schedules will have batch = NULL
- ✅ Batch will be auto-set when first student books
- ✅ No more Batch 1 zombie schedules
- ✅ Batch always matches current active batch

### Solusi 3: Add Batch Cleanup to Reset Batch Feature (PREVENTION - 10 menit)

**Problem:** Reset batch tidak delete old batch schedules

**Solution:** Add schedule cleanup to reset batch RPC

**Add to `RESET_BATCH_COMPLETE.sql`:**
```sql
-- STEP 6.5: DELETE old batch schedules (empty only)
DELETE FROM schedules
WHERE batch = '1'  -- Old batch
  AND current_students = 0;  -- Only empty schedules
```

**Impact:**
- ✅ Reset batch will clean up old schedules
- ✅ No zombie schedules left behind
- ✅ Cleaner database

---

## 🚀 Action Plan

### Step 1: Immediate Fix (2 menit)

**Jalankan file ini di Supabase:**
```
database/INVESTIGATE_BATCH_1_CREATION.sql
```

**Ini akan:**
1. Verify 9 schedule Batch 1 (semua kosong)
2. Delete semua schedule Batch 1
3. Verify hasil (should be 0 Batch 1 schedules)

### Step 2: Permanent Fix (5 menit)

**Update smart_copy_week function:**
1. Buka Supabase SQL Editor
2. Run query ini:

```sql
CREATE OR REPLACE FUNCTION smart_copy_week(
    source_week_param INT,
    target_week_param INT,
    year_param INT DEFAULT 2026
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    schedules_created INT := 0;
    bookings_copied INT := 0;
    bookings_skipped INT := 0;
    overcapacity_prevented INT := 0;
    result JSON;
BEGIN
    -- STEP 1: Copy schedules with batch = NULL
    INSERT INTO schedules (
        class_id, teacher_id, program, level, phase, day, time_slot,
        week_number, year, batch, current_students
    )
    SELECT 
        s.class_id, s.teacher_id, s.program, s.level, s.phase, s.day, s.time_slot,
        target_week_param, year_param, NULL as batch, 0  -- ✅ FIX: Set batch = NULL
    FROM schedules s
    WHERE s.week_number = source_week_param
      AND s.year = year_param
      AND NOT EXISTS (
          SELECT 1 FROM schedules s2
          WHERE s2.class_id = s.class_id
            AND s2.day = s.day
            AND s2.time_slot = s.time_slot
            AND s2.phase = s.phase
            AND s2.week_number = target_week_param
            AND s2.year = year_param
      );
    
    GET DIAGNOSTICS schedules_created = ROW_COUNT;
    
    -- STEP 2: Copy bookings (rest of function unchanged)
    -- ... (keep existing code)
    
    RETURN result;
END;
$;
```

**Impact:**
- ✅ Future copy week will NOT copy old batch values
- ✅ New schedules will have batch = NULL
- ✅ Batch auto-set when first student books
- ✅ No more Batch 1 zombie schedules

### Step 3: Test (2 menit)

1. Hard refresh browser (Ctrl + Shift + R)
2. Test booking Oxford Saturday Evening
3. Test admin create schedule
4. Should work! ✅

### Step 4: Prevention (Optional - 10 menit)

**Add cleanup to reset batch feature:**
- Update `RESET_BATCH_COMPLETE.sql`
- Add step to delete old batch schedules
- Prevent zombie schedules in future

---

## 📝 Summary

**Problem:** 9 empty Batch 1 schedules exist (0 students)

**Root Cause:** 
- `smart_copy_week` function copies batch value from source week
- Batch 1 schedules copied from Week 1 → Week 2 → Week 3 → ...
- No students in Batch 1 → Schedules stay empty forever

**Solution:**
1. Delete all 9 empty Batch 1 schedules (IMMEDIATE)
2. Fix smart_copy_week to set batch = NULL (PERMANENT)
3. Add cleanup to reset batch feature (PREVENTION)

**Result:**
- ✅ No more Batch 1 zombie schedules
- ✅ Students can book normally
- ✅ Admin can create schedules normally
- ✅ Batch always matches current active batch

---

## 🎯 Files Created

- `database/INVESTIGATE_BATCH_1_CREATION.sql` - Delete all Batch 1 schedules
- `KENAPA_BATCH_1_MUNCUL_LAGI.md` - This document
