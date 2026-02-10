# 📦 Panduan Backup Database EYSA

## 🎯 Tujuan

Sistem backup otomatis untuk menyimpan data database ke Google Drive sebagai backup berkala.

---

## 🚀 Cara Menggunakan

### Opsi 1: Backup via Admin Dashboard (Recommended)

1. **Login sebagai Admin**
2. **Klik tombol "Backup to Drive"** di header (warna biru)
3. **Tunggu proses backup** (biasanya 10-30 detik)
4. **File Excel akan otomatis ter-download**
5. **Upload file ke Google Drive:**
   - Klik "Open Google Drive Folder" di modal
   - Upload file yang baru di-download
   - File akan tersimpan di folder EYSA Backups

### Opsi 2: Backup via Command Line

```bash
node tools/backup-to-gdrive.js
```

File akan tersimpan di folder `backups/` dan siap di-upload ke Google Drive.

---

## 📊 Isi Backup

Backup file berisi **semua data** dari database dalam format Excel (.xlsx):

### Sheet yang Disertakan:

1. **users** - Data semua user (students, teachers, admin)
2. **teachers** - Data teacher lengkap
3. **schedules** - Jadwal kelas
4. **bookings** - Data booking kelas
5. **attendance** - Data absensi siswa
6. **classes** - Data kelas
7. **Backup Info** - Metadata backup (tanggal, jumlah records, dll)

---

## 📁 Lokasi Penyimpanan

### Google Drive Folder:
**URL:** https://drive.google.com/drive/folders/1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw

**Struktur Folder:**
```
EYSA Backups/
├── EYSA_Backup_2026-02-10.xlsx
├── EYSA_Backup_2026-02-09.xlsx
├── EYSA_Backup_2026-02-08.xlsx
└── ...
```

### Local Backup (Temporary):
```
project-root/
└── backups/
    ├── EYSA_Backup_2026-02-10.xlsx
    ├── backup-log.json
    └── ...
```

---

## ⏰ Jadwal Backup (Recommended)

### Manual Backup:
- **Setiap hari** sebelum tutup kantor
- **Sebelum update besar** (migrasi, perubahan struktur)
- **Setelah import data besar**

### Automated Backup (Opsional):
Bisa di-setup dengan cron job atau scheduled task:

**Windows (Task Scheduler):**
```
Program: node
Arguments: tools/backup-to-gdrive.js
Schedule: Daily at 11:00 PM
```

**Linux/Mac (Crontab):**
```bash
# Backup setiap hari jam 11 malam
0 23 * * * cd /path/to/project && node tools/backup-to-gdrive.js
```

---

## 🔐 Keamanan

### File Backup:
- ✅ Berisi **semua data sensitif** (passwords, emails, dll)
- ✅ Harus disimpan di **Google Drive private**
- ✅ Jangan share link publik
- ✅ Hanya admin yang punya akses

### Google Drive Permissions:
- **Owner:** Admin EYSA
- **Viewers:** Hanya yang diberi akses
- **Link Sharing:** OFF (Private)

---

## 📝 Backup Log

Setiap backup akan tercatat di `backups/backup-log.json`:

```json
[
  {
    "timestamp": "2026-02-10T15:30:00.000Z",
    "filename": "EYSA_Backup_2026-02-10.xlsx",
    "tables": ["users", "teachers", "schedules", "bookings", "attendance", "classes"],
    "totalRecords": 1500,
    "status": "success"
  }
]
```

---

## 🔄 Restore dari Backup

### Jika Perlu Restore Data:

1. **Download backup file** dari Google Drive
2. **Buka file Excel**
3. **Pilih sheet yang ingin di-restore**
4. **Export ke CSV** (Save As → CSV)
5. **Import via Bulk Operations:**
   - Login sebagai Admin
   - Klik "Bulk Operations"
   - Pilih tab yang sesuai
   - Upload CSV file
   - Review dan import

### Restore Full Database (Advanced):

Jika perlu restore seluruh database, hubungi developer atau gunakan Supabase Dashboard:

1. Login ke Supabase Dashboard
2. Pilih project EYSA
3. Klik **Database** → **Backups**
4. Restore dari backup point

---

## ⚠️ Troubleshooting

### Error: "Failed to fetch data"
**Solusi:**
- Cek koneksi internet
- Cek Supabase credentials di `.env.local`
- Coba refresh dan backup lagi

### Error: "File not downloaded"
**Solusi:**
- Cek browser download settings
- Allow downloads dari website
- Coba browser lain (Chrome recommended)

### File Terlalu Besar
**Solusi:**
- Backup per table (manual via Supabase Dashboard)
- Compress file sebelum upload ke Drive
- Hapus data lama yang tidak diperlukan

### Google Drive Full
**Solusi:**
- Hapus backup lama (keep last 30 days)
- Upgrade Google Drive storage
- Compress backup files

---

## 📊 Monitoring Backup

### Cek Backup Terakhir:

1. Buka `backups/backup-log.json`
2. Lihat entry terakhir
3. Pastikan status = "success"
4. Cek timestamp (kapan backup terakhir)

### Verifikasi Backup:

1. Download file backup dari Google Drive
2. Buka di Excel
3. Cek jumlah records di setiap sheet
4. Pastikan data lengkap dan valid

---

## 💡 Tips & Best Practices

### DO ✅
- Backup **setiap hari** atau minimal **3x seminggu**
- Simpan backup **minimal 30 hari** terakhir
- Test restore **sebulan sekali** untuk memastikan backup valid
- Dokumentasikan **perubahan besar** sebelum backup
- Gunakan **nama file yang jelas** (sudah otomatis dengan timestamp)

### DON'T ❌
- Jangan skip backup sebelum update besar
- Jangan share link Google Drive ke publik
- Jangan hapus semua backup (keep at least 7 days)
- Jangan lupa upload ke Google Drive setelah download
- Jangan simpan backup di local saja (harus di cloud)

---

## 🆘 Butuh Bantuan?

Jika ada masalah dengan backup:

1. **Cek error message** di console/modal
2. **Cek backup-log.json** untuk detail error
3. **Cek Supabase Dashboard** untuk status database
4. **Contact developer** jika masalah persist

---

## 📞 Contact

**Developer:** [Your Name]  
**Email:** [Your Email]  
**Google Drive Folder:** https://drive.google.com/drive/folders/1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw

---

## ✅ Checklist Backup Rutin

- [ ] Backup dilakukan hari ini
- [ ] File ter-download dengan sukses
- [ ] File di-upload ke Google Drive
- [ ] Verifikasi file bisa dibuka
- [ ] Cek jumlah records sesuai
- [ ] Update backup log
- [ ] Hapus backup lokal yang sudah di-upload

---

**Last Updated:** February 10, 2026  
**Version:** 1.0
