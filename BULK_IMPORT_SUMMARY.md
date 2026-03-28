# 📊 BULK IMPORT STUDENTS - SUMMARY

## ✅ WHAT WE CREATED

3 files untuk memudahkan bulk import siswa dari CSV:

1. **`database/BULK_IMPORT_STUDENTS_SIMPLE.sql`** ⭐ (MAIN FILE)
   - SQL script siap pakai
   - Copy-paste data CSV langsung
   - Auto-generate Student ID
   - Password default: EYSA2026

2. **`CARA_IMPORT_SISWA_BULK.md`**
   - Panduan lengkap step-by-step
   - Dengan contoh dan screenshot
   - Troubleshooting guide

3. **`QUICK_IMPORT_SISWA.txt`**
   - Quick reference card
   - 4 langkah simple
   - Copy-paste friendly

---

## 🎯 CARA PAKAI (SUPER SIMPLE)

### 1. Cek Student ID Terakhir
```sql
SELECT student_id, name FROM users 
WHERE role = 'student' 
ORDER BY student_id DESC LIMIT 5;
```
**Hasil**: EYSA2615 (contoh)

### 2. Buka File SQL
File: `database/BULK_IMPORT_STUDENTS_SIMPLE.sql`

### 3. Ganti Starting Number
Cari baris ini:
```sql
'EYSA' || lpad((2615 + row_number() OVER ())::text, 4, '0')
```
Ganti `2615` dengan Student ID terakhir dari step 1.

### 4. Paste Data CSV
Dari Google Sheets kamu, convert ke format:
```sql
VALUES
    ('Rizky Ramadani', 'English Campus & Career', 'Belum Tes', 2),
    ('Esl Suanda Sapira', 'English Campus & Career', 'Starter', 2),
    -- dst...
```

### 5. Run di Supabase
- Buka Supabase SQL Editor
- Copy-paste semua SQL
- Klik Run
- Done! ✅

---

## 🔑 TENTANG STUDENT ID

### Format
```
EYSA + 4 digit angka
Contoh: EYSA2616, EYSA2617, EYSA2618
```

### Auto-Generate
Script akan otomatis generate Student ID berurutan:
- Siswa 1: EYSA2616
- Siswa 2: EYSA2617
- Siswa 3: EYSA2618
- dst.

### Tidak Perlu Manual Input!
Kamu tidak perlu bikin Student ID manual satu-satu. Script akan handle semuanya.

---

## 🔐 PASSWORD DEFAULT

Semua siswa baru akan punya password default: **EYSA2026**

Siswa bisa ganti password nanti lewat:
1. Login ke dashboard
2. Klik icon user di pojok kanan atas
3. Klik "Change Password"
4. Masukkan password lama (EYSA2026) dan password baru

---

## 📊 CONTOH DATA CSV

Dari Google Sheets kamu:

| Name                          | Batch | Programs                  | Level         |
|-------------------------------|-------|---------------------------|---------------|
| Rizky Ramadani                | 2     | English Campus & Career   | Belum Tes     |
| Esl Suanda Sapira             | 2     | English Campus & Career   | Starter       |
| Najwa Khalilah Nursafirah     | 2     | English Campus & Career   | Starter       |
| Deviyanti Pratiwi             | 2     | English Campus & Career   | Upper Starter |

Convert ke SQL:

```sql
VALUES
    ('Rizky Ramadani', 'English Campus & Career', 'Belum Tes', 2),
    ('Esl Suanda Sapira', 'English Campus & Career', 'Starter', 2),
    ('Najwa Khalilah Nursafirah', 'English Campus & Career', 'Starter', 2),
    ('Deviyanti Pratiwi', 'English Campus & Career', 'Upper Starter', 2)
```

---

## ✅ VERIFY IMPORT

Setelah run SQL, cek hasilnya:

```sql
SELECT 
    student_id,
    name,
    program,
    level,
    batch,
    created_at
FROM users
WHERE role = 'student'
AND batch = 2
ORDER BY student_id DESC;
```

**Expected Result:**
```
EYSA2630 | Naurah Aathifah Nursaidi | English Campus & Career | Upper Starter | 2
EYSA2629 | Nurul Fathiyah S.A       | English Campus & Career | Upper Starter | 2
EYSA2628 | Siti Hajar Jumadil       | English for Teens       | Upper Starter | 2
...
EYSA2616 | Rizky Ramadani           | English Campus & Career | Belum Tes     | 2
```

---

## 🎉 SELESAI!

Sekarang semua siswa baru sudah bisa:
- ✅ Login dengan Student ID (EYSA2616, dst.) dan password EYSA2026
- ✅ Booking kelas
- ✅ Lihat attendance history
- ✅ Ganti password

Admin juga bisa:
- ✅ Lihat semua siswa di Admin Dashboard → Students tab
- ✅ Edit data siswa
- ✅ Manage bookings
- ✅ Input attendance

---

## ⚠️ TROUBLESHOOTING

### Error: "duplicate key value violates unique constraint"
**Penyebab**: Student ID sudah ada di database

**Solusi**: 
1. Cek Student ID terakhir lagi
2. Ubah starting number di script
3. Run ulang

### Siswa tidak muncul di Admin Dashboard
**Penyebab**: Belum insert ke public.users

**Solusi**: Run STEP 3 di SQL script (INSERT INTO public.users)

### Error: "permission denied for table auth.users"
**Penyebab**: Tidak punya akses ke auth.users

**Solusi**: Login sebagai admin/owner di Supabase

---

## 📁 FILES REFERENCE

| File | Purpose |
|------|---------|
| `database/BULK_IMPORT_STUDENTS_SIMPLE.sql` | SQL script utama (siap pakai) |
| `database/BULK_IMPORT_STUDENTS.sql` | SQL script lengkap (dengan komentar detail) |
| `CARA_IMPORT_SISWA_BULK.md` | Panduan lengkap step-by-step |
| `QUICK_IMPORT_SISWA.txt` | Quick reference card |
| `BULK_IMPORT_SUMMARY.md` | Summary document (file ini) |

---

## 🚀 NEXT STEPS

Setelah import siswa:

1. ✅ Test login dengan Student ID baru
2. ✅ Cek Admin Dashboard → Students tab
3. ✅ Buat schedule untuk Batch 2
4. ✅ Siswa bisa mulai booking kelas

---

## 💡 TIPS

- **Backup dulu**: Sebelum import, backup database dulu (optional)
- **Test dengan 1-2 siswa dulu**: Jangan langsung import semua, test dulu dengan 1-2 siswa
- **Cek format program dan level**: Pastikan nama program dan level sama persis dengan yang ada di database
- **Batch number**: Pastikan batch number konsisten (contoh: semua Batch 2)

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek file `CARA_IMPORT_SISWA_BULK.md` untuk troubleshooting
2. Cek query di `database/BULK_IMPORT_STUDENTS.sql` untuk debug
3. Atau tanya saya! 😊

---

**Created**: March 28, 2026
**Status**: ✅ Ready to use
**Tested**: Yes (with sample data)
