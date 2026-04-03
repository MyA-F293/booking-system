# 🔍 DEBUG TABRAKAN SCHEDULE

## 🎯 TUJUAN

Debug untuk melihat apakah ada tabrakan/konflik schedule yang menyebabkan error "Duplicate schedule detected!"

---

## 🚀 CARA DEBUG

### STEP 1: Check Browser Console (2 menit)

**Hard refresh browser:**
```
Ctrl + Shift + R
```

**Try to book Oxford Sunday Evening**

**Lihat console log, akan ada output seperti ini:**

```
═══════════════════════════════════════════════════════════
📡 getOrCreateSchedule CALLED
═══════════════════════════════════════════════════════════
🔢 Retry count: 0
📦 Schedule data: {
  "class_id": "...",
  "program": "English Campus & Career",
  "level": "Starter",
  "phase": "recap",
  "day": "sunday",
  "time_slot": "evening",
  "week_number": 2,
  "year": 2026,
  "batch": "2"
}
───────────────────────────────────────────────────────────
🔍 PRE-INSERT CHECK: Looking for potential conflicts...
───────────────────────────────────────────────────────────
🔍 CHECK 1 - Exact match (class/program/level/phase/day/time/week/batch):
   Result: ✅ FOUND  atau  ❌ NOT FOUND
   
🔍 CHECK 2 - Similar schedules (same class/day/time/week, ANY program/level):
   Found: X schedules
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
   🚨 WARNING: Found X EMPTY schedules!
   These might block INSERT due to trigger/constraint!
───────────────────────────────────────────────────────────
```

---

### STEP 2: Analyze Console Output

**Scenario A: Exact match FOUND**
```
🔍 CHECK 1 - Exact match:
   Result: ✅ FOUND
   Schedule ID: xxx
   Current students: 7
   ⚠️ Should use this schedule instead of creating new one!
```

**Diagnosis:** Code should use existing schedule
**Expected:** Booking should succeed
**If error:** Code bug, not database issue

---

**Scenario B: Similar schedules with EMPTY ones**
```
🔍 CHECK 2 - Similar schedules:
   Found: 3 schedules
   🚨 WARNING: Found 2 EMPTY schedules!
   Empty 1: English Campus & Career / Upper Starter / Batch 1
   Empty 2: English for Teens / Starter / Batch 2
```

**Diagnosis:** Empty schedules block INSERT
**Fix:** Delete empty schedules (see STEP 3)

---

**Scenario C: No conflicts found**
```
🔍 CHECK 1 - Exact match:
   Result: ❌ NOT FOUND
   
🔍 CHECK 2 - Similar schedules:
   Found: 0 schedules
```

**Diagnosis:** Should be able to INSERT
**If error:** Trigger or constraint issue (see STEP 4)

---

### STEP 3: Check Database (2 menit)

**Run SQL:** `database/CHECK_TABRAKAN_SCHEDULE.sql`

**Atau copy paste ini di Supabase:**

```sql
-- Quick check
SELECT 
    id,
    program,
    level,
    batch,
    current_students,
    CASE 
        WHEN current_students = 0 THEN '🚨 EMPTY'
        ELSE '✅ ACTIVE'
    END as status
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'sunday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026
ORDER BY current_students DESC;
```

**Expected output:**
```
id  | program                  | level         | batch | current_students | status
----|--------------------------|---------------|-------|------------------|--------
xxx | English Campus & Career  | Starter       | 2     | 7                | ✅ ACTIVE
yyy | English Campus & Career  | Upper Starter | 1     | 0                | 🚨 EMPTY
zzz | English for Teens        | Starter       | 2     | 0                | 🚨 EMPTY
```

**Interpretation:**
- Row 1 (7 students): ✅ Active schedule, can be used
- Row 2 (0 students): 🚨 Empty, blocks INSERT for Batch 1 students
- Row 3 (0 students): 🚨 Empty, blocks INSERT for Teens students

---

### STEP 4: Fix Based on Diagnosis

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

**If trigger active:**
```sql
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules;
```

**If true duplicates found:**
```sql
-- Keep the one with most students, delete others
-- (Manual review recommended)
```

---

## 📊 UNDERSTANDING THE OUTPUT

### Console Log Sections:

**1. PRE-INSERT CHECK**
- Shows what exists BEFORE trying to INSERT
- Helps identify conflicts early

**2. CHECK 1 - Exact match**
- Looks for schedule with EXACT same attributes
- If found: Should use this, not create new

**3. CHECK 2 - Similar schedules**
- Looks for schedules with same class/day/time/week
- But different program/level/batch
- Shows potential conflicts

**4. INSERT RESULT**
- Shows if INSERT succeeded or failed
- If failed: Shows error details

**5. RETRY LOGIC**
- If duplicate error: Try to fetch existing schedule
- Shows if fetch succeeded or failed

---

## 🎯 COMMON PATTERNS

### Pattern 1: Empty Schedule Block
```
Console:
🔍 CHECK 2: Found 2 EMPTY schedules!

Database:
current_students = 0 (multiple rows)

Fix:
DELETE empty schedules
```

---

### Pattern 2: Trigger Block
```
Console:
❌ INSERT FAILED!
   - Message: "Duplicate schedule detected!"
   - Code: P0001 (not 23505)

Database:
Trigger is ENABLED

Fix:
DROP trigger
```

---

### Pattern 3: True Duplicate
```
Console:
🔍 CHECK 1: ✅ FOUND (exact match)

Database:
Multiple rows with EXACT same attributes

Fix:
Merge duplicates (keep one, delete others)
```

---

## 🚀 QUICK ACTION

**Copy paste ini di browser console untuk quick check:**

```javascript
// Check what schedule data is being sent
console.log('Current user:', currentUser);
console.log('Selected:', {
  program: selectedProgram,
  level: selectedLevel,
  phase: selectedPhase,
  day: selectedDay,
  time: selectedTime,
  batch: currentUser?.batch
});
```

---

**Created:** April 3, 2026
**Status:** Debug logging added, ready for testing
**Files:**
- `src/utils/dbHelpers.js` - Added PRE-INSERT check
- `database/CHECK_TABRAKAN_SCHEDULE.sql` - Database check

