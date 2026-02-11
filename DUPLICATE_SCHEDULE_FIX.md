# 🔧 Fix Duplicate Schedules in Database

## Problem
Multiple duplicate schedule cards appearing in Admin Booking Dashboard (e.g., Tokyo Class appearing 9+ times with identical information).

## Root Cause
Database contains duplicate rows in the `schedules` table with the same:
- class_id
- day
- time_slot
- phase
- week_number
- year

## Solution

### Step 1: Clean Existing Duplicates

Run the SQL script to remove duplicates from database:

```bash
# Open Supabase SQL Editor
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# Copy and paste the contents of: database/remove_duplicate_schedules.sql
# Run each section step by step
```

**What the script does:**
1. **Find duplicates** - Shows how many duplicates exist
2. **Delete duplicates** - Keeps only the oldest record (lowest ID), deletes the rest
3. **Verify** - Confirms all duplicates are removed
4. **Add constraint** - Prevents future duplicates with UNIQUE constraint

### Step 2: Verify in Application

After running the SQL script:

1. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear cache** if needed
3. **Check Admin Booking Dashboard** - Each class should appear only once

### Step 3: Prevention

The SQL script adds a UNIQUE constraint:

```sql
ALTER TABLE schedules
ADD CONSTRAINT unique_schedule_slot 
UNIQUE (class_id, day, time_slot, phase, week_number, year);
```

This ensures:
- ✅ No duplicate schedules can be created in the future
- ✅ Database will reject any INSERT that creates a duplicate
- ✅ Application will show error if trying to create duplicate

### Step 4: Application-Level Deduplication (Already Implemented)

As a backup, the application also filters duplicates in:

**AdminBookingDashboard.jsx:**
```javascript
const loadAllSchedules = async () => {
    const filters = { week_number: displayWeek, year: currentYear };
    const data = await getSchedules(filters);
    
    // DEDUPLICATION: Remove duplicates
    const uniqueSchedules = [];
    const seenKeys = new Set();

    data.forEach(schedule => {
        const uniqueKey = `${schedule.class_id}-${schedule.day}-${schedule.time_slot}-${schedule.phase}-${schedule.week_number}`;
        if (!seenKeys.has(uniqueKey)) {
            seenKeys.add(uniqueKey);
            uniqueSchedules.push(schedule);
        }
    });

    setSchedules(uniqueSchedules);
};
```

**AdminAttendanceManager.jsx:**
```javascript
// Same deduplication logic applied in applyFilters()
```

## Expected Result

After completing all steps:
- ✅ Each schedule appears only ONCE in Admin Booking Dashboard
- ✅ No duplicate cards
- ✅ Database is clean
- ✅ Future duplicates are prevented

## Troubleshooting

### If duplicates still appear after SQL script:

1. **Check if script ran successfully:**
   ```sql
   -- Should return 0 rows
   SELECT class_id, day, time_slot, phase, week_number, year, COUNT(*) as count
   FROM schedules
   GROUP BY class_id, day, time_slot, phase, week_number, year
   HAVING COUNT(*) > 1;
   ```

2. **Check if constraint was added:**
   ```sql
   -- Should show unique_schedule_slot constraint
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'schedules';
   ```

3. **Hard refresh browser** (Ctrl+Shift+R)

4. **Check browser console** for deduplication logs:
   ```
   🔍 Duplicate schedule found and removed: Tokyo Class wednesday afternoon
   📊 Loaded 27 schedules, removed 18 duplicates, showing 9 unique schedules
   ```

### If constraint fails to add:

This means duplicates still exist. Run Step 2 (DELETE) again.

## How Duplicates Were Created

Possible causes:
1. Manual database inserts without checking for existing records
2. Application bug that created multiple schedules
3. Race condition when multiple users/processes created schedules simultaneously
4. Import script that didn't check for duplicates

## Prevention Going Forward

1. ✅ **Database constraint** - Prevents duplicates at DB level
2. ✅ **Application deduplication** - Filters duplicates in UI
3. ✅ **Proper error handling** - Shows error if duplicate creation attempted
4. 🔄 **Regular monitoring** - Check for duplicates periodically

## Related Files

- `database/remove_duplicate_schedules.sql` - SQL script to clean duplicates
- `src/components/AdminBookingDashboard.jsx` - UI deduplication
- `src/components/AdminAttendanceManager.jsx` - UI deduplication
- `src/utils/dbHelpers.js` - Database query functions

---

**Last Updated:** February 11, 2025  
**Status:** ✅ Fixed - SQL script ready, application deduplication implemented
