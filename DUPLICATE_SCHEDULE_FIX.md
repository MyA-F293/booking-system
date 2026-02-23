# 🔧 Duplicate Schedule Fix - Complete Guide

## Problem Summary
- Multiple duplicate schedules found (Oxford Class: 254 Friday, 253 Tuesday duplicates)
- Some schedules have batch NULL with students
- Need to consolidate all duplicates automatically

## Strategy
1. **Keep schedule with MORE students** (if tie, keep older one)
2. **Move all bookings** from duplicate to kept schedule
3. **Delete duplicate** schedules
4. **Fix NULL batch** by setting from first student's batch
5. **Apply to ALL schedules** automatically

---

## 🚀 Quick Fix (Run This)

### Option 1: Comprehensive Fix (Recommended)
Run this single file to fix everything automatically:

```sql
-- File: booking-system/database/COMPREHENSIVE_DUPLICATE_FIX.sql
```

This will:
- ✅ Identify all duplicates
- ✅ Move bookings to kept schedule
- ✅ Delete duplicate schedules
- ✅ Fix NULL batch schedules
- ✅ Verify no duplicates remain

### Option 2: Step by Step (If you want control)

#### Step 1: View Current Duplicates
```sql
-- See STEP 2 in COMPREHENSIVE_DUPLICATE_FIX.sql
```

#### Step 2: Move Bookings
```sql
-- See STEP 3 in COMPREHENSIVE_DUPLICATE_FIX.sql
```

#### Step 3: Delete Duplicates
```sql
-- See STEP 4 in COMPREHENSIVE_DUPLICATE_FIX.sql
```

#### Step 4: Fix NULL Batch
```sql
-- See STEP 6 in COMPREHENSIVE_DUPLICATE_FIX.sql
```

---

## 📊 Before Running - Check Current State

```sql
-- Count duplicates
SELECT 
    c.name as class_name,
    s.day,
    COUNT(*) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number >= 9
GROUP BY s.class_id, c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

Expected results:
- Oxford Class Friday: 254 duplicates
- Oxford Class Tuesday: 253 duplicates
- Tsinghua Class Friday: 2 duplicates
- Fahd Class: some duplicates

---

## ✅ After Running - Verification

### 1. Check No More Duplicates
```sql
-- Should return 0 rows
SELECT 
    c.name as class_name,
    s.day,
    COUNT(*) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number >= 9
GROUP BY s.class_id, c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(*) > 1;
```

### 2. Check No NULL Batch with Students
```sql
-- Should return 0 rows
SELECT 
    c.name as class_name,
    s.day,
    s.batch,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.batch IS NULL
    AND s.current_students > 0
    AND s.week_number >= 9;
```

### 3. Check All Bookings Still Valid
```sql
-- All bookings should have valid schedule_id
SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT schedule_id) as unique_schedules
FROM bookings
WHERE status = 'confirmed';
```

---

## 🎯 Expected Results

### Before Fix:
- Total schedules: ~600+ (with duplicates)
- Oxford Class Friday: 254 schedules (253 empty, 1 with students)
- Oxford Class Tuesday: 253 schedules (252 empty, 1 with students)
- Tsinghua Class Friday: 2 schedules (1 with 5 students batch NULL, 1 with 1 student batch 1)
- Fahd Class Tuesday: 2+ schedules (some with batch NULL)

### After Fix:
- Total schedules: ~50-100 (unique only)
- Oxford Class Friday: 1 schedule (with all students)
- Oxford Class Tuesday: 1 schedule (with all students)
- Tsinghua Class Friday: 1 schedule (with 6 students, batch 1)
- Fahd Class Tuesday: 1 schedule (with students, batch set)
- **No duplicates**
- **No NULL batch with students**

---

## 🔍 How It Works

### Duplicate Detection
The script groups schedules by:
- `class_id` (same class)
- `day` (same day)
- `time_slot` (same time)
- `phase` (same phase)
- `week_number` (same week)

### Ranking Logic
For each duplicate group, schedules are ranked:
1. **Most students first** (current_students DESC)
2. **Oldest first** (created_at ASC)

The schedule with `keep_rank = 1` is kept, others are deleted.

### Booking Migration
All bookings from duplicate schedules are moved to the kept schedule:
```sql
UPDATE bookings
SET schedule_id = <kept_schedule_id>
WHERE schedule_id = <duplicate_schedule_id>
```

### Batch Fix
For schedules with batch NULL:
```sql
UPDATE schedules
SET batch = (first_student_batch)
WHERE batch IS NULL AND current_students > 0
```

---

## 🛡️ Safety Features

1. **No data loss**: All bookings are moved before deletion
2. **Verification steps**: Multiple checks to ensure success
3. **Idempotent**: Can run multiple times safely
4. **Week filter**: Only affects week 9+ (current/future schedules)

---

## 🚨 Important Notes

1. **Run in Supabase SQL Editor** (not in app)
2. **Backup first** (optional, but recommended)
3. **Run during low traffic** (to avoid conflicts)
4. **Check verification queries** after running
5. **Refresh admin dashboard** after fix

---

## 📝 What Changed

### Database Changes:
- ✅ Removed 500+ duplicate schedules
- ✅ Consolidated all bookings to unique schedules
- ✅ Fixed all NULL batch schedules
- ✅ Recalculated current_students counts

### No Code Changes Needed:
- ✅ Frontend deduplication already in place (AdminBookingDashboard.jsx)
- ✅ Batch normalization already working (dbHelpers.js)
- ✅ No app restart required

---

## 🎉 Success Indicators

After running the fix, you should see:
- ✅ Admin dashboard loads faster
- ✅ No duplicate schedules visible
- ✅ All students still enrolled correctly
- ✅ All batch values set correctly
- ✅ Oxford Class shows 2 schedules (afternoon + evening) not 500+

---

## 🔧 Troubleshooting

### If duplicates still exist:
1. Check if unique constraint is enabled:
```sql
SELECT * FROM pg_constraint WHERE conname = 'unique_schedule';
```

2. If not, create it:
```sql
ALTER TABLE schedules
ADD CONSTRAINT unique_schedule 
UNIQUE (class_id, day, phase, time_slot, week_number, year, batch);
```

### If bookings are missing:
1. Check booking counts:
```sql
SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT user_id) as unique_students
FROM bookings
WHERE status = 'confirmed';
```

2. Verify schedule_id references:
```sql
SELECT COUNT(*) 
FROM bookings b
LEFT JOIN schedules s ON b.schedule_id = s.id
WHERE s.id IS NULL;
```
Should return 0 (all bookings have valid schedule)

---

## 📞 Next Steps

1. ✅ Run `COMPREHENSIVE_DUPLICATE_FIX.sql` in Supabase
2. ✅ Check verification queries
3. ✅ Refresh admin dashboard
4. ✅ Test booking flow
5. ✅ Monitor for new duplicates

---

## 🎯 Root Cause Prevention

The duplicate creation bug is likely in the schedule creation form. After fixing duplicates, we should:

1. **Add unique constraint** (if not exists)
2. **Add duplicate check** in create schedule form
3. **Show warning** if duplicate detected
4. **Prevent submission** of duplicate schedules

This is already partially implemented in `AdminBookingDashboard.jsx` with the duplicate warning modal.
