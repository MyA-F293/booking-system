# 🤖 Quick Test: GitHub Actions Auto-Increment

## Status Sekarang:
- ✅ Manual increment works (week 1→2→3 tested)
- ✅ Rollback works (kembali ke 1)
- ❓ GitHub Actions status: **BELUM DIKETAHUI**

---

## 🎯 Cara Test (2 Menit):

### Step 1: Run Test SQL
1. Buka Supabase Dashboard > SQL Editor
2. Copy-paste file: `database/TEST_GITHUB_ACTIONS_AUTO_INCREMENT.sql`
3. **PENTING**: Ganti `'your-api-key-here'` dengan API key Anda
   - Jika belum punya API key, buat random string (min 20 karakter)
   - Contoh: `'eysa-secret-2026-abc123xyz'`
4. Run SQL

### Step 2: Lihat Hasil
Test akan menunjukkan:

#### ✅ Scenario 1: GitHub Actions AKTIF
```
last_update_wib: Monday, 00:01-00:05 WIB
diagnosis: 🎯 PERFECT! GitHub Actions auto-increment AKTIF!
```
→ **Tidak perlu setup lagi!** Sudah jalan otomatis.

#### ⚠️ Scenario 2: Function Ada, Tapi Belum Ada Bukti
```
api_function_exists: true
updated_on_monday: false (atau true tapi bukan jam 00:01)
diagnosis: ⚠️ Function ada, tapi belum ada bukti auto-increment
```
→ **Perlu check GitHub Actions tab**

#### ❌ Scenario 3: Function Tidak Ada
```
api_function_exists: false
diagnosis: ❌ Function tidak ada. Perlu install dulu.
```
→ **Run**: `database/INSTALL_ALL_FUNCTIONS.sql`

---

## 🔍 Verify di GitHub:

### Check Run History:
1. Go to GitHub repo
2. Click tab **Actions**
3. Cari workflow: **"Auto Increment Week"**
4. Lihat run history:
   - ✅ Ada run history → GitHub Actions AKTIF
   - ❌ Tidak ada run history → Perlu setup secrets

### Check Workflow Status:
- Workflow file: `.github/workflows/auto-increment-week.yml` ✅ (sudah ada)
- Schedule: Every Sunday 17:01 UTC (= Monday 00:01 WIB)
- Trigger: Otomatis setiap minggu + manual trigger

---

## 🚀 Jika Belum Aktif - Setup Secrets:

### Perlu 3 GitHub Secrets:

1. **SUPABASE_URL**
   - Value: `https://your-project.supabase.co`
   - Dari: Supabase > Settings > API > Project URL

2. **SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (panjang)
   - Dari: Supabase > Settings > API > anon public key

3. **SUPABASE_API_KEY**
   - Value: API key yang Anda buat sendiri (min 20 karakter)
   - Contoh: `eysa-secret-2026-abc123xyz`
   - **HARUS SAMA** dengan yang di SQL function `api_increment_week()`

### Cara Add Secrets:
1. GitHub repo > **Settings**
2. **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add ketiga secrets di atas
5. Save

### Test Manual Run:
1. GitHub > **Actions** tab
2. Click **Auto Increment Week**
3. Click **Run workflow** button
4. Wait 10-20 detik
5. Check logs untuk verify success

---

## 📊 Kesimpulan:

### Jika Test Menunjukkan Senin 00:01 WIB:
→ ✅ **GitHub Actions sudah aktif!** Tidak perlu setup lagi.

### Jika Test Tidak Menunjukkan Senin 00:01:
→ ⚠️ **Perlu verify di GitHub Actions tab**
→ Jika tidak ada run history: Setup 3 secrets
→ File panduan lengkap: `SETUP_GITHUB_AUTO_INCREMENT.md`

---

## 🎯 Next Action:
1. Run `database/TEST_GITHUB_ACTIONS_AUTO_INCREMENT.sql` (ganti API key)
2. Lihat hasil test
3. Check GitHub Actions tab
4. Setup secrets jika belum ada run history

**Estimasi**: 2-5 menit untuk test + verify
