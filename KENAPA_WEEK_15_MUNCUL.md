# Kenapa Week 15 Muncul di Tab "New"?

## Problem Statement

**Symptoms:**
- Siswa tiba-tiba menemukan Week 15 di tab "New" untuk booking
- Padahal seharusnya masih Week 2 (hari ini April 5, 2026)
- Week 15 seharusnya masih 13 minggu lagi!

**Impact:**
- Siswa bingung kenapa ada Week 15
- Siswa mungkin sudah booking di Week 15 (salah week)
- Schedule system jadi kacau

## Root Cause Analysis

### Possible Causes:

#### 1. GitHub Actions Cron Schedule Salah (MOST LIKELY)

**Problem:**
- Cron schedule di `.github/workflows/auto-increment-week.yml` salah
- Seharusnya weekly (setiap Minggu), tapi jadi daily (setiap hari)
- Week di-increment 13 kali dalam 13 hari
- Week 2 → Week 15

**Check:**
```yaml
# WRONG (runs daily):
on:
  schedule:
    - cron: '0 0 * * *'  # Every day at midnight

# CORRECT (runs weekly):
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
```

**Evidence:**
- Week incremented from 2 to 15 = 13 increments
- If cron runs daily, 13 days = 13 increments
- Timeline matches!

#### 2. Manual increment_week() Called Multiple Times

**Problem:**
- Someone with database access ran `increment_week()` 13 times
- Either accidentally or for testing
- Each call increments week by 1

**Check:**
```sql
-- Check settings update history
SELECT current_week, updated_at
FROM settings
WHERE id = 1;
```

**Evidence:**
- If `updated_at` is very recent: Just happened
- If `updated_at` is old: Happened days ago

#### 3. Copy Week Feature Bug

**Problem:**
- Copy Week feature copied schedules to Week 15 instead of Week 3
- Bug in `copy_week_schedules()` function
- Wrong target week calculation

**Check:**
```sql
-- Check when Week 15 schedules were created
SELECT MIN(created_at), MAX(created_at), COUNT(*)
FROM schedules
WHERE week_number = 15;
```

**Evidence:**
- If all created at same time: Likely copy week bug
- If created gradually: Likely cron issue

#### 4. Database Corruption

**Problem:**
- Settings table corrupted
- `current_week` value jumped from 2 to 15
- Database integrity issue

**Check:**
```sql
-- Check for duplicate settings
SELECT * FROM settings ORDER BY id;
```

**Evidence:**
- If multiple rows: Duplicate settings
- If single row with week 15: Corruption

## Diagnosis Steps

### Step 1: Check Current Week

```sql
SELECT current_week, updated_at
FROM settings
WHERE id = 1;
```

**Expected:** `current_week = 2`  
**If shows 15:** DATABASE ISSUE!

### Step 2: Check Week Range

```sql
SELECT 
    MIN(week_number) as min_week,
    MAX(week_number) as max_week,
    COUNT(DISTINCT week_number) as total_weeks
FROM schedules;
```

**Expected:** `max_week = 2 or 3`  
**If shows 15:** SCHEDULES CREATED FOR WEEK 15!

### Step 3: Check Week 15 Schedules

```sql
SELECT 
    c.name,
    s.day,
    s.current_students,
    s.created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 15
ORDER BY c.name;
```

**Expected:** EMPTY  
**If rows exist:** Week 15 schedules exist!

### Step 4: Check Week 15 Bookings

```sql
SELECT 
    u.full_name,
    c.name as class_name,
    s.day
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 15;
```

**Expected:** EMPTY  
**If rows exist:** Students already booked Week 15!

### Step 5: Check GitHub Actions

1. Go to GitHub repository
2. Click "Actions" tab
3. Check "auto-increment-week" workflow
4. Look at run history
5. Count how many times it ran

**Expected:** Runs once per week (every Sunday)  
**If runs daily:** CRON SCHEDULE WRONG!

## Quick Fix

### Fix 1: Reset Current Week

```sql
-- Reset to correct week
UPDATE settings
SET current_week = 2,  -- Today should be Week 2
    updated_at = NOW()
WHERE id = 1;

-- Verify
SELECT current_week FROM settings WHERE id = 1;
```

### Fix 2: Delete Week 15 Schedules

```sql
-- Check what will be deleted
SELECT 
    COUNT(DISTINCT s.id) as schedules,
    COUNT(DISTINCT b.id) as bookings,
    COUNT(DISTINCT b.user_id) as affected_students
FROM schedules s
LEFT JOIN bookings b ON b.schedule_id = s.id
WHERE s.week_number = 15;

-- Delete bookings first
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules WHERE week_number = 15
);

-- Delete schedules
DELETE FROM schedules
WHERE week_number = 15;

-- Verify
SELECT COUNT(*) FROM schedules WHERE week_number = 15;
-- Expected: 0
```

### Fix 3: Delete All Future Weeks (3-15)

```sql
-- Check all future weeks
SELECT week_number, COUNT(*) as count
FROM schedules
WHERE week_number > 2
GROUP BY week_number
ORDER BY week_number;

-- Delete all future weeks
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules WHERE week_number > 2
);

DELETE FROM schedules
WHERE week_number > 2;

-- Verify
SELECT DISTINCT week_number
FROM schedules
ORDER BY week_number;
-- Expected: Only 1 and 2
```

### Fix 4: Fix GitHub Actions Cron

**File:** `.github/workflows/auto-increment-week.yml`

**Change from:**
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # WRONG: Every day
```

**To:**
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # CORRECT: Every Sunday
```

**Commit and push:**
```bash
git add .github/workflows/auto-increment-week.yml
git commit -m "fix: Change cron to weekly instead of daily"
git push
```

## Prevention

### 1. Add Safeguard to increment_week()

```sql
CREATE OR REPLACE FUNCTION increment_week()
RETURNS json AS $$
DECLARE
    result json;
    last_updated timestamp;
    current_week_val integer;
BEGIN
    -- Get current week and last update
    SELECT current_week, updated_at 
    INTO current_week_val, last_updated
    FROM settings WHERE id = 1;
    
    -- Safeguard: Don't increment if updated less than 6 days ago
    IF last_updated > NOW() - INTERVAL '6 days' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Week was already incremented recently',
            'current_week', current_week_val,
            'last_updated', last_updated,
            'days_since_update', EXTRACT(DAY FROM NOW() - last_updated)
        );
    END IF;
    
    -- Safeguard: Don't increment beyond reasonable limit (e.g., Week 20)
    IF current_week_val >= 20 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Week number too high - possible error',
            'current_week', current_week_val
        );
    END IF;
    
    -- Increment week
    UPDATE settings
    SET current_week = current_week + 1,
        updated_at = NOW()
    WHERE id = 1
    RETURNING current_week INTO current_week_val;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Week incremented successfully',
        'old_week', current_week_val - 1,
        'new_week', current_week_val,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Add Monitoring

**Create alert query:**
```sql
-- Run this daily to check for anomalies
SELECT 
    current_week,
    updated_at,
    CASE 
        WHEN current_week > 20 THEN '🚨 ALERT: Week too high!'
        WHEN updated_at < NOW() - INTERVAL '8 days' THEN '⚠️ WARNING: Week not updated'
        ELSE '✅ OK'
    END as status
FROM settings
WHERE id = 1;
```

### 3. Disable Manual Increment

**Revoke direct access to increment_week():**
```sql
-- Only allow GitHub Actions to call this function
REVOKE EXECUTE ON FUNCTION increment_week() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_week() TO service_role;
```

## Communication to Students

### Message Template:

```
⚠️ PEMBERITAHUAN SISTEM

Kami menemukan error di sistem booking:
- Week 15 muncul secara tidak sengaja
- Week yang benar saat ini adalah Week 2
- Week 15 seharusnya masih 13 minggu lagi

TINDAKAN YANG SUDAH DILAKUKAN:
✅ Week sudah direset ke Week 2
✅ Semua jadwal Week 15 sudah dihapus
✅ System error sudah diperbaiki

JIKA ANDA SUDAH BOOKING DI WEEK 15:
- Booking Anda sudah dibatalkan otomatis
- Silakan booking ulang di Week 2 atau Week 3
- Maaf atas ketidaknyamanannya

Terima kasih atas pengertiannya! 🙏
```

## Testing Checklist

### After Fix:

- [ ] Current week = 2 in database
- [ ] No schedules exist for Week > 3
- [ ] No bookings exist for Week > 3
- [ ] GitHub Actions cron is weekly (not daily)
- [ ] Safeguard added to increment_week()
- [ ] Students informed about the issue
- [ ] Monitor for next week increment

### Weekly Monitoring:

- [ ] Check current week matches calendar
- [ ] Check GitHub Actions ran only once
- [ ] Check no future weeks created accidentally
- [ ] Check increment_week() logs

## Summary

**Root Cause:** GitHub Actions cron schedule salah (daily instead of weekly)

**Impact:** Week incremented 13 times → Week 2 became Week 15

**Quick Fix:**
1. Reset current_week to 2
2. Delete Week 15 schedules
3. Fix GitHub Actions cron
4. Add safeguards

**Prevention:**
- Safeguard in increment_week() function
- Weekly monitoring
- Disable manual increment access

---

**Files:**
- `database/DEBUG_WEEK_15_ISSUE.sql` - Complete diagnosis
- `.github/workflows/auto-increment-week.yml` - Cron schedule
- `database/CREATE_INCREMENT_FUNCTION.sql` - Function with safeguards

**Priority:** CRITICAL - Affects all students  
**Action:** Run fix queries immediately
