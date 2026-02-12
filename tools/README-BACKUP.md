# 🛠️ Database Backup & Restore Tools

Tools untuk backup dan restore database EYSA Booking System.

## 📁 Files

### 1. `full-database-backup.js`
Script untuk backup lengkap semua tabel database.

**Usage:**
```bash
node tools/full-database-backup.js
```

**Output:**
- `backups/full-backup-[timestamp].sql` - SQL format
- `backups/full-backup-[timestamp].json` - JSON format

**Features:**
- ✅ Backup semua tabel (users, classes, schedules, bookings, attendance, teachers)
- ✅ Export ke SQL dan JSON
- ✅ Batch processing untuk data besar
- ✅ Progress indicator
- ✅ Error handling

### 2. `restore-database.js`
Script untuk restore database dari backup file.

**Usage:**
```bash
node tools/restore-database.js
```

**Features:**
- ✅ Interactive file selection
- ✅ Preview backup info sebelum restore
- ✅ Confirmation prompt
- ✅ Batch insert (100 rows per batch)
- ✅ Progress tracking
- ✅ Error reporting

## 🚀 Quick Start

### Backup Database
```bash
# 1. Pastikan .env.local sudah benar
# 2. Jalankan backup
node tools/full-database-backup.js

# 3. Check hasil backup
ls -lh backups/
```

### Restore Database
```bash
# 1. Update .env.local dengan database baru
# 2. Buat schema di database baru
# 3. Jalankan restore
node tools/restore-database.js

# 4. Pilih file backup
# 5. Konfirmasi restore
```

## 📋 Prerequisites

### Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "dotenv": "^16.x"
}
```

### Environment Variables
File `.env.local` harus berisi:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🔧 Configuration

### Menambah/Mengurangi Tabel

Edit `TABLES` array di `full-database-backup.js`:

```javascript
const TABLES = [
    'users',
    'classes',
    'schedules',
    'bookings',
    'attendance',
    'teachers',
    // Tambah tabel baru di sini
];
```

### Mengubah Batch Size

Edit `batchSize` di kedua file:

```javascript
const batchSize = 100; // Default: 100 rows per batch
```

## 📊 Backup File Formats

### SQL Format
```sql
-- Backup for table: users
-- Total rows: 150

INSERT INTO users (id, email, full_name) VALUES ('uuid', 'email@test.com', 'John Doe');
INSERT INTO users (id, email, full_name) VALUES ('uuid', 'email@test.com', 'Jane Doe');
```

**Pros:**
- ✅ Standard SQL format
- ✅ Bisa diimport ke any PostgreSQL database
- ✅ Human-readable

**Cons:**
- ❌ File size lebih besar
- ❌ Perlu manual import jika tidak pakai restore script

### JSON Format
```json
{
  "timestamp": "2025-02-11T14:30:00.000Z",
  "database": "supabase",
  "tables": {
    "users": [
      { "id": "uuid", "email": "email@test.com", "full_name": "John Doe" }
    ]
  }
}
```

**Pros:**
- ✅ Compact size
- ✅ Easy to parse programmatically
- ✅ Automatic restore dengan script

**Cons:**
- ❌ Perlu script untuk import
- ❌ Tidak bisa langsung import ke database

## 🔐 Security

⚠️ **IMPORTANT:**

1. **Backup files contain sensitive data:**
   - User emails
   - Password hashes
   - Personal information

2. **Best Practices:**
   - ✅ Add `backups/` to `.gitignore`
   - ✅ Encrypt backup files before cloud storage
   - ✅ Use secure file transfer (SFTP, SCP)
   - ✅ Limit access to backup files
   - ✅ Delete old backups regularly

3. **DO NOT:**
   - ❌ Commit backup files to public repository
   - ❌ Share backup files via email
   - ❌ Store unencrypted backups in public cloud

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js dotenv
```

### Error: "Missing Supabase credentials"
Check `.env.local` file exists and contains correct credentials.

### Error: "ENOENT: no such file or directory, open 'backups/...'"
Backups folder will be created automatically. If error persists, create manually:
```bash
mkdir backups
```

### Backup/Restore is slow
- Normal untuk database besar (>10,000 rows)
- Adjust `batchSize` untuk optimize performance
- Check network connection ke database

### Duplicate key errors during restore
Database sudah ada data. Options:
1. Truncate tables first
2. Use fresh/empty database
3. Modify backup file to skip duplicates

## 📞 Support

Untuk bantuan lebih lanjut, lihat:
- `DATABASE_MIGRATION_GUIDE.md` - Panduan lengkap migrasi
- `BACKUP_GUIDE.md` - Panduan backup umum

---

**Created:** 2025-02-11
**Version:** 1.0.0
