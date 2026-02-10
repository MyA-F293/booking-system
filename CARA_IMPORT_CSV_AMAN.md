# 🛡️ Cara Import CSV Attendance dengan Aman

## 📋 Masalah

Anda punya data attendance dalam format CSV dengan kolom:
- `date` - Tanggal (contoh: "Friday,Feb 6th 2026")
- `time` - Waktu (afternoon/evening)
- `teacher` - Nama teacher (contoh: "sir brian", "mrs feby")
- `class` - Nama kelas (contoh: "oxford", "tanghua", "tokyo", "harvard")
- `name` - Nama siswa
- `present or absent` - Status kehadiran
- `late or not` - Status terlambat

**Kekhawatiran:** Format penulisan mungkin berbeda dengan database, takut membuat identitas baru.

## ✅ Solusi: Tool Validasi & Import Otomatis

Tool ini akan:
1. ✅ **Validasi** - Cek apakah nama sudah ada di database
2. ✅ **Preview** - Tampilkan data baru vs data lama
3. ✅ **Mapping** - Cocokkan format otomatis
4. ✅ **Konfirmasi** - Minta persetujuan sebelum import
5. ✅ **Import** - Import hanya jika Anda approve

---

## 🚀 Langkah-Langkah

### 1. Simpan CSV Anda

Simpan file CSV Anda dengan nama **`attendance-to-import.csv`** di folder **`tools/`**

```
📁 project-root/
  📁 tools/
    📄 attendance-to-import.csv  ← Simpan di sini
    📄 validate-and-import-csv.js
```

### 2. Jalankan Tool Validasi

Buka terminal dan jalankan:

```bash
node tools/validate-and-import-csv.js
```

### 3. Review Hasil Validasi

Tool akan menampilkan:

```
📊 VALIDATION RESULTS

✅ Valid records: 65
⚠️  Warnings: 0

🆕 NEW DATA (not in database):
   - 15 new students
   - 2 new teachers
   - 1 new classes

   New Students:
      - Madina Azzahara
      - Savira Juliawardani Laururu
      - Zahrukushita Anindya
      ... (dan lainnya)

   New Teachers:
      - sir brian
      - mrs feby

   New Classes:
      - oxford
      - tanghua
      - tokyo
```

**PENTING:** Perhatikan bagian "NEW DATA"
- Jika nama **sudah ada** di database → akan di-link ke data yang sama ✅
- Jika nama **belum ada** → akan ditampilkan sebagai "new" ⚠️

### 4. Cek Sample Records

Tool akan menampilkan 3 contoh record yang akan diimport:

```
📝 SAMPLE RECORDS (first 3):

Record 1:
   Date: 2/6/2026
   Teacher: sir brian
   Class: oxford
   Student: Madina Azzahara
   Status: absent
   Week: 6, Year: 2026
```

**Cek apakah:**
- ✅ Nama teacher benar
- ✅ Nama class benar
- ✅ Nama student benar
- ✅ Status benar (present/late/absent)
- ✅ Week number benar

### 5. Konfirmasi Import

Tool akan bertanya:

```
❓ Do you want to proceed with import? (yes/no):
```

**Ketik:**
- `yes` atau `y` → Lanjutkan import ✅
- `no` atau `n` → Batalkan import ❌

### 6. Import Berjalan

Jika Anda approve, tool akan import data:

```
⏳ Importing to Supabase...

✅ Imported batch 1 (65 records)

🎉 IMPORT COMPLETE!

✅ Successfully imported: 65 records
❌ Failed: 0 records
```

### 7. Cek Summary

Tool akan membuat file **`import-summary.json`** dengan detail lengkap:

```json
{
  "timestamp": "2026-02-10T10:30:00.000Z",
  "totalRows": 65,
  "validRecords": 65,
  "imported": 65,
  "failed": 0,
  "warnings": [],
  "newStudents": ["Madina Azzahara", "Savira Juliawardani Laururu", ...],
  "newTeachers": ["sir brian", "mrs feby"],
  "newClasses": ["oxford", "tanghua", "tokyo"]
}
```

---

## 🔍 Cara Cek Apakah Nama Sudah Ada

### Opsi 1: Via Tool (Recommended)

Jalankan tool, lihat bagian "NEW DATA":
- Jika nama **TIDAK** muncul di list → Nama **SUDAH ADA** di database ✅
- Jika nama **MUNCUL** di list → Nama **BELUM ADA** di database ⚠️

### Opsi 2: Via Supabase Dashboard

1. Buka Supabase Dashboard
2. Pilih Table **`attendance`**
3. Klik **Filter**
4. Cari nama student/teacher/class
5. Jika ada hasil → Sudah ada ✅
6. Jika tidak ada → Belum ada ⚠️

### Opsi 3: Via Admin Dashboard

1. Login sebagai admin
2. Buka **Attendance Report**
3. Search nama student
4. Jika muncul → Sudah ada ✅
5. Jika tidak muncul → Belum ada ⚠️

---

## 🛠️ Mapping Otomatis

Tool akan otomatis mapping:

### Status Mapping

| CSV Value | Database Value |
|-----------|----------------|
| `present` | `present` |
| `absent` | `absent` |
| `late` | `late` |
| `hadir` | `present` |
| `tidak hadir` | `absent` |
| `terlambat` | `late` |

### Time Slot Mapping

| CSV Value | Database Value |
|-----------|----------------|
| `afternoon` | `afternoon` |
| `evening` | `evening` |
| `sore` | `afternoon` |
| `malam` | `evening` |

### Day Mapping

Otomatis dari tanggal:
- `Friday,Feb 6th 2026` → `friday`
- `Monday,Feb 9th 2026` → `monday`

### Week Number

Otomatis dihitung dari tanggal:
- `Feb 6th 2026` → Week 6

---

## ⚠️ Troubleshooting

### Error: "CSV file not found"

**Solusi:**
```bash
# Pastikan file ada di folder tools/
ls tools/attendance-to-import.csv

# Jika tidak ada, pindahkan file Anda ke sana
```

### Error: "VITE_SUPABASE_URL not found"

**Solusi:**
Pastikan file `.env.local` ada dan berisi:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Warning: "Invalid date format"

**Solusi:**
Pastikan format tanggal di CSV adalah:
```
Friday,Feb 6th 2026
Monday,Feb 9th 2026
```

Jika format berbeda, edit tool di bagian `parseDate()` function.

### Banyak "New Students"

**Ini Normal Jika:**
- Data CSV adalah data lama yang belum pernah diimport
- Nama siswa memang baru

**Perlu Dicek Jika:**
- Nama siswa seharusnya sudah ada tapi muncul sebagai "new"
- Kemungkinan: Perbedaan penulisan (typo, spasi, huruf besar/kecil)

**Solusi:**
1. Cek penulisan nama di CSV vs database
2. Edit CSV untuk samakan penulisan
3. Atau biarkan tool create new entry (nanti bisa di-merge manual)

---

## 📊 Setelah Import

### 1. Verifikasi Data

**Via Admin Dashboard:**
1. Login sebagai admin
2. Buka **Attendance Report**
3. Filter by week yang diimport
4. Cek apakah data muncul

**Via Supabase Dashboard:**
1. Buka Table **`attendance`**
2. Filter by `created_at` = hari ini
3. Cek jumlah records baru

### 2. Cek Duplikasi

Jalankan query untuk cek duplikasi:

```sql
SELECT 
    student_name, 
    class_name, 
    week_number, 
    day, 
    COUNT(*) as count
FROM attendance
WHERE created_at >= '2026-02-10'  -- Tanggal import
GROUP BY student_name, class_name, week_number, day
HAVING COUNT(*) > 1;
```

Jika ada duplikasi, gunakan tool:
```bash
# Lihat panduan di CARA_HAPUS_DUPLIKAT_ATTENDANCE.md
```

### 3. Update Student ID (Opsional)

Jika tool generate temporary ID (`IMPORT_0001`, `IMPORT_0002`), Anda bisa update:

```sql
-- Update student_id untuk siswa tertentu
UPDATE attendance
SET student_id = 'EYSA001'
WHERE student_name = 'Madina Azzahara'
  AND student_id LIKE 'IMPORT_%';
```

---

## 🎯 Tips & Best Practices

### 1. Test dengan Sample Kecil

Sebelum import semua data:
1. Copy 5-10 rows dari CSV
2. Simpan sebagai `attendance-to-import.csv`
3. Jalankan tool
4. Cek hasilnya
5. Jika OK, baru import semua data

### 2. Backup Database

Sebelum import data besar:
1. Buka Supabase Dashboard
2. Klik **Database** → **Backups**
3. Klik **Create Backup**

### 3. Edit CSV Sebelum Import

Jika ada perbedaan penulisan:

**Contoh:**
```csv
# CSV Anda:
teacher,class
sir brian,oxford

# Database:
teacher_name,class_name
Sir Brian,Oxford
```

**Edit CSV Anda:**
```csv
teacher,class
Sir Brian,Oxford  ← Samakan dengan database
```

### 4. Gunakan Excel untuk Edit

1. Buka CSV di Excel
2. Find & Replace untuk samakan penulisan
3. Save as CSV (UTF-8)

---

## 📝 Format CSV yang Diharapkan

Tool ini support format CSV dengan kolom:

### Minimal (Required):
- `date` - Tanggal attendance
- `name` - Nama siswa
- `teacher` - Nama teacher
- `class` - Nama kelas
- `present or absent` - Status kehadiran

### Opsional:
- `time` - Waktu (afternoon/evening)
- `late or not` - Status terlambat
- `program` - Program (Campus & Career / English for Teens)
- `level` - Level (Starter / Upper Starter / etc)

### Contoh CSV:

```csv
date,time,teacher,class,name,present or absent,late or not
"Friday,Feb 6th 2026",afternoon,sir brian,oxford,Madina Azzahara,absent,not
"Friday,Feb 6th 2026",afternoon,sir brian,oxford,Savira Juliawardani Laururu,present,not
"Friday,Feb 6th 2026",afternoon,sir brian,oxford,Zahrukushita Anindya,present,not
```

---

## ✅ Checklist

Sebelum import:

- [ ] CSV file sudah disimpan sebagai `attendance-to-import.csv` di folder `tools/`
- [ ] File `.env.local` ada dan berisi Supabase credentials
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Sudah backup database (jika import data besar)
- [ ] Sudah test dengan sample kecil (5-10 rows)
- [ ] Sudah review validation results
- [ ] Sudah cek sample records
- [ ] Siap untuk approve import

---

## 🆘 Butuh Bantuan?

Jika ada masalah:

1. **Cek error message** di console
2. **Review `import-summary.json`** untuk detail
3. **Cek Supabase logs** di Dashboard → Logs
4. **Test dengan 1-2 rows** dulu sebelum import semua

---

## 🎉 Selesai!

Setelah import berhasil:
- ✅ Data attendance sudah masuk database
- ✅ Bisa dilihat di Attendance Report
- ✅ Bisa di-export ke CSV/Excel
- ✅ Siswa bisa lihat attendance mereka

Good luck! 🚀
