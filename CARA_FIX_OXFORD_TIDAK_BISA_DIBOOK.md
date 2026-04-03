# Cara Fix: Oxford Saturday Evening Tidak Bisa Dibook oleh Student

## 🔍 PROBLEM

**Error:** "Failed to book: Duplicate schedule detected!"

**Console Log:**
```
Current Week: 1 Year: 2026
getClassStatus called {classItem: {...}, scheduleData: undefined}
⚠️ No scheduleData, returning default
🚫 Class occupied by other program: Campus & Career
🚫 Class occupied by other program: English for Teens
```

---

## 🎯 ROOT CAUSE ANALYSIS

### Dari Console Log:

1. **scheduleData: undefined**
   - Artinya: `schedules.find(s => s.class_id === classItem.id)` tidak menemukan schedule
   - Kenapa? Schedule tidak di-load karena filter tidak match

2. **Class occupied by other program**
   - Oxford Class sudah dipakai program lain di Saturday Evening Week 2
   - Room Exclusivity Rule: 1 ruangan hanya bisa 1 program di waktu yang sama

### Kemungkinan Penyebab:

**Scenario A: Empty Duplicate Schedule (Batch 1)**
- Oxford Saturday Evening Week 2 ada schedule kosong (Batch 1, 0 students)
- Schedule ini hidden dari UI (karena current_students = 0)
- Tapi trigger `prevent_duplicate_schedule` tetap detect sebagai duplicate
- Student tidak bisa create schedule baru karena trigger block

**Scenario B: Room Conflict**
- Oxford Class sudah dipakai program lain (Campus & Career atau English for Teens)
- Student tidak bisa booking karena room exclusivity rule
- Tapi error message salah (harusnya "Room occupied" bukan "Duplicate schedule")

---

## 🔧 SOLUTION

### Step 1: Check Database
Jalankan: `database/DEBUG_STUDENT_OXFORD_BOOKING.sql`

Query ini akan check:
1. Current week setting
2. Oxford Saturday Evening schedules untuk Week 2
3. Schedule untuk Campus & Career, Upper Starter, Batch 2
4. Semua class yang occupied di Saturday Evening Week 2
5. Empty duplicate Oxford schedules

### Step 2: Delete Empty Duplicates
Jika ada empty duplicate Oxford schedule:

```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

### Step 3: Fix Trigger (Long-term)
Trigger `prevent_duplicate_schedule` perlu di-update untuk check program/level/batch:

```sql
-- Current trigger only checks: class_id, day, time_slot, phase, week_number
-- Should also check: program, level, batch

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
          AND program = NEW.program      -- ✅ ADD
          AND level = NEW.level          -- ✅ ADD
          AND batch = NEW.batch          -- ✅ ADD
          AND id != COALESCE(NEW.id, -1)
    ) THEN
        RAISE EXCEPTION 'Duplicate schedule detected!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 VERIFICATION

### After Deleting Empty Duplicates:
```sql
-- Should return 0 or 1 schedule (not multiple)
SELECT COUNT(*) as total
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026;
```

### Test Student Booking:
1. Login sebagai student (Campus & Career, Upper Starter, Batch 2)
2. Pilih Phase 2 → Saturday → Evening
3. Click Oxford Class
4. Should work without "Duplicate schedule" error

---

## 📊 EXPECTED RESULTS

### Scenario A (Empty Duplicate):
- Delete empty schedule → Student bisa booking
- System akan create schedule baru dengan batch yang benar

### Scenario B (Room Conflict):
- Oxford sudah dipakai program lain → Student tidak bisa booking
- Tapi error message harus "Room occupied" bukan "Duplicate schedule"
- Perlu fix error handling di `getOrCreateSchedule`

---

## 🚨 IMMEDIATE ACTION

**Jalankan query ini sekarang:**

```sql
-- Check situation
SELECT 
    id,
    program,
    level,
    batch,
    current_students,
    created_at
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY created_at;
```

Jika ada schedule dengan `current_students = 0`, delete:
```sql
DELETE FROM schedules WHERE id = '[ID_DARI_QUERY_ATAS]';
```

---

**Created:** April 3, 2026
**Status:** Investigation ready, waiting for query results
