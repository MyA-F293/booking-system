# 📚 CARA IMPORT SISWA VIA BULK OPERATIONS

## 🎯 OVERVIEW

Kamu sudah punya fitur "Bulk Operations" di Admin Dashboard yang bisa import siswa dari Excel/CSV!

Fitur ini ada di: **Admin Dashboard → Students Tab → Bulk Operations Button**

---

## 📋 STEP-BY-STEP GUIDE

### STEP 1: Persiapkan File Excel/CSV

Format yang dibutuhkan (sesuai Required Columns):

| Column Name | Description | Example |
|-------------|-------------|---------|
| student_id | Student ID (unique) | EYSA26010027 |
| full_name | Student's full name | Andi Naelah Marsya S |
| batch | Batch number (1, 2, 3...) | 2 |
| program | Program name | English Campus & Career |
| level | Level name | Starter |
| email | Unique email (optional) | andi@example.com |
| phone | Phone number (optional) | 081234567890 |

**PENTING**: Kolom wajib (required):
- `student_id`
- `full_name`
- `batch`
- `program`
- `level`

---

### STEP 2: Download Template

1. Buka Admin Dashboard
2. Klik tab "Students"
3. Klik tombol "Bulk Operations" (icon upload)
4. Klik tab "Import Students"
5. Klik tombol "Download Template"
6. Template Excel akan ter-download

---

### STEP 3: Isi Data di Template

Copy data dari CSV kamu ke template Excel:

**Contoh Data:**

| student_id | full_name | batch | program | level | email | phone |
|------------|-----------|-------|---------|-------|-------|-------|
| EYSA26010027 | Andi Naelah Marsya S | 2 | English Campus & Career | Starter | | |
| EYSA26010028 | Kayla Maghfirah | 2 | English Campus & Career | Starter | | |
| EYSA26010029 | Aulia Nurkhairiah S | 2 | English Campus & Career | Belum Tes | | |

**Tips:**
- Email dan phone bisa dikosongkan (optional)
- Pastikan Student ID unique (tidak duplikat)
- Program name harus exact match: "English Campus & Career" atau "English for Teens"
- Level name harus exact match: "Starter", "Upper Starter", "Pre-Intermediate", "Intermediate"

---

### STEP 4: Upload File

1. Klik tombol "Upload Excel File" (tombol orange)
2. Pilih file Excel yang sudah kamu isi
3. Tunggu proses upload
4. Sistem akan validasi data
5. Jika ada error, akan muncul pesan error
6. Jika sukses, siswa akan langsung ter-import

---

### STEP 5: Verify Import

Setelah upload sukses:

1. Refresh halaman (F5)
2. Cek tab "Students"
3. Search Student ID yang baru di-import
4. Pastikan data sudah muncul

**Atau cek via SQL:**

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
ORDER BY student_id;
```

---

## 🔑 TENTANG STUDENT ID

### Format dari CSV kamu:
```
EYSA26010027
EYSA26010028
EYSA26010029
```

Format ini sudah benar! Sistem akan menggunakan Student ID ini untuk:
- Login ID
- Email: eysa26010027@eysa.local (auto-generate)
- Password default: EYSA2026

---

## 🔐 PASSWORD DEFAULT

Semua siswa baru akan punya password default: **EYSA2026**

Siswa bisa ganti password nanti lewat dashboard.

---

## ⚠️ TROUBLESHOOTING

### Error: "Student ID already exists"
**Penyebab**: Student ID sudah ada di database

**Solusi**: 
1. Cek Student ID yang duplikat
2. Hapus dari Excel file
3. Upload ulang

### Error: "Invalid program name"
**Penyebab**: Nama program tidak exact match

**Solusi**: Pastikan nama program exact match:
- ✅ "English Campus & Career"
- ✅ "English for Teens"
- ❌ "English Campus and Career" (salah)
- ❌ "Campus & Career" (salah)

### Error: "Invalid level name"
**Penyebab**: Nama level tidak exact match

**Solusi**: Pastikan nama level exact match:
- ✅ "Starter"
- ✅ "Upper Starter"
- ✅ "Pre-Intermediate"
- ✅ "Intermediate"
- ✅ "Belum Tes"
- ❌ "starter" (salah, harus kapital)

### Siswa tidak muncul setelah import
**Penyebab**: Browser cache

**Solusi**: 
1. Hard refresh: Ctrl+Shift+R
2. Atau clear browser cache
3. Atau logout dan login ulang

---

## 🎉 SELESAI!

Sekarang semua siswa baru sudah bisa:
- ✅ Login dengan Student ID (EYSA26010027, dst.) dan password EYSA2026
- ✅ Booking kelas
- ✅ Lihat attendance history
- ✅ Ganti password

---

## 📊 ALTERNATIF: IMPORT VIA SQL

Jika fitur Bulk Operations tidak work, kamu bisa pakai SQL script:

File: `database/BULK_IMPORT_WITH_EXISTING_ID.sql`

**Cara pakai:**
1. Buka Supabase SQL Editor
2. Copy-paste SQL dari file
3. Ganti data di VALUES section dengan data CSV kamu
4. Run SQL
5. Done!

---

## 💡 TIPS

- **Test dulu dengan 1-2 siswa**: Jangan langsung import semua, test dulu
- **Backup dulu**: Sebelum import, backup database (optional)
- **Cek format**: Pastikan Student ID, program, level exact match
- **Batch number**: Pastikan batch number konsisten (semua Batch 2)

---

## 📁 FILES REFERENCE

| File | Purpose |
|------|---------|
| `CARA_IMPORT_VIA_BULK_OPERATIONS.md` | Panduan ini (via UI) |
| `database/BULK_IMPORT_WITH_EXISTING_ID.sql` | SQL script (alternatif) |
| `BULK_IMPORT_SUMMARY.md` | Summary lengkap |

---

**Created**: March 28, 2026
**Status**: ✅ Ready to use
**Method**: Via Admin Dashboard UI (recommended)
