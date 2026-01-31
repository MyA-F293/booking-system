# Import Old Attendance Data

Script untuk mengimport data attendance lama dari Google Sheets ke Supabase.

## Langkah-langkah

### 1. Export Google Sheets ke CSV

1. Buka Google Sheets Anda
2. File → Download → Comma Separated Values (.csv)
3. Simpan file sebagai `old-attendance.csv` di folder `tools/`

### 2. Install Dependencies

```bash
npm install csv-parse @supabase/supabase-js
```

### 3. Update Konfigurasi

Edit file `tools/import-old-attendance.js` dan update bagian CONFIG:

```javascript
const CONFIG = {
    // Dari .env.local Anda
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key',
    
    // Data default (sesuaikan dengan data Anda)
    teacherName: 'Teacher Name',
    className: 'Starter Class',
    program: 'Campus & Career',
    level: 'Starter',
    // ... dll
};
```

### 4. Mapping Student ID

Anda perlu mapping nama siswa ke student_id yang ada di database:

**Opsi A: Manual Mapping**
```javascript
const studentIdMap = {
    'Rosavani (Batch 2)': 'STD001',
    'Andi Fatimah Azzahroh': 'STD002',
    // ... dst
};
```

**Opsi B: Auto-generate**
Script akan generate student_id otomatis (STUDENT_1, STUDENT_2, dst)

### 5. Jalankan Script

```bash
node tools/import-old-attendance.js
```

## Format CSV yang Diharapkan

CSV harus memiliki kolom:
- `NO` - Nomor urut
- `NAME` - Nama siswa
- `LEVEL` - Level kelas
- `WEEK 1 L1`, `WEEK 1 L2`, `WEEK 1 RC` - Attendance week 1
- `WEEK 2 L1`, `WEEK 2 L2`, `WEEK 2 RC` - Attendance week 2
- ... dst untuk week 3-8

## Status Mapping

Script akan mengkonversi:
- ✓ atau "present" → `present`
- ✗ atau "absent" → `absent`
- "late" → `late`
- Kosong atau "-" → diabaikan

## Troubleshooting

### Error: "Cannot find module"
```bash
npm install csv-parse @supabase/supabase-js
```

### Error: "Invalid API key"
Pastikan Anda sudah update `supabaseUrl` dan `supabaseKey` di CONFIG

### Error: "Foreign key violation"
Pastikan:
1. Table `attendance` sudah dibuat (run SQL script dulu)
2. Teacher ID exists di table `teachers`
3. Schedule ID exists di table `schedules` (jika required)

## Alternative: Manual Import via Supabase Dashboard

Jika script tidak bekerja, Anda bisa import manual:

1. Prepare CSV dengan format yang sesuai dengan table `attendance`
2. Go to Supabase Dashboard → Table Editor → attendance
3. Click "Insert" → "Import data from CSV"
4. Upload CSV file

## Format CSV untuk Manual Import

```csv
teacher_name,class_name,program,level,phase,day,time_slot,week_number,year,student_id,student_name,status
Teacher A,Starter Class,Campus & Career,Starter,phase1,monday,afternoon,1,2025,STD001,John Doe,present
Teacher A,Starter Class,Campus & Career,Starter,phase1,wednesday,afternoon,1,2025,STD001,John Doe,late
```

## Notes

- Script ini akan membuat attendance records baru, tidak akan update yang sudah ada
- Pastikan tidak ada duplikat data
- Backup database Anda sebelum import data besar
- Test dengan sample data kecil dulu sebelum import semua
