# ⚡ Quick Fix: Booking Display Shows 0/10

## Problem
Classes show "0/10" and "WAITING" when there should be students booked.

## Most Likely Cause
The `current_students` counter in database is not synced with actual bookings.

## Quick Fix (2 Minutes)

### Step 1: Run This SQL
```sql
-- Open Supabase SQL Editor
-- Copy and run: booking-system/database/FIX_CURRENT_STUDENTS_COUNTER.sql
```

This will:
1. Show current mismatch (before fix)
2. Fix the counter
3. Verify fix worked
4. Install auto-update trigger (prevents future issues)

### Step 2: Hard Refresh Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Step 3: Check Display
- Classes should now show correct student count (e.g., "28/10", "15/10")
- Status should show correct colors (red for full, green for available)

## If Still Not Working

### Try: Clear Browser Cache
```
1. Open browser settings
2. Clear browsing data
3. Select "Cached images and files"
4. Clear data
5. Refresh page
```

### Try: Check Browser Console
```
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for errors (red text)
4. Share screenshot with me
```

### Try: Run Diagnostic
```sql
-- Run: booking-system/database/DEBUG_BOOKING_DISPLAY.sql
-- Share results with me
```

## What This Fixes

✅ Syncs `current_students` counter with actual bookings
✅ Installs trigger to auto-update counter in future
✅ Prevents display showing 0/10 when there are students
✅ Fixes "WAITING" status showing incorrectly

## Files

- `booking-system/database/FIX_CURRENT_STUDENTS_COUNTER.sql` - Quick fix script
- `booking-system/database/DEBUG_BOOKING_DISPLAY.sql` - Diagnostic queries
- `booking-system/FIX_STUDENT_BOOKING_DISPLAY.md` - Detailed analysis

## Status

⏳ Waiting for you to:
1. Run `FIX_CURRENT_STUDENTS_COUNTER.sql` in Supabase
2. Hard refresh browser
3. Check if display is now correct
4. Let me know the result
