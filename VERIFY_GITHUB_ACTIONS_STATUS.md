# ✅ Verify: Apakah GitHub Actions Sudah Aktif?

## 🔍 Quick Check (2 menit)

### Step 1: Check GitHub Actions
```
1. Buka GitHub repo Anda
2. Klik tab "Actions" (di atas)
3. Cari workflow: "Auto Increment Week"
```

**Jika sudah aktif:**
- ✅ Ada workflow "Auto Increment Week" di list
- ✅ Ada run history (hijau = success, merah = failed)
- ✅ Klik salah satu run → lihat logs

**Jika belum aktif:**
- ⚠️ Workflow ada tapi tidak ada run history
- ⚠️ Atau workflow tidak muncul sama sekali
- → Perlu setup secrets (lihat Step 2)

---

### Step 2: Check GitHub Secrets
```
1. Go to: Settings > Secrets and variables > Actions
2. Check apakah ada 3 secrets:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_API_KEY
```

**Jika sudah ada 3 secrets:**
- ✅ GitHub Actions sudah di-setup
- ✅ Workflow akan jalan otomatis setiap Senin 00:01 WIB
- ✅ Tidak perlu setup lagi

**Jika belum ada secrets:**
- ⚠️ Perlu setup secrets
- → Ikuti: `SETUP_GITHUB_AUTO_INCREMENT.md`
- → Atau: `GITHUB_AUTO_INCREMENT_CHECKLIST.txt`

---

### Step 3: Check Database Function
```sql
-- Run di Supabase SQL Editor
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'api_increment_week';
```

**Jika ada result:**
- ✅ API function sudah dibuat
- ✅ GitHub Actions bisa call function ini

**Jika tidak ada result:**
- ⚠️ Perlu run SQL untuk create function
- → File: `database/CREATE_API_INCREMENT_WEEK.sql`
- → GANTI API key dengan yang rahasia

---

### Step 4: Test Manual Run
```
1. Go to: Actions tab
2. Click: "Auto Increment Week"
3. Click: "Run workflow" dropdown
4. Click: "Run workflow" button
5. Wait: 10-30 detik
6. Refresh page
7. Click: Workflow run yang baru muncul
8. Check logs
```

**Expected logs:**
```
✅ Week incremented successfully!
📅 Week changed from X to Y
```

**Jika error:**
- Check error message di logs
- Lihat troubleshooting di bawah

---

## 🎯 Status Check Summary

| Item | Check | Status |
|------|-------|--------|
| Workflow file exists | `.github/workflows/auto-increment-week.yml` | ✅ Ada |
| GitHub Secrets | 3 secrets (URL, ANON_KEY, API_KEY) | ❓ Perlu check |
| Database function | `api_increment_week()` | ❓ Perlu check |
| Run history | Actions tab > workflow runs | ❓ Perlu check |

---

## 🔧 Troubleshooting

### Workflow tidak muncul di Actions tab:
```
1. Check file ada: .github/workflows/auto-increment-week.yml
2. Push ke GitHub:
   git add .github/workflows/auto-increment-week.yml
   git commit -m "Add auto-increment workflow"
   git push
3. Refresh GitHub Actions tab
```

### Workflow error "Invalid API key":
```
1. Check secret SUPABASE_API_KEY di GitHub
2. Check API key di SQL function
3. Pastikan sama persis (case-sensitive)
```

### Workflow error "404 Not Found":
```
1. Check secret SUPABASE_URL
2. Format harus: https://your-project.supabase.co
3. Tidak ada trailing slash (/)
```

### Workflow tidak jalan otomatis:
```
1. Check schedule di workflow file: '1 17 * * 0'
2. Tunggu sampai Senin 00:01 WIB
3. Check Actions tab setelah Senin 00:01
4. Atau test manual dulu
```

---

## 📊 Cara Verify Auto-Increment Bekerja

### Senin pagi (setelah 00:01 WIB):
```
1. Check GitHub Actions:
   - Go to: Actions tab
   - Lihat run terakhir (harus ada yang baru)
   - Status harus hijau (success)

2. Check Database:
   SELECT current_week, updated_at 
   FROM settings 
   WHERE id = 1;
   
   - updated_at harus Senin pagi (baru)
   - current_week harus naik +1

3. Check AdminDashboard:
   - Refresh browser
   - Header harus tampil week yang baru
```

---

## 🎯 Quick Answer

**Apakah GitHub Actions sudah aktif?**

Cara paling cepat untuk tahu:
1. Buka: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
2. Cari: "Auto Increment Week"
3. Lihat: Ada run history?
   - **Ada** → Sudah aktif ✅
   - **Tidak ada** → Belum aktif, perlu setup ⚠️

---

## 📁 Files untuk Setup (Jika Belum Aktif)

1. **SETUP_GITHUB_AUTO_INCREMENT.md** - Panduan lengkap
2. **GITHUB_AUTO_INCREMENT_CHECKLIST.txt** - Quick checklist
3. **database/CREATE_API_INCREMENT_WEEK.sql** - SQL function
4. **database/CHECK_API_FUNCTION_EXISTS.sql** - Check function exists

---

**Date**: 27 Maret 2026
