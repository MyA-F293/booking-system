# 🔧 Copy Week Fix - Deployment Guide

## 📋 Summary

**Problem**: 345 students (34.5%) mengalami perubahan CLASS setelah copy week  
**Root Cause**: RPC function `copy_week_schedules` tidak preserve `class_id` dengan benar  
**Solution**: Rebuild RPC dengan `class_id` sebagai PRIMARY matching key  

---

## 🎯 What Changed

### Old Function (BUGGY)
```sql
-- Matching by class_name, day, time
-- ❌ Bisa salah mapping jika ada 2 class dengan day/time sama
SELECT id FROM schedules
WHERE class_name = source.class_name
  AND day = source.day
  AND time = source.time
```

### New Function (FIXED)
```sql
-- Matching by class_id (PRIMARY) + validation
-- ✅ Guarantee siswa tetap di class yang sama
SELECT id FROM schedules
WHERE class_id = source.class_id  -- PRIMARY KEY
  AND day = source.day            -- VALIDATION
  AND time = source.time          -- VALIDATION
```

---

## 📁 Files Created

1. **`database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`**
   - New RPC function dengan class_id preservation
   - Includes verification query
   - Ready to deploy

2. **`database/TEST_COPY_WEEK_FIX.sql`**
   - Comprehensive testing script
   - 11 steps untuk verify fix
   - Includes rollback procedure

3. **`COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`** (this file)
   - Deployment instructions
   - Testing checklist
   - Troubleshooting guide

---

## 🚀 Deployment Steps

### Step 1: Backup Production Data
```sql
-- Backup schedules dan bookings
CREATE TABLE schedules_backup_production AS 
SELECT * FROM schedules;

CREATE TABLE bookings_backup_production AS 
SELECT * FROM bookings;
```

### Step 2: Install New Function
1. Open Supabase SQL Editor
2. Copy paste isi file `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
3. Execute
4. Verify function installed:
```sql
SELECT proname, pg_get_function_arguments(oid)
FROM pg_proc
WHERE proname = 'copy_week_schedules';
```

### Step 3: Test in Staging (RECOMMENDED)
1. Open `database/TEST_COPY_WEEK_FIX.sql`
2. Follow steps 1-10
3. Verify all tests pass (100% class preservation)
4. If failed, rollback using step 11

### Step 4: Update Frontend (if needed)
Check if frontend code calls the function:
```javascript
// Old call (should still work)
const { data } = await supabase.rpc('copy_week_schedules', {
  source_week_param: 1,
  target_week_param: 2
});

// Function signature unchanged, no frontend changes needed
```

### Step 5: Deploy to Production
1. Install function in production database
2. Monitor first copy operation
3. Run verification query immediately after

---

## ✅ Testing Checklist

### Pre-Deployment Tests
- [ ] Backup data created
- [ ] New function installed successfully
- [ ] Function signature verified
- [ ] Permissions granted (authenticated, service_role)

### Post-Deployment Tests
- [ ] Run copy operation: `SELECT copy_week_schedules(1, 2);`
- [ ] Check return value: `success: true`
- [ ] Verify schedules copied: count matches source
- [ ] Verify bookings copied: count matches source
- [ ] **CRITICAL**: Run class preservation test (0 students changed class)
- [ ] Verify current_students counter accurate
- [ ] Test specific students (Nilna, Talitha, etc)

### Success Criteria
```
✅ preservation_rate = 100.00%
✅ class_changed = 0
✅ All students status = "✅ CORRECT - Class preserved"
✅ Verdict = "✅ SUCCESS - 100% class preserved!"
```

---

## 🔍 Verification Query

Run this after every copy operation:

```sql
WITH source_data AS (
  SELECT 
    s.class_id,
    s.class_name,
    b.user_id,
    b.student_name
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 1  -- source week
),
target_data AS (
  SELECT 
    s.class_id,
    s.class_name,
    b.user_id,
    b.student_name
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 2  -- target week
)
SELECT 
  COUNT(*) as total_students,
  SUM(CASE WHEN sd.class_id = td.class_id THEN 1 ELSE 0 END) as class_preserved,
  SUM(CASE WHEN sd.class_id != td.class_id THEN 1 ELSE 0 END) as class_changed,
  CASE 
    WHEN SUM(CASE WHEN sd.class_id != td.class_id THEN 1 ELSE 0 END) = 0 
    THEN '✅ SUCCESS'
    ELSE '❌ FAILED'
  END as verdict
FROM source_data sd
JOIN target_data td ON sd.user_id = td.user_id;
```

Expected result:
```
total_students | class_preserved | class_changed | verdict
---------------|-----------------|---------------|----------
999            | 999             | 0             | ✅ SUCCESS
```

---

## 🐛 Troubleshooting

### Issue 1: Function Not Found
**Symptom**: `function copy_week_schedules(integer, integer) does not exist`

**Solution**:
```sql
-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'copy_week_schedules';

-- If not found, reinstall from FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql
```

### Issue 2: Permission Denied
**Symptom**: `permission denied for function copy_week_schedules`

**Solution**:
```sql
-- Grant permissions
GRANT EXECUTE ON FUNCTION copy_week_schedules(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION copy_week_schedules(integer, integer) TO service_role;
```

### Issue 3: Target Week Already Has Schedules
**Symptom**: `Target week 2 already has schedules`

**Solution**:
```sql
-- Delete target week schedules first
DELETE FROM bookings 
WHERE schedule_id IN (SELECT id FROM schedules WHERE week = 2);

DELETE FROM schedules WHERE week = 2;

-- Then retry copy
SELECT copy_week_schedules(1, 2);
```

### Issue 4: Some Students Still Changed Class
**Symptom**: `class_changed > 0` in verification query

**Possible Causes**:
1. Old function still cached - restart Supabase connection
2. Multiple schedules with same class_id but different day/time
3. Data inconsistency in source week

**Investigation**:
```sql
-- Check for duplicate class_ids with different schedules
SELECT 
  class_id,
  COUNT(*) as schedule_count,
  STRING_AGG(day || ' ' || time, ', ') as schedules
FROM schedules
WHERE week = 1
GROUP BY class_id
HAVING COUNT(*) > 1;
```

---

## 🔄 Rollback Procedure

If deployment fails:

```sql
-- 1. Delete failed copy
DELETE FROM bookings 
WHERE schedule_id IN (SELECT id FROM schedules WHERE week = 2);
DELETE FROM schedules WHERE week = 2;

-- 2. Restore from backup (if needed)
INSERT INTO schedules 
SELECT * FROM schedules_backup_production WHERE week = 2;

INSERT INTO bookings 
SELECT b.* FROM bookings_backup_production b
JOIN schedules s ON b.schedule_id = s.id
WHERE s.week = 2;

-- 3. Drop old function
DROP FUNCTION IF EXISTS copy_week_schedules(integer, integer);

-- 4. Reinstall old function (if needed)
-- Use CREATE_RPC_COPY_WEEK_OPTIMIZED.sql
```

---

## 📊 Monitoring

After deployment, monitor these metrics:

1. **Copy Success Rate**
   - Track `success: true` in function return
   - Alert if `success: false`

2. **Class Preservation Rate**
   - Should be 100% always
   - Alert if < 100%

3. **Booking Count Accuracy**
   - `bookings_copied` should match source week
   - Alert if mismatch

4. **Current Students Counter**
   - Should match actual booking count
   - Alert if mismatch

---

## 📝 Next Steps

1. **Test in staging environment**
   - Use `TEST_COPY_WEEK_FIX.sql`
   - Verify all 11 steps pass

2. **Deploy to production**
   - Install new function
   - Run verification query

3. **Monitor first copy operation**
   - Check class preservation rate
   - Verify no students changed class

4. **Update documentation**
   - Add verification query to admin guide
   - Update copy week procedure

5. **Consider automation**
   - Add verification query to GitHub Actions
   - Auto-alert if class_changed > 0

---

## 🎓 Technical Details

### Why class_id is Better Than class_name

**Problem with class_name matching**:
```
Oxford Class - Monday Evening - Phase 1
Oxford Class - Monday Evening - Phase 2
```
Both have same name, day, time - but different phases!

**Solution with class_id**:
```
class_id: 123 - Oxford Class - Monday Evening - Phase 1
class_id: 456 - Oxford Class - Monday Evening - Phase 2
```
Each class has unique ID - no ambiguity!

### Function Logic Flow

1. **Validate inputs**
   - Source week exists?
   - Target week empty?

2. **Copy schedules**
   - Loop through source schedules
   - Insert with SAME class_id
   - Reset current_students to 0

3. **Copy bookings**
   - For each booking in source
   - Find target schedule by class_id (PRIMARY)
   - Validate day/time/phase match
   - Insert booking
   - Increment current_students

4. **Return summary**
   - schedules_copied count
   - bookings_copied count
   - Success message

---

## 📞 Support

If you encounter issues:

1. Check troubleshooting section above
2. Run diagnostic queries in `TEST_COPY_WEEK_FIX.sql`
3. Review function logs in Supabase
4. Check database constraints and triggers

---

## ✨ Success Indicators

You'll know the fix works when:

- ✅ 100% class preservation rate
- ✅ 0 students changed class
- ✅ All verification tests pass
- ✅ Nilna, Talitha, etc stay in correct class
- ✅ Current_students counter accurate
- ✅ No errors in function execution

**Expected Result**: "✅ SUCCESS - 100% class preserved!"
