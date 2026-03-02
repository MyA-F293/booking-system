# 🔧 DEBUG ATTENDANCE SUBMIT - QUICK GUIDE

## MASALAH
Attendance sudah diisi (semua siswa di-mark), tapi setelah klik "Submit Attendance" tidak tersimpan dan kembali ke halaman yang sama.

## LANGKAH DEBUG

### 1️⃣ Jalankan Diagnostic SQL
Buka Supabase SQL Editor dan jalankan:
```
database/DIAGNOSE_ATTENDANCE_SUBMIT.sql
```

Ini akan mengecek:
- ✅ Struktur tabel attendance
- ✅ Student dengan student_id invalid
- ✅ Schedule Tsinghua Week 9
- ✅ Siswa yang booking di schedule tersebut
- ✅ Attendance records yang sudah ada
- ✅ Constraints di tabel attendance

### 2️⃣ Cek Browser Console
1. Buka browser (Chrome/Edge)
2. Tekan F12 untuk buka Developer Tools
3. Klik tab "Console"
4. Coba submit attendance lagi
5. Screenshot error yang muncul di console

### 3️⃣ Cek Network Tab
1. Di Developer Tools, klik tab "Network"
2. Coba submit attendance lagi
3. Cari request ke Supabase (biasanya ada tulisan "attendance")
4. Klik request tersebut
5. Lihat di tab "Response" - ada error message?
6. Screenshot response-nya

## KEMUNGKINAN PENYEBAB

### 🔴 Penyebab 1: Student ID Invalid
**Gejala**: Ada siswa dengan `student_id = '-'` atau `NULL`

**Solusi**:
```sql
-- Cari siswa dengan ID invalid
SELECT full_name, student_id, program, batch
FROM users
WHERE student_id IS NULL OR student_id = '' OR student_id = '-';

-- Fix: Update student_id yang invalid
-- Ganti {user_id} dan {new_student_id} dengan nilai yang benar
UPDATE users
SET student_id = '{new_student_id}'
WHERE id = '{user_id}';
```

### 🔴 Penyebab 2: Attendance Sudah Ada (Duplicate)
**Gejala**: Attendance sudah pernah di-submit sebelumnya

**Solusi**:
```sql
-- Cek attendance yang sudah ada
SELECT * FROM attendance
WHERE class_name = 'Tsinghua Class'
    AND week_number = 9
    AND year = 2026;

-- Jika mau hapus dan submit ulang:
DELETE FROM attendance
WHERE class_name = 'Tsinghua Class'
    AND week_number = 9
    AND year = 2026;
```

### 🔴 Penyebab 3: Schedule ID Tidak Ditemukan
**Gejala**: Schedule tidak ada di database

**Solusi**:
```sql
-- Cek schedule Tsinghua Week 9
SELECT s.id, c.name, s.day, s.time_slot, s.week_number
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Tsinghua Class'
    AND s.week_number = 9
    AND s.year = 2026;
```

### 🔴 Penyebab 4: Required Field Kosong
**Gejala**: Ada field yang required tapi tidak diisi

**Solusi**: Cek struktur tabel attendance
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'attendance'
    AND is_nullable = 'NO';
```

## INFORMASI YANG DIBUTUHKAN

Untuk membantu debug, kirim screenshot/info:

1. ✅ Hasil query dari `DIAGNOSE_ATTENDANCE_SUBMIT.sql`
2. ✅ Screenshot browser console saat submit
3. ✅ Screenshot network tab response
4. ✅ Class name dan week number yang bermasalah
5. ✅ Berapa jumlah siswa sebelum submit vs setelah submit

## TEMPORARY WORKAROUND

Jika urgent dan perlu submit attendance sekarang, bisa manual insert:

```sql
-- Manual insert attendance (ganti nilai sesuai kebutuhan)
INSERT INTO attendance (
    teacher_id,
    teacher_name,
    schedule_id,
    class_name,
    program,
    level,
    phase,
    day,
    time_slot,
    week_number,
    year,
    student_id,
    student_name,
    status
) VALUES 
    ('TCHR0001', 'Teacher Name', 123, 'Tsinghua Class', 'Teens', 'Intermediate', 'phase1', 'Monday', 'afternoon', 9, 2026, 'CSA0001', 'Student Name 1', 'present'),
    ('TCHR0001', 'Teacher Name', 123, 'Tsinghua Class', 'Teens', 'Intermediate', 'phase1', 'Monday', 'afternoon', 9, 2026, 'CSA0002', 'Student Name 2', 'present');
-- Tambahkan baris untuk setiap siswa
```

## NEXT STEPS

Setelah dapat hasil diagnostic:
1. ✅ Identifikasi root cause
2. ✅ Fix data di database (jika perlu)
3. ✅ Fix code di frontend (jika perlu)
4. ✅ Add better error handling
5. ✅ Test ulang

---

**STATUS**: 🔍 Menunggu hasil diagnostic dari user
