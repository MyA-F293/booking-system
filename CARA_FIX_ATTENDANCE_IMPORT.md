# Cara Memperbaiki Data Attendance yang Sudah Diimport

## Masalah
Anda sudah import attendance menggunakan bulk import dan berhasil (100 success), tapi data tidak muncul di report.

## Penyebab
Data yang diimport **sebelum fix** masih menggunakan `student_id` dummy seperti:
- `IMPORT_0001`
- `IMPORT_0002`
- `IMPORT_0003`
- dll.

Sedangkan report mencari berdasarkan `student_id` yang benar seperti:
- `EYSA2601001`
- `EYSA2601002`
- dll.

Jadi data tidak ketemu karena ID-nya tidak cocok.

## Solusi

### Opsi 1: Hapus Data Lama dan Import Ulang (PALING MUDAH)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project booking-system

2. **Hapus Data dengan IMPORT_ ID**
   ```sql
   -- Cek dulu berapa banyak
   SELECT COUNT(*) FROM attendance WHERE student_id LIKE 'IMPORT_%';
   
   -- Kalau yakin, hapus
   DELETE FROM attendance WHERE student_id LIKE 'IMPORT_%';
   ```

3. **Import Ulang**
   - Buka aplikasi booking system
   - Masuk ke Admin Dashboard
   - Klik "Bulk Operations"
   - Tab "Import Attendance"
   - Upload file CSV yang sama
   - Klik "Import"

4. **Cek Report**
   - Sekarang data akan muncul dengan student_id yang benar

---

### Opsi 2: Update Data yang Sudah Ada (LEBIH TEKNIS)

Kalau Anda tidak mau hapus dan import ulang, bisa update data yang sudah ada.

1. **Buka Supabase SQL Editor**
   - Dashboard → SQL Editor → New Query

2. **Jalankan Script Fix**
   - Copy paste script dari file: `database/FIX_IMPORTED_ATTENDANCE_STUDENT_ID.sql`
   - Jalankan step by step:

   **Step 1: Cek berapa record yang perlu diperbaiki**
   ```sql
   SELECT 
       COUNT(*) as total_records_to_fix,
       COUNT(DISTINCT student_name) as unique_students
   FROM attendance
   WHERE student_id LIKE 'IMPORT_%';
   ```

   **Step 2: Preview apa yang akan diupdate**
   ```sql
   SELECT 
       a.id,
       a.student_id as old_student_id,
       a.student_name,
       u.student_id as new_student_id,
       u.full_name as matched_name
   FROM attendance a
   LEFT JOIN users u ON LOWER(TRIM(a.student_name)) = LOWER(TRIM(u.full_name))
   WHERE a.student_id LIKE 'IMPORT_%'
   LIMIT 10;
   ```

   **Step 3: Jalankan Fix**
   ```sql
   UPDATE attendance
   SET student_id = (
       SELECT u.student_id
       FROM users u
       WHERE LOWER(TRIM(u.full_name)) = LOWER(TRIM(attendance.student_name))
       AND u.role = 'student'
       LIMIT 1
   )
   WHERE student_id LIKE 'IMPORT_%'
   AND EXISTS (
       SELECT 1
       FROM users u
       WHERE LOWER(TRIM(u.full_name)) = LOWER(TRIM(attendance.student_name))
       AND u.role = 'student'
   );
   ```

   **Step 4: Cek hasil**
   ```sql
   -- Cek yang sudah berhasil diperbaiki
   SELECT COUNT(*) as fixed_records
   FROM attendance
   WHERE student_id NOT LIKE 'IMPORT_%'
   AND created_at > NOW() - INTERVAL '1 day';
   
   -- Cek yang masih belum bisa diperbaiki (nama tidak cocok)
   SELECT student_id, student_name, COUNT(*) as count
   FROM attendance
   WHERE student_id LIKE 'IMPORT_%'
   GROUP BY student_id, student_name;
   ```

3. **Fix Manual untuk Nama yang Tidak Cocok**
   
   Kalau ada nama yang tidak cocok (typo, format berbeda), fix manual:
   ```sql
   -- Contoh: Nama di CSV "John Doe" tapi di database "John M. Doe"
   UPDATE attendance
   SET student_id = 'EYSA2601001'  -- Ganti dengan student_id yang benar
   WHERE student_name = 'John Doe'  -- Nama dari CSV
   AND student_id LIKE 'IMPORT_%';
   ```

4. **Refresh Report**
   - Buka Attendance Report
   - Klik tombol "Refresh"
   - Data sekarang akan muncul

---

## Rekomendasi Saya

**Gunakan Opsi 1 (Hapus dan Import Ulang)** karena:
- ✅ Lebih mudah
- ✅ Lebih cepat
- ✅ Tidak perlu SQL
- ✅ Dijamin berhasil karena sekarang sudah ada fix

**Gunakan Opsi 2** hanya kalau:
- Data sudah terlalu banyak
- Tidak mau kehilangan timestamp asli
- Sudah familiar dengan SQL

---

## Verifikasi Berhasil

Setelah fix (opsi 1 atau 2), cek di Attendance Report:
1. Buka "Attendance Report"
2. Pilih filter class/student
3. Data sekarang harus muncul
4. Student_id harus format `EYSA2601xxx` bukan `IMPORT_xxx`

---

## Pencegahan ke Depan

Mulai sekarang, setiap import baru akan otomatis menggunakan student_id yang benar karena sudah ada fix di kode. Jadi masalah ini tidak akan terjadi lagi untuk import yang baru.

---

## Butuh Bantuan?

Kalau masih ada masalah:
1. Screenshot error/hasil query
2. Kirim ke saya
3. Saya akan bantu fix
