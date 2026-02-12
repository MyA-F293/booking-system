# 🚀 Panduan Lengkap Migrasi ke Hosting + Domain Baru

Panduan step-by-step untuk memindahkan EYSA Booking System ke hosting dan domain baru.

---

## 📋 Persiapan Sebelum Migrasi

### ✅ Checklist Persiapan
- [ ] Sudah beli hosting baru (VPS/Shared Hosting)
- [ ] Sudah beli domain baru
- [ ] Sudah setup DNS domain ke hosting
- [ ] Punya akses SSH/FTP ke hosting
- [ ] Punya akses cPanel/control panel hosting

### 📦 Yang Perlu Disiapkan
1. **Backup Database Lama**
   - File SQL dan JSON dari database lama
   - Simpan di tempat aman (Google Drive, local computer)

2. **Credentials Baru**
   - URL hosting baru
   - Database credentials (host, username, password, database name)
   - Domain baru

---

## 🎯 LANGKAH 1: Backup Database Lama

### Opsi A: Via UI (Paling Mudah)
```
1. Login sebagai Admin
2. Klik "Actions" di header
3. Klik "Full Database Backup"
4. Tunggu download selesai
5. Simpan file SQL dan JSON yang terdownload
```

### Opsi B: Via CLI
```bash
# Di komputer lokal, jalankan:
node tools/full-database-backup.js

# File akan tersimpan di folder backups/
# Contoh: backups/full-backup-2025-02-11-14-30.sql
#         backups/full-backup-2025-02-11-14-30.json
```

### ⚠️ PENTING
- Simpan backup di minimal 2 tempat (Google Drive + local)
- Jangan lupa backup file `.env.local` juga
- Catat semua credentials lama untuk referensi

---

## 🎯 LANGKAH 2: Setup Database Baru

### A. Jika Menggunakan Supabase Baru

#### 1. Buat Project Baru
```
1. Buka https://supabase.com
2. Klik "New Project"
3. Isi:
   - Name: eysa-booking-system-new
   - Database Password: [buat password kuat]
   - Region: pilih terdekat (Singapore/Tokyo)
4. Tunggu project selesai dibuat (~2 menit)
```

#### 2. Dapatkan Credentials
```
1. Buka project settings
2. Klik "API" di sidebar
3. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - anon/public key (VITE_SUPABASE_ANON_KEY)
4. Simpan credentials ini
```

#### 3. Buat Schema Database
```
1. Buka "SQL Editor" di Supabase
2. Jalankan semua file SQL di folder database/:
   - database/create_attendance_table.sql
   - Dan file SQL lainnya untuk create tables
3. Atau copy-paste schema dari backup SQL file
```

### B. Jika Menggunakan PostgreSQL Hosting Lain

#### 1. Buat Database
```sql
-- Via phpPgAdmin atau psql
CREATE DATABASE eysa_booking;
```

#### 2. Buat User
```sql
CREATE USER eysa_user WITH PASSWORD 'password_kuat_123';
GRANT ALL PRIVILEGES ON DATABASE eysa_booking TO eysa_user;
```

#### 3. Import Schema
```bash
# Via terminal/SSH
psql -U eysa_user -d eysa_booking -f database/create_attendance_table.sql
# Ulangi untuk semua file SQL schema
```

---

## 🎯 LANGKAH 3: Setup Hosting Baru

### A. Upload Files ke Hosting

#### Opsi 1: Via FTP/SFTP (FileZilla)
```
1. Buka FileZilla
2. Connect ke hosting:
   - Host: ftp.domainbaru.com atau IP hosting
   - Username: [dari hosting]
   - Password: [dari hosting]
   - Port: 21 (FTP) atau 22 (SFTP)

3. Upload semua file project KECUALI:
   - node_modules/ (akan diinstall ulang)
   - backups/ (tidak perlu)
   - .git/ (opsional)
   - .env.local (akan dibuat baru)

4. Upload ke folder public_html atau www atau htdocs
```

#### Opsi 2: Via Git (Lebih Mudah)
```bash
# Di hosting, via SSH:
cd /home/username/public_html
git clone https://github.com/MyA-F293/booking-system.git .

# Atau jika sudah ada:
git pull origin main
```

### B. Install Dependencies
```bash
# Via SSH di hosting
cd /home/username/public_html
npm install
```

### C. Buat File .env.local Baru
```bash
# Via SSH atau text editor di cPanel
nano .env.local
```

Isi dengan credentials baru:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-here

# Google Drive Backup (opsional, bisa pakai yang lama)
VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### D. Build Project
```bash
# Via SSH
npm run build

# Ini akan generate folder dist/ dengan file production
```

---

## 🎯 LANGKAH 4: Setup Web Server

### A. Jika Menggunakan cPanel

#### 1. Setup Node.js App
```
1. Login ke cPanel
2. Cari "Setup Node.js App"
3. Klik "Create Application"
4. Isi:
   - Node.js version: 18.x atau 20.x
   - Application mode: Production
   - Application root: public_html/booking-system
   - Application URL: domainbaru.com
   - Application startup file: (kosongkan, kita pakai static)
5. Save
```

#### 2. Setup Static Files (Vite Build)
```
1. Di cPanel, buka "File Manager"
2. Buat file .htaccess di public_html/
3. Isi dengan:
```

```apache
# .htaccess untuk Vite SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect all requests to index.html for SPA routing
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

#### 3. Copy Dist Files
```bash
# Via SSH atau File Manager
cp -r dist/* public_html/
# Atau via File Manager: extract dist folder ke public_html
```

### B. Jika Menggunakan Nginx

#### 1. Buat Config File
```bash
sudo nano /etc/nginx/sites-available/eysa-booking
```

```nginx
server {
    listen 80;
    server_name domainbaru.com www.domainbaru.com;
    root /var/www/eysa-booking/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/eysa-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### C. Jika Menggunakan Apache

#### 1. Buat VirtualHost
```bash
sudo nano /etc/apache2/sites-available/eysa-booking.conf
```

```apache
<VirtualHost *:80>
    ServerName domainbaru.com
    ServerAlias www.domainbaru.com
    DocumentRoot /var/www/eysa-booking/dist

    <Directory /var/www/eysa-booking/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/eysa-error.log
    CustomLog ${APACHE_LOG_DIR}/eysa-access.log combined
</VirtualHost>
```

#### 2. Enable Site
```bash
sudo a2ensite eysa-booking
sudo a2enmod rewrite
sudo systemctl reload apache2
```

---

## 🎯 LANGKAH 5: Restore Database

### Opsi A: Via UI (Paling Mudah)
```
1. Buka domainbaru.com
2. Login sebagai Admin
3. Klik "Actions" → "Restore Database"
4. Upload file JSON backup
5. Klik "Restore Now"
6. Tunggu proses selesai
```

### Opsi B: Via CLI
```bash
# Di komputer lokal, update .env.local dengan credentials baru
# Lalu jalankan:
node tools/restore-database.js

# Pilih file backup yang mau direstore
# Konfirmasi restore
```

### Opsi C: Via SQL (Manual)
```bash
# Via psql atau pgAdmin
psql -U eysa_user -d eysa_booking -f backups/full-backup-2025-02-11.sql
```

---

## 🎯 LANGKAH 6: Setup SSL/HTTPS

### A. Jika Menggunakan cPanel
```
1. Login ke cPanel
2. Cari "SSL/TLS Status"
3. Klik "Run AutoSSL"
4. Tunggu proses selesai
5. Domain akan otomatis pakai HTTPS
```

### B. Jika Menggunakan Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx  # untuk Nginx
# atau
sudo apt install certbot python3-certbot-apache  # untuk Apache

# Generate SSL certificate
sudo certbot --nginx -d domainbaru.com -d www.domainbaru.com
# atau
sudo certbot --apache -d domainbaru.com -d www.domainbaru.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🎯 LANGKAH 7: Testing & Verifikasi

### ✅ Checklist Testing

#### 1. Test Akses Website
- [ ] Buka https://domainbaru.com
- [ ] Website loading dengan benar
- [ ] Tidak ada error di console browser (F12)
- [ ] Logo dan gambar muncul

#### 2. Test Login
- [ ] Login sebagai Admin berhasil
- [ ] Login sebagai Teacher berhasil
- [ ] Login sebagai Student berhasil

#### 3. Test Data
- [ ] Data students muncul di Admin Dashboard
- [ ] Data teachers muncul
- [ ] Data classes dan schedules muncul
- [ ] Data bookings muncul
- [ ] Data attendance muncul

#### 4. Test Fitur Utama
- [ ] Create student baru berhasil
- [ ] Create teacher baru berhasil
- [ ] Booking class berhasil
- [ ] Fill attendance berhasil
- [ ] View attendance report berhasil
- [ ] Backup database berhasil

#### 5. Test Mobile
- [ ] Buka di HP/tablet
- [ ] Responsive layout bekerja
- [ ] Semua fitur bisa diakses
- [ ] PWA install bisa (Add to Home Screen)

---

## 🎯 LANGKAH 8: Update Domain di Aplikasi

### A. Update PWA Manifest
```bash
# Edit public/manifest.json
nano public/manifest.json
```

```json
{
  "name": "EYSA Booking System",
  "short_name": "EYSA",
  "start_url": "https://domainbaru.com/",
  "scope": "https://domainbaru.com/",
  ...
}
```

### B. Update Service Worker
```bash
# Edit public/sw.js jika ada hardcoded domain
nano public/sw.js
```

### C. Rebuild
```bash
npm run build
# Upload ulang dist/ ke hosting
```

---

## 🎯 LANGKAH 9: Redirect Domain Lama (Opsional)

Jika masih punya domain lama dan mau redirect ke domain baru:

### A. Via .htaccess (Apache)
```apache
# Di domain lama
RewriteEngine On
RewriteCond %{HTTP_HOST} ^domainlama\.com [NC,OR]
RewriteCond %{HTTP_HOST} ^www\.domainlama\.com [NC]
RewriteRule ^(.*)$ https://domainbaru.com/$1 [L,R=301]
```

### B. Via Nginx
```nginx
server {
    listen 80;
    server_name domainlama.com www.domainlama.com;
    return 301 https://domainbaru.com$request_uri;
}
```

---

## 🎯 LANGKAH 10: Maintenance & Monitoring

### A. Setup Backup Otomatis
```bash
# Buat cron job untuk backup harian
crontab -e

# Tambahkan:
0 2 * * * cd /var/www/eysa-booking && node tools/full-database-backup.js
# Backup setiap hari jam 2 pagi
```

### B. Setup Monitoring
```
1. Setup Uptime Robot (https://uptimerobot.com)
   - Monitor website availability
   - Email alert jika down

2. Setup Google Analytics (opsional)
   - Track user activity
   - Monitor performance

3. Setup Error Logging
   - Sentry.io untuk error tracking
   - CloudWatch untuk server logs
```

### C. Update Dokumentasi
```
1. Update README.md dengan domain baru
2. Update semua dokumentasi dengan URL baru
3. Inform users tentang domain baru
```

---

## 🚨 Troubleshooting

### Problem: Website tidak bisa diakses
**Solusi:**
1. Check DNS propagation: https://dnschecker.org
2. Tunggu 24-48 jam untuk DNS propagation
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check web server status: `sudo systemctl status nginx`

### Problem: Database connection error
**Solusi:**
1. Check .env.local credentials
2. Check database server running
3. Check firewall rules
4. Test connection: `psql -U username -d database -h host`

### Problem: 404 Not Found untuk routes
**Solusi:**
1. Check .htaccess atau nginx config
2. Enable mod_rewrite (Apache): `sudo a2enmod rewrite`
3. Restart web server

### Problem: Assets tidak loading (CSS/JS)
**Solusi:**
1. Check file permissions: `chmod -R 755 dist/`
2. Check .htaccess CORS settings
3. Clear browser cache
4. Check network tab di browser DevTools

### Problem: SSL certificate error
**Solusi:**
1. Regenerate certificate: `sudo certbot renew --force-renewal`
2. Check certificate expiry: `sudo certbot certificates`
3. Check nginx/apache SSL config

---

## 📞 Support & Help

Jika ada masalah saat migrasi:

1. **Check Logs**
   - Browser console (F12)
   - Server error logs
   - Database logs

2. **Dokumentasi**
   - Baca DATABASE_MIGRATION_GUIDE.md
   - Baca BACKUP_SYSTEM_SUMMARY.md
   - Check hosting documentation

3. **Contact**
   - Email hosting support
   - Check Supabase documentation
   - Contact developer

---

## ✅ Checklist Final

Setelah semua selesai, pastikan:

- [ ] Website bisa diakses via HTTPS
- [ ] Semua data ter-restore dengan benar
- [ ] Semua fitur berfungsi normal
- [ ] Mobile responsive bekerja
- [ ] PWA bisa diinstall
- [ ] Backup otomatis sudah setup
- [ ] Monitoring sudah aktif
- [ ] Domain lama redirect ke domain baru (jika ada)
- [ ] Users sudah diinformasikan tentang domain baru
- [ ] Dokumentasi sudah diupdate

---

## 🎉 Selamat!

Migrasi selesai! Website EYSA Booking System sekarang sudah running di hosting dan domain baru.

**Next Steps:**
1. Monitor website selama 1-2 minggu
2. Backup database secara berkala
3. Update fitur dan fix bugs jika ada
4. Collect feedback dari users

---

**Last Updated:** 2025-02-11
**Version:** 1.0.0
