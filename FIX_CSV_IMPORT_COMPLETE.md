# 🔧 Panduan Lengkap: Fix CSV Import Attendance

## 📊 Hasil Analisis Step 3

Dari hasil matching, ditemukan:
- ✅ **Exact Match**: 0 nama (semua nama punya perbedaan)
- ⚠️ **Partial Match**: 11 nama (nama mirip tapi tidak exact)
- ❌ **No Match**: 2 nama (tidak ada di database)

## 🎯 Masalah yang Ditemukan

### 1. Partial Match (Perlu Mapping Manual)
| CSV Name | Database Name | Student ID | Issue |
|----------|---------------|------------|-------|
| Ade Sherina | Ade Sherina H | EYSA26010056 | Missing middle initial |
| Ahmad Zayni | Ahmad Zayni Asyarifain | EYSA26010071 | Missing last name |
| Andi Fathir Meysar | A. M. Fathir Meysar Ananta | EYSA26010006 | Different format |
| Andi Nadila Salsabila | Andi Nadila Salsabila Musllim | EYSA26010135 | Missing last name |
| Asrul Arifin | Asrul | EYSA26010134 | Missing last name |
| Chentia Putri | Chentia Putri Anugrah | EYSA26010027 | Missing last name |
| Irfan | M. Irfan | EYSA26010008 | Missing initial |
| Muhaimin | Muhaimin Abubakar Assidiq Mamonto | EYSA26010073 | Missing full name |

### 2. Typo di CSV (Perlu Fix)
| CSV Name | Database Name | Student ID | Typo |
|----------|---------------|------------|------|
| Muh Fatwah Fajriansyah M | Muhammad Fatwa Fajriansyah M | EYSA26012617 | Fatwah → Fatwa |
| Muh. Fitrah Riyadi | Muh. Fitrah Ryadi | EYSA26010139 | Riyadi → Ryadi |
| Nur Fadillah Syam | Nurfadhilah Syam | EYSA26010053 | Fadillah → Fadhilah |

### 3. Missing Students (Tidak Ada di Database)
| CSV Name | Status |
|----------|--------|
| Miftahul | ❌ Perlu ditambahkan ke database |
| Nia | ❌ Perlu ditambahkan ke database |

## 🛠️ Solusi Step-by-Step

### Step 1: Tambahkan Missing Students

```sql
-- Jalankan file ini:
-- booking-system/database/ADD_MISSING_STUDENTS.sql

-- 1. Check next available student_id
SELECT 
    CONCAT('EYSA2601', LPAD(MAX(CAST(SUBSTRING(student_id, 10) AS UNSIGNED)) + 1, 4, '0')) as next_id
FROM students 
WHERE student_id LIKE 'EYSA26010%';

-- 2. Insert Miftahul (ganti XXX dengan nomor dari query di atas)
INSERT INTO students (student_id, name, status)
VALUES ('EYSA26010XXX', 'Miftahul', 'active');

-- 3. Insert Nia
INSERT INTO students (student_id, name, status)
VALUES ('EYSA26010XXX', 'Nia', 'active');

-- 4. Verify
SELECT * FROM students WHERE name IN ('Miftahul', 'Nia');
```

### Step 2: Setup Mapping Table

```sql
-- Jalankan file ini:
-- booking-system/database/FIX_CSV_TO_DB_MAPPING.sql

-- Ini akan create temporary table dengan mapping
-- CSV name → Database student_id
```

### Step 3: Import Attendance dengan Mapping

Ada 2 cara:

#### Cara A: Manual Fix CSV (Recommended)
1. Buka CSV file
2. Replace nama-nama berikut:

```
Find → Replace:
Ade Sherina → Ade Sherina H
Ahmad Zayni → Ahmad Zayni Asyarifain
Andi Fathir Meysar → A. M. Fathir Meysar Ananta
Andi Nadila Salsabila → Andi Nadila Salsabila Musllim
Asrul Arifin → Asrul
Chentia Putri → Chentia Putri Anugrah
Irfan → M. Irfan
Muh Fatwah Fajriansyah M → Muhammad Fatwa Fajriansyah M
Muh. Fitrah Riyadi → Muh. Fitrah Ryadi
Muhaimin → Muhaimin Abubakar Assidiq Mamonto
Nur Fadillah Syam → Nurfadhilah Syam
```

3. Save CSV
4. Import seperti biasa

#### Cara B: Import dengan SQL Mapping

```sql
-- 1. Import CSV ke temporary table
CREATE TEMPORARY TABLE csv_import_temp (
    student_name VARCHAR(255),
    date DATE,
    status VARCHAR(50),
    notes TEXT
);

-- 2. Load CSV data
LOAD DATA LOCAL INFILE 'path/to/your/file.csv'
INTO TABLE csv_import_temp
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- 3. Insert dengan mapping
INSERT INTO attendance (student_id, schedule_id, date, status, notes)
SELECT 
    COALESCE(
        -- Try mapping table first
        (SELECT db_student_id FROM csv_name_mapping WHERE csv_name = csv.student_name),
        -- Then try exact match
        (SELECT student_id FROM students WHERE name = csv.student_name)
    ) as student_id,
    'YOUR_SCHEDULE_ID_HERE' as schedule_id,
    csv.date,
    csv.status,
    csv.notes
FROM csv_import_temp csv
WHERE COALESCE(
    (SELECT db_student_id FROM csv_name_mapping WHERE csv_name = csv.student_name),
    (SELECT student_id FROM students WHERE name = csv.student_name)
) IS NOT NULL;

-- 4. Check yang gagal import
SELECT 
    csv.student_name,
    'Not found in database or mapping' as reason
FROM csv_import_temp csv
WHERE NOT EXISTS (
    SELECT 1 FROM csv_name_mapping WHERE csv_name = csv.student_name
) AND NOT EXISTS (
    SELECT 1 FROM students WHERE name = csv.student_name
);
```

### Step 4: Verify Import

```sql
-- Check jumlah attendance yang berhasil diimport
SELECT 
    s.name,
    COUNT(*) as attendance_count,
    MIN(a.date) as first_date,
    MAX(a.date) as last_date
FROM attendance a
JOIN students s ON s.student_id = a.student_id
WHERE a.date >= 'YOUR_IMPORT_START_DATE'
GROUP BY s.student_id, s.name
ORDER BY s.name;

-- Check attendance yang mungkin salah
SELECT 
    a.id,
    s.name,
    a.date,
    a.status,
    'Check if this is correct' as note
FROM attendance a
JOIN students s ON s.student_id = a.student_id
WHERE a.student_id IN (
    SELECT db_student_id FROM csv_name_mapping
)
AND a.date >= 'YOUR_IMPORT_START_DATE'
ORDER BY s.name, a.date;
```

## 📝 Checklist

- [ ] Step 1: Tambahkan Miftahul dan Nia ke database
- [ ] Step 2: Setup mapping table
- [ ] Step 3: Pilih cara import (A atau B)
- [ ] Step 4: Import attendance
- [ ] Step 5: Verify hasil import
- [ ] Step 6: Backup database setelah verify

## ⚠️ Catatan Penting

1. **Selalu backup database sebelum import!**
2. **Test dulu dengan sample data kecil**
3. **Verify setiap step sebelum lanjut**
4. **Jika ada error, rollback dan cek lagi**

## 🎯 Rekomendasi

**Gunakan Cara A (Manual Fix CSV)** karena:
- ✅ Lebih simple dan straightforward
- ✅ Tidak perlu SQL kompleks
- ✅ Lebih mudah di-verify
- ✅ CSV yang sudah difix bisa dipakai lagi

**Gunakan Cara B (SQL Mapping)** jika:
- CSV file sangat besar (ribuan baris)
- Sering import dengan nama yang sama
- Butuh automation

## 📞 Troubleshooting

### Problem: "Miftahul" atau "Nia" masih error
**Solution**: Pastikan sudah jalankan ADD_MISSING_STUDENTS.sql

### Problem: Nama masih tidak match
**Solution**: 
1. Check exact spelling di database
2. Update mapping table
3. Atau fix manual di CSV

### Problem: Duplicate attendance
**Solution**: 
```sql
-- Check duplicate
SELECT student_id, date, COUNT(*) 
FROM attendance 
GROUP BY student_id, date 
HAVING COUNT(*) > 1;

-- Delete duplicate (keep oldest)
DELETE a1 FROM attendance a1
INNER JOIN attendance a2 
WHERE a1.id > a2.id 
AND a1.student_id = a2.student_id 
AND a1.date = a2.date;
```

## ✅ Success Criteria

Import berhasil jika:
- ✅ Semua nama di CSV ter-map ke student_id
- ✅ Tidak ada attendance dengan student_id NULL
- ✅ Jumlah record sesuai dengan CSV
- ✅ Tidak ada duplicate attendance

---

**Last Updated**: 2026-02-20
**Status**: Ready to use
