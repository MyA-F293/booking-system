# 🎯 INI LHO KENAPA - Oxford Booking Error Explained

## 🔴 MASALAH

**Situasi:**
- Oxford Class Sunday Evening Week 2 → ❌ Error "Duplicate schedule detected!"
- Harvard & Tsinghua → ✅ Bisa dibook normal
- Semua kondisi sama (day, time, week, phase)

**User frustasi:** "tapi kok masih ya. coba gunakan pendekatan yang berbeda"

---

## 🤔 3 KEMUNGKINAN PENYEBAB

### Kemungkinan 1: EMPTY DUPLICATE SCHEDULES 🗑️

**Apa itu?**
Ada schedule lama yang `current_students = 0` (kosong) tapi masih ada di database.

**Kenapa bikin error?**
```
Database punya:
- Schedule A: Oxford / ECC / Upper Starter / Batch 1 / 0 students (EMPTY)
- Schedule B: Oxford / ECC / Upper Starter / Batch 2 / 0 students (EMPTY)
- Schedule C: Oxford / Teens / Starter / Batch 2 / 0 students (EMPTY)

Student coba book (ECC, Upper Starter, Batch 2):
1. Code check: "Ada schedule yang exact match?" → TIDAK (karena ada Batch 1 juga)
2. Code try INSERT new schedule
3. Trigger/Constraint: "Eh ada schedule lain dengan class/day/time/week sama!" → BLOCK!
4. Error: "Duplicate schedule detected!"
```

**Kenapa Oxford saja?**
- Oxford punya banyak empty schedules (dari batch lama)
- Harvard & Tsinghua clean, tidak ada empty schedules

**Cara check:**
```sql
SELECT program, level, batch, current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026;
```

**Jika ada row dengan `current_students = 0` → INI MASALAHNYA!**

**Fix:**
```sql
DELETE FROM schedules
WHERE current_students = 0
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026;
```

---

### Kemungkinan 2: TRIGGER TERLALU STRICT 🚫

**Apa itu?**
Ada trigger `prevent_duplicate_schedule` yang check duplicate tapi TIDAK check program/level/batch.

**Kenapa bikin error?**
```
Trigger logic:
IF EXISTS (schedule dengan class/day/time/phase/week SAMA) THEN
    RAISE ERROR "Duplicate!"
END IF

Problem:
- Trigger TIDAK check program/level/batch
- Jadi block INSERT meskipun program berbeda
- Different programs HARUS bisa pakai class yang sama!
```

**Cara check:**
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'schedules'::regclass
  AND tgname LIKE '%duplicate%';
```

**Jika ada trigger dengan `tgenabled = 'O'` (ENABLED) → INI MASALAHNYA!**

**Fix:**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

---

### Kemungkinan 3: RACE CONDITION ⚡

**Apa itu?**
2 students click book hampir bersamaan (dalam 1 detik).

**Kenapa bikin error?**
```
T=0.000s: Student A → Check → NOT FOUND → Start INSERT
T=0.050s: Student B → Check → NOT FOUND (A belum selesai) → Start INSERT
T=0.100s: Student A → INSERT complete → SUCCESS ✅
T=0.150s: Student B → INSERT → DUPLICATE! → ERROR ❌
```

**Kenapa Oxford saja?**
- Oxford popular → Banyak students book bersamaan
- Harvard & Tsinghua less popular → Tidak ada concurrent booking

**Cara check:**
```sql
SELECT 
    program, level, created_at,
    LAG(created_at) OVER (ORDER BY created_at) as prev_created,
    EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at))) as seconds_diff
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday' AND time_slot = 'evening'
  AND week_number = 2 AND year = 2026
ORDER BY created_at;
```

**Jika ada `seconds_diff < 1` → INI RACE CONDITION!**

**Fix:**
- Code sudah ada retry logic
- Tapi mungkin perlu improve timing
- Atau add database locking

---

## 🚀 CARA DEBUG SEKARANG

### STEP 1: Run SQL Check (2 menit)

**File:** `database/CHECK_ALL_SUNDAY_EVENING.sql`

Atau copy paste ini di Supabase SQL Editor:

```sql
-- Quick check
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

**Lihat hasilnya:**
- Berapa banyak Oxford schedules?
- Ada yang `current_students = 0`?
- Berapa banyak Harvard schedules?
- Berapa banyak Tsinghua schedules?

---

### STEP 2: Identify Root Cause (1 menit)

**Jika hasil STEP 1 menunjukkan:**

**A. Ada Oxford schedules dengan `current_students = 0`:**
→ **MASALAHNYA: Empty Duplicate Schedules**
→ **FIX:** Delete empty schedules

**B. Tidak ada Oxford schedules sama sekali:**
→ **MASALAHNYA: Trigger atau Constraint Block**
→ **FIX:** Drop trigger atau constraint

**C. Ada multiple Oxford schedules dengan timing dekat (< 1 detik):**
→ **MASALAHNYA: Race Condition**
→ **FIX:** Improve code retry logic

---

### STEP 3: Apply Fix (1 menit)

**Copy paste fix yang sesuai dari `FIX_CONSTRAINT_SEKARANG.txt`**

---

### STEP 4: Test (2 menit)

1. Hard refresh browser: `Ctrl + Shift + R`
2. Login sebagai student
3. Book Oxford Sunday Evening
4. Check console log untuk error details
5. Verify booking berhasil

---

## 📊 EXPECTED RESULTS

### Scenario A: Empty Duplicates
```
SQL Result:
class_name: Oxford Class
program: English Campus & Career
level: Upper Starter
batch: 1
current_students: 0  ← 🚨 INI MASALAHNYA!
```

**Fix:** Delete empty schedules
**Result:** Oxford bisa dibook

---

### Scenario B: Trigger Block
```
SQL Result:
trigger_name: prevent_duplicate_schedule
status: ✅ ENABLED (ACTIVE)  ← 🚨 INI MASALAHNYA!
```

**Fix:** Drop trigger
**Result:** Oxford bisa dibook

---

### Scenario C: Race Condition
```
SQL Result:
class_name: Oxford Class
program: English Campus & Career
created_at: 2026-04-03 10:00:00.123
prev_created: 2026-04-03 10:00:00.050
seconds_diff: 0.073  ← 🚨 INI MASALAHNYA! (< 1 second)
```

**Fix:** Code already handles this (retry logic)
**Result:** Should work after retry

---

## 🎯 KESIMPULAN

**Masalah paling mungkin:** Empty Duplicate Schedules (Kemungkinan 1)

**Kenapa?**
- Oxford error, Harvard/Tsinghua tidak
- Error konsisten (bukan intermittent)
- Error message: "Duplicate schedule detected!"

**Next step:**
1. Run `CHECK_ALL_SUNDAY_EVENING.sql`
2. Lihat hasilnya
3. Apply fix yang sesuai
4. Test booking lagi

**Estimated time:** 5-10 menit total

---

**Created:** April 3, 2026
**Status:** Debugging guide ready
**Files to run:**
- `database/CHECK_ALL_SUNDAY_EVENING.sql` (STEP 1)
- `FIX_CONSTRAINT_SEKARANG.txt` (STEP 3)

