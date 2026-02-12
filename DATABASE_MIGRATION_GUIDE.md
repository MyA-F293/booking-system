# 📦 Database Backup & Migration Guide

Panduan lengkap untuk backup dan migrasi database EYSA Booking System ke hosting/database baru.

## 🎯 Fitur Backup System

✅ **Full Database Backup** - Backup semua tabel dengan data lengkap
✅ **Dual Format** - Export ke SQL dan JSON
✅ **Easy Restore** - Import otomatis ke database baru
✅ **Batch Processing** - Handle data besar dengan efisien
✅ **Error Handling** - Deteksi dan report error saat backup/restore

## 📋 Tabel yang Di-backup

1. **users** - Data semua user (admin, teacher, student)
2. **classes** - Data kelas (Fahd, Harvard, Oxford, Tokyo, Tsinghua)
3. **schedules** - Jadwal kelas per minggu
4. **bookings** - Booking siswa ke kelas
5. **attendance** - Data kehadiran siswa
6. **teachers** - Data guru/tutor

## 🚀 Cara Menggunakan

### 1. Backup Database (Sebelum Migrasi)

```bash
# Jalankan script backup
node tools/full-database-backup.js
```

**Output:**
- `backups/full-backup-YYYY-MM-DD-HH-mm.sql` - Format SQL untuk import manual
- `backups/full-backup-YYYY-MM-DD-HH-mm.json` - Format JSON untuk restore otomatis

**Contoh Output:**
```
🚀 Starting Full Database Backup...

📦 Backing up table: users
   ✅ Found 150 rows

📦 Backing up table: classes
   ✅ Found 5 rows

📦 Backing up table: schedules
   ✅ Found 240 rows

... (dan seterusnya)

============================================================
📊 BACKUP SUMMARY
============================================================
✅ users                 - 150 rows
✅ classes               - 5 rows
✅ schedules             - 240 rows
✅ bookings              - 1200 rows
✅ attendance            - 3500 rows
✅ teachers              - 8 rows
============================================================
📦 Total rows backed up: 5103
💾 Backup file: backups/full-backup-2025-02-11-14-30.sql
📏 File size: 2.5 MB
============================================================

📄 JSON backup also created: backups/full-backup-2025-02-11-14-30.json
📏 JSON size: 3.2 MB

✅ Backup completed successfully!
```

### 2. Setup Database Baru

#### A. Jika Menggunakan Supabase Baru

1. Buat project baru di [Supabase](https://supabase.com)
2. Copy URL dan Anon Key
3. Update `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-new-anon-key
   ```

4. Buat tabel dengan menjalankan SQL schema:
   ```bash
   # Jalankan semua file SQL di folder database/
   # Atau copy-paste ke Supabase SQL Editor
   ```

#### B. Jika Menggunakan PostgreSQL Hosting Lain

1. Setup PostgreSQL database
2. Install Supabase client atau gunakan direct PostgreSQL connection
3. Buat tabel sesuai schema

### 3. Restore Database ke Hosting Baru

```bash
# Jalankan script restore
node tools/restore-database.js
```

**Interactive Process:**
```
🔄 Database Restore Tool

📁 Available backup files:

1. full-backup-2025-02-11-14-30.json
   Size: 3.2 MB | Modified: 2025-02-11 14:30:00

2. full-backup-2025-02-10-10-15.json
   Size: 3.0 MB | Modified: 2025-02-10 10:15:00

Enter backup file number to restore (or 0 to cancel): 1

📂 Selected: full-backup-2025-02-11-14-30.json

📊 Backup Info:
   Date: 2025-02-11T14:30:00.000Z
   Database: supabase
   Tables: 6

📋 Tables in backup:
   - users: 150 rows
   - classes: 5 rows
   - schedules: 240 rows
   - bookings: 1200 rows
   - attendance: 3500 rows
   - teachers: 8 rows

⚠️  WARNING: This will INSERT data into your database!
⚠️  Make sure you have backed up your current database first!

Do you want to continue? (yes/no): yes

🚀 Starting restore...

📦 Restoring table: users
   ✅ Inserted: 150/150 rows
📦 Restoring table: classes
   ✅ Inserted: 5/5 rows
... (dan seterusnya)

============================================================
📊 RESTORE SUMMARY
============================================================
✅ users                 - 150 inserted, 0 errors
✅ classes               - 5 inserted, 0 errors
✅ schedules             - 240 inserted, 0 errors
✅ bookings              - 1200 inserted, 0 errors
✅ attendance            - 3500 inserted, 0 errors
✅ teachers              - 8 inserted, 0 errors
============================================================

✅ Restore completed!
```

## 📝 Langkah-langkah Migrasi Lengkap

### Step 1: Persiapan
```bash
# 1. Pastikan semua dependencies terinstall
npm install

# 2. Pastikan .env.local sudah benar (database lama)
cat .env.local
```

### Step 2: Backup Database Lama
```bash
# Backup database lama
node tools/full-database-backup.js

# Verify backup file created
ls -lh backups/
```

### Step 3: Setup Database Baru
```bash
# 1. Update .env.local dengan credentials database baru
# 2. Buat schema di database baru (jalankan SQL files)
# 3. Test koneksi
```

### Step 4: Restore ke Database Baru
```bash
# Restore data
node tools/restore-database.js

# Pilih file backup terbaru
# Konfirmasi restore
```

### Step 5: Verifikasi
```bash
# 1. Login ke aplikasi
# 2. Cek data users, classes, schedules
# 3. Test booking dan attendance
# 4. Verify semua fitur berjalan normal
```

## 🔧 Troubleshooting

### Error: "Missing Supabase credentials"
**Solusi:** Pastikan `.env.local` ada dan berisi:
```env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### Error: "Table does not exist"
**Solusi:** Buat schema dulu di database baru:
```bash
# Jalankan semua SQL files di folder database/
# Atau gunakan Supabase SQL Editor
```

### Error: "Duplicate key value violates unique constraint"
**Solusi:** Database baru sudah ada data. Options:
1. Truncate semua tabel dulu
2. Atau gunakan database kosong

### Backup File Terlalu Besar
**Solusi:** 
1. Gunakan format JSON (lebih compact)
2. Atau backup per tabel secara terpisah
3. Compress file backup: `gzip backups/*.json`

## 💡 Tips & Best Practices

### 1. Backup Rutin
```bash
# Setup cron job untuk backup otomatis setiap hari
0 2 * * * cd /path/to/project && node tools/full-database-backup.js
```

### 2. Simpan Backup di Multiple Locations
- Local: `backups/` folder
- Cloud: Google Drive, Dropbox
- Git: Commit backup files (jika tidak terlalu besar)

### 3. Test Restore Secara Berkala
- Buat test database
- Restore backup ke test database
- Verify data integrity

### 4. Dokumentasi Perubahan Schema
- Catat setiap perubahan struktur tabel
- Update SQL schema files
- Version control untuk schema changes

## 📊 Format File Backup

### SQL Format (.sql)
```sql
-- Backup for table: users
-- Total rows: 150
-- Backup date: 2025-02-11T14:30:00.000Z

INSERT INTO users (id, email, full_name, role, ...) VALUES ('uuid', 'email@example.com', 'John Doe', 'student', ...);
INSERT INTO users (id, email, full_name, role, ...) VALUES ('uuid', 'email@example.com', 'Jane Doe', 'teacher', ...);
...
```

### JSON Format (.json)
```json
{
  "timestamp": "2025-02-11T14:30:00.000Z",
  "database": "supabase",
  "tables": {
    "users": [
      {
        "id": "uuid",
        "email": "email@example.com",
        "full_name": "John Doe",
        "role": "student"
      }
    ],
    "classes": [...],
    ...
  }
}
```

## 🔐 Security Notes

⚠️ **PENTING:**
- Backup files berisi data sensitif (email, password hash, dll)
- Jangan commit backup files ke public repository
- Encrypt backup files jika disimpan di cloud
- Gunakan `.gitignore` untuk exclude `backups/` folder

## 📞 Support

Jika ada masalah saat migrasi:
1. Check error message di console
2. Verify database credentials
3. Check database schema compatibility
4. Contact developer untuk bantuan

---

**Last Updated:** 2025-02-11
**Version:** 1.0.0
