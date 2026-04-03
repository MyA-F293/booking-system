# 🧪 Lokal Test Plan - Oxford Booking Fix

## 🎯 MASALAH

1. **Oxford Saturday Evening tidak bisa dibook** - error "Duplicate schedule detected!"
2. **Batch 1 schedules masih muncul** - 9 empty schedules (0 students)
3. **EYSA26020009 bookings tidak muncul** - bookings di Week 1, UI hanya load Week 2-3
4. **Trigger terlalu strict** - block booking yang seharusnya valid

---

## ✅ SOLUSI SEDERHANA (3 QUERY)

### Query 1: Disable Trigger
```sql
ALTER TABLE schedules DISABLE TRIGGER prevent_duplicate_schedule;
```

**Kenapa?**
- Trigger redundant (code sudah ada duplicate checking)
- Trigger terlalu strict (tidak check program/level/batch)
- Trigger menyebabkan false positive

### Query 2: Delete Empty Schedules (Week 2)
```sql
DELETE FROM schedules
WHERE week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Kenapa?**
- Empty schedules menyebabkan trigger block booking baru
- System akan create schedule baru otomatis saat ada yang booking

### Query 3: Delete ALL Batch 1 Schedules
```sql
DELETE FROM schedules
WHERE batch = '1'
  AND current_students = 0;
```

**Kenapa?**
- Batch 1 students sudah dihapus
- 9 empty Batch 1 schedules masih ada
- smart_copy_week terus copy Batch 1 ke week baru

---

## 🧪 TESTING STEPS

### 1. Jalankan 3 query di atas di Supabase SQL Editor

### 2. Test Booking (Lokal)
1. Hard refresh browser: `Ctrl + Shift + R`
2. Login sebagai student (any student)
3. Pilih Saturday → Evening → Oxford
4. Click "Book"
5. **Expected:** ✅ Booking berhasil, tidak ada error

### 3. Test dengan Multiple Students (Race Condition)
1. Open 2 browser windows (Chrome + Firefox)
2. Login sebagai 2 students berbeda
3. Booking Oxford Saturday Evening **bersamaan** (click book hampir bersamaan)
4. **Expected:** ✅ Kedua booking berhasil, tidak ada duplicate error

### 4. Verify Database
```sql
-- Check Oxford Saturday Evening schedules
SELECT 
    program,
    level,
    batch,
    current_students,
    max_students
FROM schedules
WHERE class_id = (SELECT id FROM classes WHERE name = 'Oxford Class')
  AND day = 'saturday'
  AND time_slot = 'evening'
  AND week_number = 2
  AND year = 2026;
```

**Expected:**
- 1 schedule per program/level combination
- current_students > 0
- No empty schedules
- No Batch 1 schedules

---

## 🔧 OPTIONAL: Fix smart_copy_week (Prevent Future Issues)

**File:** `booking-system/database/FIX_SMART_COPY_WEEK_BATCH.sql`

**What it does:**
- Update smart_copy_week function
- Set `batch = NULL` instead of copying from source
- Prevent old batch values from being copied

**Run this AFTER testing booking works!**

---

## 📋 CHECKLIST

- [ ] Query 1: Disable trigger
- [ ] Query 2: Delete empty schedules Week 2
- [ ] Query 3: Delete all Batch 1 schedules
- [ ] Hard refresh browser
- [ ] Test booking Oxford Saturday Evening
- [ ] Test dengan 2 students bersamaan
- [ ] Verify database (no empty schedules)
- [ ] (Optional) Fix smart_copy_week function

---

## ⚠️ JANGAN DEPLOY DULU

Test lokal dulu sampai yakin semua works!

---

**Created:** April 3, 2026
**Status:** Ready to test
**Priority:** HIGH
