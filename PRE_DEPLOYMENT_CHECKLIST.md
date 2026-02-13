# Pre-Deployment Checklist

## ✅ Tahap 1: Setup Konfigurasi (SELESAI)

### File Konfigurasi
- [x] `.env.production` - Environment variables untuk production
- [x] `public/manifest.json` - PWA manifest dengan domain baru
- [x] `.htaccess` - Apache configuration untuk SPA routing & security
- [x] `DEPLOYMENT_GUIDE.md` - Panduan lengkap deployment

### Verifikasi Konfigurasi
- [x] Supabase URL: https://zckdzifjyoglyqnxdtaw.supabase.co
- [x] Domain production: https://portal.eysalanguagecenter.com
- [x] PWA start_url sudah menggunakan domain baru
- [x] Security headers configured

---

## 📋 Tahap 2: Persiapan Deploy (BELUM)

### Pre-Build Checklist
- [ ] Test aplikasi di local: `npm run dev`
- [ ] Pastikan tidak ada error di console
- [ ] Test login admin, teacher, student
- [ ] Test booking & attendance features
- [ ] Verify Supabase connection

### Build Production
```bash
# 1. Install dependencies
npm install

# 2. Build untuk production
npm run build

# 3. Preview build (optional)
npm run preview
```

### Verifikasi Build
- [ ] Folder `dist/` terbuat
- [ ] File `dist/index.html` ada
- [ ] Folder `dist/assets/` berisi JS & CSS
- [ ] File `dist/manifest.json` ada
- [ ] File `dist/sw.js` ada
- [ ] Icons (192, 512) ada di dist/

---

## 🌐 Tahap 3: Setup Hosting (BELUM)

### cPanel Setup
- [ ] Login ke cPanel: http://103.30.147.68:2083/
- [ ] Buat subdomain: portal.eysalanguagecenter.com
- [ ] Document root: /public_html/portal/
- [ ] Subdomain aktif dan accessible

### SSL Certificate
- [ ] Install SSL via AutoSSL di cPanel
- [ ] Verify HTTPS aktif
- [ ] Test redirect HTTP → HTTPS

---

## 📤 Tahap 4: Upload Files (BELUM)

### Metode 1: FTP (Recommended)
```
Host: eysalanguagecenter.com
Username: eysalang
Port: 21
```

Upload semua file dari `dist/` ke `/public_html/portal/`

### Metode 2: cPanel File Manager
1. Zip folder `dist/` menjadi `dist.zip`
2. Upload via File Manager
3. Extract di `/public_html/portal/`
4. Move semua file dari `dist/` ke root portal

### Files yang Harus Diupload
- [ ] index.html
- [ ] assets/ (folder dengan JS & CSS)
- [ ] manifest.json
- [ ] sw.js
- [ ] .htaccess
- [ ] eysa-logo.svg
- [ ] icon-192.png
- [ ] icon-512.png
- [ ] icon-maskable-192.png
- [ ] icon-maskable-512.png
- [ ] apple-touch-icon.png
- [ ] booking-illustration.png (jika ada)

---

## 🧪 Tahap 5: Testing (BELUM)

### Basic Testing
- [ ] Akses https://portal.eysalanguagecenter.com
- [ ] Halaman loading tanpa error
- [ ] Check browser console (no errors)
- [ ] Check Network tab (all assets loaded)

### Functional Testing
- [ ] Login sebagai Admin
- [ ] Login sebagai Teacher
- [ ] Login sebagai Student
- [ ] Create booking
- [ ] Mark attendance
- [ ] View reports
- [ ] Export data

### PWA Testing
- [ ] Install PWA di Android
- [ ] Install PWA di iOS
- [ ] Test offline mode
- [ ] Test push notifications
- [ ] Check app shortcuts

### Performance Testing
- [ ] Google PageSpeed Insights
- [ ] Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
- [ ] Mobile responsiveness
- [ ] Load time < 3 seconds

---

## 🔧 Tahap 6: Post-Deployment (BELUM)

### Monitoring Setup
- [ ] Setup uptime monitoring
- [ ] Setup error tracking
- [ ] Setup analytics
- [ ] Document production URLs

### Backup
- [ ] Backup Supabase database
- [ ] Backup hosting files
- [ ] Save credentials securely
- [ ] Document backup procedures

### Documentation
- [ ] Update README.md dengan production URL
- [ ] Update user guides
- [ ] Inform stakeholders
- [ ] Create maintenance plan

---

## 🚨 Troubleshooting Quick Reference

### Website tidak bisa diakses
1. Check DNS propagation
2. Verify subdomain setup di cPanel
3. Check file permissions (755/644)
4. Review error logs

### Blank page
1. Check browser console
2. Verify all files uploaded
3. Check .htaccess syntax
4. Test with cache disabled

### API errors
1. Verify Supabase credentials
2. Check CORS settings
3. Test API endpoints
4. Review network requests

### PWA tidak install
1. Verify HTTPS active
2. Check manifest.json
3. Test service worker
4. Verify icons available

---

## 📞 Support Contacts

**Hosting:** idwebhost.com support  
**Developer:** Check DEPLOYMENT_GUIDE.md  
**Documentation:** QUICK_REFERENCE.md

---

## ✨ Status Saat Ini

**Tahap 1: Setup Konfigurasi** ✅ SELESAI

File-file berikut sudah dibuat dan siap:
- `.env.production` - Production environment variables
- `public/manifest.json` - Updated dengan domain baru
- `.htaccess` - Apache configuration
- `DEPLOYMENT_GUIDE.md` - Panduan lengkap
- `PRE_DEPLOYMENT_CHECKLIST.md` - Checklist ini

**Next Step:** Tahap 2 - Build Production

Jalankan:
```bash
npm run build
```

Kemudian lanjut ke tahap 3 untuk setup hosting.
