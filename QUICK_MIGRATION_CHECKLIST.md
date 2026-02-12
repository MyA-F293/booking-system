# ⚡ Quick Migration Checklist

Checklist cepat untuk migrasi ke hosting baru. Untuk detail lengkap, baca `PANDUAN_MIGRASI_HOSTING_BARU.md`.

---

## 📋 Pre-Migration (Sebelum Beli Hosting)

- [ ] Backup database lama (Actions → Full Database Backup)
- [ ] Simpan file SQL + JSON di 2 tempat (Google Drive + local)
- [ ] Backup file `.env.local`
- [ ] Screenshot semua settings penting
- [ ] Catat jumlah data (students, teachers, classes, bookings, attendance)

---

## 🛒 Beli Hosting & Domain

- [ ] Beli hosting (VPS/Shared) - Rekomendasi: min 2GB RAM, 20GB storage
- [ ] Beli domain
- [ ] Setup DNS domain ke hosting
- [ ] Dapatkan akses SSH/FTP
- [ ] Dapatkan akses cPanel/control panel

---

## 🗄️ Setup Database Baru

### Opsi A: Supabase (Recommended)
- [ ] Buat project baru di https://supabase.com
- [ ] Copy Project URL dan anon key
- [ ] Buat tables via SQL Editor
- [ ] Test connection

### Opsi B: PostgreSQL Hosting
- [ ] Buat database baru
- [ ] Buat user database
- [ ] Import schema SQL
- [ ] Test connection

---

## 📤 Upload Files ke Hosting

### Via Git (Recommended)
```bash
cd /home/username/public_html
git clone https://github.com/MyA-F293/booking-system.git .
npm install
```

### Via FTP
- [ ] Upload semua files KECUALI: node_modules, backups, .git, .env.local
- [ ] Install dependencies: `npm install`

---

## ⚙️ Configuration

- [ ] Buat file `.env.local` baru dengan credentials baru
- [ ] Build project: `npm run build`
- [ ] Copy dist/ ke public_html/
- [ ] Setup .htaccess atau nginx config untuk SPA routing

---

## 🔄 Restore Database

### Via UI (Easiest)
- [ ] Buka domainbaru.com
- [ ] Login as Admin
- [ ] Actions → Restore Database
- [ ] Upload JSON backup
- [ ] Wait for completion

### Via CLI
```bash
node tools/restore-database.js
```

---

## 🔒 Setup SSL

### cPanel
- [ ] SSL/TLS Status → Run AutoSSL

### Let's Encrypt
```bash
sudo certbot --nginx -d domainbaru.com -d www.domainbaru.com
```

---

## ✅ Testing

- [ ] Website accessible via HTTPS
- [ ] Login works (Admin, Teacher, Student)
- [ ] All data visible (students, teachers, classes, bookings, attendance)
- [ ] Create new student works
- [ ] Booking works
- [ ] Attendance works
- [ ] Backup works
- [ ] Mobile responsive
- [ ] PWA installable

---

## 🔧 Post-Migration

- [ ] Update manifest.json dengan domain baru
- [ ] Setup backup cron job
- [ ] Setup monitoring (Uptime Robot)
- [ ] Redirect domain lama (jika ada)
- [ ] Inform users tentang domain baru
- [ ] Update dokumentasi

---

## 🚨 Emergency Contacts

**Jika ada masalah:**
1. Check browser console (F12)
2. Check server logs
3. Baca PANDUAN_MIGRASI_HOSTING_BARU.md
4. Contact hosting support
5. Contact developer

---

## 📊 Expected Timeline

- **Backup database:** 5-10 menit
- **Setup hosting:** 30-60 menit
- **Upload files:** 10-30 menit
- **Setup database:** 20-40 menit
- **Restore data:** 10-30 menit
- **Testing:** 30-60 menit
- **SSL setup:** 5-15 menit

**Total:** 2-4 jam (tergantung pengalaman)

---

## 💡 Tips

1. **Lakukan di waktu sepi** (malam/weekend) untuk minimize downtime
2. **Test di staging dulu** jika memungkinkan
3. **Jangan hapus hosting lama** sampai yakin hosting baru stable (1-2 minggu)
4. **Backup berkala** setelah migrasi
5. **Monitor closely** 1-2 minggu pertama

---

**Ready to migrate? Let's go! 🚀**

Baca detail lengkap di: `PANDUAN_MIGRASI_HOSTING_BARU.md`
