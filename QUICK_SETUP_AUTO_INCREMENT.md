# Quick Setup: Auto Increment Week

## 🎯 Tujuan
Otomatis increment `current_week` setiap Senin jam 00:01 WIB tanpa perlu manual.

## 📋 Pilih Metode:

### ✅ Metode 1: Supabase pg_cron (Pro Plan - $25/month)
**Paling Mudah & Reliable**

1. Pastikan Anda pakai Supabase Pro
2. Buka Supabase SQL Editor
3. Copy-paste semua SQL dari `database/SETUP_AUTO_INCREMENT_WEEK.sql`
4. Run SQL
5. ✅ Done! Otomatis jalan setiap Senin 00:01 WIB

**Verify:**
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-increment-week';
```

---

### ✅ Metode 2: GitHub Actions (Free - Recommended)
**Gratis & Reliable**

#### Step 1: Setup API Function
1. Buka Supabase SQL Editor
2. Copy section "ALTERNATIVE: SUPABASE FREE TIER SOLUTION" dari `database/SETUP_AUTO_INCREMENT_WEEK.sql`
3. **PENTING**: Ganti `your-secret-api-key-here` dengan API key rahasia Anda (contoh: `eysa-auto-week-2026-secret-key-xyz123`)
4. Run SQL

#### Step 2: Setup GitHub Secrets
1. Go to GitHub repo: Settings > Secrets and variables > Actions
2. Add 3 secrets:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: (dari Supabase Settings > API)
   - `SUPABASE_API_KEY`: (API key yang Anda buat di Step 1)

#### Step 3: Enable GitHub Actions
1. File `.github/workflows/auto-increment-week.yml` sudah dibuat
2. Commit & push ke GitHub
3. Go to Actions tab di GitHub
4. Enable workflows jika belum

#### Step 4: Test Manual
1. Go to Actions tab
2. Pilih "Auto Increment Week"
3. Click "Run workflow" > "Run workflow"
4. Check logs untuk verify

✅ Done! Otomatis jalan setiap Senin 00:01 WIB

---

### ✅ Metode 3: Cron-job.org (Paling Cepat Setup)
**5 Menit Setup**

#### Step 1: Setup API Function (sama seperti Metode 2 Step 1)

#### Step 2: Daftar di Cron-job.org
1. Go to https://cron-job.org
2. Sign up (gratis)

#### Step 3: Create Cron Job
1. Click "Create cronjob"
2. Title: `EYSA Auto Increment Week`
3. URL: `https://your-project.supabase.co/rest/v1/rpc/api_increment_week`
4. Request method: `POST`
5. Request headers:
   ```
   Content-Type: application/json
   apikey: your-supabase-anon-key
   ```
6. Request body:
   ```json
   {"api_key": "your-secret-api-key"}
   ```
7. Schedule:
   - Every: `Week`
   - On: `Monday`
   - At: `00:01` (WIB timezone)
8. Save & Enable

✅ Done! Otomatis jalan setiap Senin 00:01 WIB

---

## 🧪 Testing

### Test API Function:
```sql
-- Test increment
SELECT api_increment_week('your-secret-api-key-here');

-- Check result
SELECT current_week, updated_at FROM settings WHERE id = 1;
```

### Test via curl:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: your-supabase-anon-key" \
  -d '{"api_key": "your-secret-api-key"}' \
  https://your-project.supabase.co/rest/v1/rpc/api_increment_week
```

Expected response:
```json
{
  "success": true,
  "old_week": 1,
  "new_week": 2,
  "timestamp": "2026-03-27T17:01:00Z"
}
```

---

## 📊 Monitoring

### Check current week:
```sql
SELECT current_week, updated_at FROM settings WHERE id = 1;
```

### Check cron logs (pg_cron only):
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-increment-week')
ORDER BY start_time DESC
LIMIT 10;
```

### Check GitHub Actions logs:
1. Go to Actions tab
2. Click latest "Auto Increment Week" run
3. Check logs

---

## 🔧 Troubleshooting

### Week tidak increment otomatis:
1. Check apakah cron job enabled
2. Check timezone (WIB = UTC+7)
3. Test manual: `SELECT api_increment_week('your-api-key')`
4. Check logs (GitHub Actions / Cron-job.org)

### API key error:
1. Pastikan API key sama di SQL function dan cron service
2. Pastikan tidak ada typo
3. Test dengan curl

### Fallback:
Admin masih bisa manual increment dengan klik button "Next Week" (▶) di header.

---

## 🎯 Rekomendasi

| Metode | Kelebihan | Kekurangan | Rekomendasi |
|--------|-----------|------------|-------------|
| pg_cron | Paling reliable, zero maintenance | Butuh Pro plan ($25/month) | ⭐⭐⭐⭐⭐ Jika budget ada |
| GitHub Actions | Gratis, reliable, terintegrasi | Perlu setup secrets | ⭐⭐⭐⭐⭐ Recommended untuk Free tier |
| Cron-job.org | Paling cepat setup | Depend on external service | ⭐⭐⭐⭐ Good alternative |

---

**Setup Time:**
- Metode 1 (pg_cron): 2 menit
- Metode 2 (GitHub Actions): 10 menit
- Metode 3 (Cron-job.org): 5 menit

**Pilih yang sesuai dengan budget dan kebutuhan Anda!** ✅
