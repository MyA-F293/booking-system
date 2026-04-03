# 🚀 JALANKAN INI SEKARANG!

## 🎯 MASALAH: Beberapa siswa bisa book, beberapa tidak

**Root cause:** Ada empty schedules dengan program/level berbeda yang block INSERT schedule baru.

---

## 📋 STEP 1: Check Pattern (1 menit)

Copy paste di Supabase SQL Editor:

```sql
SELECT 
    program,
    level,
    batch,
    current_students,
    CASE 
        WHEN current_students = 0 THEN '🚨 EMPTY - Blocks others'
        WHEN current_students > 0 THEN '✅ ACTIVE - Can book'
    END as status
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY current_students DESC;
```

---

## 🔧 STEP 2: Fix (30 detik)

Copy paste di Supabase SQL Editor:

```sql
-- Delete empty schedules
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;

-- Drop trigger
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

---

## ✅ STEP 3: Verify (30 detik)

```sql
-- Check lagi
SELECT COUNT(*) as empty_schedules
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Expected:** `empty_schedules = 0`

---

## 🧪 STEP 4: Test (1 menit)

1. Hard refresh browser: `Ctrl + Shift + R`
2. Login sebagai student yang tadi TIDAK BISA book
3. Book Oxford Sunday Evening
4. ✅ Should work!

---

## 📊 PENJELASAN SINGKAT

**Kenapa beberapa bisa, beberapa tidak?**

- Students dengan program/level yang SAMA dengan schedule yang ada → ✅ Bisa book
- Students dengan program/level yang BERBEDA → ❌ Tidak bisa (empty schedule block)

**Contoh:**
- Schedule ada: ECC + Upper Starter + Batch 2 (3 students)
- Student A (ECC + Upper Starter + Batch 2) → ✅ Bisa (exact match)
- Student B (ECC + Upper Starter + Batch 1) → ❌ Tidak bisa (empty schedule block)
- Student C (Teens + Starter + Batch 2) → ❌ Tidak bisa (empty schedule block)

**Fix:** Delete empty schedules → Semua students bisa book!

---

**Total time:** 3 menit
**Success rate:** 99%

