# 🔧 Batch Format Mismatch Fix

## 🎯 Masalah

Booking Faradilla tidak muncul di student view meskipun ada di database.

### Root Cause
**Batch format mismatch** antara users table dan schedules table:
- User batch: `"Batch 1"` (string dengan spasi)
- Schedule batch: `1` (integer/string tanpa prefix)
- Query filter: `"Batch 1" ≠ "1"` → tidak match!

### Dampak
- Student tidak bisa melihat booking mereka sendiri
- Filter batch di `getUserBookings()`, `getSchedules()`, `hasUserBookedPhase()` gagal

## ✅ Solusi

### 1. Fix di Code (DONE ✅)
Normalize batch format di semua query functions:

**File:** `src/utils/dbHelpers.js`

**Functions yang di-fix:**
1. `getUserBookings()` - Extract angka dari "Batch 1" → "1"
2. `getSchedules()` - Normalize batch filter
3. `hasUserBookedPhase()` - Normalize batch filter
4. `getOccupiedClassesByOtherPrograms()` - Normalize batch filter

**Logic:**
```javascript
if (batch) {
    // Extract number from "Batch 1" → "1"
    const batchNumber = batch.toString().replace(/[^0-9]/g, '');
    query = query.eq('batch', batchNumber);
}
```

### 2. Fix di Database (REQUIRED ⚠️)
Standardisasi format batch di database untuk konsistensi:

**File:** `database/STANDARDIZE_BATCH_TO_NUMBER.sql`

**Jalankan SQL ini di Supabase:**
```sql
-- Convert "Batch 1" to "1" in users table
UPDATE users
SET batch = TRIM(REPLACE(LOWER(batch), 'batch', ''))
WHERE batch ILIKE '%batch%';

-- Convert "Batch 1" to "1" in schedules table
UPDATE schedules
SET batch = TRIM(REPLACE(LOWER(batch), 'batch', ''))
WHERE batch ILIKE '%batch%';
```

## 📊 Verification

### Before Fix
```
User: Faradilla
- user.batch = "Batch 1"
- schedule.batch = "1"
- Filter result: ❌ MISMATCH → No bookings shown
```

### After Fix
```
User: Faradilla
- user.batch = "1" (standardized)
- schedule.batch = "1"
- Filter result: ✅ MATCH → Bookings shown correctly
```

## 🚀 Deployment Steps

1. ✅ **Code fix deployed** - Normalize batch di query functions (DONE)
2. ⚠️ **Database fix REQUIRED** - Jalankan `STANDARDIZE_BATCH_TO_NUMBER.sql` di Supabase
3. ✅ **Test** - Login sebagai Faradilla, booking seharusnya muncul

## 📝 Testing Checklist

- [ ] Jalankan SQL standardization di Supabase
- [ ] Login sebagai student dengan batch "1"
- [ ] Cek tab "W9" (next week)
- [ ] Booking Tuesday & Friday Harvard Class harus muncul
- [ ] Cek "Booking Details" tab - harus tampil 2 bookings
- [ ] Test booking baru - harus bisa book tanpa error

## 🎯 Standard Format

**Batch format yang benar:**
- ✅ `"1"` - Angka saja
- ✅ `"2"` - Angka saja
- ✅ `"3"` - Angka saja
- ❌ `"Batch 1"` - SALAH (ada prefix)
- ❌ `"batch 1"` - SALAH (ada prefix)

## 🔍 Related Files

- `src/utils/dbHelpers.js` - Query functions dengan batch filter
- `database/STANDARDIZE_BATCH_TO_NUMBER.sql` - Database standardization script (REQUIRED)
- `database/CHECK_FARADILLA_BATCH.sql` - Verification query

## 💡 Lesson Learned

**Always standardize data format!**
- Gunakan format konsisten untuk batch (angka saja: "1", "2", "3")
- Validate input saat create user/schedule
- Add database constraint untuk enforce format
- Normalize di code untuk backward compatibility
