# Panduan Deploy ke Hosting Baru

## Informasi Hosting

**Domain Utama:** eysalanguagecenter.com  
**Subdomain Portal:** portal.eysalanguagecenter.com  
**Server:** tridadi (IP: 103.30.147.68)  
**Provider:** idwebhost.com

### Login cPanel
- URL: http://103.30.147.68:2083/
- Username: eysalang
- Password: D3a2dL[TYc71.s

### FTP Access
- Hostname: eysalanguagecenter.com
- Username: eysalang
- Password: (sama dengan cPanel)
- Port: 21

---

## Tahap 1: Setup Konfigurasi ✅

### 1.1 Environment Variables
File `.env.production` sudah dibuat dengan konfigurasi:
- Supabase URL dan Keys
- Google Apps Script URLs
- VAPID Public Key untuk Push Notifications
- Production URL: https://portal.eysalanguagecenter.com

### 1.2 PWA Manifest
File `public/manifest.json` sudah diupdate dengan:
- start_url: https://portal.eysalanguagecenter.com/
- shortcuts URLs menggunakan domain baru

### 1.3 Checklist Konfigurasi
- [x] .env.production dibuat
- [x] manifest.json diupdate dengan domain baru
- [x] Supabase credentials tersedia
- [ ] Verifikasi Supabase RLS policies
- [ ] Test koneksi Supabase dari local

---

## Tahap 2: Build & Deploy

### 2.1 Build Production
```bash
# Install dependencies (jika belum)
npm install

# Build untuk production
npm run build
```

Hasil build akan ada di folder `dist/`

### 2.2 Setup Subdomain di cPanel

1. Login ke cPanel: http://103.30.147.68:2083/
2. Cari menu "Subdomains"
3. Buat subdomain baru:
   - Subdomain: `portal`
   - Domain: `eysalanguagecenter.com`
   - Document Root: `public_html/portal` (atau sesuai preferensi)
4. Klik "Create"

### 2.3 Upload Files via FTP

**Menggunakan FileZilla atau FTP Client:**
1. Host: eysalanguagecenter.com
2. Username: eysalang
3. Password: D3a2dL[TYc71.s
4. Port: 21

**Upload semua file dari folder `dist/` ke:**
- `/public_html/portal/` (atau document root subdomain yang dibuat)

**Struktur file yang diupload:**
```
/public_html/portal/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── eysa-logo.svg
├── icon-192.png
├── icon-512.png
├── manifest.json
├── sw.js
└── ...
```

### 2.4 Upload via cPanel File Manager (Alternatif)

1. Login ke cPanel
2. Buka "File Manager"
3. Navigate ke `/public_html/portal/`
4. Upload file `dist.zip` (zip folder dist terlebih dahulu)
5. Extract di server
6. Pindahkan semua file dari `dist/` ke root folder portal

---

## Tahap 3: Konfigurasi Server

### 3.1 Setup .htaccess untuk SPA

Buat file `.htaccess` di `/public_html/portal/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 3.2 Setup SSL Certificate

1. Di cPanel, cari "SSL/TLS Status"
2. Pilih domain `portal.eysalanguagecenter.com`
3. Klik "Run AutoSSL" untuk mendapatkan Let's Encrypt certificate
4. Tunggu proses selesai (biasanya 1-5 menit)

### 3.3 Force HTTPS

Tambahkan di `.htaccess` (paling atas):

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Tahap 4: Testing & Verifikasi

### 4.1 Test Akses Website
- [ ] Buka https://portal.eysalanguagecenter.com
- [ ] Pastikan halaman loading dengan benar
- [ ] Check console browser untuk errors

### 4.2 Test Fitur Utama
- [ ] Login Admin
- [ ] Login Teacher
- [ ] Login Student
- [ ] Booking system
- [ ] Attendance tracking
- [ ] Dashboard loading

### 4.3 Test PWA
- [ ] Install PWA di mobile
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Check manifest.json loading

### 4.4 Test Performance
- [ ] Google PageSpeed Insights
- [ ] Lighthouse audit
- [ ] Mobile responsiveness

---

## Tahap 5: Post-Deployment

### 5.1 Update DNS (Jika Perlu)
Jika subdomain tidak langsung aktif:
1. Cek DNS propagation: https://dnschecker.org
2. Tunggu 1-24 jam untuk DNS propagation
3. Clear browser cache

### 5.2 Setup Monitoring
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Setup error tracking (Sentry)
- [ ] Setup analytics (Google Analytics)

### 5.3 Backup
- [ ] Backup database Supabase
- [ ] Backup files di hosting
- [ ] Dokumentasi credentials

---

## Troubleshooting

### Website tidak bisa diakses
1. Check DNS: `nslookup portal.eysalanguagecenter.com`
2. Check file permissions (755 untuk folder, 644 untuk files)
3. Check .htaccess syntax
4. Check error logs di cPanel

### Blank page / White screen
1. Check browser console untuk errors
2. Pastikan semua assets terupload
3. Check file paths di index.html
4. Verify base URL di vite.config.js

### PWA tidak bisa install
1. Pastikan HTTPS aktif
2. Check manifest.json accessible
3. Check service worker registration
4. Verify icons tersedia

### API errors
1. Check Supabase connection
2. Verify environment variables
3. Check CORS settings di Supabase
4. Test API endpoints

---

## Kontak Support

**Hosting Support:**
- idwebhost.com support
- Email: support@idwebhost.com

**Developer:**
- Check PANDUAN_MIGRASI_HOSTING_BARU.md
- Check QUICK_REFERENCE.md

---

## Next Steps

Setelah deployment berhasil:
1. Update dokumentasi dengan URL production
2. Inform users tentang URL baru
3. Setup redirect dari URL lama (jika ada)
4. Monitor performance dan errors
5. Plan untuk regular backups
