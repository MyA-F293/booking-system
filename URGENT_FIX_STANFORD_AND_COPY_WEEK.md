# 🚨 URGENT FIX: Stanford Class + Copy Week Issues

## 📋 Issue Summary

### Issue 1: Cannot create Stanford Class on Friday ❌
**Root Cause:** Stanford Class doesn't exist in production database yet.

### Issue 2: Copy Week creates schedules but they don't appear in UI ❌  
**Root Cause:** Copied schedules have `batch = NULL` and may be filtered out by the UI.

---

## 🛠️ SOLUTION 1: Add Stanford Class to Database

### Step 1: Run this SQL in Supabase SQL Editor

```sql
-- ============================================
-- ADD STANFORD CLASS TO DATABASE
-- ============================================

-- Insert Stanford Class with capacity of 6 students
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('Stanford Class', 4, 6, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Verify the insert
SELECT 
    id,
    name,
    min_students,
    max_students,
    is_active,
    created_at
FROM classes 
WHERE name = 'Stanford Class';

-- Show all classes for reference
SELECT * FROM classes ORDER BY name;
```

### Step 2: Verify in Admin UI

1. Refresh admin dashboard (F5)
2. Click "Create Schedule" button
3. Look for "🌲 Stanford Class" in the class dropdown
4. Try creating a Stanford Class schedule on Friday
5. Verify capacity shows as "X/6" (not X/10)

**Expected Result:** ✅ Stanford Class appears in dropdown and can be created on Friday

---

## 🛠️ SOLUTION 2: Fix Copy Week Feature

### Problem Analysis

The Copy Week feature is working correctly:
- ✅ RPC function `smart_copy_week` creates schedules
- ✅ Sets `batch = NULL` for new schedules (correct behavior)
- ❌ BUT: UI may be filtering out NULL batch schedules

### Debug Steps

#### Step 1: Check if schedules were actually created

Run this SQL in Supabase:

```sql
-- Check last copied schedules (should show recent schedules with NULL batch)
SELECT 
    id,
    class_id,
    day,
    time_slot,
    phase,
    week_number,
    program,
    level,
    current_students,
    batch,
    created_at
FROM schedules
WHERE week_number = 2  -- Change to your target week
  AND year = 2026
  AND batch IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

#### Step 2: Check UI filters

The issue is likely one of these:

1. **"Hide Empty" toggle is ON** → Hides schedules with 0 students
2. **Batch filter** → May be filtering out NULL batch schedules
3. **Week tab** → Viewing "Current Week" instead of "Next Week"
4. **Cache** → Browser showing old data

### UI Checks

1. **Toggle "Hide Empty" OFF**
   - Look for a toggle button in admin dashboard
   - Turn it OFF to see empty schedules

2. **Switch to correct week tab**
   - If you copied to Week 2, make sure you're viewing "Next Week" tab
   - Not "Current Week"

3. **Clear cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

4. **Check console logs**
   - Open DevTools (F12)
   - Look for console.log messages about schedules
   - Should show: "📊 Loaded X schedules, removed Y duplicates..."

### Step 3: Check batch auto-detection

Since batch is now auto-detected from majority of students:

```sql
-- Check batch distribution
SELECT 
    batch,
    COUNT(*) as student_count
FROM students
WHERE is_active = TRUE
GROUP BY batch
ORDER BY student_count DESC;
```

**Expected:** Most students should be Batch 3

### Step 4: Verify RPC function is updated

```sql
-- Check if smart_copy_week sets batch to NULL
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'smart_copy_week';
```

Look for this line in the function:
```sql
batch = NULL
```

If you see `batch = source.batch`, the function needs to be updated with:
`database/FIX_SMART_COPY_WEEK_BATCH.sql`

---

## 🔍 Quick Diagnostic

### For Stanford Class Issue:

```sql
-- One-liner to check if Stanford exists
SELECT COUNT(*) as stanford_exists 
FROM classes 
WHERE name = 'Stanford Class';
-- Should return 1, if 0 then run the INSERT above
```

### For Copy Week Issue:

```sql
-- Check schedules created in last 5 minutes
SELECT 
    COUNT(*) as recent_schedules,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM schedules
WHERE created_at > NOW() - INTERVAL '5 minutes'
  AND week_number = 2;  -- Your target week
```

If this returns > 0, schedules were created! Problem is in UI filters.

---

## ✅ Success Checklist

### Stanford Class
- [ ] Run `INSERT INTO classes` SQL
- [ ] Verify Stanford Class appears in Supabase `classes` table
- [ ] Refresh admin dashboard
- [ ] See "🌲 Stanford Class" in Create Schedule dropdown
- [ ] Successfully create Stanford Class on Friday
- [ ] Capacity shows as "X/6" not "X/10"

### Copy Week
- [ ] Run diagnostic SQL to verify schedules exist
- [ ] Turn OFF "Hide Empty" toggle in admin UI
- [ ] Switch to correct week tab (Next Week)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] See copied schedules appear
- [ ] Verify batch shows correct auto-detected value

---

## 🎯 Most Likely Solutions

### Stanford Class → 95% sure
**Run the SQL INSERT.** The class doesn't exist in production database.

### Copy Week → 90% sure  
**Turn OFF "Hide Empty" toggle.** Copied schedules have 0 students initially, so they're being hidden.

---

## 📞 Need Help?

If issues persist after following these steps:

1. **Take screenshot of:**
   - Admin dashboard showing the issue
   - Browser console (F12 → Console tab)
   - Supabase SQL results

2. **Share these details:**
   - Which week are you copying FROM and TO?
   - Is "Hide Empty" toggle ON or OFF?
   - What does the console.log show?

---

## 🔄 After Fix

Once both issues are resolved:

1. Test creating Stanford Class on all days (Mon-Sun)
2. Test Copy Week feature multiple times
3. Verify students can book Stanford Class
4. Verify copied schedules show correctly with 0 students
5. Deploy to production if testing locally

**Files to reference:**
- `database/add_stanford_class.sql`
- `database/FIX_SMART_COPY_WEEK_BATCH.sql`  
- `database/check_copy_week_result.sql`
- `STANFORD_CLASS_FRIDAY_DEBUG.md`
