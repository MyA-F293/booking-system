# Action Plan: Fix Week 15 Issue & Add Missing Attendance

## Current Status

### Task 1: Week 15 Booking Issue ⚠️ CRITICAL
- **Problem**: 6 students booked Week 15 schedules instead of Week 2
- **Root Cause**: Database `current_week` was set to 15 instead of 2
- **Affected Students**: 6 students across Fahd, Harvard, Oxford, Tokyo, and Tsinghua classes
- **Solution Ready**: `FIX_ALL_WEEK_15_COMPLETE.sql` prepared

### Task 2: Add Missing Attendance ⏸️ WAITING
- **Problem**: 2 students missing attendance records
  1. Zalika Fathiyyah (EYSA26020140) - Harvard Class - Thursday, April 2, 2026
  2. Rahmah Rafifah Abu (EYSA26020173) - Oxford Class - Wednesday, April 1, 2026
- **Blocker**: Need to verify which week (1 or 2) corresponds to April 1-2, 2026
- **Solution Ready**: `ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql` prepared (needs week verification)

### Task 3: Track Schedule Changes ✅ DONE
- **Solution**: `TRACK_SCHEDULE_CHANGES.sql` ready to use anytime

---

## Action Steps

### STEP 1: Fix Week 15 Issue (CRITICAL - Do First)

**1.1 Run the fix query:**
```bash
# In Supabase SQL Editor, run:
booking-system/database/FIX_ALL_WEEK_15_COMPLETE.sql
```

**What it does:**
- Shows current state (6 schedules, 6 bookings in Week 15)
- Creates missing Week 2 schedules if needed
- Moves all Week 15+ bookings to Week 2
- Updates `current_students` counters
- Deletes empty Week 15+ schedules
- Resets `current_week` to 2
- Deletes all future weeks (3-99)
- Verifies the fix

**Expected Output:**
```
✅ SUCCESS! All Week 15+ issues fixed!
Current Week: 2
Max Week in Database: 2
Week 2 Schedules: [number]
Week 2 Bookings: 6
Remaining Week 15+ Schedules: 0
```

**1.2 Verify GitHub Actions (already correct):**
```yaml
# File: .github/workflows/auto-increment-week.yml
# Cron: '1 17 * * 0' ✅ CORRECT (weekly on Sunday)
```

**1.3 Inform affected students:**

Use template from `MESSAGE_TO_AFFECTED_STUDENTS_WEEK_15.md`:

```
Dear [Student Name],

We noticed your booking was accidentally placed in Week 15 due to a system issue. 
We've moved it to Week 2 (current week) for you.

Your schedule:
- Class: [Class Name]
- Day: [Day]
- Time: [Time Slot]
- Week: 2

No action needed from you. Your booking is confirmed!

Sorry for any confusion.
EYSA Team
```

**Affected students:**
1. Student in Fahd Class
2. Student in Harvard Class
3. Student in Oxford Class
4. Student in Tokyo Class
5. 2 students in Tsinghua Class

---

### STEP 2: Verify Week for April Dates

**2.1 Run the check query:**
```bash
# In Supabase SQL Editor, run:
booking-system/database/CHECK_WEEK_FOR_APRIL_DATES.sql
```

**2.2 Analyze the results:**

Look for:
- Current week setting
- Existing attendance for Week 1 and Week 2
- Harvard Class schedule (Thursday evening)
- Oxford Class schedule (Wednesday evening)

**2.3 Determine the correct week:**

If April 1-2, 2026 falls in:
- **Week 1**: Update `ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql` line with `week_number = 1`
- **Week 2**: Keep as is (already set to `week_number = 2`)

---

### STEP 3: Add Missing Attendance

**3.1 Update the query if needed:**

If April 1-2 is Week 1, edit `ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql`:
```sql
-- Change all instances of:
week_number = 2
-- To:
week_number = 1
```

**3.2 Run the query:**
```bash
# In Supabase SQL Editor, run:
booking-system/database/ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql
```

**Expected Output:**
```
✓ Found student: Zalika Fathiyyah (English for Teens - Starter)
✓ Found schedule: Harvard Class - Thursday evening (Teacher: [Name])
✅ Added attendance: Zalika Fathiyyah - Harvard Class (Thursday evening, Week 2)

✓ Found student: Rahmah Rafifah Abu (English Campus & Career - [Level])
✓ Found schedule: Oxford Class - Wednesday evening (Teacher: [Name])
✅ Added attendance: Rahmah Rafifah Abu - Oxford Class (Wednesday evening, Week 2)

DONE!
```

---

### STEP 4: Track Schedule Changes (Optional)

**When needed, run:**
```bash
# In Supabase SQL Editor, run:
booking-system/database/TRACK_SCHEDULE_CHANGES.sql
```

**What it shows:**
- Students who LEFT (were in previous week but not current)
- Students who JOINED (new in current week)
- Students who CHANGED schedule (different class/day/time)
- Side-by-side comparison by class
- Complete lists for both weeks
- Summary statistics

---

## Verification Checklist

### After Step 1 (Week 15 Fix):
- [ ] `current_week` = 2 in settings table
- [ ] No schedules exist for week > 2
- [ ] All 6 students have bookings in Week 2
- [ ] No bookings exist for Week 15+
- [ ] Student dashboard shows Week 2 in "Current" tab
- [ ] Student dashboard shows Week 3 in "New" tab

### After Step 3 (Add Attendance):
- [ ] Zalika has attendance for Harvard Class (Thursday evening)
- [ ] Rahmah has attendance for Oxford Class (Wednesday evening)
- [ ] Both records show correct week_number
- [ ] Both records show status = 'present'
- [ ] Teacher names are filled correctly

---

## Why Week 15 Happened?

**Investigation Results:**

1. **Code is CORRECT** ✅
   - Student dashboard reads from database via `useWeek()` context
   - Shows `currentWeek` in "Current" tab
   - Shows `currentWeek + 1` in "New" tab

2. **Database was WRONG** ❌
   - `settings.current_week` was set to 15 instead of 2
   - Likely caused by manual testing or accidental multiple increments

3. **GitHub Actions is CORRECT** ✅
   - Cron: `'1 17 * * 0'` = Weekly on Sunday at 17:01 UTC (Monday 00:01 WIB)
   - Not running daily

**Most Likely Cause:**
- Manual testing of `increment_week()` function
- Or manual database update during testing
- NOT caused by GitHub Actions running too frequently

---

## Prevention Measures

### Already Implemented:
1. ✅ 6-day cooldown in `increment_week()` function
2. ✅ GitHub Actions runs weekly (not daily)
3. ✅ Manual trigger available for testing

### Recommended:
1. Add max week limit (e.g., don't increment beyond Week 20)
2. Add logging to track who/what increments the week
3. Monitor `current_week` value weekly
4. Test `increment_week()` in staging environment only

---

## Files Reference

### Week 15 Fix:
- `database/FIX_ALL_WEEK_15_COMPLETE.sql` - Complete fix query
- `KENAPA_SISWA_BISA_BOOKING_WEEK_15.md` - Root cause analysis
- `MESSAGE_TO_AFFECTED_STUDENTS_WEEK_15.md` - Student notification template

### Add Attendance:
- `database/ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql` - Insert query
- `database/CHECK_WEEK_FOR_APRIL_DATES.sql` - Week verification query
- `database/CHECK_ATTENDANCE_TABLE_STRUCTURE.sql` - Table structure reference

### Track Changes:
- `database/TRACK_SCHEDULE_CHANGES.sql` - Schedule change tracking query

### GitHub Actions:
- `.github/workflows/auto-increment-week.yml` - Auto-increment workflow (CORRECT)

---

## Timeline

**Immediate (Now):**
1. Run `FIX_ALL_WEEK_15_COMPLETE.sql` (5 minutes)
2. Verify fix (2 minutes)
3. Inform affected students (10 minutes)

**Next (After Week Verification):**
1. Run `CHECK_WEEK_FOR_APRIL_DATES.sql` (1 minute)
2. Update `ADD_MISSING_ATTENDANCE_APRIL_FIXED.sql` if needed (1 minute)
3. Run attendance insert query (2 minutes)
4. Verify attendance added (1 minute)

**Total Time:** ~22 minutes

---

## Questions to Answer

### Q1: Why did current_week become 15?
**A:** Most likely manual testing or accidental multiple calls to `increment_week()`. GitHub Actions is configured correctly (weekly).

### Q2: Will this happen again?
**A:** No, if we avoid manual testing in production. The 6-day cooldown prevents accidental rapid increments.

### Q3: Are the 6 students' bookings safe?
**A:** Yes, they will be moved to Week 2 automatically by the fix query. No data loss.

### Q4: What week is April 1-2, 2026?
**A:** Need to run `CHECK_WEEK_FOR_APRIL_DATES.sql` to determine. Check existing attendance records.

### Q5: Can we track who changed schedules?
**A:** Yes, use `TRACK_SCHEDULE_CHANGES.sql` anytime to see students who left/joined/changed classes.

---

**Status:** Ready to execute  
**Priority:** CRITICAL (Week 15 fix), MEDIUM (Add attendance)  
**Risk:** LOW (queries are safe, have verification steps)  
**Impact:** 6 students (Week 15), 2 students (attendance)
