# 🎯 BEBERAPA SISWA BISA, BEBERAPA TIDAK - Root Cause

## 🔴 SITUASI

**User report:** "gini lho kausnya ada beberapa siswa yang bisa dan ada yang tidak"

Ini bukan race condition! Ini masalah **program/level/batch matching**.

---

## 💡 ROOT CAUSE

### Scenario:

**Database punya:**
```
Schedule 1: Oxford / ECC / Upper Starter / Batch 2 / 3 students (ACTIVE)
Schedule 2: Oxford / ECC / Upper Starter / Batch 1 / 0 students (EMPTY)
Schedule 3: Oxford / Teens / Starter / Batch 2 / 0 students (EMPTY)
```

**Trigger/Constraint logic:**
```sql
-- Check duplicate berdasarkan:
WHERE class_id = Oxford
  AND day = sunday
  AND time_slot = evening
  AND week_number = 2
-- TIDAK check: program, level, batch
```

### Result:

**Student A (ECC, Upper Starter, Batch 2):**
1. Code check: Ada schedule yang exact match (Schedule 1)
2. Code use existing schedule
3. ✅ **BERHASIL BOOK!**

**Student B (ECC, Upper Starter, Batch 1):**
1. Code check: Tidak ada schedule yang exact match (Schedule 2 ada tapi empty)
2. Code try INSERT new schedule
3. Trigger/Constraint: "Ada schedule lain dengan class/day/time/week sama!" (Schedule 1)
4. ❌ **ERROR: "Duplicate schedule detected!"**

**Student C (Teens, Starter, Batch 2):**
1. Code check: Tidak ada schedule yang exact match (Schedule 3 ada tapi empty)
2. Code try INSERT new schedule
3. Trigger/Constraint: "Ada schedule lain dengan class/day/time/week sama!" (Schedule 1)
4. ❌ **ERROR: "Duplicate schedule detected!"**

---

## 🔍 PATTERN

**Yang BISA book:**
- ✅ Students dengan program/level/batch yang SAMA dengan schedule yang sudah ada dan ACTIVE
- ✅ Contoh: ECC + Upper Starter + Batch 2 (karena Schedule 1 ada dan active)

**Yang TIDAK BISA book:**
- ❌ Students dengan program/level/batch yang BERBEDA
- ❌ Students dengan program/level/batch yang SAMA tapi schedule-nya EMPTY
- ❌ Contoh: ECC + Upper Starter + Batch 1 (Schedule 2 empty)
- ❌ Contoh: Teens + Starter + Batch 2 (Schedule 3 empty)

---

## 🧪 CARA CHECK

### Run SQL ini di Supabase:

**File:** `database/CHECK_STUDENT_PATTERN.sql`

**Atau copy paste ini:**

```sql
-- Check pattern
SELECT 
    program,
    level,
    batch,
    current_students,
    CASE 
        WHEN current_students = 0 THEN '🚨 EMPTY - Blocks others'
        WHEN current_students > 0 THEN '✅ ACTIVE - Students can book'
    END as status
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY current_students DESC;
```

### Expected Result:

```
program                  | level         | batch | current_students | status
-------------------------|---------------|-------|------------------|---------------------------
English Campus & Career  | Upper Starter | 2     | 3                | ✅ ACTIVE - Students can book
English Campus & Career  | Upper Starter | 1     | 0                | 🚨 EMPTY - Blocks others
English for Teens        | Starter       | 2     | 0                | 🚨 EMPTY - Blocks others
```

**Interpretation:**
- Students dengan ECC + Upper Starter + Batch 2 → ✅ BISA book
- Students dengan ECC + Upper Starter + Batch 1 → ❌ TIDAK BISA (empty schedule blocks)
- Students dengan Teens + Starter + Batch 2 → ❌ TIDAK BISA (empty schedule blocks)

---

## ✅ SOLUSI

### Quick Fix: Delete Empty Schedules

```sql
-- Delete ALL empty Oxford schedules
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Result:**
- Empty schedules dihapus
- Semua students bisa book (code akan create schedule baru sesuai program/level mereka)

---

### Permanent Fix: Update Trigger

**Option 1: Drop trigger (recommended)**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**Option 2: Update trigger to check program/level/batch**
```sql
CREATE OR REPLACE FUNCTION check_duplicate_schedule()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM schedules
        WHERE class_id = NEW.class_id
          AND day = NEW.day
          AND time_slot = NEW.time_slot
          AND phase = NEW.phase
          AND week_number = NEW.week_number
          AND program = NEW.program              -- ✅ ADD
          AND level = NEW.level                  -- ✅ ADD
          AND COALESCE(batch, '0') = COALESCE(NEW.batch, '0')  -- ✅ ADD
          AND id != COALESCE(NEW.id, -1)
    ) THEN
        RAISE EXCEPTION 'Duplicate schedule detected!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 VERIFICATION

### After Fix:

```sql
-- Check lagi
SELECT 
    program,
    level,
    batch,
    current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY current_students DESC;
```

**Expected:** Hanya ada schedules dengan `current_students > 0`

### Test:

1. Hard refresh browser: `Ctrl + Shift + R`
2. Login sebagai student dengan program/level berbeda
3. Book Oxford Sunday Evening
4. ✅ Semua students sekarang bisa book!

---

## 🎯 KESIMPULAN

**Masalah:** Empty schedules dengan program/level berbeda block INSERT schedule baru

**Penyebab:** Trigger/constraint check class/day/time/week tapi TIDAK check program/level/batch

**Solusi:** Delete empty schedules + drop/update trigger

**Result:** Semua students bisa book, tidak peduli program/level/batch mereka

---

## 🚀 QUICK ACTION

**Copy paste ini di Supabase:**

```sql
-- 1. Check pattern
SELECT program, level, batch, current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026;

-- 2. Delete empty schedules
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026
  AND current_students = 0;

-- 3. Drop trigger
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;

-- 4. Verify
SELECT COUNT(*) as remaining_empty
FROM schedules
WHERE current_students = 0
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026;
```

**Expected:** `remaining_empty = 0`

**Test:** Semua students sekarang bisa book Oxford! ✅

---

**Created:** April 3, 2026
**Status:** Root cause identified - Empty schedules block different program/level
**Estimated fix time:** 2 minutes

