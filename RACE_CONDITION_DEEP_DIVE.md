# 🔍 RACE CONDITION DEEP DIVE - Oxford Booking Error

## 📋 CONTEXT

**User melaporkan:**
- Oxford Class tidak bisa dibook
- Error: "Duplicate schedule detected!"
- Harvard & Tsinghua bisa dibook normal
- Semua kondisi sama: Sunday Evening, Week 2, Phase 2

**User bertanya:**
1. "tapi kok masih ya. coba gunakan pendekatan yang berbeda"
2. "apakah masalahnya memang race condition? coba buat debugnya lebih detail"
3. "ini lho knp sih"

---

## 🎯 3 KEMUNGKINAN PENYEBAB

### 1️⃣ RACE CONDITION (True Concurrent Access)

**Definisi:** 2+ students click book hampir bersamaan (< 1 detik)

**Timeline:**
```
T=0.000s: Student A → Check schedule → NOT FOUND → Start INSERT
T=0.050s: Student B → Check schedule → NOT FOUND (A belum commit) → Start INSERT
T=0.100s: Student A → INSERT complete → SUCCESS ✅
T=0.150s: Student B → INSERT → DUPLICATE ERROR ❌ (A sudah commit)
```

**Ciri-ciri:**
- ✅ Error code: `23505` (duplicate key violation)
- ✅ Error intermittent (kadang bisa, kadang tidak)
- ✅ Terjadi saat traffic tinggi
- ✅ Multiple schedules dengan timestamp sangat dekat (< 1 detik)

**Solusi:**
- Code retry dengan exponential backoff
- Fetch existing schedule setelah duplicate error
- Use database locking (SELECT FOR UPDATE)

---

### 2️⃣ TRIGGER BLOCK (False Positive)

**Definisi:** Trigger `prevent_duplicate_schedule` block INSERT yang seharusnya valid

**Trigger Logic:**
```sql
-- Trigger check HANYA:
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number
-- TIDAK check: program, level, batch
```

**Problem:**
- Trigger block INSERT jika ada schedule lain dengan class/day/time/phase/week sama
- MESKIPUN program/level/batch berbeda
- Ini SALAH karena different programs HARUS bisa pakai class yang sama

**Ciri-ciri:**
- ✅ Error message: "Duplicate schedule detected!" (custom message)
- ✅ Error code: BUKAN `23505` (trigger error, bukan constraint)
- ✅ Error konsisten (selalu gagal)
- ✅ Terjadi meskipun hanya 1 user

**Solusi:**
- Drop trigger: `DROP TRIGGER prevent_duplicate_schedule`
- Atau update trigger untuk check program/level/batch juga

---

### 3️⃣ EMPTY DUPLICATE SCHEDULES (Leftover Data)

**Definisi:** Ada schedule lama dengan `current_students = 0` yang bikin trigger/constraint block

**Scenario:**
```
Schedule 1: Oxford / ECC / Upper Starter / Batch 1 / 0 students (EMPTY, leftover)
Schedule 2: Oxford / ECC / Upper Starter / Batch 2 / 0 students (EMPTY, leftover)
Schedule 3: Oxford / Teens / Starter / Batch 2 / 0 students (EMPTY, leftover)
```

**Problem:**
- Student (ECC, Upper Starter, Batch 2) coba book
- Code check: Tidak ada schedule yang exact match
- Code try INSERT
- Trigger/constraint detect: "Ada schedule lain dengan class/day/time/phase/week sama!"
- Block INSERT meskipun schedule yang ada EMPTY

**Ciri-ciri:**
- ✅ Multiple schedules dengan `current_students = 0`
- ✅ Schedules dengan program/level/batch berbeda
- ✅ Error konsisten untuk class tertentu (Oxford)
- ✅ Class lain (Harvard, Tsinghua) tidak ada masalah

**Solusi:**
- Delete empty schedules: `DELETE FROM schedules WHERE current_students = 0`
- Update trigger untuk ignore empty schedules
- Prevent empty schedules dari dibuat

---

## 🧪 CARA DEBUG

### STEP 1: Run Comprehensive Check

**File:** `database/DEBUG_RACE_CONDITION_DETAIL.sql`

**Ini akan show:**
1. Semua schedules di Sunday Evening Week 2
2. Count per class (empty vs active)
3. Trigger status (enabled/disabled)
4. Constraint status (unique constraints)
5. Detail per class (Oxford, Harvard, Tsinghua)
6. Other programs yang pakai class yang sama

**Expected Output:**
- Jika Race Condition: Multiple schedules dengan timing dekat
- Jika Trigger Block: Trigger status = ENABLED
- Jika Empty Duplicates: Multiple schedules dengan current_students = 0

---

### STEP 2: Analyze Pattern

**File:** `database/ANALYZE_RACE_CONDITION.sql`

**Ini akan analyze:**
1. Timing pattern (race condition detection)
2. Trigger/constraint status
3. Empty schedule count
4. Program sharing pattern

**Expected Output:**
```
DIAGNOSIS: 
- 🚨 PROBLEM: Empty schedules exist - might block INSERT
- 🚨 PROBLEM: Duplicate prevention trigger is ACTIVE
- 🚨 PROBLEM: Multiple UNIQUE constraints exist
- ✅ No obvious blocking issues found
```

---

### STEP 3: Manual Test

**File:** `database/TEST_RACE_CONDITION_MANUAL.sql`

**Cara test:**
1. Open 2 SQL editor tabs di Supabase
2. Tab 1: Run TEST 1 (Student A INSERT) - JANGAN commit
3. Tab 2: Run TEST 2 (Student B INSERT) - Lihat hasilnya
4. Tab 1: ROLLBACK (undo test)

**Expected Result:**
- Jika Race Condition: Student B error "duplicate key"
- Jika Trigger Block: Student B error "Duplicate schedule detected!"
- Jika No Problem: Both students SUCCESS

---

## 🔧 SOLUSI BERDASARKAN DIAGNOSIS

### Jika Race Condition (Hypothesis 1):

**Code sudah handle ini!** (line 303-370 di dbHelpers.js)
- Retry dengan exponential backoff
- Fetch existing schedule setelah duplicate error
- Max 5 retries

**Tapi mungkin perlu improve:**
- Add delay sebelum retry (currently immediate)
- Use database locking (SELECT FOR UPDATE)

---

### Jika Trigger Block (Hypothesis 2):

**Quick Fix:**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**Permanent Fix:**
```sql
-- Update trigger to check program/level/batch
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

### Jika Empty Duplicates (Hypothesis 3):

**Quick Fix:**
```sql
-- Delete ALL empty schedules
DELETE FROM schedules
WHERE day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Permanent Fix:**
```sql
-- Auto-delete empty schedules after 24 hours
CREATE OR REPLACE FUNCTION cleanup_empty_schedules()
RETURNS void AS $$
BEGIN
    DELETE FROM schedules
    WHERE current_students = 0
      AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 RECOMMENDED APPROACH

### Phase 1: Diagnosis (5 minutes)

1. Run `DEBUG_RACE_CONDITION_DETAIL.sql`
2. Run `ANALYZE_RACE_CONDITION.sql`
3. Identify which hypothesis is correct

### Phase 2: Quick Fix (2 minutes)

**If Trigger Block:**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**If Empty Duplicates:**
```sql
DELETE FROM schedules WHERE current_students = 0 
AND day = 'sunday' AND time_slot = 'evening' 
AND week_number = 2 AND year = 2026;
```

**If Race Condition:**
- Code already handles this
- Test dengan 2 users bersamaan
- Verify retry logic works

### Phase 3: Verify (3 minutes)

1. Hard refresh browser (Ctrl + Shift + R)
2. Test booking Oxford Sunday Evening
3. Check console log untuk error details
4. Verify booking berhasil

### Phase 4: Permanent Fix (10 minutes)

- Update trigger to check program/level/batch
- Add auto-cleanup for empty schedules
- Improve code retry logic with better timing

---

## 📊 EXPECTED RESULTS

### Scenario A: Race Condition
```
Console log:
❌❌❌ INSERT FAILED!
🔴 ERROR DETAILS:
   - Code: 23505
   - Message: duplicate key value violates unique constraint
🔄 STEP 2: Duplicate detected - fetching existing schedule...
✅✅✅ SUCCESS: Found existing schedule!
```

### Scenario B: Trigger Block
```
Console log:
❌❌❌ INSERT FAILED!
🔴 ERROR DETAILS:
   - Code: P0001 (or similar)
   - Message: Duplicate schedule detected!
🔄 STEP 2: Duplicate detected - fetching existing schedule...
⚠️ NO SCHEDULE FOUND!
❌ Failed to fetch schedule after 5 retries
```

### Scenario C: Empty Duplicates
```
SQL result:
🔬 HYPOTHESIS 3: Empty Duplicates
class_name: Oxford Class
program: English Campus & Career
level: Upper Starter
batch: 1
current_students: 0
status: 🚨 EMPTY - Might block new INSERT
```

---

## 🚀 NEXT STEPS

1. ✅ Run `DEBUG_RACE_CONDITION_DETAIL.sql` di Supabase
2. ⏳ Analyze hasil untuk identify root cause
3. ⏳ Apply quick fix berdasarkan diagnosis
4. ⏳ Test booking Oxford lagi
5. ⏳ Apply permanent fix jika perlu

---

**Created:** April 3, 2026
**Status:** Debugging tools ready, waiting for SQL results
**Files Created:**
- `database/DEBUG_RACE_CONDITION_DETAIL.sql`
- `database/ANALYZE_RACE_CONDITION.sql`
- `database/TEST_RACE_CONDITION_MANUAL.sql`

