# 🔍 Visual Investigation - Siswa Hilang Setelah Copy Week

## 📊 What Happened (User's Report)

```
WEEK 1 (Before Copy)
┌─────────────────────────────────────┐
│  RABU (Wednesday)                   │
│  ┌───────────────────────────────┐  │
│  │ 👤 Andi                       │  │
│  │ 👤 Budi                       │  │
│  │ 👤 Citra                      │  │
│  │ 👤 Doni                       │  │
│  │ ... (50 students)             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

         ↓ COPY WEEK (User Action)
         ↓ "Pindahkan ke Kamis-Sabtu"

WEEK 2 (After Copy)
┌─────────────────────────────────────┐
│  KAMIS (Thursday)                   │
│  ┌───────────────────────────────┐  │
│  │ ❓ Where are the students?    │  │
│  │ ❓ Names not showing          │  │
│  └───────────────────────────────┘  │
│                                     │
│  JUMAT (Friday)                     │
│  ┌───────────────────────────────┐  │
│  │ ❓ Empty schedules?           │  │
│  └───────────────────────────────┘  │
│                                     │
│  SABTU (Saturday)                   │
│  ┌───────────────────────────────┐  │
│  │ ❓ Bookings exist but hidden? │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**User says**: "Padahal pas week 2 masih adaji" (Bookings still exist in week 2)

---

## 🎯 What We're Investigating

### Scenario 1: Students Completely Missing
```
WEEK 1          WEEK 2
┌─────┐         ┌─────┐
│ 👤  │  ❌ →   │     │  (No booking at all)
└─────┘         └─────┘

CAUSE: Bookings not copied
FIX: Re-copy bookings
```

### Scenario 2: Students Moved to Wrong Day
```
WEEK 1          WEEK 2
┌─────────┐     ┌─────────┐
│ RABU    │     │ SENIN   │  (Wrong day!)
│ 👤 Andi │ → ? │ 👤 Andi │
└─────────┘     └─────────┘

CAUSE: Wrong day mapping
FIX: Move to correct day
```

### Scenario 3: Students Exist But Schedule Empty
```
WEEK 2
┌──────────────────────────┐
│ KAMIS (Thursday)         │
│ ┌──────────────────────┐ │
│ │ Schedule: EXISTS ✅  │ │
│ │ Bookings: EXISTS ✅  │ │
│ │ Display: EMPTY ❌    │ │
│ └──────────────────────┘ │
└──────────────────────────┘

CAUSE: Display bug or current_students = 0
FIX: Update counter or fix UI
```

### Scenario 4: Target Schedules Not Created
```
WEEK 1          WEEK 2
┌─────────┐     ┌─────────┐
│ RABU    │     │ KAMIS   │
│ ✅ Exists│ →   │ ❌ NULL │  (Schedule not created)
└─────────┘     └─────────┘

CAUSE: Schedules not created for Thursday-Saturday
FIX: Create schedules first, then copy bookings
```

---

## 📋 Debug Query Will Tell Us

### TEST 1: Count Missing Students
```sql
SELECT COUNT(*) 
FROM week1_students 
WHERE NOT EXISTS (SELECT 1 FROM week2_students)
```

**If > 0**: Students completely missing → Need re-copy

**If = 0**: Students exist somewhere → Check other tests

---

### TEST 2: Check Day Changes
```sql
SELECT student, week1_day, week2_day
WHERE week1_day != week2_day
```

**Expected**: wednesday → thursday/friday/saturday

**If different**: Wrong mapping → Need fix

---

### TEST 3 & 4: Compare Lists
```
TEST 3: List all students in Wednesday Week 1
TEST 4: List all students in Thursday-Saturday Week 2

Compare manually:
- Are the same students in both lists?
- Are they in the correct classes?
- Are they in the correct time slots?
```

---

### TEST 5: Find Empty Schedules
```sql
SELECT * FROM schedules
WHERE week_number = 2
  AND day IN ('thursday', 'friday', 'saturday')
  AND current_students = 0
```

**If found**: Schedules exist but no students → Need assign

**If not found**: Schedules don't exist → Need create

---

### TEST 6: Summary Statistics
```
Week 1 Wednesday: 50 students
Week 2 Thursday:  ?? students
Week 2 Friday:    ?? students
Week 2 Saturday:  ?? students

Total Week 2 (Thu-Sat): Should be ~50 students
```

**If less**: Students missing → Investigate why

**If equal**: Students exist → Check display issue

---

## 🔧 Possible Fixes (Based on Results)

### Fix 1: Re-copy Bookings
```sql
INSERT INTO bookings (schedule_id, user_id, status)
SELECT target_schedule_id, user_id, 'confirmed'
FROM week1_bookings
WHERE NOT EXISTS (SELECT 1 FROM week2_bookings)
```

### Fix 2: Move to Correct Day
```sql
UPDATE bookings
SET schedule_id = correct_schedule_id
WHERE schedule_id = wrong_schedule_id
```

### Fix 3: Update Counter
```sql
UPDATE schedules
SET current_students = (
  SELECT COUNT(*) FROM bookings 
  WHERE schedule_id = schedules.id
)
```

### Fix 4: Create Missing Schedules
```sql
INSERT INTO schedules (class_id, day, time_slot, week_number)
SELECT class_id, 'thursday', time_slot, 2
FROM schedules
WHERE week_number = 1 AND day = 'wednesday'
```

---

## 🎯 Decision Tree

```
Run DEBUG_MISSING_STUDENT_AFTER_COPY.sql
              ↓
    ┌─────────┴─────────┐
    │                   │
TEST 1 > 0?        TEST 1 = 0?
    │                   │
    ↓                   ↓
Students Missing    Students Exist
    │                   │
    ↓                   ↓
Re-copy Bookings    Check TEST 2
                        │
              ┌─────────┴─────────┐
              │                   │
        Day Changed?        Day Same?
              │                   │
              ↓                   ↓
        Fix Mapping         Check TEST 5
                                │
                      ┌─────────┴─────────┐
                      │                   │
              Empty Schedules?    No Empty?
                      │                   │
                      ↓                   ↓
              Assign Students     Display Bug
```

---

## 📊 Expected Timeline

```
┌─────────────────────────────────────────────────┐
│ 1. Run Debug Query          [2 min]             │
│ 2. Share Results            [1 min]             │
│ 3. Analyze Results          [2 min]             │
│ 4. Create Fix Query         [5 min]             │
│ 5. Execute Fix              [2 min]             │
│ 6. Verify Fix               [2 min]             │
│                                                 │
│ TOTAL: ~14 minutes to resolve! 🚀              │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Next Steps

1. ✅ Read this visual guide (you're here!)
2. ⏳ Run `DEBUG_MISSING_STUDENT_AFTER_COPY.sql`
3. ⏳ Share all 6 test results
4. ⏳ Wait for specific fix based on results
5. ⏳ Execute fix query
6. ✅ Problem solved!

---

**STATUS**: ⏳ Waiting for debug results to determine exact cause and fix.

**FILE TO RUN**: `booking-system/database/DEBUG_MISSING_STUDENT_AFTER_COPY.sql`

**GUIDE**: `booking-system/QUICK_ACTION_SISWA_HILANG.md`
