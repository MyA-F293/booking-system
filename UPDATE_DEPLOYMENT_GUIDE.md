# Panduan Update Aplikasi ke Production

## Workflow Update

### 1. Development & Testing
```bash
# Edit code di local
# Test perubahan
npm run dev
```

### 2. Commit ke GitHub (Backup)
```bash
git add .
git commit -m "Deskripsi perubahan"
git push origin main
```

### 3. Build Production
```bash
npm run build
```
Folder `dist/` akan berisi file production yang siap diupload.

### 4. Upload ke Hosting

#### Metode A: cPanel File Manager (Recommended untuk pemula)

1. **Zip folder dist**
   - Klik kanan folder `dist/` → Compress → ZIP
   - Atau via command: `tar -czf dist.zip dist/`

2. **Login cPanel**
   - URL: http://103.30.147.68:2083/
   - Username: eysalang
   - Password: D3a2dL[TYc71.s

3. **Navigate ke folder website**
   - File Manager → `/public_html/portal.eysalanguagecenter.com/`

4. **Backup file lama (optional tapi recommended)**
   - Select all files → Compress → `backup-YYYY-MM-DD.zip`
   - Move ke folder `/backups/`

5. **Hapus file lama**
   - Select all files (KECUALI `.htaccess`)
   - Delete

6. **Upload & Extract**
   - Upload `dist.zip`
   - Extract
   - Move semua file dari folder `dist/` ke root
   - Delete folder `dist/` yang kosong

7. **Verify**
   - Buka https://portal.eysalanguagecenter.com
   - Hard refresh: Ctrl + Shift + R
   - Test fitur yang diupdate

#### Metode B: FTP Client (Recommended untuk update rutin)

**Setup FTP Client (One-time)**
1. Download FileZilla: https://filezilla-project.org/
2. Install
3. Buat connection:
   - Host: `eysalanguagecenter.com`
   - Username: `eysalang`
   - Password: `D3a2dL[TYc71.s`
   - Port: `21`
4. Save connection

**Update via FTP**
1. Build: `npm run build`
2. Open FileZilla
3. Connect ke server
4. Navigate ke `/public_html/portal.eysalanguagecenter.com/`
5. **Backup** (optional):
   - Download semua file ke local folder `backup-YYYY-MM-DD/`
6. **Delete file lama** di server (kecuali `.htaccess`)
7. **Upload** semua file dari `dist/` ke server
8. Verify website

#### Metode C: Automated Deployment (Advanced)

**Setup GitHub Actions untuk Auto-Deploy**

Buat file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.3.0
      with:
        server: eysalanguagecenter.com
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./dist/
        server-dir: /public_html/portal.eysalanguagecenter.com/
```

**Setup Secrets di GitHub:**
1. GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `FTP_USERNAME`: eysalang
   - `FTP_PASSWORD`: D3a2dL[TYc71.s

**Setelah setup, setiap `git push` akan auto-deploy!**

---

## Checklist Update

### Pre-Update
- [ ] Test perubahan di local (`npm run dev`)
- [ ] Commit ke GitHub
- [ ] Build production (`npm run build`)
- [ ] Backup file production saat ini (optional)

### Update
- [ ] Upload file baru ke hosting
- [ ] Verify `.htaccess` masih ada
- [ ] Clear browser cache

### Post-Update
- [ ] Test website: https://portal.eysalanguagecenter.com
- [ ] Test fitur yang diupdate
- [ ] Test di mobile
- [ ] Check console untuk errors
- [ ] Inform users jika ada breaking changes

---

## Troubleshooting

### Website masih tampil versi lama
1. Hard refresh: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check apakah file terupload dengan benar
4. Check timestamp file di cPanel

### Error 404 setelah update
1. Pastikan `.htaccess` tidak terhapus
2. Re-upload `.htaccess` dari project
3. Check file permissions (644 untuk files, 755 untuk folders)

### Blank page / White screen
1. Check browser console untuk errors
2. Verify semua file dari `dist/` terupload
3. Check file `index.html` ada dan readable
4. Check error logs di cPanel

### Service Worker cache issue
1. Update version di `public/sw.js`
2. Users perlu hard refresh atau clear cache
3. Consider adding version query string: `app.js?v=1.0.1`

---

## Best Practices

1. **Always backup before update**
   - Download current production files
   - Or compress di server sebelum delete

2. **Test di staging dulu** (optional)
   - Buat subdomain `staging.portal.eysalanguagecenter.com`
   - Test update di staging dulu
   - Kalau OK, baru deploy ke production

3. **Update di jam sepi**
   - Malam hari atau weekend
   - Inform users sebelumnya

4. **Version control**
   - Tag release di GitHub: `git tag v1.0.1`
   - Dokumentasi changelog

5. **Monitor after update**
   - Check error logs
   - Monitor user feedback
   - Siap rollback kalau ada masalah

---

## Rollback (Kalau Ada Masalah)

### Via Backup
1. Login cPanel File Manager
2. Navigate ke `/public_html/portal.eysalanguagecenter.com/`
3. Delete semua file
4. Extract backup: `backup-YYYY-MM-DD.zip`
5. Verify website kembali normal

### Via Git
1. Checkout commit sebelumnya: `git checkout <commit-hash>`
2. Build: `npm run build`
3. Upload ke hosting

---

## Quick Commands

```bash
# Full update workflow
npm run build
# Then upload dist/ via FTP or cPanel

# With git
git add .
git commit -m "Update feature X"
git push
npm run build
# Upload dist/

# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz dist/
```

---

## Monitoring

### Check Website Status
- https://portal.eysalanguagecenter.com
- Check console: F12 → Console
- Check network: F12 → Network

### Check Hosting Resources
- cPanel → Metrics → Resource Usage
- Monitor bandwidth usage
- Monitor disk space

### Check Supabase
- Supabase Dashboard → Settings → Usage
- Monitor database size
- Monitor bandwidth

---

## Support

**Hosting Issues:**
- idwebhost.com support
- Email: support@idwebhost.com

**Application Issues:**
- Check GitHub issues
- Review error logs
- Check DEPLOYMENT_GUIDE.md
