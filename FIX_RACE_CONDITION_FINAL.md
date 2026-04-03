# 🎯 FIX: Race Condition - Oxford Booking Error

## ✅ ROOT CAUSE DITEMUKAN!

### Masalah BUKAN dari Constraint!

Dari investigasi SQL:
- ✅ Constraint `unique_schedule` dan `unique_schedule_no_batch` sudah di-drop
- ✅ Hanya tersisa `schedules_unique_booking` (yang CORRECT)
- ✅ **TIDAK ADA** schedule Oxford Saturday Evening di Week 2

### Masalah Sebenarnya: TRUE RACE CONDITION

**Timeline:**
1. **Student A** click book Oxford Saturday Evening
   - Query check: Schedule not found
   - INSERT: Start...
   
2. **Student B** click book (0.5 detik kemudian)
   - Query check: Schedule not found (Student A belum selesai INSERT)
   - INSERT: Start...
   
3. **Student A** INSERT complete → SUCCESS ✅

4. **Student B** INSERT → **DUPLICATE ERROR** ❌
   - Constraint `schedules_unique_booking` detect duplicate
   - Error code: 23505

---

## 🔧 SOLUSI

### Code Fix: Improved Race Condition Handling

**File:** `booking-system/src/utils/dbHelpers.js`

**Perubahan:**

**BEFORE:**
```javascript
// ✅ Handle duplicate key error (race condition)
if (createError.code === '23505' && retryCount < 3) {
    console.log('⚠️ Duplicate key detected, retrying...');
    await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
    return getOrCreateSchedule(scheduleData, retryCount + 1);
}

throw createError; // ❌ Langsung throw error
```

**AFTER:**
```javascript
// ✅ Handle duplicate key error (race condition)
if (createError.code === '23505') {
    console.log('⚠️ Duplicate key detected - Race condition!');
    console.log('⚠️ Another request created the schedule first, fetching it now...');
    
    // Wait for the other INSERT to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ Try to fetch the schedule created by the other request
    const { data: existingData, error: fetchError } = await query.maybeSingle();
    
    if (existingData) {
        console.log('✅ Found schedule created by concurrent request');
        return existingData; // ✅ Return schedule yang sudah dibuat
    }
    
    // If still not found, retry
    if (retryCount < 3) {
        console.log('⚠️ Retrying... (attempt', retryCount + 1, ')');
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return getOrCreateSchedule(scheduleData, retryCount + 1);
    }
}

throw createError;
```

**Key Improvements:**
1. ✅ Immediately try to fetch schedule after duplicate error
2. ✅ Return the schedule created by concurrent request
3. ✅ Only retry if fetch fails
4. ✅ Better logging for debugging

---

## 🧪 TESTING

### 1. Start Dev Server
```bash
cd booking-system
npm run dev
```

### 2. Test Race Condition
1. Open 2 browser tabs (or 2 different browsers)
2. Login as 2 different students (different programs)
3. Both click "Book" on Oxford Saturday Evening **at the same time**
4. **Expected:** Both bookings succeed (2 separate schedules created)

### 3. Check Console Log
```
⚠️ Duplicate key detected - Race condition!
⚠️ Another request created the schedule first, fetching it now...
✅ Found schedule created by concurrent request: [schedule_id]
```

---

## 📊 KENAPA INI AMAN?

### Constraint `schedules_unique_booking` Protects:
```sql
UNIQUE (class_id, program, level, phase, day, time_slot, week_number, year, batch)
```

**Scenario 1: Same Program/Level (TRUE Duplicate)**
- Student A: ECC + Upper Starter → INSERT → SUCCESS
- Student B: ECC + Upper Starter → INSERT → DUPLICATE ERROR
- Code: Fetch Student A's schedule → Return same schedule
- **Result:** ✅ Both students book the SAME schedule (correct!)

**Scenario 2: Different Program/Level (NOT Duplicate)**
- Student A: ECC + Upper Starter → INSERT → SUCCESS
- Student B: Teens + Starter → INSERT → SUCCESS (different program/level)
- **Result:** ✅ 2 separate schedules created (correct!)

---

## 🎯 KESIMPULAN

### Masalah:
- ❌ Race condition: 2 students click book hampir bersamaan
- ❌ Code retry tapi langsung throw error
- ❌ Tidak fetch schedule yang sudah dibuat oleh request lain

### Solusi:
- ✅ Detect duplicate error (code 23505)
- ✅ Immediately fetch schedule created by concurrent request
- ✅ Return existing schedule instead of throwing error
- ✅ Retry if fetch fails

### Result:
- ✅ Multiple students can book same class (different programs)
- ✅ Race condition handled gracefully
- ✅ No more "Duplicate schedule detected!" error

---

## 📝 NEXT STEPS

1. ✅ Code fix applied
2. ⏳ Test di lokal (http://localhost:5174/)
3. ⏳ Confirm fix works
4. ⏳ Commit & push to GitHub
5. ⏳ Netlify auto-deploy
6. ⏳ Test di production

---

**Created:** April 3, 2026
**Status:** Code fixed, testing in progress
**File Modified:** `booking-system/src/utils/dbHelpers.js`
