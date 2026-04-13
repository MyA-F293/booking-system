# 🔍 Masalah: Booking Tidak Muncul di Tab "New"

## 📋 Problem Statement

**Yang Dilaporkan:**
- 5 users melaporkan booking mereka tidak muncul di tab "New"
- Padahal mereka sudah booking
- Scroll ke bawah juga tidak muncul

**Root Cause:**
1. `current_students` counter tidak ter-sync dengan actual bookings
2. UI filter terlalu agresif - hanya show schedule jika `current_students > 0`
3. Jika counter = 0 tapi user sudah booking → booking HILANG dari tampilan!

---

## 🎯 Quick Fix (2 Steps)

### Step 1: Sync Counter di Database

**File**: `database/FIX_BOOKING_COUNTER_SYNC.sql`

1. Buka Supabase SQL Editor
2. Copy paste query dari file di atas
3. Execute
4. Lihat verification results

**Expected Result:**
```
✅ VERIFICATION
week_number | class_name | counter | actual_bookings | status
------------|------------|---------|-----------------|--------
2           | Oxford     | 5       | 5               | ✅ SYNCED
2           | Harvard    | 3       | 3               | ✅ SYNCED
```

### Step 2: Deploy UI Fix

**File**: `src/components/BookingDashboard.jsx`

UI sudah di-fix untuk:
- ✅ ALWAYS show schedules where user has booked (even if counter = 0)
- ✅ Show warning banner if counter = 0 but user booked
- ✅ Suggest refresh if data looks outdated

**Deploy:**
```bash
npm run build
# Deploy to Netlify/Vercel
```

---

## 🔍 Debug Guide

### Step 1: Identify Affected Users

**File**: `database/DEBUG_BOOKING_NOT_SHOWING.sql`

Run STEP 1 to see bookings with counter = 0:

```sql
-- Shows bookings that exist but counter = 0
SELECT ...
FROM bookings b
WHERE s.current_students = 0  -- Counter shows 0 but booking exists!
```

**Expected Output:**
```
full_name    | class_name | day      | counter_value | status
-------------|------------|----------|---------------|----------
Andi         | Oxford     | monday   | 0             | confirmed
Budi         | Harvard    | tuesday  | 0             | confirmed
```

### Step 2: Check Counter Mismatch

Run STEP 2 to see extent of problem:

```sql
-- Count mismatches
SELECT ...
HAVING COUNT(b.id) != s.current_students
```

**Expected Output:**
```
class_name | counter_shows | actual_bookings | difference
-----------|---------------|-----------------|------------
Oxford     | 0             | 5               | +5
Harvard    | 2             | 4               | +2
```

### Step 3: Check Specific Users

Replace `[USER_NAME]` with actual names:

```sql
WHERE u.full_name ILIKE '%Andi%'
```

---

## 🛠️ Root Cause Analysis

### Why Counter Gets Out of Sync?

**Possible Causes:**

1. **Race Condition**
   - Multiple users booking simultaneously
   - Counter update happens AFTER booking insert
   - If booking fails, counter already incremented

2. **Trigger Not Firing**
   - Database trigger might be disabled
   - Trigger error not caught
   - Trigger only fires on certain conditions

3. **Manual Database Changes**
   - Admin manually deletes bookings
   - Counter not updated

4. **Cache Issue**
   - Counter cached in application
   - Cache not invalidated after booking
   - Stale data shown to users

5. **Transaction Rollback**
   - Booking transaction rolls back
   - Counter update committed before rollback
   - Counter incremented but booking doesn't exist

---

## 🔧 Permanent Fix (Long-term)

### Option 1: Use Database Trigger (Recommended)

Create trigger to auto-sync counter:

```sql
CREATE OR REPLACE FUNCTION sync_schedule_counter()
RETURNS TRIGGER AS $$
BEGIN
    -- Update counter based on actual bookings
    UPDATE schedules
    SET current_students = (
        SELECT COUNT(*)
        FROM bookings
        WHERE schedule_id = COALESCE(NEW.schedule_id, OLD.schedule_id)
          AND status = 'confirmed'
    )
    WHERE id = COALESCE(NEW.schedule_id, OLD.schedule_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT, UPDATE, DELETE
CREATE TRIGGER booking_counter_sync
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_schedule_counter();
```

### Option 2: Remove Counter Column (Best)

Don't store counter - calculate on-the-fly:

```sql
-- In queries, use:
SELECT 
    s.*,
    (SELECT COUNT(*) FROM bookings 
     WHERE schedule_id = s.id 
       AND status = 'confirmed') as current_students
FROM schedules s;
```

**Pros:**
- ✅ Always accurate
- ✅ No sync issues
- ✅ No race conditions

**Cons:**
- ❌ Slightly slower queries
- ❌ Need to update all queries

### Option 3: Periodic Sync Job

Run sync query every hour:

```sql
-- Cron job (if using pg_cron)
SELECT cron.schedule(
    'sync-booking-counters',
    '0 * * * *',  -- Every hour
    $$
    UPDATE schedules
    SET current_students = (
        SELECT COUNT(*)
        FROM bookings
        WHERE bookings.schedule_id = schedules.id
          AND bookings.status = 'confirmed'
    )
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE);
    $$
);
```

---

## 📊 Monitoring

### Check Counter Health

Run this weekly:

```sql
SELECT 
    COUNT(*) as total_schedules,
    SUM(CASE WHEN s.current_students = actual THEN 1 ELSE 0 END) as synced,
    SUM(CASE WHEN s.current_students != actual THEN 1 ELSE 0 END) as out_of_sync
FROM (
    SELECT 
        s.id,
        s.current_students,
        COUNT(b.id) as actual
    FROM schedules s
    LEFT JOIN bookings b ON s.id = b.schedule_id AND b.status = 'confirmed'
    WHERE s.year = 2026
    GROUP BY s.id, s.current_students
) sub;
```

**Expected:**
```
total_schedules | synced | out_of_sync
----------------|--------|-------------
150             | 150    | 0            ✅ HEALTHY
150             | 145    | 5            ⚠️ NEEDS FIX
```

---

## 🚀 Deployment Checklist

- [ ] Run `DEBUG_BOOKING_NOT_SHOWING.sql` to identify affected schedules
- [ ] Run `FIX_BOOKING_COUNTER_SYNC.sql` to sync counters
- [ ] Verify all counters are synced
- [ ] Deploy UI fix (BookingDashboard.jsx)
- [ ] Test with affected users
- [ ] Implement permanent fix (trigger or remove counter)
- [ ] Set up monitoring

---

## 📞 User Communication

**Message to Affected Users:**

```
Hi [Name],

We've identified and fixed the issue where your booking wasn't showing in the app.

What happened:
- Your booking was successfully saved in the database
- A display issue prevented it from showing in the app
- This has now been fixed

What we did:
- Synced all booking counters
- Updated the app to prevent this from happening again
- Your booking is now visible

Please refresh your app (hard refresh: Ctrl+Shift+R) to see your booking.

Sorry for the inconvenience!
```

---

## 🔗 Related Files

- Debug Query: `database/DEBUG_BOOKING_NOT_SHOWING.sql`
- Fix Query: `database/FIX_BOOKING_COUNTER_SYNC.sql`
- UI Fix: `src/components/BookingDashboard.jsx` (line 127-135)
- Previous Similar Issue: `QUICK_FIX_BOOKING_DISPLAY.md`

---

**STATUS**: ✅ Fixed in code, needs deployment

**NEXT STEPS**:
1. Run debug query to see affected users
2. Run fix query to sync counters
3. Deploy UI fix
4. Implement permanent solution (trigger)
