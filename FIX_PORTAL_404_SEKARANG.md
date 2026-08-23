# 🚨 FIX PORTAL 404 - ACTION SEKARANG

## 🎯 MASALAH
- URL: https://portal.eysalanguagecenter.com → **404 Not Found**
- GitHub Actions deploy SUCCESS ✅
- Files sudah ke-upload ke server ✅
- Tapi website tidak bisa diakses ❌

## 🔍 PENYEBAB
**Subdomain configuration rusak/hilang di cPanel!**

Kemungkinan terjadi karena:
- Subdomain `portal` terhapus/disabled
- Document Root pointing ke folder salah
- Apache vhost configuration berubah

---

## ✅ SOLUSI STEP-BY-STEP

### STEP 1: Login ke cPanel
```
URL: http://103.30.147.68:2083/
atau: https://panel.idwebhost.com
Username: (username hosting Anda)
Password: (password hosting Anda)
```

### STEP 2: Cek Subdomain
1. Di cPanel, cari menu **"Subdomains"**
2. Lihat apakah subdomain `portal` masih ada
3. Cek **Document Root** nya

**Seharusnya:**
```
Subdomain: portal
Domain: eysalanguagecenter.com
Document Root: /home/username/public_html/portal.eysalanguagecenter.com
```

### STEP 3A: Jika Subdomain HILANG → BUAT ULANG

1. Di menu "Subdomains", klik **"Create Subdomain"**
2. Isi form:
   ```
   Subdomain: portal
   Domain: eysalanguagecenter.com
   Document Root: /home/username/public_html/portal.eysalanguagecenter.com
   ```
3. Klik **"Create"**
4. Tunggu 1-2 menit

### STEP 3B: Jika Subdomain ADA → CEK DOCUMENT ROOT

1. Di list subdomain, klik **icon pensil** (Edit) pada subdomain `portal`
2. Pastikan Document Root:
   ```
   /home/username/public_html/portal.eysalanguagecenter.com
   ```
3. Jika salah, edit dan save
4. Jika benar, lanjut ke Step 4

### STEP 4: Verify Files Ada di Folder yang Benar

1. Di cPanel, buka **"File Manager"**
2. Navigate ke: `public_html/portal.eysalanguagecenter.com/`
3. **PASTIKAN FILE INI ADA:**
   - ✅ `index.html` (file booking system)
   - ✅ `.htaccess` (routing configuration)
   - ✅ folder `assets/` (JS, CSS, images)
   - ✅ `version.json`
   - ✅ `manifest.json`

4. **Jika TIDAK ADA atau KOSONG:**
   - Files mungkin ter-upload ke folder lain
   - Cek folder: `public_html/` (root)
   - Atau trigger GitHub Actions deploy ulang

### STEP 5: Test .htaccess di Root (public_html)

1. Buka file: `public_html/.htaccess`
2. **PASTIKAN TIDAK ADA** baris yang redirect ke portal:
   
   ```apache
   # ❌ HAPUS baris ini jika ada:
   # RewriteRule ^(.*)$ portal.eysalanguagecenter.com/$1 [L]
   # Redirect / /portal.eysalanguagecenter.com/
   ```

3. **TAMBAHKAN** baris ini (jika belum ada):
   ```apache
   # Allow subdomain to work independently
   RewriteCond %{HTTP_HOST} ^portal\.eysalanguagecenter\.com$ [NC]
   RewriteRule ^(.*)$ - [L]
   ```

### STEP 6: Clear Cache dan Test

1. **Clear DNS Cache** (di komputer Anda):
   - Windows: `ipconfig /flushdns` di CMD
   - Mac: `sudo killall -HUP mDNSResponder`

2. **Clear Browser Cache**:
   - Chrome: Ctrl + Shift + Delete
   - Pilih "Cached images and files"
   - Clear data

3. **Hard Refresh**:
   - Ctrl + F5 (Windows)
   - Cmd + Shift + R (Mac)

4. **Test Akses**:
   ```
   https://portal.eysalanguagecenter.com
   https://portal.eysalanguagecenter.com/index.html
   ```

---

## 🔧 TROUBLESHOOTING

### Masih 404? Cek ini:

#### Test 1: Akses File Directly
```
https://portal.eysalanguagecenter.com/index.html
```
- **Jika JALAN** → Problem di `.htaccess` routing
- **Jika 404** → Problem di subdomain configuration

#### Test 2: Check DNS Resolution
```bash
# Di terminal/CMD:
nslookup portal.eysalanguagecenter.com
```

**Expected result:**
```
Name:    portal.eysalanguagecenter.com
Address: 103.30.147.68
```

Jika IP berbeda atau "Non-existent domain" → DNS problem!

#### Test 3: Test dengan IP Direct
```
http://103.30.147.68/portal.eysalanguagecenter.com/
```
- **Jika JALAN** → DNS belum propagate
- **Jika 404** → Files tidak di folder yang benar

### Jika Files Tidak Ada di Folder Portal

**Option A: Trigger GitHub Actions Deploy Ulang**
1. Buka: https://github.com/MyA-f293/booking-system/actions
2. Pilih workflow: "Deploy to Production"
3. Klik "Run workflow" → "Run workflow"
4. Tunggu deploy selesai (2-3 menit)

**Option B: Upload Manual via FTP**
1. Build project locally:
   ```bash
   cd booking-system
   npm run build
   ```
2. Upload folder `dist/` ke `/public_html/portal.eysalanguagecenter.com/`
3. Via FTP client (FileZilla) atau File Manager cPanel

---

## 📋 CHECKLIST

- [ ] Login ke cPanel berhasil
- [ ] Subdomain `portal` ada di cPanel
- [ ] Document Root: `/home/.../portal.eysalanguagecenter.com`
- [ ] File `index.html` ada di folder portal
- [ ] File `.htaccess` ada di folder portal
- [ ] No redirect ke portal di `.htaccess` root
- [ ] Clear browser cache
- [ ] Clear DNS cache
- [ ] Test akses: https://portal.eysalanguagecenter.com
- [ ] Test akses: https://portal.eysalanguagecenter.com/index.html

---

## 🆘 MASIH BELUM BISA?

### Hubungi Hosting Provider

**idwebhost.com Support:**
- Live Chat: https://idwebhost.com
- Ticket: https://clientzone.idwebhost.com
- Phone: 0274-5305505

**Info untuk support:**
```
Issue: Subdomain portal.eysalanguagecenter.com returns 404 Not Found
Domain: eysalanguagecenter.com
Subdomain: portal
Server: tridadi (103.30.147.68)
Previous status: Working before (deployed via GitHub Actions)
Files exist: Verified in /public_html/portal.eysalanguagecenter.com/
Request: Please check Apache vhost configuration for subdomain
```

### Screenshots yang Dibutuhkan

Jika mau kirim ke saya untuk analisis lebih lanjut:
1. **cPanel → Subdomains** (list subdomain)
2. **File Manager → `portal.eysalanguagecenter.com/`** (list files)
3. **Isi file `.htaccess`** di folder root (`public_html/`)
4. **Isi file `.htaccess`** di folder portal
5. **Result dari**: `nslookup portal.eysalanguagecenter.com`

---

## 💡 QUICK SUMMARY

**Yang paling mungkin:**
1. Subdomain configuration hilang → Recreate subdomain
2. Document Root salah → Edit ke folder yang benar
3. Files tidak ada → Re-deploy via GitHub Actions

**Quick test:**
```
https://portal.eysalanguagecenter.com/index.html
```
Kalau ini jalan tapi root URL tidak → problem di `.htaccess`

Good luck! 🚀
