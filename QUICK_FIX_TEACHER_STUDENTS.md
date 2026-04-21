# Quick Fix: Nama Siswa Salah di Teacher View

## Masalah
Teacher melihat nama siswa yang salah / tidak sesuai di dashboard mereka.

## Penyebab Umum
1. Siswa dari Batch 1 (lama) masih ter-booking di jadwal Batch 2 (sekarang)
2. Siswa yang sudah di-deactivate masih muncul
3. Data tidak ter-update setelah reset batch

## Solusi Cepat

### Opsi 1: Jalankan Query Fix (RECOMMENDED)

1. **Buka Supabase SQL Editor**
2. **Copy paste query ini:**

```sql
-- QUICK FIX: Remove wrong students from teacher view
BEGIN;

-- Delete bookings from Batch 1 (old batch)
DELETE FROM bookings
WHERE user_id IN (
    SELECT u.id 
    FROM users u
    WHERE u.batch = '1'  -- Batch 1 (old)
    AND u.role = 'student'
)
AND schedule_id IN (
    SELECT id FROM schedules 
    WHERE week_number = (SELECT current_week FROM settings WHERE id = 1)
    AND year = 2026
);

-- Delete bookings from inactive students
DELETE FROM bookings
WHERE user_id IN (
    SELECT id FROM users 
    WHERE is_active = false
    AND role = 'student'
)
AND schedule_id IN (
    SELECT id FROM schedules 
    WHERE week_number = (SELECT current_week FROM settings WHERE id = 1)
    AND year = 2026
);

-- Update counter
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE bookings.schedule_id = schedules.id
)
WHERE week_number = (SELECT current_week FROM settings WHERE id = 1)
AND year = 2026;

COMMIT;
```

3. **Klik Run**
4. **Refresh teacher dashboard** (logout & login kembali)

### Opsi 2: Jalankan File SQL Lengkap

1. Buka file: `booking-system/database/FIX_TEACHER_WRONG_STUDENTS.sql`
2. Copy semua isi file
3. Paste di Supabase SQL Editor
4. Klik Run
5. Lihat hasil verifikasi di output

## Verifikasi Setelah Fix

Jalankan query ini untuk cek apakah masih ada siswa yang salah:

```sql
-- Check if any wrong students still exist
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.teacher_name,
    u.student_id,
    u.full_name,
    u.batch as student_batch,
    s.batch as schedule_batch,
    u.is_active,
    CASE 
        WHEN u.batch != s.batch THEN '❌ WRONG BATCH'
        WHEN u.is_active = false THEN '❌ INACTIVE'
        ELSE '✅ OK'
    END as status
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
LEFT JOIN users u ON b.user_id = u.id
WHERE s.week_number = (SELECT current_week FROM settings WHERE id = 1)
    AND s.year = 2026
    AND (u.batch != s.batch OR u.is_active = false)
ORDER BY s.day, s.time_slot, u.full_name;
```

**Hasil yang benar:** Query tidak mengembalikan hasil (0 rows)

## Test di Teacher Dashboard

1. **Logout teacher** (jika sedang login)
2. **Login kembali** sebagai teacher
3. **Cek student list** di dashboard
4. **Verify:**
   - Semua siswa adalah Batch 2
   - Semua siswa aktif
   - Tidak ada nama yang tidak dikenal

## Jika Masih Ada Masalah

### Debug Lebih Detail:

1. Buka file: `booking-system/database/DEBUG_TEACHER_STUDENT_NAMES.sql`
2. Replace `'TEACHER_ID_HERE'` dengan teacher ID yang bermasalah
3. Jalankan query satu per satu untuk investigasi

### Atau Baca Panduan Lengkap:

Buka file: `booking-system/CARA_DEBUG_NAMA_SISWA_TUTOR.md`

## Prevention

Untuk mencegah masalah ini terulang:

### 1. Saat Reset Batch
Selalu jalankan cleanup booking:
```sql
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules WHERE batch = '1'  -- batch lama
);
```

### 2. Saat Deactivate Student
Hapus bookingnya juga:
```sql
DELETE FROM bookings WHERE user_id = 'STUDENT_ID';
```

### 3. Weekly Cleanup (Optional)
Buat scheduled job untuk cleanup otomatis setiap minggu.

## Catatan Penting

⚠️ **Query ini akan menghapus booking yang salah**
- Siswa dari batch lama akan kehilangan booking mereka
- Siswa inactive akan kehilangan booking mereka
- Ini adalah behavior yang diinginkan untuk fix masalah

✅ **Aman untuk production**
- Query hanya menghapus data yang memang salah
- Tidak mempengaruhi data yang benar
- Counter akan di-update otomatis

## Estimasi Waktu
- Jalankan query: 5-10 detik
- Refresh teacher dashboard: 2-3 detik
- Total: < 1 menit

## Status
- [x] Query fix dibuat
- [x] Debug tool dibuat
- [x] Panduan lengkap dibuat
- [ ] **TODO: Jalankan query fix di production**
- [ ] **TODO: Test di teacher dashboard**
- [ ] **TODO: Verify semua teacher sudah benar**
