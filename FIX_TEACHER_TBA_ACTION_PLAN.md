# 🎯 Action Plan: Fix Teacher "TBA" Display Issue

## Current Status: INVESTIGATION PHASE 🔍

## Problem Summary
Teacher display in booking modal shows "TBA" instead of actual teacher name for some occupied rooms.

---

## ✅ COMPLETED FIXES

### 1. Fixed Frontend Code (Teacher Display Logic)
**Files Modified**:
- ✅ `booking-system/src/utils/dbHelpers.js` - Added teacher data to query
- ✅ `booking-system/src/BookingSystemDB.jsx` - Updated teacher display logic

**What Was Fixed**:
- System now fetches teacher data from database
- Displays correct teacher for occupied rooms
- Shows teacher from occupying schedule when room has conflict

### 2. Fixed Student Management Form (Program Name)
**File Modified**:
- ✅ `booking-system/src/AdminDashboard.jsx` - Changed "Campus & Career" → "English Campus & Career"

**What Was Fixed**:
- Dropdown now shows correct program name
- New students will be created with correct program name
- Prevents future program name inconsistency

---

## 🔄 PENDING FIXES (IN ORDER)

### STEP 1: Fix Program Name in Database (READY TO RUN)
**Priority**: 🔥 HIGH - Must run first!

**File**: `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql`

**Why First**: 
- 21 students have wrong program name ("Campus & Career" instead of "English Campus & Career")
- This causes room conflict check to fail
- Affects students like Naswa (EYSA26020225)

**Action**:
1. Open Supabase SQL Editor
2. Run the SQL file step by step
3. Expected result: "UPDATE 21"
4. Verify: No more "Campus & Career" in database

**Time**: 5-10 minutes

**Risk**: ✅ SAFE - Only updates text field, bookings remain intact

**Documentation**: `booking-system/FIX_PROGRAM_NAME_COMPLETE.md`

---

### STEP 2: Check Teacher Assignments in Database (INVESTIGATION)
**Priority**: 🔥 HIGH - Need to identify the issue

**File**: `booking-system/database/CHECK_TEACHER_ASSIGNMENTS.sql`

**Purpose**: Find which schedules don't have teacher_id assigned

**Action**:
1. Open Supabase SQL Editor
2. Run query 1: Count schedules without teacher
   ```sql
   SELECT 
       program,
       COUNT(*) as jadwal_tanpa_teacher,
       SUM(current_students) as total_siswa_terdampak
   FROM schedules
   WHERE teacher_id IS NULL
     AND current_students > 0
   GROUP BY program;
   ```

3. Run query 2: See details of schedules without teacher
4. Run query 3: See available teachers
5. Screenshot results

**Expected Results**:
- **If schedules missing teacher**: Will show which programs/schedules need teacher assigned
- **If no schedules missing teacher**: Problem is elsewhere (need different investigation)

**Time**: 5 minutes

**Documentation**: `booking-system/CHECK_TEACHER_TBA_ISSUE.md`

---

### STEP 3: Assign Teachers to Schedules (DEPENDS ON STEP 2)
**Priority**: 🔥 HIGH - Fix the root cause

**File**: `booking-system/database/FIX_TEACHER_ASSIGNMENTS.sql` (TO BE CREATED)

**Purpose**: Assign correct teacher_id to schedules that are missing it

**Action**:
1. Based on results from STEP 2, identify which teacher should be assigned to which schedule
2. Create UPDATE statements to assign teacher_id
3. Run the SQL file
4. Verify all schedules have teacher_id

**Example**:
```sql
-- Assign Teacher A to all Campus & Career schedules
UPDATE schedules
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Teacher A')
WHERE program = 'English Campus & Career'
  AND teacher_id IS NULL;
```

**Time**: 10-15 minutes (depends on complexity)

**Risk**: ✅ SAFE - Only updates teacher_id field

---

### STEP 4: Deploy Code Changes (FINAL)
**Priority**: 🔥 HIGH - Make fixes live

**Action**:
```bash
cd booking-system
git add .
git commit -m "Fix: Teacher display and program name issues"
git push
```

**Netlify will auto-deploy** (if auto-deploy is configured)

**Time**: 5 minutes

---

### STEP 5: Verify Everything Works (TESTING)
**Priority**: 🔥 HIGH - Confirm fixes work

**Test Cases**:

1. **Test Program Name Fix**:
   - Login as Naswa (EYSA26020225)
   - Open Booking tab
   - Should see many available schedules ✅
   - Book a schedule
   - Should succeed without "Room Occupied" error ✅

2. **Test Teacher Display**:
   - Login as any student
   - Open Booking tab
   - Look at class cards
   - Should see teacher names (not "TBA") ✅
   - Check occupied rooms
   - Should show correct teacher using that room ✅

3. **Test Create New Student**:
   - Login as admin
   - Open Student Management
   - Create new student
   - Dropdown should show "English Campus & Career" ✅
   - Login as new student
   - Test booking
   - Should work correctly ✅

**Time**: 10-15 minutes

---

## 📋 COMPLETE CHECKLIST

### Database Fixes:
- [ ] **STEP 1**: Run `FIX_PROGRAM_NAME_SAFE.sql`
  - [ ] Verify 21 students before update
  - [ ] Run UPDATE (expect "UPDATE 21")
  - [ ] Verify no more "Campus & Career"
  - [ ] Check Naswa's program updated

- [ ] **STEP 2**: Run `CHECK_TEACHER_ASSIGNMENTS.sql`
  - [ ] Count schedules without teacher
  - [ ] See details of affected schedules
  - [ ] List available teachers
  - [ ] Screenshot results

- [ ] **STEP 3**: Create and run `FIX_TEACHER_ASSIGNMENTS.sql`
  - [ ] Identify correct teacher for each schedule
  - [ ] Create UPDATE statements
  - [ ] Run SQL file
  - [ ] Verify all schedules have teacher_id

### Code Deployment:
- [x] Fix `AdminDashboard.jsx` (program name)
- [x] Fix `dbHelpers.js` (teacher query)
- [x] Fix `BookingSystemDB.jsx` (teacher display)
- [ ] Deploy to production
- [ ] Verify deployment successful

### Testing:
- [ ] Test Naswa booking (should work)
- [ ] Test teacher display (should show names)
- [ ] Test occupied rooms (should show correct teacher)
- [ ] Test create new student (dropdown correct)
- [ ] Test new student booking (should work)

---

## 🎯 EXPECTED OUTCOMES

### After STEP 1 (Program Name Fix):
- ✅ 21 students can book schedules
- ✅ No more "Room Occupied" errors for Campus & Career students
- ✅ Naswa can book successfully

### After STEP 2 (Investigation):
- ✅ Know exactly which schedules are missing teacher
- ✅ Know which teachers are available
- ✅ Can create targeted fix

### After STEP 3 (Teacher Assignment):
- ✅ All schedules have teacher assigned
- ✅ No more "TBA" displays
- ✅ Correct teacher shows for occupied rooms

### After STEP 4 (Deployment):
- ✅ All fixes are live in production
- ✅ Users see correct information

### After STEP 5 (Testing):
- ✅ Confirmed everything works
- ✅ No regressions
- ✅ Issue fully resolved

---

## 📊 TIMELINE

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Fix program name in database | 5-10 min | 🔄 Ready |
| 2 | Check teacher assignments | 5 min | 🔄 Ready |
| 3 | Assign teachers to schedules | 10-15 min | ⏳ Waiting |
| 4 | Deploy code changes | 5 min | ⏳ Waiting |
| 5 | Verify and test | 10-15 min | ⏳ Waiting |
| **TOTAL** | | **35-50 min** | |

---

## 🚨 IMPORTANT NOTES

### Must Run in Order:
1. **STEP 1 FIRST** - Program name fix affects room conflict logic
2. **STEP 2 SECOND** - Need to know what's missing before fixing
3. **STEP 3 THIRD** - Fix based on investigation results
4. **STEP 4 FOURTH** - Deploy after database is fixed
5. **STEP 5 LAST** - Test everything together

### Why This Order:
- Program name fix is prerequisite for correct room conflict detection
- Can't fix teacher assignments without knowing what's missing
- Can't deploy code without database being ready
- Can't test properly until everything is deployed

### Safety:
- ✅ All database changes are SAFE
- ✅ Only updating text fields and foreign keys
- ✅ No data deletion
- ✅ Bookings remain intact
- ✅ Can rollback if needed

---

## 📝 RELATED FILES

### Documentation:
- `booking-system/FIX_PROGRAM_NAME_COMPLETE.md` - Program name fix details
- `booking-system/CHECK_TEACHER_TBA_ISSUE.md` - Teacher check guide
- `booking-system/ADMIN_VS_TUTOR_ATTENDANCE_ISSUE_CONTINUED.md` - Technical details
- `booking-system/CARA_FIX_ROOM_OCCUPIED_NASWA.md` - User guide

### Database Scripts:
- `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql` - Ready to run
- `booking-system/database/CHECK_TEACHER_ASSIGNMENTS.sql` - Ready to run
- `booking-system/database/FIX_TEACHER_ASSIGNMENTS.sql` - To be created

### Code Files:
- `booking-system/src/AdminDashboard.jsx` - Fixed ✅
- `booking-system/src/utils/dbHelpers.js` - Fixed ✅
- `booking-system/src/BookingSystemDB.jsx` - Fixed ✅

---

## 🎯 NEXT ACTION

**START WITH STEP 1**: Run `FIX_PROGRAM_NAME_SAFE.sql`

This will:
1. Fix 21 students' program names
2. Allow them to book schedules
3. Fix room conflict detection
4. Prepare for teacher assignment fix

**Then proceed to STEP 2** to investigate teacher assignments.

---

**Created**: April 4, 2026  
**Status**: 🔄 Ready to Execute  
**Priority**: 🔥 HIGH  
**Estimated Time**: 35-50 minutes total
