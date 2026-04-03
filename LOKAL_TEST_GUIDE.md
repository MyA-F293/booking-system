# 🧪 Lokal Test Guide - Oxford Booking Fix

## 🎯 MASALAH YANG AKAN DIPERBAIKI

1. ❌ Oxford Saturday Evening tidak bisa dibook - error "Duplicate schedule detected!"
2. ❌ Batch 1 schedules masih muncul (9 empty schedules)
3. ❌ EYSA26020009 bookings tidak muncul di UI
4. ❌ Race condition - user A bisa book, user B tidak bisa

---

## ✅ SOLUSI (1 FILE SQL SAJA)

### Jalankan file ini di Supabase SQL Editor:

```
booking-system/database/FIX_ALL_ISSUES_NOW.sql
```

**File ini akan:**
1. Disable trigger yang terlalu strict
2. Delete empty schedules di Week 2
3. Delete semua Batch 1 schedules (9 schedules)
4. Cancel bookings EYSA26020009 (2 bookings di Week 1)
5. Verify semua fix berhasil

---

## 🧪 TESTING STEPS

### 1. Jalankan SQL Fix
- Buka Supabase Dashboard
- SQL Editor
- Copy paste isi file `FIX_ALL_ISSUES_NOW.sql`
- Run
- Check output - semua harus ✅

### 2. Hard Refresh Browser
```
Ctrl + Shift + R
```

### 3. Test Booking Oxford Saturday Evening
1. Login sebagai student (any student)
2. Pilih Saturday → Evening → Oxford
3. Click "Book"
4. **Expected:** ✅ Booking berhasil, tidak ada error

### 4. Test Race Condition (2 Students Bersamaan)
1. Open 2 browser windows (Chrome + Firefox)
2. Login sebagai 2 students berbeda
3. Booking Oxford Saturday Evening **bersamaan**
4. **Expected:** ✅ Kedua booking berhasil

### 5. Test EYSA26020009
1. Login sebagai EYSA26020009
2. Check booking page
3. **Expected:** ✅ Tidak ada bookings (sudah di-cancel)
4. Try booking new class
5. **Expected:** ✅ Bisa booking normal

---

## 📊 VERIFICATION QUERIES

### Check Oxford Saturday Evening:
```sql
SELECT 
    program,
    level,
    COALESCE(batch, 'NULL') as batch,
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
- 1-2 schedules (different program/level)
- current_students > 0
- No Batch 1
- No empty schedules

### Check Batch 1:
```sql
SELECT COUNT(*) as batch_1_schedules
FROM schedules
WHERE batch = '1';
```

**Expected:** 0 schedules

### Check EYSA26020009:
```sql
SELECT COUNT(*) as bookings
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE u.student_id = 'EYSA26020009';
```

**Expected:** 0 bookings

---

## ❓ JIKA MASIH ERROR

### Error: "Duplicate schedule detected!"
→ Trigger masih enabled, jalankan:
```sql
ALTER TABLE schedules DISABLE TRIGGER prevent_duplicate_schedule;
```

### Error: "COALESCE types cannot be matched"
→ Jangan update trigger, cukup disable saja

### Booking tidak muncul di UI
→ Check week filter di code (line 322-323 BookingSystemDB.jsx)

---

## 🔧 OPTIONAL: Fix smart_copy_week

**Setelah booking works**, jalankan:
```
booking-system/database/FIX_SMART_COPY_WEEK_BATCH.sql
```

**What it does:**
- Update smart_copy_week function
- Set `batch = NULL` instead of copying from source
- Prevent Batch 1 schedules dari muncul lagi

---

## ⚠️ JANGAN DEPLOY DULU

Test lokal sampai yakin semua works!

---

**Created:** April 3, 2026
**Status:** Ready to test
**Files:** 
- `database/FIX_ALL_ISSUES_NOW.sql` (main fix)
- `database/FIX_SMART_COPY_WEEK_BATCH.sql` (optional, run after)
