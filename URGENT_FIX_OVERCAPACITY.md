## 🚨 URGENT: Fix Overcapacity Classes - Panduan Cepat

Masalah terjadi karena script `COMPREHENSIVE_DUPLICATE_FIX.sql` salah merge schedule yang sebenarnya berbeda.

### 📊 Situasi Sekarang:

- **Oxford Friday Afternoon**: 18 siswa (harusnya max 10) ❌
- **Oxford Tuesday Afternoon**: 17 siswa (harusnya max 10) ❌  
- **Harvard Friday Afternoon**: 14 siswa (harusnya max 10) ❌
- **Harvard Monday Afternoon**: 11 siswa (harusnya max 10) ❌

### 🎯 Solusi: Split ke Multiple Schedules

Saya sudah buatkan 2 cara fix:

---

## Cara 1: Manual Split (Recommended - Lebih Aman)

Jalankan query ini satu per satu di Supabase SQL Editor.

### Oxford Friday Afternoon (18 siswa → 10 + 8)

```sql
-- 1. Buat schedule baru untuk Evening
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, batch, current_students)
SELECT 
    class_id, 'friday', 'evening', phase, 9, 2026, program, level, '1', 0
FROM schedules
WHERE id = '152e36a2-68ee-40dd-91c3-fe55ddb1a5da';

-- 2. Lihat ID schedule baru yang dibuat
SELECT id, day, time_slot, current_students 
FROM schedules 
WHERE day = 'friday' AND time_slot = 'evening' AND week_number = 9
ORDER BY created_at DESC LIMIT 1;

-- 3. Pindahkan 8 siswa terakhir ke evening (ganti <ID_BARU> dengan hasil step 2)
UPDATE bookings
SET schedule_id = '<ID_BARU>'
WHERE id IN (
    SELECT b.id FROM bookings b
    WHERE b.schedule_id = '152e36a2-68ee-40dd-91c3-fe55ddb1a5da'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC LIMIT 8
);

-- 4. Update current_students
UPDATE schedules SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) WHERE id IN ('152e36a2-68ee-40dd-91c3-fe55ddb1a5da', '<ID_BARU>');
```

### Oxford Tuesday Afternoon (17 siswa → 10 + 7)

```sql
-- 1. Buat schedule baru
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, batch, current_students)
SELECT 
    class_id, 'tuesday', 'evening', phase, 9, 2026, program, level, '1', 0
FROM schedules
WHERE id = '4b082a79-d5bc-4bee-8246-36ffc7df1981';

-- 2. Lihat ID baru
SELECT id FROM schedules 
WHERE day = 'tuesday' AND time_slot = 'evening' AND week_number = 9
ORDER BY created_at DESC LIMIT 1;

-- 3. Pindahkan 7 siswa (ganti <ID_BARU>)
UPDATE bookings SET schedule_id = '<ID_BARU>'
WHERE id IN (
    SELECT b.id FROM bookings b
    WHERE b.schedule_id = '4b082a79-d5bc-4bee-8246-36ffc7df1981'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC LIMIT 7
);

-- 4. Update current_students
UPDATE schedules SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) WHERE id IN ('4b082a79-d5bc-4bee-8246-36ffc7df1981', '<ID_BARU>');
```

### Harvard Friday Afternoon (14 siswa → 10 + 4)

```sql
-- 1. Buat schedule baru
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, batch, current_students)
SELECT 
    class_id, 'friday', 'evening', phase, 9, 2026, program, level, '1', 0
FROM schedules
WHERE id = '1e999629-3828-4fe0-aef0-bfc3b8a10289';

-- 2. Lihat ID baru
SELECT id FROM schedules 
WHERE day = 'friday' AND time_slot = 'evening' AND week_number = 9
    AND class_id = (SELECT class_id FROM schedules WHERE id = '1e999629-3828-4fe0-aef0-bfc3b8a10289')
ORDER BY created_at DESC LIMIT 1;

-- 3. Pindahkan 4 siswa (ganti <ID_BARU>)
UPDATE bookings SET schedule_id = '<ID_BARU>'
WHERE id IN (
    SELECT b.id FROM bookings b
    WHERE b.schedule_id = '1e999629-3828-4fe0-aef0-bfc3b8a10289'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC LIMIT 4
);

-- 4. Update current_students
UPDATE schedules SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) WHERE id IN ('1e999629-3828-4fe0-aef0-bfc3b8a10289', '<ID_BARU>');
```

### Harvard Monday Afternoon (11 siswa → 10 + 1)

```sql
-- 1. Buat schedule baru
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, batch, current_students)
SELECT 
    class_id, 'monday', 'evening', phase, 9, 2026, program, level, '1', 0
FROM schedules
WHERE id = '537f0177-567f-44b7-819f-639b40a46036';

-- 2. Lihat ID baru
SELECT id FROM schedules 
WHERE day = 'monday' AND time_slot = 'evening' AND week_number = 9
    AND class_id = (SELECT class_id FROM schedules WHERE id = '537f0177-567f-44b7-819f-639b40a46036')
ORDER BY created_at DESC LIMIT 1;

-- 3. Pindahkan 1 siswa (ganti <ID_BARU>)
UPDATE bookings SET schedule_id = '<ID_BARU>'
WHERE id IN (
    SELECT b.id FROM bookings b
    WHERE b.schedule_id = '537f0177-567f-44b7-819f-639b40a46036'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC LIMIT 1
);

-- 4. Update current_students
UPDATE schedules SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) WHERE id IN ('537f0177-567f-44b7-819f-639b40a46036', '<ID_BARU>');
```

---

## Cara 2: Recalculate Only (Cepat tapi Tidak Split)

Jika Anda mau biarkan overcapacity untuk sementara:

```sql
-- File: booking-system/database/AUTO_SPLIT_OVERCAPACITY.sql
-- Jalankan STEP 2 saja
```

---

## ✅ Verification

Setelah fix, jalankan ini untuk verify:

```sql
-- Should return 0 rows
SELECT 
    c.name, s.day, s.time_slot, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9 AND s.current_students > 10;
```

---

## 📊 Hasil Akhir yang Diharapkan:

**Oxford Class:**
- Friday Afternoon: 10 siswa ✅
- Friday Evening: 8 siswa ✅
- Tuesday Afternoon: 10 siswa ✅
- Tuesday Evening: 7 siswa ✅

**Harvard Class:**
- Friday Afternoon: 10 siswa ✅
- Friday Evening: 4 siswa ✅
- Monday Afternoon: 10 siswa ✅
- Monday Evening: 1 siswa ✅

**Total: 8 schedules (semua max 10 siswa)** ✅

---

## ⚠️ Catatan Penting:

1. Siswa yang dipindahkan adalah siswa yang **terakhir booking** (created_at DESC)
2. Semua siswa tetap di batch 1
3. Siswa akan otomatis lihat jadwal baru mereka
4. Tidak ada data yang hilang

---

## 🚀 Rekomendasi:

Gunakan **Cara 1 (Manual Split)** karena:
- Lebih aman
- Bisa kontrol siswa mana yang dipindah
- Hasil lebih terorganisir

Setelah fix, **JANGAN jalankan** `COMPREHENSIVE_DUPLICATE_FIX.sql` lagi!
