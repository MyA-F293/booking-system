# 👥 VISUAL: Pattern Siswa Yang Bisa vs Tidak Bisa

## 🎯 SITUASI

**User:** "gini lho kausnya ada beberapa siswa yang bisa dan ada yang tidak"

**Ini bukan random!** Ada pattern yang jelas.

---

## 📊 VISUAL EXPLANATION

### Database State:

```
Oxford Class - Sunday Evening - Week 2
├── Schedule 1: ECC / Upper Starter / Batch 2 / 3 students ✅ ACTIVE
├── Schedule 2: ECC / Upper Starter / Batch 1 / 0 students 🟡 EMPTY
└── Schedule 3: Teens / Starter / Batch 2 / 0 students 🟡 EMPTY
```

### Trigger/Constraint Logic:

```
IF EXISTS (schedule dengan class/day/time/week SAMA) THEN
    BLOCK INSERT
END IF

❌ TIDAK check: program, level, batch
```

---

## 👥 STUDENT SCENARIOS

### ✅ Student A: ECC / Upper Starter / Batch 2

```
1. Click book Oxford Sunday Evening
2. Code check: "Ada schedule dengan ECC + Upper Starter + Batch 2?"
   → YES! Schedule 1 (3 students)
3. Code: Use existing schedule
4. Add booking to Schedule 1
5. ✅ SUCCESS!
```

**Result:** Schedule 1 sekarang punya 4 students

---

### ❌ Student B: ECC / Upper Starter / Batch 1

```
1. Click book Oxford Sunday Evening
2. Code check: "Ada schedule dengan ECC + Upper Starter + Batch 1?"
   → NO! Schedule 2 ada tapi EMPTY (current_students = 0)
   → Code logic: Ignore empty schedules
3. Code: Try INSERT new schedule
4. Trigger check: "Ada schedule lain dengan class/day/time/week sama?"
   → YES! Schedule 1, 2, 3 exist
5. Trigger: BLOCK INSERT
6. ❌ ERROR: "Duplicate schedule detected!"
```

**Result:** Student tidak bisa book

---

### ❌ Student C: Teens / Starter / Batch 2

```
1. Click book Oxford Sunday Evening
2. Code check: "Ada schedule dengan Teens + Starter + Batch 2?"
   → NO! Schedule 3 ada tapi EMPTY (current_students = 0)
   → Code logic: Ignore empty schedules
3. Code: Try INSERT new schedule
4. Trigger check: "Ada schedule lain dengan class/day/time/week sama?"
   → YES! Schedule 1, 2, 3 exist
5. Trigger: BLOCK INSERT
6. ❌ ERROR: "Duplicate schedule detected!"
```

**Result:** Student tidak bisa book

---

## 🔧 KENAPA INI TERJADI?

### Code Logic (CORRECT):
```javascript
// Check schedule dengan EXACT match
.eq('class_id', class_id)
.eq('program', program)      // ✅ Check program
.eq('level', level)          // ✅ Check level
.eq('batch', batch)          // ✅ Check batch
.eq('day', day)
.eq('time_slot', time_slot)
.eq('week_number', week_number)
```

### Trigger Logic (WRONG):
```sql
-- Check schedule TANPA program/level/batch
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND week_number = NEW.week_number
-- ❌ TIDAK check: program, level, batch
```

**Mismatch:** Code check lebih specific, trigger check terlalu general

---

## ✅ SOLUSI

### Fix 1: Delete Empty Schedules

```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Result:**
```
Oxford Class - Sunday Evening - Week 2
└── Schedule 1: ECC / Upper Starter / Batch 2 / 3 students ✅ ACTIVE
```

**Now:**
- Student A (ECC + Upper Starter + Batch 2) → ✅ Use Schedule 1
- Student B (ECC + Upper Starter + Batch 1) → ✅ Create new Schedule 2
- Student C (Teens + Starter + Batch 2) → ✅ Create new Schedule 3

---

### Fix 2: Drop Trigger

```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**Result:** Trigger tidak block INSERT lagi

---

## 🧪 TESTING

### Test dengan 3 students berbeda:

**Student A (ECC, Upper Starter, Batch 2):**
- Book Oxford Sunday Evening
- ✅ Should work (use existing schedule)

**Student B (ECC, Upper Starter, Batch 1):**
- Book Oxford Sunday Evening
- ✅ Should work (create new schedule)

**Student C (Teens, Starter, Batch 2):**
- Book Oxford Sunday Evening
- ✅ Should work (create new schedule)

**Expected Result:**
```
Oxford Class - Sunday Evening - Week 2
├── Schedule 1: ECC / Upper Starter / Batch 2 / 4 students
├── Schedule 2: ECC / Upper Starter / Batch 1 / 1 student
└── Schedule 3: Teens / Starter / Batch 2 / 1 student
```

---

## 🎯 KESIMPULAN

**Pattern:**
- ✅ Students dengan program/level/batch yang match schedule ACTIVE → Bisa book
- ❌ Students dengan program/level/batch yang berbeda → Tidak bisa (empty schedule block)

**Root cause:**
- Empty schedules exist di database
- Trigger block INSERT karena detect "duplicate" (tanpa check program/level)

**Fix:**
- Delete empty schedules
- Drop trigger
- Semua students bisa book!

---

**Created:** April 3, 2026
**Status:** Pattern identified, fix ready
**Next:** Run `JALANKAN_INI_SEKARANG.md`

