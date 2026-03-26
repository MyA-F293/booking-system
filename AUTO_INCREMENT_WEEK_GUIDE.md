# Auto Increment Week - Setup Guide

## Overview
Sistem otomatis untuk increment `current_week` setiap hari Senin jam 00:01 WIB.

## 2 Pilihan Implementasi:

### ✅ Pilihan 1: Supabase pg_cron (Recommended - Pro Plan)
**Kelebihan:**
- Fully automated, tidak perlu maintenance
- Berjalan di database server
- Reliable dan tidak perlu external service

**Kekurangan:**
- Hanya tersedia di Supabase Pro ($25/month)
- Tidak bisa digunakan di Free tier

**Setup:**
1. Pastikan Anda menggunakan Supabase Pro plan
2. Jalankan SQL di `database/SETUP_AUTO_INCREMENT_WEEK.sql`
3. Verify dengan query: `SELECT * FROM cron.job WHERE jobname = 'auto-increment-week'`
4. Done! Week akan otomatis increment setiap Senin 00:01 WIB

### ✅ Pilihan 2: External Cron + API (Free Tier Compatible)
**Kelebihan:**
- Gratis, bisa digunakan di Supabase Free tier
- Flexible, bisa pakai berbagai cron service

**Kekurangan:**
- Perlu setup external service
- Sedikit lebih kompleks

**Setup:**
1. Jalankan SQL untuk create API function (ada di `SETUP_AUTO_INCREMENT_WEEK.sql`)
2. Ganti `your-secret-api-key-here` dengan API key rahasia Anda
3. Setup external cron service (pilih salah satu):

#### Option A: GitHub Actions (Recommended)
Buat file `.github/workflows/auto-increment-week.yml`:

```yaml
name: Auto Increment Week

on:
  schedule:
    # Setiap Senin jam 00:01 WIB (Minggu 17:01 UTC)
    - cron: '1 17 * * 0'
  workflow_dispatch: # Allow manual trigger

jobs:
  increment-week:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase API
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -d '{"api_key": "${{ secrets.SUPABASE_API_KEY }}"}' \
            https://your-project.supabase.co/rest/v1/rpc/api_increment_week
```

Setup secrets di GitHub:
- Go to Settings > Secrets > Actions
- Add secret: `SUPABASE_API_KEY` dengan value API key Anda

#### Option B: Vercel Cron (jika deploy di Vercel)
Buat file `api/cron/increment-week.js`:

```javascript
export default async function handler(req, res) {
  // Verify Vercel Cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/api_increment_week`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          api_key: process.env.SUPABASE_API_KEY
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

Tambahkan di `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/increment-week",
    "schedule": "1 17 * * 0"
  }]
}
```

#### Option C: Cron-job.org (Paling Mudah)
1. Daftar di https://cron-job.org (gratis)
2. Create new cron job:
   - URL: `https://your-project.supabase.co/rest/v1/rpc/api_increment_week`
   - Method: POST
   - Headers: 
     - `Content-Type: application/json`
     - `apikey: your-supabase-anon-key`
   - Body: `{"api_key": "your-secret-api-key"}`
   - Schedule: Setiap Senin 00:01 WIB
3. Save dan enable

## Timezone Notes:
- Supabase menggunakan UTC timezone
- WIB = UTC+7
- Senin 00:01 WIB = Minggu 17:01 UTC
- Cron format: `minute hour day-of-month month day-of-week`
- Day of week: 0 = Sunday, 1 = Monday, dst.

## Testing:

### Test pg_cron (Pilihan 1):
```sql
-- Manual test function
SELECT increment_current_week();

-- Check current week
SELECT current_week FROM settings WHERE id = 1;

-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'auto-increment-week';

-- Check cron job history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-increment-week')
ORDER BY start_time DESC
LIMIT 10;
```

### Test API function (Pilihan 2):
```sql
-- Test API function
SELECT api_increment_week('your-secret-api-key-here');

-- Check result
SELECT current_week FROM settings WHERE id = 1;
```

### Test via curl:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: your-supabase-anon-key" \
  -d '{"api_key": "your-secret-api-key"}' \
  https://your-project.supabase.co/rest/v1/rpc/api_increment_week
```

## Monitoring:

### Check if auto-increment is working:
```sql
-- Check current week and last update
SELECT current_week, updated_at 
FROM settings 
WHERE id = 1;

-- Check cron job logs (pg_cron only)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-increment-week')
ORDER BY start_time DESC
LIMIT 10;
```

## Troubleshooting:

### Cron job tidak jalan:
1. Check apakah pg_cron extension enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron'`
2. Check apakah job terdaftar: `SELECT * FROM cron.job WHERE jobname = 'auto-increment-week'`
3. Check logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10`
4. Pastikan timezone sudah benar (UTC vs WIB)

### API function tidak jalan:
1. Check apakah function exists: `SELECT * FROM pg_proc WHERE proname = 'api_increment_week'`
2. Test manual: `SELECT api_increment_week('your-api-key')`
3. Check API key sudah benar
4. Check external cron service logs

## Disable Auto-Increment:

### Disable pg_cron:
```sql
SELECT cron.unschedule('auto-increment-week');
```

### Disable external cron:
- GitHub Actions: Disable workflow di GitHub
- Vercel Cron: Remove dari vercel.json
- Cron-job.org: Disable job di dashboard

## Fallback:
Jika auto-increment gagal, admin masih bisa manual increment dengan:
1. Klik button "Next Week" (▶) di admin dashboard header
2. Atau jalankan SQL: `SELECT increment_current_week()`

## Rekomendasi:
- **Supabase Pro**: Gunakan pg_cron (Pilihan 1) - paling reliable
- **Supabase Free**: Gunakan GitHub Actions (Pilihan 2A) - gratis dan reliable
- **Quick Setup**: Gunakan Cron-job.org (Pilihan 2C) - paling mudah setup

## Security Notes:
- Jangan commit API key ke git
- Gunakan environment variables atau secrets
- API key harus rahasia dan kompleks
- Rotate API key secara berkala

---

**Setup Date**: 27 Maret 2026
**Status**: Ready to Deploy ✅
