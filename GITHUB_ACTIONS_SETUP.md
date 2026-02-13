# Setup GitHub Actions Auto-Deploy

## Apa itu GitHub Actions?

GitHub Actions adalah fitur otomasi dari GitHub yang bisa menjalankan task otomatis setiap kali kamu push code. Dalam kasus ini, setiap `git push` akan:
1. Build aplikasi otomatis
2. Upload ke hosting otomatis
3. Website langsung update

**Workflow:** `git push` → Auto build → Auto upload → Live! 🚀

---

## Setup Instructions

### Step 1: Setup GitHub Secrets

GitHub Secrets adalah tempat menyimpan password/credentials secara aman di GitHub.

1. **Buka GitHub Repository**
   - https://github.com/[username]/[repo-name]

2. **Navigate ke Settings**
   - Klik tab "Settings" (pojok kanan atas)

3. **Buka Secrets and Variables**
   - Sidebar kiri → "Secrets and variables" → "Actions"

4. **Add Repository Secrets**
   Klik "New repository secret" dan tambahkan satu per satu:

   **Secret 1: FTP_USERNAME**
   - Name: `FTP_USERNAME`
   - Value: `eysalang`
   - Klik "Add secret"

   **Secret 2: FTP_PASSWORD**
   - Name: `FTP_PASSWORD`
   - Value: `D3a2dL[TYc71.s`
   - Klik "Add secret"

   **Secret 3: VITE_SUPABASE_URL**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://zckdzifjyoglyqnxdtaw.supabase.co`
   - Klik "Add secret"

   **Secret 4: VITE_SUPABASE_ANON_KEY**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja2R6aWZqeW9nbHlxbnhkdGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODQzMzIsImV4cCI6MjA4MzI2MDMzMn0.N29Ajb51HV2w5hbs07f9YJqEtWnenOhD0YJO2lebtgY`
   - Klik "Add secret"

   **Secret 5: VITE_FEEDBACK_SHEET_URL**
   - Name: `VITE_FEEDBACK_SHEET_URL`
   - Value: `https://script.google.com/macros/s/AKfycbxVZm9hU8mtt8eB1krvVsutGz2btSKD1g2P-F3PKLDcDzmKqUu4u9n2lqhCnDiV1S2J/exec`
   - Klik "Add secret"

   **Secret 6: VITE_ATTENDANCE_SHEET_URL**
   - Name: `VITE_ATTENDANCE_SHEET_URL`
   - Value: `https://script.google.com/macros/s/AKfycbwsN0qh662KWsYVenLUp_KryVfV_cGlWR9YvdDcjE0mYA-6oeINLvI6eQ9Ul-qNgt0twQ/exec`
   - Klik "Add secret"

   **Secret 7: VITE_VAPID_PUBLIC_KEY**
   - Name: `VITE_VAPID_PUBLIC_KEY`
   - Value: `BC7mGzQjrEjRAcJXXMIMLhCj8j8P75wz8MTlM523n-XBRna_jnYKH3kMgcdyQNlrXMVnYQXouVkefEYjGlFMcp8`
   - Klik "Add secret"

5. **Verify Secrets**
   Setelah selesai, kamu harus punya 7 secrets:
   - ✅ FTP_USERNAME
   - ✅ FTP_PASSWORD
   - ✅ VITE_SUPABASE_URL
   - ✅ VITE_SUPABASE_ANON_KEY
   - ✅ VITE_FEEDBACK_SHEET_URL
   - ✅ VITE_ATTENDANCE_SHEET_URL
   - ✅ VITE_VAPID_PUBLIC_KEY

---

### Step 2: Push GitHub Actions Workflow

File `.github/workflows/deploy.yml` sudah dibuat. Sekarang push ke GitHub:

```bash
git add .github/workflows/deploy.yml
git add GITHUB_ACTIONS_SETUP.md
git commit -m "Setup GitHub Actions auto-deploy"
git push origin main
```

---

### Step 3: Test Auto-Deploy

Setelah push, GitHub Actions akan otomatis jalan:

1. **Check Actions Tab**
   - Buka GitHub repo → Tab "Actions"
   - Kamu akan lihat workflow "Deploy to Production" sedang running

2. **Monitor Progress**
   - Klik workflow yang sedang running
   - Lihat log real-time
   - Tunggu sampai selesai (biasanya 2-5 menit)

3. **Verify Deployment**
   - Kalau success (✅ hijau), buka https://portal.eysalanguagecenter.com
   - Website sudah update otomatis!

---

## How to Use

### Normal Workflow (Setelah Setup)

```bash
# 1. Edit code
# (edit file yang mau diubah)

# 2. Test di local
npm run dev

# 3. Commit & Push
git add .
git commit -m "Update feature X"
git push origin main

# 4. DONE! 
# GitHub Actions akan otomatis:
# - Build production
# - Upload ke hosting
# - Website langsung update
```

**Tidak perlu lagi:**
- ❌ `npm run build` manual
- ❌ Upload via cPanel
- ❌ Upload via FTP

**Cukup `git push` dan tunggu 2-5 menit!** ✅

---

## Manual Trigger (Optional)

Kalau mau deploy manual tanpa push code baru:

1. GitHub repo → Tab "Actions"
2. Pilih workflow "Deploy to Production"
3. Klik "Run workflow" → "Run workflow"
4. Tunggu selesai

---

## Monitoring & Troubleshooting

### Check Deployment Status

**Via GitHub:**
- Tab "Actions" → Lihat status workflow
- ✅ Hijau = Success
- ❌ Merah = Failed
- 🟡 Kuning = Running

**Via Website:**
- Buka https://portal.eysalanguagecenter.com
- Hard refresh: Ctrl + Shift + R
- Check console untuk errors

### Common Issues

#### 1. Build Failed
**Error:** `npm ci` atau `npm run build` failed

**Solution:**
- Check error log di Actions tab
- Pastikan `package.json` tidak ada error
- Test build di local: `npm run build`

#### 2. FTP Connection Failed
**Error:** "Failed to connect to FTP server"

**Solution:**
- Check FTP credentials di Secrets
- Pastikan FTP_USERNAME dan FTP_PASSWORD benar
- Test FTP manual via FileZilla

#### 3. Deployment Success tapi Website Tidak Update
**Solution:**
- Hard refresh browser: Ctrl + Shift + R
- Clear browser cache
- Check file timestamp di cPanel File Manager
- Check service worker cache

#### 4. Environment Variables Missing
**Error:** "VITE_SUPABASE_URL is not defined"

**Solution:**
- Check semua secrets sudah ditambahkan di GitHub
- Nama secret harus EXACT match (case-sensitive)
- Re-run workflow setelah add secrets

---

## Advanced Configuration

### Deploy Only on Specific Branch

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ production ]  # Hanya deploy dari branch production
```

### Deploy on Tag/Release

```yaml
on:
  push:
    tags:
      - 'v*'  # Deploy saat push tag v1.0.0, v1.0.1, etc
```

### Add Slack/Discord Notification

Tambahkan step di workflow untuk notifikasi saat deploy success/failed.

### Staging Environment

Buat workflow terpisah untuk deploy ke staging:
- `.github/workflows/deploy-staging.yml`
- Deploy ke subdomain `staging.portal.eysalanguagecenter.com`

---

## Security Notes

1. **Secrets are encrypted** - GitHub encrypt semua secrets, aman
2. **Never commit secrets** - Jangan pernah commit password di code
3. **Use environment variables** - Selalu pakai env vars untuk credentials
4. **Rotate passwords regularly** - Ganti password FTP secara berkala

---

## Rollback

Kalau deployment bermasalah dan mau rollback:

### Option 1: Revert Commit
```bash
git revert HEAD
git push origin main
# Auto-deploy akan jalan dengan code sebelumnya
```

### Option 2: Manual Rollback
1. Login cPanel File Manager
2. Restore dari backup
3. Atau re-deploy commit sebelumnya via Actions

---

## Benefits

✅ **Faster deployment** - 2-5 menit otomatis vs 10-15 menit manual
✅ **Less error** - Tidak ada human error saat upload
✅ **Consistent** - Build process selalu sama
✅ **Trackable** - Semua deployment tercatat di Actions log
✅ **Rollback easy** - Tinggal revert commit
✅ **Team-friendly** - Siapapun yang push akan auto-deploy

---

## Cost

**GitHub Actions Free Tier:**
- 2,000 minutes/month untuk private repo
- Unlimited untuk public repo

**Estimasi usage:**
- 1 deployment = ~3 menit
- 2,000 minutes = ~666 deployments/bulan
- **Lebih dari cukup!** ✅

---

## Next Steps

Setelah setup selesai:

1. ✅ Test deployment dengan push dummy commit
2. ✅ Monitor Actions tab untuk status
3. ✅ Verify website update
4. ✅ Inform team tentang workflow baru
5. ✅ Update documentation

---

## Support

**GitHub Actions Issues:**
- Check Actions tab untuk error logs
- GitHub Docs: https://docs.github.com/en/actions

**FTP Issues:**
- Check FTP credentials
- Test manual via FileZilla
- Contact hosting support

**Application Issues:**
- Check browser console
- Review deployment logs
- Test di local environment
