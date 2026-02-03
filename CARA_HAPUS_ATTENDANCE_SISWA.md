# Cara Menghapus Attendance Siswa Tertentu

## 🎯 Untuk: Muh Fikri Syahputra (EYSA26010054)

## 📋 Langkah-Langkah

### 1️⃣ Buka Supabase SQL Editor
- Login ke https://supabase.com
- Pilih project Anda
- Klik **SQL Editor** di sidebar kiri

### 2️⃣ Cek Data yang Akan Dihapus (PENTING!)
Copy paste query ini untuk melihat data attendance siswa:

```sql
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    program,
    level,
    day,
    time_slot,
    week_number,
    year,
    status,
    teacher_name,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY created_at DESC;
```

**Klik Run** - Ini akan menampilkan semua attendance record siswa ini.

### 3️⃣ Hitung Berapa Record yang Akan Dihapus
```sql
SELECT 
    COUNT(*) as total_records,
    student_name,
    student_id
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY student_name, student_id;
```

**Klik Run** - Akan tampil berapa total record yang akan dihapus.

### 4️⃣ HAPUS Attendance (MAIN STEP) ⚠️
**PERHATIAN:** Ini akan menghapus SEMUA attendance record siswa ini!

```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054';
```

**Klik Run** - Akan tampil message: "DELETE X" (X = jumlah record yang dihapus)

### 5️⃣ Verifikasi Berhasil
```sql
SELECT 
    COUNT(*) as remaining_records
FROM attendance
WHERE student_id = 'EYSA26010054';
```

**Klik Run** - Harusnya return **0** (tidak ada record lagi)

## 🎯 Opsi Alternatif

### Opsi A: Hapus Hanya untuk Week Tertentu
Jika hanya mau hapus attendance untuk Week 6 saja:

```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND week_number = 6
  AND year = 2026;
```

### Opsi B: Hapus Hanya untuk Class Tertentu
Jika hanya mau hapus attendance untuk Tsinghua Class:

```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND class_name = 'Tsinghua Class';
```

### Opsi C: Hapus untuk Beberapa Siswa Sekaligus
Jika mau hapus attendance untuk beberapa siswa:

```sql
DELETE FROM attendance
WHERE student_id IN (
    'EYSA26010054',  -- Muh Fikri Syahputra
    'EYSA26010055',  -- Siswa lain
    'EYSA26010056'   -- Siswa lain
);
```

## ⚠️ PENTING!

### Yang Dihapus:
- ✅ Attendance records (hadir/telat/tidak hadir)
- ✅ Semua history attendance siswa ini

### Yang TIDAK Dihapus:
- ❌ Akun siswa (masih bisa login)
- ❌ Booking siswa (booking tetap ada)
- ❌ Data siswa di tabel users

## 🔄 Jika Salah Hapus

Jika tidak sengaja hapus yang salah, **TIDAK BISA di-undo**! Data sudah hilang permanen.

**Solusi:**
- Admin bisa isi ulang attendance lewat tab "Fill" di Admin Dashboard
- Atau tutor bisa isi ulang attendance

## 💡 Tips

1. **Selalu jalankan Step 2 & 3 dulu** untuk melihat data sebelum dihapus
2. **Screenshot data** sebelum dihapus (untuk backup)
3. **Gunakan opsi alternatif** jika hanya mau hapus sebagian data
4. **Pastikan Student ID benar** sebelum menjalankan DELETE

## 📁 File SQL Lengkap
Semua query ada di: `database/delete_student_attendance.sql`

## 🎉 Hasil Akhir

Setelah dihapus:
- ✅ Attendance siswa ini hilang dari database
- ✅ Tidak muncul di Attendance Report
- ✅ Angka Present/Late/Absent jadi 0
- ✅ Siswa masih bisa booking dan hadir ke kelas

---
**Dibuat:** 3 Februari 2026
**Student:** Muh Fikri Syahputra (EYSA26010054)
