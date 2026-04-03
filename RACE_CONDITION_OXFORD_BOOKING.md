# Race Condition: Oxford Booking - User Pertama Bisa, User Kedua Gagal

## 🔍 PROBLEM

**Situasi:**
- Jadwal: Oxford Saturday Evening Week 2
- User A: Booking → ✅ BERHASIL
- User B: Booking (hampir bersamaan) → ❌ ERROR "Duplicate schedule detected!"

**Kondisi sama:** Program, Level, Phase, Day, Time, Week semua sama

---

## 🎯 ROOT CAUSE: Race Condition + Trigger Timing

### Timeline yang Terjadi:

**User A (0.000s):**
```
1. getOrCreateSchedule() check schedule → NOT FOUND
2. INSERT new schedule → IN PROGRESS...
```

**User B (0.050s) - hampir bersamaan:**
```
1. getOrCreateSchedule() check schedule → NOT FOUND (User A belum commit)
2. INSERT new schedule → TRIGGER FIRES!
3. Trigger check: "Ada schedule lain dengan class/day/time/phase/week yang sama!"
4. RAISE EXCEPTION: "Duplicate schedule detected!"
5. ❌ ERROR - tidak bisa retry
```

**User A (0.100s):**
```
3. INSERT complete → ✅ SUCCESS
4. Create booking → ✅ SUCCESS
```

---

## 🔧 WHY CODE RETRY DOESN'T WORK

### Current Code (line 303-310):
```javascript
if (createError.code === '23505' && retryCount < 3) {
    // Retry on duplicate key error
    return getOrCreateSchedule(scheduleData, retryCount + 1);
}
```

**Problem:**
- Trigger error code: **NOT '23505'** (duplicate key)
- Trigger error: **RAISE EXCEPTION** (custom error)
- Code doesn't catch trigger error → No retry → User sees error

---

## ✅ SOLUTION 1: Update Trigger to Allow Race Condition

**Current trigger:**
```sql
CREATE OR REPLACE FUNCTION check_duplicate_schedule()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM schedules
        WHERE class_id = NEW.class_id
          AND day = NEW.day
          AND time_slot = NEW.time_slot
          AND phase = NEW.phase
          AND week_number = NEW.week_number
          AND id != COALESCE(NEW.id, -1)
    ) THEN
        RAISE EXCEPTION 'Duplicate schedule detected!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Fix: Add program/level/batch check:**
```sql
CREATE OR REPLACE FUNCTION check_duplicate_schedule()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM schedules
        WHERE class_id = NEW.class_id
          AND day = NEW.day
          AND time_slot = NEW.time_slot
          AND phase = NEW.phase
          AND week_number = NEW.week_number
          AND program = NEW.program              -- ✅ ADD
          AND level = NEW.level                  -- ✅ ADD
          AND COALESCE(batch, 0) = COALESCE(NEW.batch, 0)  -- ✅ ADD
          AND id != COALESCE(NEW.id, -1)
    ) THEN
        RAISE EXCEPTION 'Duplicate schedule detected!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Result:** Trigger only blocks if EXACT match (including program/level/batch)

---

## ✅ SOLUTION 2: Update Code to Handle Trigger Error

**Add trigger error handling:**
```javascript
if (createError) {
    // Handle duplicate key error (race condition)
    if (createError.code === '23505' && retryCount < 3) {
        console.log('⚠️ Duplicate key detected, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return getOrCreateSchedule(scheduleData, retryCount + 1);
    }
    
    // ✅ ADD: Handle trigger error (duplicate schedule)
    if (createError.message?.includes('Duplicate schedule') && retryCount < 3) {
        console.log('⚠️ Duplicate schedule detected by trigger, retrying...');
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return getOrCreateSchedule(scheduleData, retryCount + 1);
    }
    
    console.error('❌ Error creating schedule:', createError);
    throw createError;
}
```

---

## 🧪 VERIFICATION

### Test Race Condition:
1. Open 2 browser windows (different users, same program/level)
2. Both select: Saturday → Evening → Oxford Class
3. Click "Book" at the same time (within 1 second)

**Before Fix:**
- User 1: ✅ Success
- User 2: ❌ Error "Duplicate schedule detected!"

**After Fix:**
- User 1: ✅ Success (creates schedule)
- User 2: ✅ Success (finds existing schedule, retries)

---

## 📊 WHY ONLY OXFORD?

**Possible reasons:**
1. Oxford is popular → More simultaneous bookings
2. Oxford has empty duplicates → Trigger more sensitive
3. Other classes already have schedules → No race condition

---

## 🚀 RECOMMENDED FIX

**Priority 1:** Update trigger to check program/level/batch (SOLUTION 1)
- Prevents false positives
- Allows different programs to use same class/time

**Priority 2:** Add trigger error handling in code (SOLUTION 2)
- Handles race condition gracefully
- Retries instead of showing error to user

**Both fixes together = Best solution!**

---

**Created:** April 3, 2026
**Status:** Root cause identified, 2 solutions provided
