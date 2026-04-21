# Cara Debug Nama Siswa Tidak Sesuai di Teacher View

## Masalah
Nama siswa yang muncul di teacher view tidak sesuai / salah.

## Kemungkinan Penyebab

### 1. **Siswa dari Batch Lama Masih Ada**
- Siswa dari Batch 1 masih ter-booking di jadwal Batch 2
- Terjadi karena booking tidak dihapus saat reset batch

### 2. **Siswa Inactive Masih Muncul**
- Siswa yang sudah di-deactivate masih ter-booking
- Booking lama tidak dibersihkan

### 3. **Duplicate Students**
- Ada siswa dengan nama sama tapi ID berbeda
- Salah satu aktif, salah satu inactive

### 4. **Wrong Week Data**
- Teacher melihat data dari week yang salah
- Cache issue atau data tidak refresh

## Langkah Debug

### Step 1: Identifikasi Teacher ID
1. Login sebagai teacher
2. Buka browser console (F12)
3. Ketik: `localStorage.getItem('user')`
4. Copy teacher ID dari hasil

### Step 2: Jalankan Query Diagnostic
1. Buka Supabase SQL Editor
2. Buka file: `booking-system/database/DEBUG_TEACHER_STUDENT_NAMES.sql`
3. Replace `'TEACHER_ID_HERE'` dengan teacher ID yang didapat dari Step 1
4. Jalankan query satu per satu

### Step 3: Analisis Hasil

#### Query 1: Current Week & Batch
```
Hasil yang benar:
- current_week: 7 atau 8 (sesuai minggu sekarang)
- current_batch: 2
```

#### Query 2: Teacher Schedules
```
Cek:
- Apakah batch = 2? (bukan 1)
- Apakah week_number sesuai current week?
- Apakah ada jadwal duplicate?
```

#### Query 3: Bookings per Schedule
```
Cek:
- Apakah semua siswa batch = 2?
- Apakah semua siswa is_active = true?
- Apakah ada nama yang tidak dikenal?
```

#### Query 4: Wrong Batch Students
```
Jika ada hasil:
- Ini siswa dari batch lama yang masih ter-booking
- Perlu dihapus bookingnya
```

#### Query 5: Inactive Students
```
Jika ada hasil:
- Ini siswa inactive yang masih ter-booking
- Perlu dihapus bookingnya
```

#### Query 6: Duplicate Names
```
Jika ada hasil:
- Ada siswa dengan nama sama tapi ID berbeda
- Cek mana yang aktif, mana yang inactive
```

#### Query 7: Full Diagnostic
```
Lihat kolom 'issue':
- ⚠️ WRONG BATCH: Siswa dari batch lama
- ⚠️ INACTIVE: Siswa yang sudah di-deactivate
- ✅ OK: Siswa yang benar
```

## Solusi Berdasarkan Masalah

### Solusi 1: Hapus Booking dari Batch Lama
```sql
-- Hapus booking siswa dari batch yang salah
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules 
    WHERE teacher_id = 'TEACHER_ID_HERE'
    AND week_number = (SELECT current_week FROM settings WHERE id = 1)
)
AND user_id IN (
    SELECT id FROM users 
    WHERE batch != '2'  -- Hapus yang bukan batch 2
);
```

### Solusi 2: Hapus Booking Siswa Inactive
```sql
-- Hapus booking siswa yang inactive
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules 
    WHERE teacher_id = 'TEACHER_ID_HERE'
    AND week_number = (SELECT current_week FROM settings WHERE id = 1)
)
AND user_id IN (
    SELECT id FROM users 
    WHERE is_active = false
);
```

### Solusi 3: Update current_students Counter
```sql
-- Update counter setelah hapus booking
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE bookings.schedule_id = schedules.id
)
WHERE teacher_id = 'TEACHER_ID_HERE'
AND week_number = (SELECT current_week FROM settings WHERE id = 1);
```

### Solusi 4: Permanent Delete Duplicate Inactive Students
```sql
-- Hapus permanen siswa duplicate yang inactive
-- HATI-HATI: Ini permanent delete!
DELETE FROM users
WHERE id IN (
    SELECT u1.id
    FROM users u1
    INNER JOIN users u2 ON u1.full_name = u2.full_name AND u1.id != u2.id
    WHERE u1.is_active = false
    AND u2.is_active = true
    AND u1.role = 'student'
);
```

## Cara Test Setelah Fix

1. **Refresh Teacher Dashboard**
   - Logout teacher
   - Login kembali
   - Cek apakah nama siswa sudah benar

2. **Verify di Admin Dashboard**
   - Login sebagai admin
   - Buka Booking tab
   - Filter by teacher
   - Cek apakah booking sudah benar

3. **Check Database**
   - Jalankan Query 7 (Full Diagnostic) lagi
   - Pastikan semua siswa status = ✅ OK

## Prevention untuk Masa Depan

### 1. Saat Reset Batch
Pastikan jalankan query ini:
```sql
-- Hapus semua booking dari batch lama
DELETE FROM bookings
WHERE schedule_id IN (
    SELECT id FROM schedules WHERE batch = '1'
);

-- Hapus semua schedule dari batch lama
DELETE FROM schedules WHERE batch = '1';
```

### 2. Saat Deactivate Student
Pastikan hapus bookingnya juga:
```sql
-- Hapus booking siswa yang di-deactivate
DELETE FROM bookings
WHERE user_id = 'STUDENT_ID_HERE';
```

### 3. Regular Cleanup
Jalankan query ini setiap minggu:
```sql
-- Cleanup booking siswa inactive
DELETE FROM bookings
WHERE user_id IN (
    SELECT id FROM users WHERE is_active = false
);

-- Update counter
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) FROM bookings WHERE bookings.schedule_id = schedules.id
);
```

## Quick Fix Command

Jika ingin fix cepat tanpa investigasi detail:

```sql
-- QUICK FIX: Hapus semua booking yang bermasalah
BEGIN;

-- 1. Hapus booking siswa inactive
DELETE FROM bookings
WHERE user_id IN (SELECT id FROM users WHERE is_active = false);

-- 2. Hapus booking siswa dari batch lama
DELETE FROM bookings
WHERE user_id IN (SELECT id FROM users WHERE batch != '2');

-- 3. Update counter
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) FROM bookings WHERE bookings.schedule_id = schedules.id
)
WHERE week_number = (SELECT current_week FROM settings WHERE id = 1);

COMMIT;
```

## Catatan Penting

⚠️ **BACKUP DULU** sebelum menjalankan DELETE query!

```sql
-- Backup bookings
CREATE TABLE bookings_backup_20260421 AS
SELECT * FROM bookings;

-- Backup users
CREATE TABLE users_backup_20260421 AS
SELECT * FROM users;
```

Jika ada masalah, bisa restore:
```sql
-- Restore bookings
INSERT INTO bookings
SELECT * FROM bookings_backup_20260421;
```
