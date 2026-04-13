# 📋 Cara Lihat Detail Siswa yang Pindah Class

## 🎯 Tujuan
Mendapatkan daftar lengkap nama-nama siswa yang berubah class karena copy week bug, termasuk:
- Student ID
- Nama lengkap
- Program & Level
- Class asal (Week 1)
- Class tujuan (Week 2)
- Jadwal (hari, waktu, phase)

---

## ⚡ Quick Start (2 Menit)

### Step 1: Buka File Query
File: `database/GET_STUDENTS_WHO_CHANGED_CLASS.sql`

### Step 2: Copy Paste ke Supabase
1. Buka Supabase SQL Editor
2. Copy paste **SEMUA ISI FILE** tersebut
3. Execute

### Step 3: Lihat Hasil
Akan muncul **6 hasil query** berbeda:

---

## 📊 Penjelasan Setiap Query

### QUERY 1: Detail Lengkap Semua Siswa ⭐ PALING PENTING
```
Kolom yang muncul:
- no: Nomor urut
- student_id: ID siswa (EYSA26020001, dll)
- nama_siswa: Nama lengkap
- program: English for Teens, English Campus & Career, dll
- level: Upper Starter, Intermediate, dll
- batch: 2
- week_1_class: Class di week 1 (Oxford, Harvard, dll)
- week_2_class: Class di week 2 (seharusnya sama, tapi berubah)
- jadwal: Monday evening, Tuesday afternoon, dll
- phase: phase1 atau phase2
- severity: Tingkat keparahan (CRITICAL atau WARNING)
```

**Contoh Output:**
```
no | student_id    | nama_siswa      | program           | level         | week_1_class | week_2_class | jadwal          | severity
---|---------------|-----------------|-------------------|---------------|--------------|--------------|-----------------|------------------
1  | EYSA26020001  | Nilna Khaeriyah | English for Teens | Upper Starter | Oxford Class | Tokyo Class  | Monday evening  | 🔴 CRITICAL
2  | EYSA26020045  | Talitha         | English for Teens | Upper Starter | Oxford Class | Fahd Class   | Monday evening  | 🔴 CRITICAL
3  | EYSA26020089  | St. Nur Afifah  | English for Teens | Upper Starter | Oxford Class | Harvard Class| Monday evening  | 🔴 CRITICAL
```

---

### QUERY 2: Summary Per Class
Menunjukkan **pattern perpindahan**:
```
from_class    | to_class      | jumlah_siswa | daftar_nama
--------------|---------------|--------------|---------------------------
Oxford Class  | Tokyo Class   | 120          | Nilna, Talitha, Afifah, ...
Oxford Class  | Harvard Class | 85           | Ahmad, Budi, Citra, ...
Harvard Class | Tsinghua Class| 60           | Dina, Eko, Fani, ...
```

---

### QUERY 3: Breakdown Per Program
Analisis impact per program dan level:
```
program                 | level         | from_class   | to_class     | jumlah_siswa | daftar_nama
------------------------|---------------|--------------|--------------|--------------|-------------
English for Teens       | Upper Starter | Oxford Class | Tokyo Class  | 80           | Nilna, ...
English Campus & Career | Intermediate  | Harvard Class| Fahd Class   | 45           | Ahmad, ...
```

---

### QUERY 4: Export Format (CSV-Ready) ⭐ UNTUK EXPORT
Format clean untuk export ke Excel:
```
student_id   | full_name       | program           | level         | batch | week_1_class | week_2_class | hari    | waktu     | phase
-------------|-----------------|-------------------|---------------|-------|--------------|--------------|---------|-----------|-------
EYSA26020001 | Nilna Khaeriyah | English for Teens | Upper Starter | 2     | Oxford Class | Tokyo Class  | monday  | evening   | phase1
EYSA26020045 | Talitha         | English for Teens | Upper Starter | 2     | Oxford Class | Fahd Class   | monday  | evening   | phase1
```

**Cara Export:**
1. Klik kanan pada hasil query
2. "Export to CSV" atau copy paste ke Excel
3. Save untuk dokumentasi

---

### QUERY 5: Top 20 Examples
Quick preview 20 siswa pertama untuk cek cepat:
```
no | student_id   | nama_siswa      | perpindahan_class        | info_program                    | jadwal_info
---|--------------|-----------------|--------------------------|--------------------------------|---------------------------
1  | EYSA26020001 | Nilna Khaeriyah | Oxford Class → Tokyo Class| English for Teens - Upper Starter | monday evening (phase1)
2  | EYSA26020045 | Talitha         | Oxford Class → Fahd Class | English for Teens - Upper Starter | monday evening (phase1)
```

---

### QUERY 6: Total Summary ⭐ OVERVIEW
Ringkasan total impact:
```
total_siswa_berubah_class | jumlah_class_terdampak | jumlah_program_terdampak | jumlah_batch_terdampak | persentase_dari_total
--------------------------|------------------------|--------------------------|------------------------|----------------------
345                       | 5                      | 3                        | 1                      | 34.50%
```

**Interpretasi:**
- 345 siswa berubah class (dari 999 total siswa)
- 5 class terdampak (Oxford, Harvard, Tsinghua, Tokyo, Fahd)
- 3 program terdampak (Teens, Campus & Career, dll)
- 1 batch terdampak (Batch 2)
- 34.50% dari total siswa mengalami bug ini

---

## 📥 Cara Export Data

### Option 1: Export ke Excel (RECOMMENDED)
1. Jalankan **QUERY 4** (Export Format)
2. Klik kanan pada hasil
3. Pilih "Export to CSV" atau "Copy"
4. Paste ke Excel
5. Save as `Daftar_Siswa_Pindah_Class.xlsx`

### Option 2: Copy Paste Manual
1. Jalankan **QUERY 1** (Detail Lengkap)
2. Select all hasil
3. Ctrl+C (Copy)
4. Paste ke Excel atau Google Sheets
5. Format as table

### Option 3: Screenshot
1. Jalankan **QUERY 5** (Top 20)
2. Screenshot hasil
3. Untuk quick reference atau report

---

## 🔍 Analisis Data

### Cari Siswa Tertentu
Tambahkan filter di QUERY 1:
```sql
-- Tambahkan di bagian WHERE
AND u.full_name ILIKE '%Nilna%'  -- Cari siswa bernama Nilna
```

### Filter Per Class
```sql
-- Hanya siswa yang pindah dari Oxford
AND c1.name = 'Oxford Class'
```

### Filter Per Program
```sql
-- Hanya program English for Teens
AND u.program = 'English for Teens'
```

---

## 📊 Expected Results

### Jika Bug Ada:
- **QUERY 1**: 345 rows (atau lebih)
- **QUERY 2**: Beberapa rows menunjukkan pattern perpindahan
- **QUERY 6**: `total_siswa_berubah_class > 0`

### Jika Tidak Ada Bug:
- **QUERY 1**: 0 rows (no data)
- **QUERY 2**: 0 rows (no data)
- **QUERY 6**: `total_siswa_berubah_class = 0`

---

## 🎯 Next Steps Setelah Dapat Data

### 1. Dokumentasi
- Export QUERY 4 ke Excel
- Save dengan nama: `Bug_Report_Copy_Week_[DATE].xlsx`
- Attach ke issue tracker atau report

### 2. Notifikasi Siswa (Optional)
- Gunakan daftar dari QUERY 1
- Kirim email/WhatsApp ke siswa yang terdampak
- Jelaskan akan ada perbaikan

### 3. Deploy Fix
- File: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
- Guide: `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`
- Test: `QUICK_TEST_COPY_WEEK_FIX.md`

### 4. Restore Correct Class (Optional)
Jika ingin kembalikan siswa ke class yang benar:
```sql
-- HATI-HATI: Backup dulu sebelum jalankan!
-- Query untuk restore akan dibuat terpisah jika diperlukan
```

---

## ⚠️ Important Notes

1. **Backup First**: Sebelum melakukan perubahan apapun, backup data dulu
2. **Read Only**: Query ini hanya READ, tidak mengubah data
3. **Safe to Run**: Aman dijalankan berkali-kali
4. **No Side Effects**: Tidak ada efek samping ke database

---

## 🆘 Troubleshooting

### Error: Column "full_name" not found
**Solusi**: Ganti `u.full_name` dengan nama kolom yang benar di tabel users Anda

### Error: Relation "users" does not exist
**Solusi**: Ganti `users` dengan `auth.users` atau nama tabel yang benar

### No Data Returned
**Kemungkinan**:
1. Bug sudah di-fix sebelumnya
2. Data sudah di-correct manually
3. Week 1 atau Week 2 tidak ada data

---

## 📞 Support

Jika ada pertanyaan atau butuh modifikasi query:
1. Share hasil QUERY 6 (Total Summary)
2. Share contoh 5 rows dari QUERY 1
3. Jelaskan apa yang ingin dianalisis lebih lanjut

---

## ✅ Checklist

- [ ] Buka file `database/GET_STUDENTS_WHO_CHANGED_CLASS.sql`
- [ ] Copy paste ke Supabase SQL Editor
- [ ] Execute query
- [ ] Lihat hasil QUERY 1 (Detail Lengkap)
- [ ] Lihat hasil QUERY 6 (Total Summary)
- [ ] Export QUERY 4 ke Excel (optional)
- [ ] Dokumentasikan hasil
- [ ] Lanjut ke deployment fix

---

**File Terkait:**
- Query: `database/GET_STUDENTS_WHO_CHANGED_CLASS.sql`
- Fix: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
- Guide: `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`
- Quick Test: `QUICK_TEST_COPY_WEEK_FIX.md`
