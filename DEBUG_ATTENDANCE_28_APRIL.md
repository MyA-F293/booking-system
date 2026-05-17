# Debug Attendance Issue - 28 April (Fathir)

## Masalah
- Siswa (Fathir) komplain hadir tanggal 28 April
- Di report attendance tercatat absent
- Nama Fathir tidak muncul di daftar attendance tanggal 28 April

## Kemungkinan Penyebab

### 1. **Siswa Booking di Schedule yang Berbeda**
   - Fathir mungkin booking di class/schedule lain pada tanggal 28 April
   - Teacher yang mark attendance berbeda dengan schedule yang Fathir booking

### 2. **Mismatch antara Booking dan Schedule**
   - Fathir punya booking untuk tanggal 28 April
   - Tapi schedule_id di booking tidak match dengan schedule yang teacher buka untuk mark attendance

### 3. **Data Attendance Tidak Tersimpan**
   - Teacher sudah mark present
   - Tapi data tidak tersimpan ke database (error saat submit)

### 4. **Week Number Mismatch**
   - Booking Fathir ada di week yang berbeda
   - Schedule yang dibuka teacher ada di week lain

### 5. **Duplicate Schedule Issue**
   - Ada 2 schedule untuk tanggal 28 April (duplicate)
   - Teacher mark attendance di schedule A
   - Fathir booking di schedule B

## Query untuk Investigasi

### Step 1: Cari Booking Fathir tanggal 28 April
```sql
-- Cari semua booking atas nama Fathir di bulan April
SELECT 
  b.id as booking_id,
  b.student_id,
  s.name as student_name,
  b.schedule_id,
  sch.date as schedule_date,
  sch.time,
  sch.class_name,
  sch.teacher_name,
  sch.week,
  b.status,
  b.created_at
FROM bookings b
JOIN students s ON b.student_id = s.id
JOIN schedules sch ON b.schedule_id = sch.id
WHERE s.name ILIKE '%fathir%'
  AND sch.date >= '2026-04-01'
  AND sch.date <= '2026-04-30'
ORDER BY sch.date, sch.time;
```

### Step 2: Cari Attendance Fathir tanggal 28 April
```sql
-- Cari attendance record untuk Fathir di tanggal 28 April
SELECT 
  a.id as attendance_id,
  a.student_id,
  s.name as student_name,
  a.schedule_id,
  sch.date as schedule_date,
  sch.time,
  sch.class_name,
  sch.teacher_name,
  a.status,
  a.marked_at,
  a.marked_by
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN schedules sch ON a.schedule_id = sch.id
WHERE s.name ILIKE '%fathir%'
  AND sch.date = '2026-04-28'
ORDER BY sch.time;
```

### Step 3: Cari Semua Schedule tanggal 28 April
```sql
-- Lihat semua schedule tanggal 28 April untuk cek duplicate
SELECT 
  id as schedule_id,
  date,
  time,
  class_name,
  teacher_name,
  room,
  week,
  phase,
  created_at,
  -- Hitung berapa booking di schedule ini
  (SELECT COUNT(*) FROM bookings WHERE schedule_id = schedules.id) as total_bookings,
  -- Hitung berapa attendance di schedule ini
  (SELECT COUNT(*) FROM attendance WHERE schedule_id = schedules.id) as total_attendance
FROM schedules
WHERE date = '2026-04-28'
ORDER BY time, class_name;
```

### Step 4: Cross-check Booking vs Attendance
```sql
-- Cari booking yang tidak punya attendance record
SELECT 
  b.id as booking_id,
  s.name as student_name,
  s.student_id as student_number,
  sch.date,
  sch.time,
  sch.class_name,
  sch.teacher_name,
  b.schedule_id,
  CASE 
    WHEN a.id IS NULL THEN '❌ NO ATTENDANCE RECORD'
    ELSE '✅ Has Attendance: ' || a.status
  END as attendance_status
FROM bookings b
JOIN students s ON b.student_id = s.id
JOIN schedules sch ON b.schedule_id = sch.id
LEFT JOIN attendance a ON a.student_id = b.student_id AND a.schedule_id = b.schedule_id
WHERE s.name ILIKE '%fathir%'
  AND sch.date = '2026-04-28'
  AND b.status = 'confirmed';
```

## Solusi Berdasarkan Hasil

### Jika: Booking ada tapi Attendance tidak ada
**Penyebab:** Teacher tidak mark attendance untuk siswa ini, atau data tidak tersimpan

**Solusi:**
```sql
-- Insert attendance record manual
INSERT INTO attendance (student_id, schedule_id, status, marked_at, marked_by)
SELECT 
  b.student_id,
  b.schedule_id,
  'present', -- Ganti dengan status yang benar
  NOW(),
  'admin' -- Atau teacher_id yang sesuai
FROM bookings b
JOIN students s ON b.student_id = s.id
JOIN schedules sch ON b.schedule_id = sch.id
WHERE s.name ILIKE '%fathir%'
  AND sch.date = '2026-04-28'
  AND b.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1 FROM attendance a 
    WHERE a.student_id = b.student_id 
    AND a.schedule_id = b.schedule_id
  );
```

### Jika: Attendance ada tapi status = 'absent'
**Penyebab:** Teacher salah mark, atau siswa memang tidak hadir

**Solusi:**
```sql
-- Update status attendance dari absent ke present
UPDATE attendance
SET 
  status = 'present',
  marked_at = NOW(),
  marked_by = 'admin_correction'
WHERE student_id = (SELECT id FROM students WHERE name ILIKE '%fathir%' LIMIT 1)
  AND schedule_id IN (
    SELECT id FROM schedules WHERE date = '2026-04-28'
  )
  AND status = 'absent';
```

### Jika: Ada duplicate schedule
**Penyebab:** Schedule duplicate, booking di schedule A, attendance di schedule B

**Solusi:** Lihat `DUPLICATE_SCHEDULE_FIX.md` atau jalankan:
```sql
-- Merge attendance dari duplicate schedule
-- (Harus hati-hati, cek dulu mana schedule yang benar)
```

## Action Plan

1. **Jalankan Query Step 1-4** untuk investigasi
2. **Screenshot hasil query** dan kirim ke saya
3. **Identifikasi penyebab** berdasarkan hasil
4. **Jalankan solusi yang sesuai**
5. **Verify** dengan cek attendance report lagi

## Notes
- Tanggal 28 April 2026 = Selasa
- Pastikan timezone correct (WIB/WITA/WIT)
- Cek juga apakah ada issue dengan week number calculation
