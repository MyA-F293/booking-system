# 🚀 DEPLOY ULANG PORTAL - PANDUAN LENGKAP

## 🎯 KAPAN DEPLOY ULANG?

Deploy ulang **BISA membantu** jika:
- ✅ Files tidak ter-upload dengan benar
- ✅ Build error di GitHub Actions sebelumnya
- ✅ Files corrupt atau incomplete
- ✅ Cache issue di deployment

Deploy ulang **TIDAK akan membantu** jika:
- ❌ Subdomain configuration di cPanel rusak
- ❌ Document Root pointing ke folder salah
- ❌ DNS issue
- ❌ Apache vhost configuration bermasalah

---

## 📊 CEK DULU: Apakah Deploy Terakhir Sukses?

### Langkah 1: Cek GitHub Actions Status

1. Buka: https://github.com/MyA-f293/booking-system/actions
2. Lihat workflow terakhir: **"Deploy to Production"**
3. Cek status:
   - ✅ **Success (hijau)** → Files sudah ter-upload, masalah di cPanel
   - ❌ **Failed (merah)** → Build/deploy error, deploy ulang bisa membantu
   - 🟡 **Running (kuning)** → Tunggu selesai dulu

### Langkah 2: Cek Timestamp Deploy Terakhir

Lihat kapan deploy terakhir sukses:
- Jika baru saja (< 30 menit) → Masalah bukan di deployment
- Jika sudah lama (> 1 hari) → Mungkin ada update yang belum ke-deploy

---

## 🔄 CARA DEPLOY ULANG

### OPSI 1: Trigger GitHub Actions (RECOMMENDED)

**Ini cara tercepat dan paling aman!**

#### Step-by-step:

1. **Buka GitHub Actions**
   ```
   https://github.com/MyA-f293/booking-system/actions
   ```

2. **Pilih Workflow "Deploy to Production"**
   - Klik tab "Actions" di repo
   - Pilih workflow: "Deploy to Production"

3. **Run Manual Workflow**
   - Klik tombol "Run workflow" (kanan atas)
   - Pilih branch: `main` (default)
   - Klik "Run workflow" (hijau)

4. **Monitor Progress**
   - Tunggu workflow running (2-3 menit)
   - Lihat log untuk memastikan tidak ada error
   - Status harus ✅ hijau (success)

5. **Verify Deploy**
   - Setelah success, tunggu 30-60 detik
   - Buka: https://portal.eysalanguagecenter.com
   - Hard refresh: Ctrl + Shift + R

---

### OPSI 2: Git Push Trigger (Manual)

Jika Opsi 1 tidak tersedia, trigger deploy dengan git push:

```bash
# 1. Masuk ke folder booking-system
cd booking-system

# 2. Buat perubahan kecil (trigger deploy)
echo "# Redeploy" >> README.md

# 3. Commit dan push
git add README.md
git commit -m "Trigger redeploy"
git push origin main

# 4. Cek GitHub Actions
# https://github.com/MyA-f293/booking-system/actions
```

Monitor status deploy seperti di Opsi 1.

---

### OPSI 3: Build & Upload Manual via FTP

**Hanya jika GitHub Actions bermasalah!**

#### Prerequisites:
- Node.js installed
- FTP client (FileZilla) atau cPanel File Manager
- FTP credentials

#### Steps:

```bash
# 1. Masuk ke folder booking-system
cd booking-system

# 2. Install dependencies (jika belum)
npm install

# 3. Build production
npm run build

# 4. Hasil build ada di folder: dist/
# Files: index.html, assets/, .htaccess, dll
```

#### Upload via FTP:

**Option A: FileZilla (Desktop)**
1. Download FileZilla: https://filezilla-project.org/
2. Connect ke server:
   ```
   Host: 103.30.147.68 atau ftp.eysalanguagecenter.com
   Username: (username cPanel Anda)
   Password: (password cPanel Anda)
   Port: 21
   ```
3. Navigate ke: `/public_html/portal.eysalanguagecenter.com/`
4. **BACKUP DULU** (rename folder lama jadi `backup_old`)
5. Upload semua file dari folder `dist/` ke folder portal
6. Pastikan file `.htaccess` juga ke-upload

**Option B: cPanel File Manager**
1. Login ke cPanel
2. Buka "File Manager"
3. Navigate ke: `public_html/portal.eysalanguagecenter.com/`
4. **BACKUP DULU** (compress folder lama)
5. Delete files lama (kecuali backup)
6. Upload `dist.zip` (compress folder dist dulu)
7. Extract di folder portal
8. Pastikan `.htaccess` ada dan correct

---

## ✅ VERIFIKASI SETELAH DEPLOY

### Test 1: Cek Files Ada di Server

**Via cPanel File Manager:**
1. Navigate ke: `public_html/portal.eysalanguagecenter.com/`
2. Pastikan ada file:
   - ✅ `index.html` (file utama)
   - ✅ `.htaccess` (routing)
   - ✅ folder `assets/` (JS, CSS, images)
   - ✅ `manifest.json`
   - ✅ `version.json`

### Test 2: Cek File Size

- `index.html` → sekitar 1-3 KB (small)
- Folder `assets/` → total ~1-5 MB
- Jika file size 0 KB atau sangat kecil → upload gagal

### Test 3: Test Akses Website

```
1. https://portal.eysalanguagecenter.com
   → Should load booking system

2. https://portal.eysalanguagecenter.com/index.html
   → Should also work (direct file access)

3. Check browser console (F12)
   → No 404 errors for JS/CSS files
```

### Test 4: Hard Refresh

Setelah deploy ulang, **WAJIB** hard refresh:
- Chrome: Ctrl + Shift + R
- Firefox: Ctrl + F5
- Safari: Cmd + Shift + R

---

## 🔍 TROUBLESHOOTING

### Deploy Sukses Tapi Masih 404?

**Ini berarti masalah BUKAN di deployment, tapi di cPanel!**

Langkah berikutnya:
1. ✅ Cek subdomain `portal` di cPanel (lihat: FIX_PORTAL_404_SEKARANG.md)
2. ✅ Verify Document Root pointing ke folder yang benar
3. ✅ Test DNS resolution: `nslookup portal.eysalanguagecenter.com`

### Deploy Gagal (GitHub Actions Failed)?

**Cek error log di GitHub Actions:**

1. Buka workflow yang failed
2. Klik job yang failed (biasanya "deploy")
3. Lihat error message

**Common errors:**

#### Error: FTP Connection Failed
```
Solusi:
- Cek FTP credentials di GitHub Secrets
- Cek FTP_PASSWORD benar
- Test FTP connection manual via FileZilla
```

#### Error: Build Failed
```
Solusi:
- npm install error → Cek package.json
- Build error → Cek code syntax
- Run build locally: npm run build
```

#### Error: Permission Denied
```
Solusi:
- Cek folder permissions di server
- Folder: 755
- Files: 644
- Set via cPanel File Manager
```

### Files Tidak Ter-upload Lengkap?

**Cek GitHub Actions log:**
- Lihat berapa files yang ter-upload
- Expected: ~20-50 files (index.html + assets)
- Jika kurang → Re-run workflow

**Manual check di server:**
```bash
# Via SSH (jika ada akses)
ls -la /home/username/public_html/portal.eysalanguagecenter.com/

# Expected output:
# index.html
# .htaccess
# assets/ (folder with JS, CSS, images)
# manifest.json
# version.json
```

---

## 📋 CHECKLIST DEPLOY ULANG

### Pre-Deploy:
- [ ] Cek GitHub Actions status terakhir
- [ ] Backup files lama di server (via cPanel)
- [ ] Siapkan FTP credentials (jika manual)
- [ ] Pastikan internet stabil

### Deploy:
- [ ] Trigger GitHub Actions workflow
- [ ] Monitor progress (2-3 menit)
- [ ] Check status: Success ✅
- [ ] Verify files uploaded di cPanel File Manager

### Post-Deploy:
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Test akses: https://portal.eysalanguagecenter.com
- [ ] Check browser console (F12) - no errors
- [ ] Test login functionality
- [ ] Test booking flow (student)
- [ ] Test admin dashboard

### Jika Masih 404:
- [ ] Cek subdomain configuration di cPanel
- [ ] Verify Document Root
- [ ] Check DNS resolution
- [ ] Contact hosting support

---

## 💡 TIPS PRO

### 1. Selalu Backup Sebelum Deploy
```
Di cPanel File Manager:
1. Navigate ke folder portal
2. Klik kanan folder → Compress
3. Download file .zip sebagai backup
4. Baru deploy ulang
```

### 2. Monitor GitHub Actions Email
GitHub akan kirim email jika deploy gagal/sukses.
Check email untuk notifikasi otomatis.

### 3. Check Version.json
```
Akses: https://portal.eysalanguagecenter.com/version.json

Isi file ini update setiap deploy:
{
  "version": "1.0.x",
  "buildDate": "2026-07-03T...",
  "commitHash": "abc123"
}

Jika timestamp lama → Deploy belum update
```

### 4. Test di Incognito Mode
```
Buka browser incognito/private:
- Chrome: Ctrl + Shift + N
- Firefox: Ctrl + Shift + P

Test di incognito untuk bypass cache completely
```

---

## 🎯 KEPUTUSAN: Deploy Ulang atau Fix cPanel?

### Deploy Ulang JIKA:
- ✅ GitHub Actions terakhir failed
- ✅ Deploy sudah lama (> 1 minggu)
- ✅ Suspect files corrupt
- ✅ Ada code changes yang belum ke-deploy

### Fix cPanel JIKA:
- ✅ GitHub Actions terakhir success ✅
- ✅ Deploy baru saja (< 1 jam)
- ✅ Files ada di server tapi 404
- ✅ Subdomain tidak resolve

**Quick test untuk memutuskan:**
```
1. Cek GitHub Actions → Success ✅?
   → Jika YES → Fix cPanel (subdomain issue)
   → Jika NO → Deploy ulang

2. Cek files di cPanel File Manager → Ada?
   → Jika YES → Fix cPanel (configuration issue)
   → Jika NO → Deploy ulang
```

---

## 🆘 MASIH BELUM BISA?

### Contact Me:
Kirim screenshot:
1. GitHub Actions status page
2. cPanel File Manager (folder portal)
3. cPanel Subdomains list
4. Browser console error (F12)

### Contact Hosting Support:
**idwebhost.com:**
- Live Chat: https://idwebhost.com
- Ticket: https://clientzone.idwebhost.com
- Phone: 0274-5305505

**Info untuk support:**
```
Issue: Portal subdomain returns 404 after deployment
GitHub Actions: Success ✅ (attach screenshot)
Files uploaded: Verified in File Manager
Subdomain: portal.eysalanguagecenter.com
Request: Please verify Apache vhost configuration
```

---

## 📝 SUMMARY

**TL;DR:**
1. Cek GitHub Actions status dulu
2. Jika success → Masalah di cPanel, bukan deployment
3. Jika failed → Deploy ulang via GitHub Actions
4. Trigger workflow: "Run workflow" button
5. Monitor sampai success ✅
6. Test website dengan hard refresh

**Deploy ulang takes:** 2-3 menit
**Website online:** Immediately after success

Good luck! 🚀
