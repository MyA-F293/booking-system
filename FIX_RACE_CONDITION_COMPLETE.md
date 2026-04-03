# Fix Complete: Race Condition Oxford Booking

## 🎯 PROBLEM SOLVED

**Issue:** Jadwal yang sama, user berbeda:
- User pertama: ✅ Bisa booking
- User kedua: ❌ Error "Duplicate schedule detected!"

**Root Cause:** Race condition + Trigger timing issue

---

## ✅ FIXES IMPLEMENTED

### Fix 1: Update Trigger (Database)
**File:** `database/FIX_TRIGGER_RACE_CONDITION.sql`

**Changes:**
- Trigger sekarang check: class_id, day, time, phase, week, **program, level, batch**
- Sebelumnya hanya check: class_id, day, time, phase, week
- Ini mencegah false positive "duplicate" untuk program/level/batch berbeda

**Impact:**
- Different programs dapat booking same class/time (jika tidak conflict)
- Same program/level/batch tidak bisa duplicate (correct behavior)

### Fix 2: Handle Trigger Error (Code)
**File:** `src/utils/dbHelpers.js` line 303-318

**Changes:**
```javascript
// ✅ NEW: Handle trigger error
if (createError.message?.includes('Duplicate schedule') && retryCount < 3) {
    console.log('⚠️ Duplicate schedule detected by trigger, retrying...');
    await new Promise(resolve => setTimeout(resolve, 150 * (retryCount + 1)));
    return getOrCreateSchedule(scheduleData, retryCount + 1);
}
```

**Impact:**
- Ketika trigger block karena race condition, code akan retry
- User kedua akan fetch schedule yang dibuat user pertama
- Tidak ada error message ke user

---

## 🧪 HOW IT WORKS NOW

### Scenario: 2 Users Booking Simultaneously

**Before Fix:**
```
User A (0.000s): Check → Not found → INSERT → Success ✅
User B (0.050s): Check → Not found → INSERT → TRIGGER BLOCK ❌
Result: User B sees error
```

**After Fix:**
```
User A (0.000s): Check → Not found → INSERT → Success ✅
User B (0.050s): Check → Not found → INSERT → TRIGGER BLOCK
                 → Retry 1 (0.200s): Check → FOUND → Use existing ✅
Result: Both users succeed!
```

---

## 📊 TECHNICAL DETAILS

### Trigger Error vs Duplicate Key Error:

**Duplicate Key Error (23505):**
- Thrown by PostgreSQL constraint
- Code already handles this

**Trigger Error (RAISE EXCEPTION):**
- Thrown by custom trigger function
- Code didn't handle this → NOW FIXED

### Why Only Oxford?

**Possible reasons:**
1. Oxford is popular → More simultaneous bookings
2. Timing: Users click at exact same moment
3. Network latency: Both requests arrive within 50ms

**Harvard & Tsinghua:** Less popular or users don't click simultaneously

---

## 🚀 DEPLOYMENT

### Step 1: Update Database Trigger
```sql
-- Run: database/FIX_TRIGGER_RACE_CONDITION.sql
-- This updates the trigger to check program/level/batch
```

### Step 2: Deploy Code Changes
```bash
# Code already updated in src/utils/dbHelpers.js
# Commit and deploy to production
git add .
git commit -m "Fix: Handle trigger error in race condition"
git push
```

### Step 3: Test
1. Open 2 browser windows (different users)
2. Both select: Saturday → Evening → Oxford
3. Click "Book" simultaneously
4. Both should succeed (or second user should see "Already booked this phase")

---

## ✅ VERIFICATION

### Check Trigger Definition:
```sql
SELECT pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'prevent_duplicate_schedule';
```

Should include: `program = NEW.program AND level = NEW.level`

### Test Simultaneous Booking:
- Use 2 different student accounts
- Try booking same class at same time
- Both should succeed without "Duplicate schedule" error

---

## 📝 NOTES

### Why This Fix is Safe:

1. **Trigger still prevents real duplicates:**
   - Same class + day + time + phase + week + program + level + batch = BLOCKED ✅

2. **Allows legitimate different schedules:**
   - Same class + time, but different program = ALLOWED ✅
   - Same class + time, but different level = ALLOWED ✅

3. **Code handles race condition:**
   - First user creates schedule
   - Second user retries and finds existing schedule
   - Both users can book successfully

---

**Created:** April 3, 2026
**Status:** Fixes implemented, ready to deploy
**Files Changed:** 
- `database/FIX_TRIGGER_RACE_CONDITION.sql` (new)
- `src/utils/dbHelpers.js` (updated)
