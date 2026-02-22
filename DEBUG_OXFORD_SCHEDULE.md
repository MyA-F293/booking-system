# Debug Oxford Class Schedule Display Issue

## Problem
Database shows 2 Oxford Class Monday schedules for Week 9:
- Afternoon 16:00-17:30 (10 students) - id: cbeb97e5
- Evening 19:00-20:30 (10 students) - id: 94621f0f

But Admin Booking Dashboard only shows Evening schedule.

## Investigation Steps

### Step 1: Verify Database Data
Run this query in Supabase:
```sql
-- Check all Oxford Class Monday schedules for Week 9
SELECT 
    id,
    class_id,
    day,
    time_slot,
    phase,
    week_number,
    year,
    program,
    current_students,
    created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'monday'
    AND s.week_number = 9
    AND s.year = 2026
ORDER BY time_slot;
```

Expected: 2 rows (afternoon and evening)

### Step 2: Check Browser Console
1. Open Admin Booking Dashboard
2. Open browser console (F12)
3. Click "Next Week" tab to load Week 9 schedules
4. Look for these debug messages:

```
🔍 RAW SCHEDULES FROM DB: [number]
🎓 Oxford Class Monday schedules: [array with both schedules]
🔑 Oxford Monday unique key: [key for afternoon]
🔑 Oxford Monday unique key: [key for evening]
✅ FINAL Oxford Class Monday schedules: [array with both schedules]
👁️ Oxford Class Monday after hideEmpty filter: [array]
🔍 Oxford Class Monday after day filter: [array]
```

### Step 3: Analyze Debug Output

#### If RAW SCHEDULES shows only 1 Oxford Monday:
- Problem is in `getSchedules()` function in `dbHelpers.js`
- Database query is not returning both schedules

#### If RAW SCHEDULES shows 2 but FINAL shows 1:
- Problem is in deduplication logic
- Check if both schedules have different `time_slot` values
- Unique key should be different: `class_id-monday-afternoon-phase1-9` vs `class_id-monday-evening-phase1-9`

#### If FINAL shows 2 but after hideEmpty filter shows 1:
- One schedule has `current_students = 0`
- Check database: both should have 10 students

#### If all filters show 2 but UI shows 1:
- Problem is in rendering logic
- Check if view mode is "grouped" or "list"
- Check if class is expanded in grouped view

### Step 4: Common Issues

1. **Time Slot Mismatch**
   - Check if both schedules have correct time_slot: "afternoon" and "evening"
   - Not "Afternoon" or "AFTERNOON" (case sensitive)

2. **Phase Mismatch**
   - Both should be "phase1" (not "Phase1" or "PHASE1")

3. **Week Number Mismatch**
   - Both should be week 9 (integer, not string)

4. **Duplicate Detection False Positive**
   - If unique keys are identical, one will be filtered out
   - Check console for "🔍 Duplicate schedule found and removed"

### Step 5: Manual Verification

Run this query to see the exact unique keys:
```sql
SELECT 
    id,
    c.name as class_name,
    s.class_id || '-' || s.day || '-' || s.time_slot || '-' || s.phase || '-' || s.week_number as unique_key,
    day,
    time_slot,
    phase,
    week_number,
    current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'monday'
    AND s.week_number = 9
    AND s.year = 2026
ORDER BY time_slot;
```

The unique_key column should show 2 DIFFERENT values.

## Solution

Once you identify the issue from the debug output, we can fix it:

1. **If database has wrong data**: Update the schedule records
2. **If deduplication is wrong**: Fix the unique key logic
3. **If filtering is wrong**: Adjust the filter conditions
4. **If rendering is wrong**: Fix the UI display logic

## Next Steps

1. Run the SQL query in Step 1
2. Open browser console and check debug messages
3. Report back what you see in the console
4. We'll fix the specific issue based on the debug output
