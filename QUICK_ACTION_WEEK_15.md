# Quick Action: Fix Week 15 Issue

## 🚨 CRITICAL - Do This First

### Step 1: Fix Week 15 (5 minutes)

**Run this query in Supabase SQL Editor:**
```
booking-system/database/FIX_ALL_WEEK_15_COMPLETE.sql
```

**Expected result:**
```
✅ SUCCESS! All Week 15+ issues fixed!
Current Week: 2
Remaining Week 15+ Schedules: 0
```

---

### Step 2: Verify Week for April Dates (1 minute)

**Run this query:**
```
booking-system/database/CHECK_WEEK_FOR_APRIL_DATES.sql
```

**Look for:**
- Is there attendance for Week 1 or Week 2 around April 1-2?
- Which week has Harvard Class (Thursday evening)?
- Which week has Oxford Class (Wednesday evening)?

---

### Step 3: Add Missing Attendance (2 minutes)

**If April 1-2 is Week 1:**
Edit `ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql` and change:
```sql
week_number = 2  →  week_number = 1
```

**Then run:**
```
booking-system/database/ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql
```

**Expected result:**
```
✅ Added attendance: Zalika Fathiyyah - Harvard Class
✅ Added attendance: Rahmah Rafifah Abu - Oxford Class
```

---

## ✅ Verification

### Check 1: Current Week
```sql
SELECT current_week FROM settings WHERE id = 1;
-- Expected: 2
```

### Check 2: No Future Weeks
```sql
SELECT MAX(week_number) FROM schedules;
-- Expected: 2
```

### Check 3: Student Dashboard
1. Login as student
2. Tab "Current" should show Week 2
3. Tab "New" should show Week 3

---

## 📧 Inform Students

**6 students affected by Week 15 issue:**
- 1 in Fahd Class
- 1 in Harvard Class
- 1 in Oxford Class
- 1 in Tokyo Class
- 2 in Tsinghua Class

**Message template:**
```
Dear [Name],

Your booking was moved from Week 15 to Week 2 due to a system fix.
Your schedule is confirmed - no action needed!

Class: [Class Name]
Day: [Day]
Time: [Time]
Week: 2

EYSA Team
```

---

## 🔍 Track Schedule Changes (Optional)

**To see who changed schedules between weeks:**
```
booking-system/database/TRACK_SCHEDULE_CHANGES.sql
```

Shows:
- Students who left
- Students who joined
- Students who changed class/day/time

---

## ⏱️ Total Time: ~8 minutes

1. Fix Week 15: 5 min
2. Check week dates: 1 min
3. Add attendance: 2 min

---

**Full details:** See `ACTION_PLAN_WEEK_15_FIX.md`
