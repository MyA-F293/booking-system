# Kenapa Oxford Saja Yang Error "Duplicate Schedule"?

## 🔍 SITUASI

**Yang BISA dibook:**
- ✅ Harvard Class (0/10) - WAITING
- ✅ Tsinghua Class (0/10) - WAITING

**Yang TIDAK BISA dibook:**
- ❌ Oxford Class (0/10) - WAITING → Error: "Duplicate schedule detected!"

**Kondisi sama:** Saturday Evening, Week 2, Phase 2, semua 0/10 students

---

## 🎯 ROOT CAUSE

### Trigger `prevent_duplicate_schedule` Logic:

Trigger ini check duplicate berdasarkan:
- class_id
- day
- time_slot
- phase
- week_number

**TIDAK check:** program, level, batch

### Scenario:

**Oxford Class Saturday Evening Week 2:**
```
Schedule 1: Campus & Career / Upper Starter / Batch 2 / 0 students (EMPTY, hidden)
Schedule 2: Campus & Career / Upper Starter / Batch 1 / 0 students (EMPTY, hidden)
Schedule 3: English for Teens / Starter / Batch 2 / 0 students (EMPTY, hidden)
```

Ketika student (Campus & Career, Upper Starter, Batch 2) mencoba booking:
1. Code `getOrCreateSchedule` check: class_id, day, time, phase, week, program, level, batch
2. Tidak menemukan schedule yang exact match (karena ada multiple dengan batch berbeda)
3. Code mencoba CREATE schedule baru
4. **Trigger block:** "Duplicate schedule detected!" (karena trigger hanya check class_id, day, time, phase, week)

**Harvard & Tsinghua:** Tidak ada empty duplicate schedules → bisa booking normal

---

## ✅ SOLUTION

### Quick Fix: Delete Empty Oxford Schedules

**File:** `database/DELETE_EMPTY_OXFORD_SATURDAY.sql`

```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Result:** Semua empty Oxford schedules dihapus → Student bisa booking

---

## 🔧 PERMANENT FIX

### Update Trigger to Check Program/Level/Batch

**Current trigger:**
```sql
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number
```

**Should be:**
```sql
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number
  AND program = NEW.program          -- ✅ ADD
  AND level = NEW.level              -- ✅ ADD
  AND COALESCE(batch, 0) = COALESCE(NEW.batch, 0)  -- ✅ ADD
```

---

## 🧪 VERIFICATION

### Check Oxford Schedules:
```sql
SELECT program, level, batch, current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026;
```

**Before Fix:** Multiple rows (some with 0 students)
**After Fix:** Only active schedules (current_students > 0)

---

## 📊 WHY THIS HAPPENS

1. **Batch 1 schedules deleted** → Empty Batch 1 schedules remain
2. **smart_copy_week copies old batch** → Empty schedules copied to new weeks
3. **Trigger doesn't check program/level/batch** → Blocks all new schedule creation
4. **Only Oxford affected** → Because only Oxford has multiple empty duplicates

**Harvard & Tsinghua:** Clean, no empty duplicates → No problem

---

## 🚀 IMMEDIATE ACTION

**Jalankan query ini sekarang:**

```sql
-- Check situation
SELECT id, program, level, batch, current_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY current_students DESC, created_at;
```

**Jika ada schedule dengan current_students = 0:**
```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Test:** Student coba booking Oxford lagi → Should work!

---

**Created:** April 3, 2026
**Status:** Root cause identified, SQL fix ready
