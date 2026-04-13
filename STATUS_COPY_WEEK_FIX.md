# 📊 Status Copy Week Fix

## 🎯 Quick Check

Untuk cek apakah fix sudah di-install atau belum:

### Step 1: Jalankan Query Check

Copy paste ke Supabase SQL Editor:

**File:** `database/CHECK_COPY_WEEK_FUNCTION_STATUS.sql`

### Step 2: Lihat Hasil STEP 3 (Function Source Code)

Cari bagian ini di hasil query:

```sql
-- Cari bagian ini:
SELECT id INTO existing_schedule_id
FROM schedules
WHERE week_number = target_week_param
  AND year = 2026
  AND class_id = source_schedule.class_id  -- ← INI YANG PENTING!
```

---

## ✅ Jika SUDAH DI-FIX

**Ciri-ciri:**
- Ada baris: `AND class_id = source_schedule.class_id`
- Function menggunakan `class_id` sebagai PRIMARY matching key
- Ada comment: `-- PRIMARY: Match by class_id`

**Artinya:**
- ✅ Function sudah benar
- ✅ Class mapping sudah di-fix
- ❌ Masalah siswa hilang BUKAN dari function

**Next Steps:**
1. Jalankan `DEBUG_MISSING_STUDENT_AFTER_COPY.sql`
2. Cari tahu kenapa siswa tidak ter-copy
3. Kemungkinan:
   - Manual delete booking
   - Jadwal target tidak ter-create
   - Booking status bukan 'confirmed'

---

## ❌ Jika BELUM DI-FIX

**Ciri-ciri:**
- TIDAK ada baris: `AND class_id = source_schedule.class_id`
- Function pakai `class_name` atau hanya `day, time_slot`
- Tidak ada comment tentang class_id

**Artinya:**
- ❌ Function masih buggy
- ❌ Siswa bisa pindah class setelah copy
- ❌ Booking bisa hilang atau salah mapping

**Next Steps:**
1. **INSTALL FIX SEKARANG!**
2. File: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
3. Copy paste ke Supabase SQL Editor
4. Execute
5. Test dengan copy week lagi

---

## 🔍 Cara Cek Manual (Tanpa Query)

### Method 1: Lihat di Supabase Dashboard

1. Buka Supabase Dashboard
2. Klik "Database" → "Functions"
3. Cari function `copy_week_schedules`
4. Klik untuk lihat source code
5. Cari kata "class_id" di dalam function

### Method 2: Test Langsung

1. Backup data dulu
2. Copy week 1 ke week 3 (week kosong)
3. Jalankan verification query:

```sql
-- Cek apakah ada siswa yang pindah class
SELECT 
    COUNT(*) as total_students,
    SUM(CASE WHEN s1.class_id != s2.class_id THEN 1 ELSE 0 END) as class_changed
FROM bookings b1
JOIN schedules s1 ON b1.schedule_id = s1.id
JOIN bookings b2 ON b2.user_id = b1.user_id
JOIN schedules s2 ON b2.schedule_id = s2.id
WHERE s1.week_number = 1
  AND s2.week_number = 3
  AND s1.year = 2026
  AND s2.year = 2026;
```

**Hasil:**
- `class_changed = 0` → ✅ FIXED
- `class_changed > 0` → ❌ BUGGY

---

## 📋 Summary

| Status | Ciri-ciri | Action |
|--------|-----------|--------|
| ✅ FIXED | Ada `class_id = source_schedule.class_id` | Debug masalah lain |
| ❌ BUGGY | Tidak ada `class_id` matching | Install fix sekarang |
| ❓ UNKNOWN | Function tidak ditemukan | Install fix dari awal |

---

## 🚀 Quick Install Fix

Jika belum di-fix, jalankan ini:

```sql
-- File: database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql
-- Copy paste seluruh isi file ke Supabase SQL Editor
-- Execute
```

Atau baca guide lengkap di:
- `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`
- `QUICK_TEST_COPY_WEEK_FIX.md`

---

## 🔗 Related Files

- Check Status: `database/CHECK_COPY_WEEK_FUNCTION_STATUS.sql`
- Install Fix: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
- Debug Siswa Hilang: `database/DEBUG_MISSING_STUDENT_AFTER_COPY.sql`
- Verification: `database/VERIFY_CLASS_CHANGE_SIMPLE.sql`

---

**NEXT STEP**: Jalankan `CHECK_COPY_WEEK_FUNCTION_STATUS.sql` dan kasih tau hasilnya!
