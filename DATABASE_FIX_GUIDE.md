# Database Fix Guide - Duplicate Schedules & Over-Capacity

## Problem Summary
1. **24 duplicate schedules** for Oxford Class Saturday Phase2
2. **Over-capacity**: Schedule showing 11/10 students
3. **Data loss**: Students and teacher assignments disappearing after being added
4. **Root cause**: No database constraints preventing duplicates or over-capacity

## Solution Overview
This guide provides SQL queries to:
- Remove duplicate schedules (keep the best one)
- Remove duplicate bookings
- Recalculate student counts
- Add database constraints
- Add automatic triggers for capacity checks

## Step-by-Step Instructions

### STEP 1: Backup Your Database
**CRITICAL**: Before running any queries, backup your database!

In Supabase Dashboard:
1. Go to Database → Backups
2. Create a manual backup
3. Wait for confirmation

### STEP 2: Check Current Issues

Run this query to see duplicate schedules:

```sql
SELECT 
    c.name as class_name,
    s.day,
    s.phase,
    s.time_slot,
    s.week_number,
    s.year,
    COALESCE(s.batch, '') as batch,
    COUNT(*) as duplicate_count,
    STRING_AGG(s.id::text, ', ') as schedule_ids
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.day, s.phase, s.time_slot, s.week_number, s.year, COALESCE(s.batch, '')
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**Expected Output**: Should show Oxford Class with 24 duplicates

### STEP 3: Remove Duplicate Schedules

This query keeps the best schedule (with teacher assigned, most students, or oldest):

```sql
WITH ranked_schedules AS (
    SELECT 
        id,
        class_id,
        day,
        phase,
        time_slot,
        week_number,
        year,
        COALESCE(batch, '') as batch_key,
        ROW_NUMBER() OVER (
            PARTITION BY class_id, day, phase, time_slot, week_number, year, COALESCE(batch, '')
            ORDER BY 
                CASE WHEN teacher_id IS NOT NULL THEN 0 ELSE 1 END,
                current_students DESC,
                created_at ASC
        ) as rn
    FROM schedules
),
schedules_to_delete AS (
    SELECT id 
    FROM ranked_schedules 
    WHERE rn > 1
)
DELETE FROM schedules
WHERE id IN (SELECT id FROM schedules_to_delete);
```

**Expected Output**: `DELETE X` (where X is number of duplicates removed)

### STEP 4: Remove Duplicate Bookings

```sql
WITH ranked_bookings AS (
    SELECT 
        id,
        schedule_id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY schedule_id, user_id
            ORDER BY created_at ASC
        ) as rn
    FROM bookings
    WHERE status = 'confirmed'
),
bookings_to_delete AS (
    SELECT id 
    FROM ranked_bookings 
    WHERE rn > 1
)
DELETE FROM bookings
WHERE id IN (SELECT id FROM bookings_to_delete);
```

**Expected Output**: `DELETE X` (number of duplicate bookings removed)

### STEP 5: Recalculate Student Counts

```sql
UPDATE schedules s
SET current_students = COALESCE(
    (
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.schedule_id = s.id
        AND b.status = 'confirmed'
    ),
    0
);
```

**Expected Output**: `UPDATE X` (number of schedules updated)

### STEP 6: Add Unique Constraints

Prevent future duplicates:

```sql
-- For schedules
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS unique_schedule_combination;

ALTER TABLE schedules
ADD CONSTRAINT unique_schedule_combination 
UNIQUE (class_id, day, phase, time_slot, week_number, year, batch);

-- For bookings
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS unique_booking_per_student;

ALTER TABLE bookings
ADD CONSTRAINT unique_booking_per_student
UNIQUE (schedule_id, user_id);
```

**Expected Output**: `ALTER TABLE` (twice)

### STEP 7: Add Capacity Check Trigger

Prevent over-capacity (max 10 students):

```sql
-- Drop existing if any
DROP TRIGGER IF EXISTS check_schedule_capacity ON bookings;
DROP FUNCTION IF EXISTS check_schedule_capacity();

-- Create function
CREATE OR REPLACE FUNCTION check_schedule_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity INTEGER := 10;
BEGIN
    SELECT current_students INTO current_count
    FROM schedules
    WHERE id = NEW.schedule_id;

    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Schedule is at full capacity (% students)', max_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER check_schedule_capacity
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION check_schedule_capacity();
```

**Expected Output**: `CREATE TRIGGER`

### STEP 8: Add Auto-Update Trigger

Automatically update `current_students` when bookings change:

```sql
-- Drop existing if any
DROP TRIGGER IF EXISTS update_schedule_count_on_insert ON bookings;
DROP TRIGGER IF EXISTS update_schedule_count_on_delete ON bookings;
DROP TRIGGER IF EXISTS update_schedule_count_on_update ON bookings;
DROP FUNCTION IF EXISTS update_schedule_student_count();

-- Create function
CREATE OR REPLACE FUNCTION update_schedule_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE schedules
        SET current_students = current_students + 1
        WHERE id = NEW.schedule_id;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE schedules
        SET current_students = GREATEST(current_students - 1, 0)
        WHERE id = OLD.schedule_id;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE schedules
            SET current_students = GREATEST(current_students - 1, 0)
            WHERE id = OLD.schedule_id;
        END IF;
        
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE schedules
            SET current_students = current_students + 1
            WHERE id = NEW.schedule_id;
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_schedule_count_on_insert
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();

CREATE TRIGGER update_schedule_count_on_delete
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();

CREATE TRIGGER update_schedule_count_on_update
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_schedule_student_count();
```

**Expected Output**: `CREATE TRIGGER` (three times)

### STEP 9: Verify Everything is Fixed

Check for remaining duplicates (should return 0 rows):

```sql
SELECT 
    c.name as class_name,
    s.day,
    s.phase,
    s.time_slot,
    COUNT(*) as duplicate_count
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.day, s.phase, s.time_slot, s.week_number, s.year, COALESCE(s.batch, '')
HAVING COUNT(*) > 1;
```

Check for over-capacity (should return 0 rows):

```sql
SELECT 
    s.id,
    c.name as class_name,
    s.day,
    s.phase,
    s.time_slot,
    s.current_students,
    COUNT(b.id) as actual_bookings
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON b.schedule_id = s.id AND b.status = 'confirmed'
GROUP BY s.id, c.name, s.day, s.phase, s.time_slot, s.current_students
HAVING s.current_students > 10 OR s.current_students != COUNT(b.id);
```

Summary report:

```sql
SELECT 
    'Total Schedules' as metric,
    COUNT(*) as count
FROM schedules
UNION ALL
SELECT 
    'Total Bookings',
    COUNT(*)
FROM bookings
WHERE status = 'confirmed'
UNION ALL
SELECT 
    'Schedules at Capacity',
    COUNT(*)
FROM schedules
WHERE current_students >= 10
UNION ALL
SELECT 
    'Schedules with Students',
    COUNT(*)
FROM schedules
WHERE current_students > 0;
```

## Frontend Improvements Needed

After fixing the database, update the frontend to prevent double-submissions:

### 1. Add Loading States
In `AdminBookingDashboard.jsx`, add disabled state to buttons during operations:

```jsx
<button
    onClick={handleAddStudent}
    disabled={loading}
    className="..."
>
    {loading ? 'Adding...' : 'Add Student'}
</button>
```

### 2. Add Debouncing
Prevent rapid clicks:

```jsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleAddStudent = async (studentId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
        // ... existing code
    } finally {
        setIsSubmitting(false);
    }
};
```

## Testing After Fix

1. **Test adding students**: Try adding students to a class, verify count updates correctly
2. **Test capacity limit**: Try adding 11th student, should show error
3. **Test duplicate prevention**: Try adding same student twice, should show error
4. **Test teacher assignment**: Assign teacher, verify it persists after refresh
5. **Test schedule creation**: Create new schedule, verify no duplicates created

## Troubleshooting

### If data still disappears:
1. Check browser console for errors
2. Check Supabase logs for trigger errors
3. Verify RLS policies allow the operations
4. Check if frontend is creating multiple schedules

### If capacity check doesn't work:
1. Verify trigger was created: `SELECT * FROM pg_trigger WHERE tgname = 'check_schedule_capacity';`
2. Check trigger is enabled
3. Test manually: Try inserting booking when schedule is full

### If counts are wrong:
1. Re-run Step 5 (recalculate counts)
2. Check if triggers are working
3. Verify no orphaned bookings exist

## Success Criteria

✅ No duplicate schedules exist
✅ All `current_students` counts match actual bookings
✅ Cannot add more than 10 students to a schedule
✅ Cannot add same student twice to same schedule
✅ Student counts update automatically
✅ Data persists after refresh

## Need Help?

If issues persist:
1. Export the problematic schedule data
2. Check Supabase logs for errors
3. Verify all triggers are active
4. Test with a fresh schedule to isolate the issue
