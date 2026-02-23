# 🛡️ Install Database Protection - Step by Step

## Prerequisites

Before installing database protection, you MUST:
1. ✅ Fix overcapacity issue (or accept current state)
2. ✅ Clean all duplicate schedules
3. ✅ Verify no duplicates remain

## Step-by-Step Installation

### Step 1: Check for Remaining Duplicates

Run this query in Supabase SQL Editor:

```sql
-- File: database/CHECK_REMAINING_DUPLICATES.sql
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(*) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY s.class_id, c.name, s.day, s.time_slot, s.phase, s.week_number, s.year
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**Expected Result:** 0 rows (no duplicates)

**If you see duplicates:**
- Run `database/COMPREHENSIVE_DUPLICATE_FIX.sql` first
- Then come back to this step

---

### Step 2: Backup Current State (Optional but Recommended)

```sql
-- Create backup of schedules table
CREATE TABLE schedules_backup_before_protection AS
SELECT * FROM schedules;

-- Verify backup
SELECT COUNT(*) FROM schedules_backup_before_protection;
```

---

### Step 3: Install Database Protection

Run the entire file in Supabase SQL Editor:

**File:** `database/PREVENT_DUPLICATE_SCHEDULES.sql`

This will install:
1. ✅ Unique constraint on (class_id, day, time_slot, phase, week_number, year)
2. ✅ Trigger to prevent duplicate inserts
3. ✅ Trigger to auto-set batch from first student
4. ✅ Performance index

**Expected Output:**
```
NOTICE: Dropped old unique_schedule_combination constraint (if exists)
NOTICE: Auto-set schedule batch to X from first student (when booking happens)

Protection Type    | Name                              | Status
-------------------|-----------------------------------|--------
Unique Constraint  | unique_schedule_no_batch          | ACTIVE
Trigger            | trigger_prevent_duplicate_schedule| ACTIVE
Trigger            | trigger_auto_set_schedule_batch   | ACTIVE
Index              | idx_schedules_unique_combo        | ACTIVE
```

---

### Step 4: Verify Protection is Active

Run verification queries:

```sql
-- Check unique constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
    AND conname = 'unique_schedule_no_batch';

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%schedule%'
ORDER BY trigger_name;

-- Check index
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'schedules'
    AND indexname = 'idx_schedules_unique_combo';
```

**Expected:** All 3 protections should be listed

---

### Step 5: Test Protection (Optional)

Try to create a duplicate schedule manually:

```sql
-- Get a test class
SELECT id, name FROM classes LIMIT 1;

-- Create first schedule (should succeed)
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, current_students)
VALUES (
    '<class_id_from_above>',
    'monday',
    'afternoon',
    'phase1',
    99,
    2026,
    'English for Teens',
    'Intermediate',
    0
);

-- Try to create duplicate (should FAIL with error)
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, current_students)
VALUES (
    '<same_class_id>',
    'monday',
    'afternoon',
    'phase1',
    99,
    2026,
    'English for Teens',
    'Intermediate',
    0
);

-- Expected error:
-- ERROR: Duplicate schedule detected! Schedule for this class/day/time/phase/week already exists.
-- HINT: Please refresh the page and check existing schedules.

-- Clean up test
DELETE FROM schedules WHERE week_number = 99;
```

---

### Step 6: Test Auto-Set Batch (Optional)

Test that batch is auto-set when first student books:

```sql
-- Create schedule with NULL batch
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, current_students, batch)
SELECT id, 'tuesday', 'evening', 'phase1', 99, 2026, 'English for Teens', 'Intermediate', 0, NULL
FROM classes LIMIT 1
RETURNING id;

-- Get a test student
SELECT id, full_name, batch FROM users WHERE batch IS NOT NULL LIMIT 1;

-- Create booking (batch should auto-set)
INSERT INTO bookings (user_id, schedule_id, status)
VALUES (
    '<student_id_from_above>',
    '<schedule_id_from_above>',
    'confirmed'
);

-- Check if batch was auto-set
SELECT id, batch, current_students FROM schedules WHERE week_number = 99;

-- Expected: batch should be set to student's batch number (e.g., "1", "2", "3")

-- Clean up test
DELETE FROM bookings WHERE schedule_id IN (SELECT id FROM schedules WHERE week_number = 99);
DELETE FROM schedules WHERE week_number = 99;
```

---

## What Each Protection Does

### 1. Unique Constraint
```sql
UNIQUE (class_id, day, time_slot, phase, week_number, year)
```
- **Purpose:** Database-level enforcement
- **Effect:** Prevents duplicate schedules at database level
- **Error:** Returns error code 23505 if duplicate attempted

### 2. Trigger: Prevent Duplicates
```sql
trigger_prevent_duplicate_schedule (BEFORE INSERT OR UPDATE)
```
- **Purpose:** Extra validation before insert/update
- **Effect:** Checks for duplicates and raises exception
- **Error:** Custom error message with hint

### 3. Trigger: Auto-Set Batch
```sql
trigger_auto_set_schedule_batch (AFTER INSERT on bookings)
```
- **Purpose:** Automatically set schedule batch from first student
- **Effect:** When first student books, schedule batch = student batch
- **Benefit:** No need to manually set batch when creating schedule

### 4. Performance Index
```sql
idx_schedules_unique_combo
```
- **Purpose:** Speed up duplicate checks
- **Effect:** Makes queries faster
- **Benefit:** Better performance for large datasets

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to install protection while duplicates exist

**Solution:**
1. Run `database/CHECK_REMAINING_DUPLICATES.sql`
2. Run `database/COMPREHENSIVE_DUPLICATE_FIX.sql`
3. Try installing protection again

### Error: "constraint already exists"

**Cause:** Protection already installed

**Solution:**
- Check verification queries (Step 4)
- If protection is active, you're done!
- If not, drop old constraint and reinstall

### Trigger Not Working

**Check trigger is enabled:**
```sql
SELECT 
    trigger_name,
    status
FROM information_schema.triggers
WHERE trigger_name LIKE '%schedule%';
```

**Re-create trigger:**
```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_schedule ON schedules;
-- Then run the CREATE TRIGGER command from PREVENT_DUPLICATE_SCHEDULES.sql
```

---

## Rollback (If Needed)

If you need to remove the protection:

```sql
-- Remove unique constraint
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS unique_schedule_no_batch;

-- Remove triggers
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_schedule ON schedules;
DROP TRIGGER IF EXISTS trigger_auto_set_schedule_batch ON bookings;

-- Remove functions
DROP FUNCTION IF EXISTS prevent_duplicate_schedule();
DROP FUNCTION IF EXISTS auto_set_schedule_batch();

-- Remove index
DROP INDEX IF EXISTS idx_schedules_unique_combo;

-- Restore from backup (if created)
-- TRUNCATE schedules;
-- INSERT INTO schedules SELECT * FROM schedules_backup_before_protection;
```

---

## Summary

After installation, you will have:
- ✅ 4 layers of database protection
- ✅ 1 layer of frontend protection (already installed)
- ✅ Total: 5 layers of duplicate prevention
- ✅ Auto-set batch from first student
- ✅ Fast performance with index

**Result:** No more duplicate schedules possible! 🎉

---

## Next Steps After Installation

1. ✅ Test create schedule in admin dashboard
2. ✅ Try double-clicking create button (should be prevented)
3. ✅ Create schedule without batch (should auto-set when student books)
4. ✅ Monitor for any errors
5. ✅ Commit frontend changes
6. ✅ Deploy to production

---

## Status Checklist

- [ ] Checked for remaining duplicates
- [ ] Created backup (optional)
- [ ] Installed database protection
- [ ] Verified protection is active
- [ ] Tested duplicate prevention
- [ ] Tested auto-set batch
- [ ] Documented installation
- [ ] Ready for production

**Installation Time:** ~5 minutes
**Difficulty:** Easy (just copy-paste SQL)
**Risk:** Low (can be rolled back)
