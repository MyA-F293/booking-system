# 🎯 Action Plan: Fix Stanford Class & Copy Week Issues

## ⚡ QUICK START (Do this first!)

### 1. Run Diagnostic SQL (2 minutes)

Open Supabase SQL Editor and run:
```
database/diagnostic_stanford_and_copy_week.sql
```

This will tell you exactly what's wrong and what to do.

---

## 🔧 FIX 1: Stanford Class Cannot Be Created on Friday

### Root Cause
Stanford Class doesn't exist in production database.

### Solution (1 minute)

**In Supabase SQL Editor, run:**

```sql
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('Stanford Class', 4, 6, TRUE)
ON CONFLICT (name) DO NOTHING;
```

### Verify (30 seconds)

```sql
SELECT * FROM classes WHERE name = 'Stanford Class';
```

Should return:
```
name: Stanford Class
min_students: 4
max_students: 6
is_active: true
```

### Test in UI

1. Refresh admin dashboard (F5)
2. Click "Create Schedule"
3. Look for "🌲 Stanford Class" in dropdown
4. Create a schedule on Friday
5. ✅ Should work now!

---

## 🔧 FIX 2: Copy Week Creates Schedules But They Don't Appear

### Root Cause
95% sure: **"Hide Empty" toggle is ON**, hiding schedules with 0 students.

### Solution 1: Turn OFF "Hide Empty" (5 seconds) ⭐ TRY THIS FIRST

1. Look at top of admin dashboard
2. Find toggle labeled "Hide Empty" or similar
3. Click to turn it **OFF**
4. Copied schedules should appear immediately!

### Solution 2: Check Week Tab (5 seconds)

1. Make sure you're viewing the **correct week tab**
2. If you copied to Week 2, select "Next Week" tab
3. Not "Current Week"

### Solution 3: Hard Refresh Browser (5 seconds)

1. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. This clears cache and reloads fresh data

### Solution 4: Verify Schedules Exist in Database

**In Supabase, run:**

```sql
-- Check if schedules were created
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.current_students,
    s.batch,
    s.created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2  -- Change to your target week
  AND s.year = 2026
ORDER BY s.created_at DESC
LIMIT 10;
```

**If this shows schedules:**
✅ Copy Week is working! Problem is UI filters (Solution 1 or 2)

**If this shows nothing:**
❌ Copy Week failed. Check console logs (F12 → Console) for errors.

---

## 📋 Complete Checklist

### Stanford Class
- [ ] Run `INSERT INTO classes` SQL in Supabase
- [ ] Verify Stanford Class exists in database
- [ ] Refresh admin dashboard (F5)
- [ ] See "🌲 Stanford Class" in dropdown
- [ ] Create Stanford Class schedule on Friday
- [ ] Verify it shows capacity as "X/6"

### Copy Week
- [ ] Run diagnostic SQL to check if schedules exist
- [ ] Turn OFF "Hide Empty" toggle in admin UI
- [ ] Switch to correct week tab
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Verify copied schedules appear with 0 students
- [ ] Verify batch is NULL (will be set when first student books)

---

## 🚨 If Still Not Working

### Stanford Class Issue

**Error: "Schedule already exists" or "Duplicate"**
→ Schedule already exists at that time. Choose different day/time.

**Error: "Room conflict"**
→ Another program using that classroom. Choose different time/phase.

**Stanford Class not in dropdown after SQL**
→ Clear browser cache, hard refresh, check Supabase again.

### Copy Week Issue

**Schedules exist in DB but not in UI**
1. Check "Hide Empty" toggle (most common)
2. Check week tab selection
3. Check browser console for JavaScript errors
4. Check if batch filter is excluding NULL batch schedules

**Schedules not created in DB at all**
1. Check console logs (F12 → Console)
2. Look for error message from `smart_copy_week` RPC
3. Verify RPC function is updated (run diagnostic SQL)
4. Check if source week has schedules to copy

---

## 📊 Expected Behavior After Fix

### Stanford Class
- ✅ Appears in all dropdowns with 🌲 emoji
- ✅ Can be created on any day (Mon-Sun)
- ✅ Shows capacity as "X/6" not "X/10"
- ✅ Students can book Stanford Class
- ✅ Green badge color

### Copy Week
- ✅ Clicking "Copy Week" creates schedules
- ✅ Success message shows: "Schedules created: X"
- ✅ New schedules appear in UI (with "Hide Empty" OFF)
- ✅ Current students = 0 initially
- ✅ Batch = NULL (auto-set when first student books)
- ✅ All schedule details copied correctly

---

## 🎓 Understanding the Issues

### Why Stanford Class wasn't working:
- Code was added to UI (badges, capacity logic)
- But database entry was never created
- SQL file exists but wasn't run in production
- Without DB entry, system can't create schedules

### Why Copy Week schedules were "invisible":
- `smart_copy_week` RPC works correctly
- Creates schedules with `batch = NULL` and `current_students = 0`
- UI has "Hide Empty" toggle that hides 0-student schedules
- So copied schedules exist but are filtered out
- Simply turning off the toggle reveals them

---

## 🔄 Prevention for Future

### Before adding new classes:
1. Update UI code (badges, capacity)
2. **Run SQL to add class to database**
3. Test in local environment
4. Deploy both code + SQL to production

### When using Copy Week:
1. Turn OFF "Hide Empty" toggle before copying
2. This lets you see new empty schedules immediately
3. Turn back ON after verifying if desired

---

## 📁 Reference Files

- `URGENT_FIX_STANFORD_AND_COPY_WEEK.md` - Detailed troubleshooting
- `STANFORD_CLASS_FRIDAY_DEBUG.md` - Stanford-specific debugging
- `database/diagnostic_stanford_and_copy_week.sql` - Run this first!
- `database/add_stanford_class.sql` - Add Stanford to DB
- `database/check_copy_week_result.sql` - Verify Copy Week results
- `database/FIX_SMART_COPY_WEEK_BATCH.sql` - Update RPC if needed

---

## ✅ Success!

Once both fixes are complete:

1. ✅ Stanford Class can be created on Friday (and any day)
2. ✅ Copy Week creates schedules that appear in UI
3. ✅ Both features work as expected

Test thoroughly before considering this done! 🎉
