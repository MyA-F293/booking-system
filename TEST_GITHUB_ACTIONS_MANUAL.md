# 🧪 Test GitHub Actions Manual - Step by Step

## 📋 Persiapan (30 detik):

### 1. Check Current Week
Buka Supabase SQL Editor, run:
```sql
SELECT current_week, updated_at AT TIME ZONE 'Asia/Jakarta' as updated_wib 
FROM settings WHERE id = 1;
```

Expected: `current_week = 1` (dari test sebelumnya)

---

## 🚀 Test Manual Run (2 menit):

### Step 1: Go to GitHub Actions
1. Buka GitHub repo Anda
2. Click tab **"Actions"** (di atas, sebelah Pull requests)
3. Lihat list workflows di sebelah kiri

### Step 2: Find Auto-Increment Workflow
Cari workflow dengan nama salah satu dari:
- "Auto Increment Week"
- "Setup auto-increment week"
- Atau yang mirip dengan auto-increment

Click workflow tersebut.

### Step 3: Run Workflow Manually
1. Di halaman workflow, lihat tombol **"Run workflow"** (dropdown, warna biru/hijau)
2. Click dropdown **"Run workflow"**
3. Pastikan branch = **main** (atau branch default Anda)
4. Click tombol **"Run workflow"** (hijau)

### Step 4: Wait & Monitor
1. Refresh halaman (F5)
2. Akan muncul workflow run baru dengan status:
   - 🟡 **Yellow dot** = Running (tunggu 10-30 detik)
   - ✅ **Green checkmark** = Success
   - ❌ **Red X** = Failed

3. Click workflow run yang baru muncul untuk lihat details

### Step 5: Check Logs
1. Di halaman workflow run, click job name (biasanya "increment-week" atau "build")
2. Expand steps untuk lihat logs
3. Cari output:
   - ✅ "Week incremented successfully!"
   - ✅ "Week changed from 1 to 2"
   - ❌ "Failed to increment week" (jika error)

---

## ✅ Verify di Supabase (30 detik):

### Check Week Naik
Buka Supabase SQL Editor, run:
```sql
SELECT 
    current_week,
    updated_at AT TIME ZONE 'Asia/Jakarta' as updated_wib,
    CASE 
        WHEN current_week = 2 THEN '✅ SUCCESS - Week naik dari 1 ke 2'
        WHEN current_week = 1 THEN '❌ FAILED - Week masih 1'
        ELSE '⚠️ Unexpected week: ' || current_week
    END as test_result
FROM settings WHERE id = 1;
```

Expected result:
```
current_week: 2
updated_wib: 2026-03-27 11:XX:XX (waktu sekarang)
test_result: ✅ SUCCESS - Week naik dari 1 ke 2
```

---

## 🎯 Hasil Test:

### ✅ Jika Success:
- Week naik dari 1 → 2 ✅
- GitHub Actions logs menunjukkan "Week incremented successfully!" ✅
- **Kesimpulan**: GitHub Actions setup BENAR dan BERFUNGSI! 🎉
- **Next**: Tunggu Senin 00:01 WIB untuk verify auto-increment otomatis

### ❌ Jika Failed:
Check error di GitHub Actions logs:

#### Error 1: "Invalid API key"
**Problem**: API key di GitHub Secrets tidak match dengan function
**Fix**: 
1. Check secret `SUPABASE_API_KEY` di GitHub Settings > Secrets
2. Check API key di function `api_increment_week()` di Supabase
3. Pastikan SAMA PERSIS (case-sensitive, no spaces)

#### Error 2: "404 Not Found"
**Problem**: URL Supabase salah
**Fix**:
1. Check secret `SUPABASE_URL` di GitHub Settings > Secrets
2. Format harus: `https://your-project.supabase.co` (no trailing slash)
3. Copy dari Supabase Dashboard > Settings > API > Project URL

#### Error 3: "Unauthorized"
**Problem**: Anon key salah atau expired
**Fix**:
1. Check secret `SUPABASE_ANON_KEY` di GitHub Settings > Secrets
2. Copy ulang dari Supabase Dashboard > Settings > API > anon public key
3. Pastikan tidak ada spasi atau karakter tambahan

#### Error 4: "Function not found"
**Problem**: Function `api_increment_week()` belum ada
**Fix**:
1. Run SQL: `database/INSTALL_ALL_FUNCTIONS.sql`
2. Verify function exists:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'api_increment_week';
```

---

## 🔄 Rollback (Optional):

Jika ingin reset week ke 1 setelah test:
```sql
UPDATE settings SET current_week = 1, updated_at = NOW() WHERE id = 1;
```

---

## 📊 Summary Checklist:

- [ ] Current week = 1 (sebelum test)
- [ ] Go to GitHub > Actions tab
- [ ] Find auto-increment workflow
- [ ] Click "Run workflow" button
- [ ] Wait for green checkmark (10-30 detik)
- [ ] Check logs: "Week incremented successfully!"
- [ ] Verify di Supabase: current_week = 2
- [ ] ✅ Test SUCCESS!

---

## 🎯 Next Steps After Success:

1. ✅ **Manual test works** - GitHub Actions bisa increment week
2. ⏰ **Wait for Monday 00:01 WIB** - Verify auto-increment otomatis jalan
3. 📊 **Monitor** - Check setiap Senin pagi apakah week naik otomatis
4. 🔧 **Fallback** - Jika auto-increment gagal, admin bisa manual click button ▶ di dashboard

---

**Estimasi Waktu**: 2-3 menit total
**Difficulty**: Easy ⭐
**Status**: Ready to test! 🚀
