# 🧪 Test Realtime Sync - Quick Guide

**READY TO TEST**: The realtime sync implementation is complete!

---

## 🎯 Quick Test (2 minutes)

### Step 1: Open Two Windows
1. **Window A**: Open admin dashboard (login as admin)
2. **Window B**: Open student page (login as student OR use incognito)

### Step 2: Open Browser Console
- Press `F12` or `Ctrl+Shift+I` (Windows)
- Go to "Console" tab in both windows

### Step 3: Toggle Testing Mode
1. In **Admin Window**: Click the "Testing Mode" button
2. Watch the console in **BOTH windows**

### Step 4: Check Results

**Admin Console Should Show**:
```
🔵 About to update testing_mode to: true
✅ Testing Mode updated in database: true
```

**Student Console Should Show** (within 1-2 seconds):
```
🔔 Realtime update received: {...}
✅ Settings updated from realtime: { testing_mode: true }
```

---

## ✅ Success = Student sees change WITHOUT refreshing page!

If student console shows `🔔 Realtime update received:` → **IT WORKS!** 🎉

---

## ⚠️ If It Doesn't Work

### Check 1: Is Realtime Enabled in Supabase?
1. Go to Supabase Dashboard
2. Database → Replication
3. Find `settings` table
4. Enable "Realtime"
5. Save

### Check 2: Check Console for Errors
Look for:
- WebSocket connection errors
- Permission denied errors
- Subscription failed errors

### Check 3: Verify Database Update
In admin console, after clicking toggle:
- Should see: `✅ Testing Mode updated in database: true`
- If you see error → check RLS policies

---

## 🔧 Quick Fix Commands

### If Realtime Not Enabled:
```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
```

### If Permission Issues:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'settings';
```

---

## 📞 What to Report

If it doesn't work, tell me:
1. What do you see in admin console?
2. What do you see in student console?
3. Any error messages?
4. Does database value change? (check in Supabase dashboard)

---

**Test now and let me know the results!** 🚀
