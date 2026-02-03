# Cara Menambahkan Kembali Attendance yang Terhapus

## 🎯 Untuk: Muh Fikri Syahputra (EYSA26010054)
## 📝 Menambahkan kembali attendance yang hilang

## 📋 Langkah-Langkah

### 1️⃣ Buka Supabase SQL Editor
- Login ke https://supabase.com
- Pilih project Anda
- Klik **SQL Editor** di sidebar kiri

### 2️⃣ Cek Attendance yang Ada Sekarang
```sql
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    status,
    day,
    week_number,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY created_at DESC;
```
**Klik Run** - Lihat attendance yang masih ada (jika ada)

### 3️⃣ Dapatkan Schedule ID
Anda perlu tahu `schedule_id` untuk class yang mau ditambahkan attendance-nya:

```sql
SELECT 
    id as schedule_id,
    teacher_id,
    program,
    level,
    day,
    time_slot,
    week_number
FROM schedules
WHERE week_number = 6
  AND year = 2026
  AND program = 'Campus & Career'
  AND level = 'Starter'
ORDER BY day, time_slot;
```

**Klik Run** - Copy `schedule_id` yang sesuai dengan class Tsinghua

### 4️⃣ Dapatkan Teacher ID
```sql
SELECT 
    id as teacher_id,
    name as teacher_name
FROM teachers
WHERE is_active = true
ORDER BY name;
```

**Klik Run** - Copy `teacher_id` dan `teacher_name` yang mengajar class tersebut

### 5️⃣ Tambahkan Attendance Record
Ganti nilai-nilai berikut dengan data yang benar:

```sql
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
) VALUES (
    'PASTE_TEACHER_ID_HERE',     -- Dari Step 4
    'PASTE_TEACHER_NAME_HERE',   -- Dari Step 4
    'PASTE_SCHEDULE_ID_HERE',    -- Dari Step 3
    'Tsinghua Class',            -- Nama class
    'Campus & Career',           -- Program
    'Starter',                   -- Level
    'Phase 1',                   -- Phase
    'monday',                    -- Hari (lowercase)
    'afternoon',                 -- afternoon atau evening
    6,                           -- Week number
    2026,                        -- Year
    'EYSA26010054',             -- Student ID
    'Muh Fikri Syahputra',      -- Student name
    'late'                       -- Status: present, late, atau absent
);
```

**Klik Run** - Record akan ditambahkan

### 6️⃣ Verifikasi Berhasil
```sql
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    status,
    day,
    week_number,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY created_at DESC;
```

**Klik Run** - Harusnya muncul record yang baru ditambahkan

## 📝 Contoh Lengkap

Misalnya dari query Step 3 & 4 Anda dapat:
- `schedule_id`: `abc123-def456-ghi789`
- `teacher_id`: `xyz789-uvw456-rst123`
- `teacher_name`: `John Doe`

Maka query-nya jadi:

```sql
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
) VALUES (
    'xyz789-uvw456-rst123',
    'John Doe',
    'abc123-def456-ghi789',
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'monday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'late'
);
```

## 🔄 Menambahkan Beberapa Record Sekaligus

Jika mau tambahkan beberapa attendance sekaligus (misalnya late + present):

```sql
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
-- Record 1: Late
(
    'TEACHER_ID',
    'Teacher Name',
    'SCHEDULE_ID_1',
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'monday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'late'
),
-- Record 2: Present
(
    'TEACHER_ID',
    'Teacher Name',
    'SCHEDULE_ID_2',
    'Tsinghua Class',
    'Campus & Career',
    'Starter',
    'Phase 1',
    'wednesday',
    'afternoon',
    6,
    2026,
    'EYSA26010054',
    'Muh Fikri Syahputra',
    'present'
);
```

## 📊 Status yang Bisa Digunakan

| Status | Arti | Warna |
|--------|------|-------|
| `present` | Hadir | 🟢 Hijau |
| `late` | Terlambat | 🟡 Kuning |
| `absent` | Tidak Hadir | 🔴 Merah |

## ⚠️ Penting!

### Data yang Harus Benar:
- ✅ `schedule_id` - Harus ada di tabel schedules
- ✅ `teacher_id` - Harus ada di tabel teachers
- ✅ `student_id` - Harus sesuai dengan siswa
- ✅ `week_number` - Harus sesuai dengan schedule
- ✅ `day` - Harus lowercase (monday, tuesday, dll)
- ✅ `time_slot` - Harus afternoon atau evening
- ✅ `status` - Harus present, late, atau absent

### Jika Error:
- Cek apakah schedule_id benar (dari Step 3)
- Cek apakah teacher_id benar (dari Step 4)
- Pastikan tidak ada typo di status atau day
- Pastikan week_number dan year sesuai

## 💡 Tips

1. **Copy-paste dengan hati-hati** - Jangan sampai ada spasi atau karakter aneh
2. **Cek schedule_id dulu** - Pastikan schedule untuk class tersebut ada
3. **Gunakan query helper** di Step 3 & 4 untuk mendapatkan ID yang benar
4. **Test dengan 1 record dulu** - Jangan langsung banyak
5. **Verifikasi di aplikasi** - Refresh Attendance Report untuk melihat hasilnya

## 📁 File SQL Lengkap
Semua query ada di: `database/restore_student_attendance.sql`

## 🎉 Hasil Akhir

Setelah berhasil:
- ✅ Attendance record kembali muncul di database
- ✅ Muncul di Attendance Report
- ✅ Angka Present/Late/Absent kembali normal
- ✅ History attendance siswa kembali lengkap

---
**Dibuat:** 3 Februari 2026
**Student:** Muh Fikri Syahputra (EYSA26010054)
**Action:** Restore deleted attendance records
