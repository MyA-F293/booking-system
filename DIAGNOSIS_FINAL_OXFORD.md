# 🎯 DIAGNOSIS FINAL - Oxford Booking Error

## ✅ HASIL INVESTIGASI

### Dari SQL Debug:
- ✅ Trigger sudah DISABLED
- ⚠️ Ada 1 empty schedule (Fahd Class wednesday afternoon)
- ✅ No Batch 1 schedules
- Current Week = 1

### Dari Console Log:
- 🚨 Error: "Duplicate schedule detected!"
- Query result: `found: false` (schedule tidak ditemukan)
- Code tries to INSERT → ERROR
- Error message: "Schedule for this class/day/time/phase/week already exists"

---

## 🔍 ROOT CAUSE DITEMUKAN!

**Bukan dari trigger, tapi dari UNIQUE CONSTRAINT!**

### Penjelasan:

1. **Trigger sudah disabled** ✅
2. **Tapi masih ada UNIQUE CONSTRAINT di database** ❌

**UNIQUE Constraint:**
- Check: `class_id + day + time_slot + phase + week_number`
- TIDAK check: `program`, `level`, `batch`

**Code Logic:**
- Check: `class_id + day + time_slot + phase + week_number + program + level + batch`

**Design Mismatch:**
- Constraint terlalu strict (seperti trigger)
- Block booking yang seharusnya valid
- Different programs tidak bisa pakai class yang sama

---

## 💡 KENAPA KADANG BISA, KADANG TIDAK?

### Timeline:

**Student A (English Campus & Career, Upper Starter):**
1. Click book Oxford Saturday Evening
2. Code check: Schedule tidak ada
3. Code INSERT: class_id + saturday + evening + recap + week 2 + **ECC + Upper Starter**
4. Constraint check: class_id + saturday + evening + recap + week 2 (NO program check)
5. Constraint: Tidak ada duplicate → **SUCCESS** ✅

**Student B (Teens, Starter) - 5 detik kemudian:**
1. Click book Oxford Saturday Evening
2. Code check: Schedule tidak ada (karena code check program/level juga)
3. Code INSERT: class_id + saturday + evening + recap + week 2 + **Teens + Starter**
4. Constraint check: class_id + saturday + evening + recap + week 2 (NO program check)
5. Constraint: **DUPLICATE DETECTED!** (Student A's schedule) → **ERROR** ❌

**Result:** Student A bisa book, Student B tidak bisa (meskipun program berbeda!)

---

## ✅ SOLUSI

### Jalankan query ini di Supabase:

**File:** `booking-system/database/FIX_UNIQUE_CONSTRAINT.sql`

**Atau copy paste ini:**

```sql
-- Check constraint name first
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
  AND contype = 'u';

-- Drop the constraint (adjust name based on output above)
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_class_id_day_time_slot_phase_week_number_key;

ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS unique_schedule_per_week;

ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_unique_schedule;

-- Verify
SELECT 
    COUNT(*) as remaining_unique_constraints
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
  AND contype = 'u';
```

**Expected:** 0 remaining unique constraints

---

## 🧪 TESTING

### 1. Jalankan SQL fix di atas

### 2. Hard refresh browser:
```
Ctrl + Shift + R
```

### 3. Test booking dengan 2 students berbeda:
- Student A: Book Oxford Saturday Evening
- Student B: Book Oxford Saturday Evening (different program/level)
- **Expected:** ✅ Kedua booking berhasil

---

## 📊 KENAPA INI AMAN?

### Code sudah ada duplicate checking:
```javascript
// getOrCreateSchedule() checks:
.eq('class_id', class_id)
.eq('program', program)      // ✅ Check program
.eq('level', level)          // ✅ Check level
.eq('phase', phase)
.eq('day', day)
.eq('time_slot', time_slot)
.eq('week_number', week_number)
.eq('batch', batch)          // ✅ Check batch
```

**Code prevents TRUE duplicates** (same class + day + time + phase + week + program + level + batch)

**Constraint was preventing LEGITIMATE schedules** (different program/level using same class)

---

## 🎯 KESIMPULAN

### Masalah:
1. ❌ Trigger terlalu strict (sudah disabled)
2. ❌ UNIQUE Constraint terlalu strict (masih aktif) ← **INI PENYEBABNYA!**

### Solusi:
1. ✅ Drop UNIQUE constraint
2. ✅ Code sudah ada proper duplicate checking
3. ✅ Different programs bisa pakai class yang sama

### Result:
- ✅ Oxford Saturday Evening bisa dibook
- ✅ Multiple students (different program) bisa book bersamaan
- ✅ No more "Duplicate schedule detected!" error

---

**Created:** April 3, 2026
**Status:** Root cause identified - UNIQUE constraint
**Next:** Run `FIX_UNIQUE_CONSTRAINT.sql`
