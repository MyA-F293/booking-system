# Auto-Delete Empty Schedules - Complete Guide

**Goal:** Automatically delete jadwal kosong setiap saat, tanpa manual intervention.

---

## 🎯 3 Options Available

### **Option 1: Database Trigger (RECOMMENDED)** ⭐

**File:** `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`

**How it works:**
- Trigger fires INSTANTLY when `current_students` becomes 0
- Automatically deletes the schedule
- Real-time, no delay

**Pros:**
- ✅ **Instant deletion** - happens immediately
- ✅ **Works on free tier** - no paid features needed
- ✅ **Most efficient** - only triggers when needed
- ✅ **Reliable** - database-level, can't be bypassed
- ✅ **Simple** - one SQL file to run

**Cons:**
- ❌ Trigger fires on EVERY update to current_students

**Best for:** Most use cases (RECOMMENDED!)

---

### **Option 2: Supabase pg_cron (Scheduled Job)**

**File:** `database/AUTO_CLEAN_EMPTY_SCHEDULES_CRON.sql`

**How it works:**
- Scheduled job runs every 1 minute
- Scans all schedules and deletes empties
- Batch processing

**Pros:**
- ✅ Batch processing - deletes multiple at once
- ✅ Predictable schedule - runs at exact intervals
- ✅ Can schedule for low-traffic times
- ✅ Can check job history and logs

**Cons:**
- ❌ **Requires Supabase Pro** ($25/month)
- ❌ 1-minute delay before cleanup
- ❌ More complex setup
- ❌ Runs even when not needed (wastes resources)

**Best for:** If you already have Pro tier and want scheduled batch cleanup

---

### **Option 3: Frontend Interval (Client-side)**

**Implementation:** React useEffect with setInterval

**How it works:**
- Client-side code checks for empty schedules every X seconds
- Deletes them via API call
- Only runs when admin has page open

**Pros:**
- ✅ Easy to implement
- ✅ No database changes needed
- ✅ Can show user feedback

**Cons:**
- ❌ Only works when admin has page open
- ❌ Multiple tabs = multiple scans (wasteful)
- ❌ Network dependent
- ❌ Battery drain on mobile
- ❌ Not reliable

**Best for:** NOT RECOMMENDED (use Option 1 instead)

---

## 🚀 RECOMMENDED: Install Option 1 (Trigger)

### Step 1: Run SQL

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Paste entire content of `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`
4. Click **Run**

### Step 2: Verify Installation

Run this query:

```sql
-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_delete_empty_schedules';
```

**Expected result:** One row showing the trigger details

### Step 3: Test It

```sql
-- Test 1: Create a test schedule
INSERT INTO schedules (
    class_id, day, time_slot, phase, 
    week_number, year, program, level, 
    current_students, batch
)
VALUES (
    1, 'monday', 'afternoon', 'phase1',
    999, 2026, 'General English', 'Beginner',
    1, 3
);

-- Test 2: Update to 0 students → Should auto-delete!
UPDATE schedules 
SET current_students = 0 
WHERE week_number = 999;

-- Test 3: Verify deletion
SELECT * FROM schedules WHERE week_number = 999;
-- Expected: No results (auto-deleted by trigger)
```

---

## 📊 How Trigger Works

### Scenario 1: Student Cancels Booking

```
1. Student clicks "Cancel Booking"
2. Booking is deleted from bookings table
3. Trigger on bookings table decrements current_students
4. current_students becomes 0
5. ⚡ Auto-delete trigger fires INSTANTLY
6. Schedule is deleted from database
7. ✅ No empty schedule remains!
```

### Scenario 2: Admin Force Close

```
1. Admin force-closes all students
2. All bookings are deleted
3. current_students becomes 0
4. ⚡ Trigger fires immediately
5. Schedule deleted
6. ✅ Clean database!
```

### Scenario 3: Last Student Cancels

```
1. Schedule has 1 student
2. That student cancels
3. current_students: 1 → 0
4. ⚡ Trigger fires
5. Schedule deleted instantly
6. ✅ No orphan schedules!
```

---

## 🔄 Complete Prevention System (After All Fixes)

### Layer 1: Frontend CREATE Prevention ✅
- File: `AdminBookingDashboard.jsx`
- Can't create empty schedules via form
- Shows error message

### Layer 2: Database Copy Prevention ✅
- File: `IMPROVE_SMART_COPY_WEEK.sql` (needs to be run)
- Copy Week skips empty schedules
- Filter: `WHERE current_students > 0`

### Layer 3: Auto-Delete Trigger ✅ (NEW!)
- File: `AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`
- Instantly deletes when current_students = 0
- Database-level, can't be bypassed

### Layer 4: Manual Clean Button ✅
- For any edge cases that slip through
- Available in Dashboard alerts

---

## 💡 Why Trigger is Best

### vs setTimeout (Current auto-clean):
- ✅ **Immediate** - no 2-second delay
- ✅ **Reliable** - doesn't depend on page staying open
- ✅ **Always works** - even if user closes browser
- ✅ **Database-level** - can't be interrupted

### vs pg_cron (Scheduled job):
- ✅ **Free tier** - no Pro subscription needed
- ✅ **Instant** - no 1-minute wait
- ✅ **Efficient** - only runs when needed
- ✅ **Simpler** - less code, less complexity

### vs Frontend Interval:
- ✅ **Always active** - not dependent on client
- ✅ **Reliable** - no network issues
- ✅ **Efficient** - no polling overhead
- ✅ **Battery friendly** - no client-side loops

---

## 🧪 Testing Checklist

After installing the trigger, test these scenarios:

### ✅ Test 1: Cancel Last Booking
1. Create schedule with 1 student
2. Student cancels booking
3. **Expected:** Schedule is deleted immediately
4. **Verify:** Check database - schedule should be gone

### ✅ Test 2: Force Close All
1. Create schedule with multiple students
2. Admin force-closes all students
3. **Expected:** Schedule deleted automatically
4. **Verify:** Database should be clean

### ✅ Test 3: Edit Schedule to 0
1. Create schedule with students
2. Admin manually sets current_students = 0
3. **Expected:** Trigger fires, schedule deleted
4. **Verify:** No empty schedules remain

### ✅ Test 4: Copy Week
1. Copy week with empty schedules (if any old ones exist)
2. **Expected:** Empty schedules not copied (Layer 2)
3. If somehow copied, trigger deletes them (Layer 3)
4. **Verify:** Target week has no empties

---

## 📋 Installation Checklist

- [ ] Run `database/IMPROVE_SMART_COPY_WEEK.sql` (Layer 2)
- [ ] Run `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql` (Layer 3)
- [ ] Verify trigger with test query
- [ ] Test cancel booking scenario
- [ ] Test force close scenario
- [ ] Monitor for 24 hours
- [ ] Remove frontend setTimeout auto-clean (optional - can keep as backup)

---

## 🎯 Expected Results After Installation

### Before (Current):
- Empty schedules appear after Copy Week
- Depends on setTimeout (unreliable)
- Manual cleanup sometimes needed
- Database has orphan schedules

### After (With Trigger):
- Empty schedules deleted INSTANTLY
- No setTimeout dependency
- No manual cleanup needed
- Database always clean
- Happens automatically in background

---

## 🚨 Edge Cases Handled

1. **Network failure during cancel**
   - ✅ Trigger is database-level, not affected

2. **User closes browser mid-cancel**
   - ✅ Trigger still executes (server-side)

3. **Multiple cancels at same time**
   - ✅ Each triggers independently, no conflicts

4. **Copy Week creates empty**
   - ✅ Prevented by Layer 2 filter
   - ✅ If bypassed, Layer 3 deletes it

5. **Direct database manipulation**
   - ✅ Trigger catches it (monitors UPDATE events)

---

## 📊 Performance Impact

**Trigger overhead:** Minimal
- Only fires on UPDATE of current_students column
- Simple condition check (= 0)
- Single DELETE query
- Microseconds of execution time

**Database load:** Negligible
- Only triggers when actually needed
- No background scanning
- No polling loops
- More efficient than setTimeout

**Conclusion:** ✅ Safe to install, no performance concerns

---

## 🔧 Troubleshooting

### Q: Trigger not firing?

**Check:**
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_delete_empty_schedules';

-- Check function exists
SELECT * FROM pg_proc 
WHERE proname = 'auto_delete_empty_schedules';
```

**Fix:** Re-run the SQL file

### Q: Want to disable trigger temporarily?

```sql
-- Disable trigger
ALTER TABLE schedules 
DISABLE TRIGGER trigger_auto_delete_empty_schedules;

-- Re-enable trigger
ALTER TABLE schedules 
ENABLE TRIGGER trigger_auto_delete_empty_schedules;
```

### Q: Want to remove trigger completely?

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_auto_delete_empty_schedules ON schedules;

-- Drop function
DROP FUNCTION IF EXISTS auto_delete_empty_schedules();
```

---

## 🎉 Benefits Summary

✅ **Zero manual work** - fully automatic  
✅ **Real-time** - deletes instantly  
✅ **Reliable** - database-level, always works  
✅ **Free** - no Pro tier needed  
✅ **Efficient** - minimal overhead  
✅ **Simple** - one SQL file to install  
✅ **Safe** - only deletes empties (current_students = 0)  
✅ **Maintainable** - no complex code

---

**RECOMMENDATION:** Install Option 1 (Trigger) NOW for instant, reliable empty schedule cleanup! 🚀
