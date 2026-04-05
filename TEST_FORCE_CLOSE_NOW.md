# Test Force Close Feature - Quick Guide

## What We Fixed
Added comprehensive logging to track why student side doesn't see force_close_booking changes.

## Test Now (Localhost)

### 1. Rebuild the app
```bash
cd booking-system
npm run build
```

### 2. Start dev server (if not running)
```bash
npm run dev
```

### 3. Test as Student
1. Open browser in **Incognito/Private mode** (important!)
2. Go to `http://localhost:5173`
3. Login as a student
4. Press F12 to open Developer Tools
5. Go to Console tab
6. Look for these logs:

**Expected logs (if working):**
```
🔵 BookingModeProvider: Component mounted/rendered
🔵 BookingModeProvider: Loaded bookingMode from localStorage: production
🔵 BookingModeContext: Starting to load force_close_booking from database...
🔵 BookingModeContext: Querying settings table...
🔵 BookingModeContext: Query result: { data: {...}, error: null }
✅ Loaded force_close_booking from database: false
🔵 BookingModeContext: Loading complete, loading state set to false
🚀 BookingSystemDB component mounted
🔒 Force Close: false
⏳ BookingMode Loading: false
```

### 4. Test Admin Toggle
1. Open another tab (still incognito)
2. Login as admin
3. Go to Settings → Toggle "Force Close Booking"
4. Go back to student tab
5. Refresh page (F5)
6. Check console - should see `🔒 Force Close: true`
7. Check if booking shows "CLOSED" message

## What to Report

### If you see ALL the blue 🔵 logs:
✅ **SUCCESS!** The context is loading correctly.
- Just need to deploy and ask users to hard refresh

### If you see NO blue 🔵 logs:
❌ **PROBLEM**: Context not mounting
- Take screenshot of console
- Check if there are any red errors

### If you see blue logs but ERROR:
❌ **PROBLEM**: Database or RLS issue
- Copy the exact error message
- Check which query failed

### If student page shows "CLOSED" even when force_close = false:
❌ **PROBLEM**: Logic issue in canBook() function
- Need to check BookingSystemDB.jsx line ~500

## Quick Checks

### Check database value:
```sql
SELECT force_close_booking FROM settings WHERE id = 1;
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'settings';
```

### Check if column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings';
```

## Files Changed
- `booking-system/src/contexts/BookingModeContext.jsx` - Added logging
- `booking-system/src/BookingSystemDB.jsx` - Added loading state log

## Next Steps
1. Test on localhost first
2. If works → Deploy to Netlify
3. Ask users to hard refresh (Ctrl+Shift+R)
4. Test admin toggle → student refresh → verify change
