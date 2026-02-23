# 🚀 Quick Setup - Free Auto-Copy (5 Minutes)

## Total Cost: $0/month ✅

---

## Step 1: Setup Supabase RPC (2 minutes)

1. Open Supabase SQL Editor
2. Copy entire `database/SETUP_RPC_AUTO_COPY.sql`
3. Run the script
4. Verify: `SELECT * FROM rpc_auto_copy_bookings();`

**Expected Output:**
```json
{
  "success": false,
  "message": "Not Sunday - auto-copy only runs on Sunday",
  "current_day": 1,
  "current_week": 9
}
```
(This is normal if not Sunday)

---

## Step 2: Get Supabase Credentials (1 minute)

1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Step 3: Setup Free Cron Service (2 minutes)

### Option A: cron-job.org (Recommended)

1. Go to https://cron-job.org/en/
2. Click "Sign up" (free)
3. Verify email
4. Click "Create cronjob"
5. Fill in:

```
Title: Auto-Copy Bookings Weekly

URL: https://YOUR_PROJECT.supabase.co/rest/v1/rpc/rpc_auto_copy_bookings_with_log

Schedule:
  - Minute: 0
  - Hour: 20
  - Day: *
  - Month: *
  - Weekday: Sunday (0)
  
Or use cron expression: 0 20 * * 0

Request Method: POST

Request Headers:
  apikey: YOUR_SUPABASE_ANON_KEY
  Authorization: Bearer YOUR_SUPABASE_ANON_KEY
  Content-Type: application/json

Request Body: {}

Notifications: Enable (get email on failure)
```

6. Click "Create cronjob"
7. Click "Execute now" to test

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully copied week 9 to week 10",
  "schedules_created": 24,
  "bookings_copied": 150
}
```

---

## Step 4: Verify Setup (30 seconds)

Check logs in Supabase:

```sql
SELECT * FROM auto_copy_logs ORDER BY created_at DESC LIMIT 5;
```

**Expected:**
- 1 row with `success = true`
- Shows schedules_created and bookings_copied

---

## ✅ Done!

Auto-copy will now run automatically every Sunday at 20:00.

---

## Monitoring

### Check Last Run:
```sql
SELECT 
    success,
    message,
    source_week,
    target_week,
    bookings_copied,
    created_at
FROM auto_copy_logs 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check All Runs:
```sql
SELECT * FROM auto_copy_logs ORDER BY created_at DESC;
```

### Check Failed Runs:
```sql
SELECT * FROM auto_copy_logs 
WHERE success = false 
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Problem: "Not Sunday" message
**Solution:** This is normal. Auto-copy only runs on Sunday. Wait for Sunday or change the day check in the function.

### Problem: No response from cron
**Solution:** 
1. Check cron-job.org execution history
2. Verify URL is correct
3. Verify API key is correct
4. Check Supabase logs

### Problem: "Error: permission denied"
**Solution:**
```sql
GRANT EXECUTE ON FUNCTION rpc_auto_copy_bookings_with_log() TO anon;
```

### Problem: Bookings not copied
**Solution:**
1. Check if source week has bookings
2. Check if target week already has bookings
3. Check if classes are full (max 10)
4. Check logs for details

---

## Alternative: GitHub Actions (Free)

If you have GitHub repo, you can use GitHub Actions instead:

1. Create `.github/workflows/auto-copy.yml`:

```yaml
name: Auto-Copy Bookings

on:
  schedule:
    - cron: '0 20 * * 0'  # Every Sunday at 20:00 UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  auto-copy:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase RPC
        run: |
          response=$(curl -X POST \
            '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/rpc_auto_copy_bookings_with_log' \
            -H 'apikey: ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}')
          echo "Response: $response"
          
          # Check if successful
          if echo "$response" | grep -q '"success":true'; then
            echo "✅ Auto-copy successful"
            exit 0
          else
            echo "❌ Auto-copy failed"
            echo "$response"
            exit 1
          fi
```

2. Add secrets in GitHub repo settings:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

3. Commit and push

---

## Cost Comparison

| Solution | Cost | Reliability | Setup Time |
|----------|------|-------------|------------|
| **Free (cron-job.org)** | $0 | 99%+ | 5 min |
| **Free (GitHub Actions)** | $0 | 99%+ | 10 min |
| pg_cron (Supabase Pro) | $25/mo | 99.9%+ | 5 min |

---

## Summary

✅ **Setup Complete!**
- Supabase RPC function created
- Free cron service configured
- Auto-copy runs every Sunday 20:00
- Logs available for monitoring
- Total cost: $0/month

**Next:** Wait for Sunday or trigger manually to test!
