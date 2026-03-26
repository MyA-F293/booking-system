# Setup GitHub Actions - Auto Increment Week

## ✅ Status: File Workflow Sudah Ada
File `.github/workflows/auto-increment-week.yml` sudah dibuat dan siap digunakan.

## 📋 Langkah Setup (5 Menit):

### Step 1: Setup API Function di Supabase
1. Buka Supabase Dashboard > SQL Editor
2. Copy-paste SQL berikut:

```sql
-- Create API function untuk increment week
CREATE OR REPLACE FUNCTION public.api_increment_week(api_key TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_week INTEGER;
    new_week INTEGER;
    expected_key TEXT := 'eysa-auto-week-2026-xyz123'; -- GANTI dengan API key rahasia Anda
BEGIN
    -- Verify API key
    IF api_key != expected_key THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid API key'
        );
    END IF;
    
    -- Get current week
    SELECT current_week INTO old_week
    FROM settings
    WHERE id = 1;
    
    -- Increment week
    new_week := old_week + 1;
    
    -- Update settings table
    UPDATE settings
    SET current_week = new_week,
        updated_at = NOW()
    WHERE id = 1;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'old_week', old_week,
        'new_week', new_week,
        'timestamp', NOW()
    );
END;
$$;
```

3. **PENTING**: Ganti `'eysa-auto-week-2026-xyz123'` dengan API key rahasia Anda sendiri
   - Contoh: `'eysa-secret-key-abc123def456'`
   - Buat yang panjang dan random
   - Simpan API key ini, akan dipakai di Step 2

4. Run SQL
5. Test function:
```sql
SELECT api_increment_week('eysa-auto-week-2026-xyz123');
```

Expected result:
```json
{
  "success": true,
  "old_week": 1,
  "new_week": 2,
  "timestamp": "2026-03-27T..."
}
```

---

### Step 2: Setup GitHub Secrets
1. Go to GitHub repo: **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Tambahkan 3 secrets:

#### Secret 1: SUPABASE_URL
- Name: `SUPABASE_URL`
- Value: `https://your-project.supabase.co`
- Cara dapat: Supabase Dashboard > Settings > API > Project URL

#### Secret 2: SUPABASE_ANON_KEY
- Name: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (panjang)
- Cara dapat: Supabase Dashboard > Settings > API > Project API keys > anon public

#### Secret 3: SUPABASE_API_KEY
- Name: `SUPABASE_API_KEY`
- Value: `eysa-auto-week-2026-xyz123` (yang Anda buat di Step 1)
- Ini adalah API key rahasia yang Anda set di SQL function

4. Verify semua secrets sudah tersimpan

---

### Step 3: Push ke GitHub
File workflow sudah ada di `.github/workflows/auto-increment-week.yml`

1. Commit & push:
```bash
git add .github/workflows/auto-increment-week.yml
git commit -m "Add auto-increment week workflow"
git push
```

2. Go to GitHub repo > **Actions** tab
3. Pastikan workflow "Auto Increment Week" muncul

---

### Step 4: Test Manual
1. Go to **Actions** tab
2. Click **Auto Increment Week** workflow
3. Click **Run workflow** dropdown
4. Click **Run workflow** button
5. Wait beberapa detik
6. Click workflow run yang baru muncul
7. Check logs:
   - ✅ Harus ada "Week incremented successfully!"
   - ✅ Harus ada "Week changed from X to Y"

8. Verify di Supabase:
```sql
SELECT current_week, updated_at FROM settings WHERE id = 1;
```

---

## 🎯 Jadwal Otomatis:
Setelah setup selesai, workflow akan otomatis jalan:
- **Setiap Senin jam 00:01 WIB** (Minggu 17:01 UTC)
- Tidak perlu manual lagi!

---

## 📊 Monitoring:

### Check di GitHub:
1. Go to **Actions** tab
2. Lihat history "Auto Increment Week"
3. Check logs setiap Senin

### Check di Supabase:
```sql
-- Check current week
SELECT current_week, updated_at FROM settings WHERE id = 1;

-- Check last update time
SELECT 
    current_week,
    updated_at,
    updated_at AT TIME ZONE 'Asia/Jakarta' as updated_at_wib
FROM settings 
WHERE id = 1;
```

---

## 🔧 Troubleshooting:

### Workflow gagal dengan "Invalid API key":
- Check secret `SUPABASE_API_KEY` di GitHub
- Pastikan sama dengan yang di SQL function
- Tidak ada typo atau spasi

### Workflow gagal dengan "404 Not Found":
- Check secret `SUPABASE_URL` di GitHub
- Pastikan format: `https://your-project.supabase.co` (tanpa trailing slash)

### Workflow gagal dengan "Unauthorized":
- Check secret `SUPABASE_ANON_KEY` di GitHub
- Copy ulang dari Supabase Dashboard > Settings > API

### Week tidak increment:
- Check apakah workflow enabled di GitHub Actions
- Check schedule: `1 17 * * 0` (Minggu 17:01 UTC = Senin 00:01 WIB)
- Test manual dulu untuk verify function works

---

## 🎯 Fallback:
Jika GitHub Actions gagal, admin masih bisa manual increment dengan:
1. Klik button **Next Week** (▶) di admin dashboard header
2. Atau run SQL: `SELECT increment_current_week()`

---

## ✅ Checklist Setup:

- [ ] Step 1: Create API function di Supabase
- [ ] Step 1: Ganti API key dengan yang rahasia
- [ ] Step 1: Test function dengan SQL
- [ ] Step 2: Add secret `SUPABASE_URL`
- [ ] Step 2: Add secret `SUPABASE_ANON_KEY`
- [ ] Step 2: Add secret `SUPABASE_API_KEY`
- [ ] Step 3: Push workflow file ke GitHub
- [ ] Step 4: Test manual run di GitHub Actions
- [ ] Step 4: Verify week increment di Supabase
- [ ] ✅ Done! Otomatis jalan setiap Senin 00:01 WIB

---

**Estimasi Waktu Setup**: 5-10 menit
**Status**: Ready to Deploy ✅
