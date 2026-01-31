# Panduan Import Data Attendance Lama

## 📋 Ringkasan

Anda memiliki data attendance lama di Google Sheets dengan format:
- Kolom: NO, NAME, LEVEL, WEEK 1-8 (dengan sub-kolom L1, L2, RC)
- Status ditandai dengan warna atau simbol (✓ = hadir, ✗ = tidak hadir)

Panduan ini akan membantu Anda mengimport data tersebut ke Supabase.

## 🎯 Pilihan Import

### Opsi 1: Import Otomatis (Recommended)
Menggunakan script Node.js untuk konversi dan import otomatis.

### Opsi 2: Import Manual
Export ke CSV, edit manual, lalu import via Supabase Dashboard.

---

## 📝 OPSI 1: Import Otomatis

### Langkah 1: Export Google Sheets ke CSV

1. Buka Google Sheets Anda
2. Klik **File** → **Download** → **Comma Separated Values (.csv)**
3. Simpan file sebagai `old-attendance.csv`
4. Pindahkan file ke folder `tools/` di project Anda

### Langkah 2: Install Dependencies

Buka terminal dan jalankan:

```bash
npm install csv-parse csv-stringify @supabase/supabase-js
```

### Langkah 3: Konfigurasi Script

Edit file `tools/convert-spreadsheet-to-csv.js` dan update bagian CONFIG:

```javascript
const CONFIG = {
    inputFile: './tools/old-attendance.csv',
    outputFile: './tools/attendance-import.csv',
    
    // Mapping session ke hari (sesuaikan dengan jadwal Anda)
    sessionToDayMap: {
        'L1': 'monday',      // L1 = Senin
        'L2': 'wednesday',   // L2 = Rabu
        'RC': 'friday'       // RC = Jumat (Review Class?)
    },
    
    // Data default
    defaults: {
        teacherName: 'Ms. Sarah',        // GANTI dengan nama teacher
        className: 'Starter Class',      // GANTI dengan nama kelas
        program: 'Campus & Career',      // Program yang sesuai
        timeSlot: 'afternoon',           // afternoon atau evening
        year: 2025,                      // Tahun data
        phase: 'phase1'                  // phase1, phase2, atau recap
    },
    
    // Mapping nama siswa ke student_id (opsional)
    studentIdMap: {
        'Rosavani (Batch 2)': 'STD001',
        'Andi Fatimah Azzahroh': 'STD002',
        // ... tambahkan mapping lainnya jika perlu
    }
};
```

### Langkah 4: Jalankan Konversi

```bash
node tools/convert-spreadsheet-to-csv.js
```

Output akan tersimpan di `tools/attendance-import.csv`

### Langkah 5: Review Output

Buka file `attendance-import.csv` dan pastikan data sudah benar:
- Nama siswa benar
- Status (present/late/absent) benar
- Week number benar
- Hari dan time slot sesuai

### Langkah 6: Import ke Supabase

**Via Dashboard:**
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Klik **Table Editor** → **attendance**
4. Klik **Insert** → **Import data from CSV**
5. Upload file `attendance-import.csv`
6. Klik **Import**

**Via Script (alternatif):**
```bash
node tools/import-old-attendance.js
```

---

## 📝 OPSI 2: Import Manual

### Langkah 1: Export ke CSV

1. Export Google Sheets ke CSV (seperti Opsi 1)

### Langkah 2: Buat Template CSV

Buat file baru `attendance-manual.csv` dengan header:

```csv
teacher_name,class_name,program,level,phase,day,time_slot,week_number,year,student_id,student_name,status
```

### Langkah 3: Isi Data Manual

Contoh:

```csv
teacher_name,class_name,program,level,phase,day,time_slot,week_number,year,student_id,student_name,status
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,monday,afternoon,1,2025,STD001,Rosavani (Batch 2),present
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,wednesday,afternoon,1,2025,STD001,Rosavani (Batch 2),present
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,friday,afternoon,1,2025,STD001,Rosavani (Batch 2),late
```

### Langkah 4: Import ke Supabase

1. Buka Supabase Dashboard → Table Editor → attendance
2. Klik **Insert** → **Import data from CSV**
3. Upload file CSV Anda
4. Klik **Import**

---

## 🔍 Informasi Penting

### Mapping Status

Script akan mengkonversi:
- `✓` atau `present` → `present`
- `✗` atau `absent` → `absent`
- `late` → `late`
- Kosong atau `-` → diabaikan (tidak diimport)

### Mapping Session ke Hari

Anda perlu tentukan mapping L1, L2, RC ke hari:

```javascript
'L1': 'monday',      // Lesson 1 = Senin?
'L2': 'wednesday',   // Lesson 2 = Rabu?
'RC': 'friday'       // Review Class = Jumat?
```

**Sesuaikan dengan jadwal kelas Anda!**

### Student ID

Jika siswa belum ada di database `users`, Anda punya 2 opsi:

**Opsi A:** Buat siswa dulu di database
1. Tambahkan semua siswa ke table `users`
2. Catat student_id mereka
3. Update `studentIdMap` di script

**Opsi B:** Auto-generate student_id
- Script akan generate: `IMPORT_001`, `IMPORT_002`, dst
- Nanti bisa di-update manual jika perlu

### Data yang Diperlukan

Untuk setiap attendance record, Anda perlu:
- ✅ `teacher_name` - Nama teacher
- ✅ `class_name` - Nama kelas
- ✅ `program` - Program (Campus & Career / English for Teens)
- ✅ `level` - Level (Starter / Upper Starter / Pre-Intermediate / Intermediate)
- ✅ `phase` - Phase (phase1 / phase2 / recap)
- ✅ `day` - Hari (monday / tuesday / wednesday / thursday / friday / saturday / sunday)
- ✅ `time_slot` - Waktu (afternoon / evening)
- ✅ `week_number` - Minggu ke berapa (1-52)
- ✅ `year` - Tahun (2025)
- ✅ `student_id` - ID siswa
- ✅ `student_name` - Nama siswa
- ✅ `status` - Status (present / late / absent)

---

## ⚠️ Troubleshooting

### Error: "Cannot find module"
```bash
npm install csv-parse csv-stringify @supabase/supabase-js
```

### Error: "ENOENT: no such file or directory"
Pastikan file `old-attendance.csv` ada di folder `tools/`

### Error: "Foreign key violation"
Kemungkinan:
1. Teacher ID tidak ada di table `teachers`
2. Schedule ID tidak ada di table `schedules`

**Solusi:** Set `teacher_id` dan `schedule_id` sebagai NULL di script, atau buat data teacher/schedule dulu.

### Data tidak muncul di report
Pastikan:
1. Week number sesuai dengan filter yang Anda pilih
2. Year sesuai
3. Class name sesuai dengan yang ada di database

---

## 📊 Contoh Data

### Input (Google Sheets):

| NO | NAME | LEVEL | WEEK 1 L1 | WEEK 1 L2 | WEEK 1 RC |
|----|------|-------|-----------|-----------|-----------|
| 1  | John | Starter | ✓ | ✓ | ✗ |
| 2  | Jane | Starter | ✓ | late | ✓ |

### Output (CSV untuk Supabase):

```csv
teacher_name,class_name,program,level,phase,day,time_slot,week_number,year,student_id,student_name,status
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,monday,afternoon,1,2025,IMPORT_001,John,present
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,wednesday,afternoon,1,2025,IMPORT_001,John,present
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,friday,afternoon,1,2025,IMPORT_001,John,absent
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,monday,afternoon,1,2025,IMPORT_002,Jane,present
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,wednesday,afternoon,1,2025,IMPORT_002,Jane,late
Ms. Sarah,Starter Class,Campus & Career,Starter,phase1,friday,afternoon,1,2025,IMPORT_002,Jane,present
```

---

## ✅ Checklist

Sebelum import, pastikan:

- [ ] SQL script `create_attendance_table.sql` sudah dijalankan di Supabase
- [ ] File CSV sudah di-export dari Google Sheets
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Konfigurasi di script sudah di-update (teacher name, class name, dll)
- [ ] Mapping session ke hari sudah benar
- [ ] Student ID mapping sudah di-setup (jika perlu)
- [ ] Test dengan sample data kecil dulu (5-10 rows)
- [ ] Backup database sebelum import data besar

---

## 🎉 Setelah Import Berhasil

1. **Verifikasi data:**
   - Login sebagai admin
   - Buka Attendance Report
   - Filter by week dan class
   - Pastikan data muncul dengan benar

2. **Test export:**
   - Export ke CSV
   - Export ke Excel
   - Pastikan data lengkap

3. **Test student view:**
   - Login sebagai student
   - Buka "My Attendance"
   - Pastikan data siswa muncul

4. **Cleanup:**
   - Hapus file temporary (`old-attendance.csv`, `attendance-import.csv`)
   - Update student_id jika menggunakan auto-generate

---

## 📞 Butuh Bantuan?

Jika ada masalah:
1. Check error message di console
2. Verify data format di CSV
3. Check Supabase logs di Dashboard
4. Test dengan 1-2 rows dulu sebelum import semua

Good luck! 🚀
