# 👀 LIHAT CONSOLE LOG - Debug Tabrakan

## 🚀 QUICK START

1. **Hard refresh browser:** `Ctrl + Shift + R`
2. **Open console:** `F12` atau `Ctrl + Shift + I`
3. **Try to book Oxford Sunday Evening**
4. **Lihat output di console**

---

## 📊 APA YANG AKAN MUNCUL

### Section 1: PRE-INSERT CHECK

```
🔍 PRE-INSERT CHECK: Looking for potential conflicts...
───────────────────────────────────────────────────────────
🔍 CHECK 1 - Exact match (class/program/level/phase/day/time/week/batch):
   Result: ✅ FOUND  atau  ❌ NOT FOUND
```

**Jika FOUND:**
- ✅ Ada schedule yang exact match
- Code should use this schedule
- Booking should succeed

**Jika NOT FOUND:**
- ⚠️ Tidak ada schedule yang exact match
- Code will try to INSERT new schedule
- Lanjut ke CHECK 2

---

### Section 2: SIMILAR SCHEDULES

```
🔍 CHECK 2 - Similar schedules (same class/day/time/week, ANY program/level):
   Found: 3 schedules
   📋 EXISTING SCHEDULES:
   1. ID: xxx
      Program: English Campus & Career
      Level: Starter
      Batch: 2
      Students: 7/10
      Match: ✅ EXACT
   2. ID: yyy
      Program: English Campus & Career
      Level: Upper Starter
      Batch: 1
      Students: 0/10
      Match: ⚠️ DIFFERENT
   3. ID: zzz
      Program: English for Teens
      Level: Starter
      Batch: 2
      Students: 0/10
      Match: ⚠️ DIFFERENT
   🚨 WARNING: Found 2 EMPTY schedules!
   These might block INSERT due to trigger/constraint!
   Empty 1: English Campus & Career / Upper Starter / Batch 1
   Empty 2: English for Teens / Starter / Batch 2
```

**Interpretation:**
- Schedule 1 (7 students): ✅ Active, exact match
- Schedule 2 (0 students): 🚨 Empty, different level/batch
- Schedule 3 (0 students): 🚨 Empty, different program

**Problem:** Empty schedules 2 & 3 might block INSERT

---

### Section 3: INSERT RESULT

**If SUCCESS:**
```
✅✅✅ SUCCESS: Schedule created!
🆔 New schedule ID: xxx
```

**If FAILED:**
```
❌❌❌ INSERT FAILED!
═══════════════════════════════════════════════════════════
🔴 ERROR DETAILS:
   - Message: duplicate key value violates unique constraint "schedules_unique_booking"
   - Code: 23505
   - Details: Key (class_id, program, level, phase, day, time_slot, week_number, year, batch)=(xxx, English Campus & Career, Starter, recap, sunday, evening, 2, 2026, 2) already exists.
```

**Error code meanings:**
- `23505`: Duplicate key (constraint violation)
- `P0001`: Trigger error (custom exception)
- Other: Different error

---

## 🎯 DIAGNOSIS DARI CONSOLE LOG

### Case 1: Exact Match Found + INSERT Failed

```
🔍 CHECK 1: ✅ FOUND (Schedule ID: xxx, 7 students)
❌❌❌ INSERT FAILED!
   - Code: 23505
```

**Problem:** Code tried to INSERT meskipun exact match ada
**Root cause:** Code bug atau race condition
**Fix:** Code should use existing schedule (already implemented in retry logic)

---

### Case 2: Empty Schedules + INSERT Failed

```
🔍 CHECK 1: ❌ NOT FOUND
🔍 CHECK 2: Found 3 schedules
   🚨 WARNING: Found 2 EMPTY schedules!
❌❌❌ INSERT FAILED!
   - Message: Duplicate schedule detected!
```

**Problem:** Empty schedules block INSERT
**Root cause:** Trigger/constraint check class/day/time/week but NOT program/level
**Fix:** Delete empty schedules

---

### Case 3: No Conflicts + INSERT Failed

```
🔍 CHECK 1: ❌ NOT FOUND
🔍 CHECK 2: Found 0 schedules
❌❌❌ INSERT FAILED!
   - Message: Duplicate schedule detected!
```

**Problem:** Trigger or constraint blocking
**Root cause:** Trigger/constraint too strict
**Fix:** Drop trigger or constraint

---

## 🔧 QUICK FIX

**Based on console log, run SQL di Supabase:**

**If empty schedules found:**
```sql
DELETE FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**If trigger blocking:**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**Then test again!**

---

## 📋 CHECKLIST

- [ ] Hard refresh browser (`Ctrl + Shift + R`)
- [ ] Open console (`F12`)
- [ ] Try to book Oxford Sunday Evening
- [ ] Read console log output
- [ ] Identify problem from patterns above
- [ ] Run SQL fix
- [ ] Test again

---

**Created:** April 3, 2026
**Status:** Debug logging active
**Next:** Check console log and apply fix

