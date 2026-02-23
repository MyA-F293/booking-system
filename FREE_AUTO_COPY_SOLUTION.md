# 🆓 Free Auto-Copy Solution - No Paid Services Required

## Problem
- pg_cron requires Supabase Pro Plan ($25/month) ❌
- Need free alternative for auto-copy ✅

## Solution: Supabase RPC + Free External Cron

Combine:
1. **Supabase RPC Function** (free, runs in database)
2. **Free External Cron Service** (cron-job.org, EasyCron, etc.)
3. **Supabase Webhook** (free, triggers RPC)

Total Cost: **$0/month** ✅

---

## Architecture

```
External Cron (Free)
    ↓ (HTTP POST every Sunday 20:00)
Supabase RPC Endpoint
    ↓ (Execute SQL function)
Auto-Copy Function
    ↓ (Copy bookings)
Database Updated ✅
```

---

## Implementation

### Step 1: Create RPC Function in Supabase

This function can be called via HTTP API (no pg_cron needed).

```sql
-- File: database/SETUP_RPC_AUTO_COPY.sql

-- Create the auto-copy function
CREATE OR REPLACE FUNCTION rpc_auto_copy_bookings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_week_num INTEGER;
    current_year_num INTEGER;
    v_source_week INTEGER;
    v_target_week INTEGER;
    v_schedules_created INTEGER := 0;
    v_bookings_copied INTEGER := 0;
    v_bookings_skipped INTEGER := 0;
    v_day_of_week INTEGER;
BEGIN
    -- Get current week, year, and day
    current_week_num := EXTRACT(WEEK FROM CURRENT_DATE);
    current_year_num := EXTRACT(YEAR FROM CURRENT_DATE);
    v_day_of_week := EXTRACT(DOW FROM CURRENT_DATE);
    
    -- Only run on Sunday (0)
    IF v_day_of_week != 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Not Sunday - auto-copy only runs on Sunday',
            'current_day', v_day_of_week
        );
    END IF;
    
    v_source_week := current_week_num;
    v_target_week := current_week_num + 1;
    
    -- Create schedules for target week
    WITH inserted AS (
        INSERT INTO schedules (
            class_id, teacher_id, program, level, phase, day, time_slot,
            week_number, year, batch, current_students
        )
        SELECT 
            class_id, teacher_id, program, level, phase, day, time_slot,
            v_target_week, current_year_num, NULL, 0
        FROM schedules
        WHERE week_number = v_source_week
            AND year = current_year_num
            AND NOT EXISTS (
                SELECT 1 FROM schedules s2
                WHERE s2.class_id = schedules.class_id
                    AND s2.day = schedules.day
                    AND s2.time_slot = schedules.time_slot
                    AND s2.phase = schedules.phase
                    AND s2.week_number = v_target_week
                    AND s2.year = current_year_num
            )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_schedules_created FROM inserted;
    
    -- Copy bookings
    WITH booking_copy AS (
        INSERT INTO bookings (user_id, schedule_id, status)
        SELECT 
            b.user_id,
            s_target.id,
            'confirmed'
        FROM bookings b
        JOIN schedules s_source ON b.schedule_id = s_source.id
        JOIN schedules s_target ON 
            s_target.class_id = s_source.class_id AND
            s_target.day = s_source.day AND
            s_target.time_slot = s_source.time_slot AND
            s_target.phase = s_source.phase AND
            s_target.week_number = v_target_week AND
            s_target.year = current_year_num
        WHERE s_source.week_number = v_source_week
            AND s_source.year = current_year_num
            AND b.status = 'confirmed'
            AND s_target.current_students < 10
            AND NOT EXISTS (
                SELECT 1 FROM bookings b2
                JOIN schedules s2 ON b2.schedule_id = s2.id
                WHERE b2.user_id = b.user_id
                    AND s2.phase = s_source.phase
                    AND s2.week_number = v_target_week
                    AND s2.year = current_year_num
                    AND b2.status = 'confirmed'
            )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_bookings_copied FROM booking_copy;
    
    -- Calculate skipped
    SELECT COUNT(*) INTO v_bookings_skipped
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE s.week_number = v_source_week
        AND s.year = current_year_num
        AND b.status = 'confirmed';
    
    v_bookings_skipped := v_bookings_skipped - v_bookings_copied;
    
    -- Update current_students
    UPDATE schedules
    SET current_students = (
        SELECT COUNT(*)
        FROM bookings
        WHERE bookings.schedule_id = schedules.id
            AND bookings.status = 'confirmed'
    )
    WHERE week_number = v_target_week
        AND year = current_year_num;
    
    -- Auto-set batch
    UPDATE schedules s
    SET batch = (
        SELECT REGEXP_REPLACE(u.batch, '[^0-9]', '', 'g')
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.schedule_id = s.id 
            AND b.status = 'confirmed'
        ORDER BY b.created_at ASC
        LIMIT 1
    )
    WHERE s.week_number = v_target_week
        AND s.year = current_year_num
        AND s.batch IS NULL
        AND s.current_students > 0;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', format('Copied week %s to week %s', v_source_week, v_target_week),
        'source_week', v_source_week,
        'target_week', v_target_week,
        'schedules_created', v_schedules_created,
        'bookings_copied', v_bookings_copied,
        'bookings_skipped', v_bookings_skipped,
        'timestamp', NOW()
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', 'Error: ' || SQLERRM,
        'timestamp', NOW()
    );
END;
$$;

-- Grant public access (will be protected by RLS and API key)
GRANT EXECUTE ON FUNCTION rpc_auto_copy_bookings() TO anon;
GRANT EXECUTE ON FUNCTION rpc_auto_copy_bookings() TO authenticated;
```

### Step 2: Test RPC Function

```sql
-- Test in Supabase SQL Editor
SELECT * FROM rpc_auto_copy_bookings();

-- Expected response:
-- {
--   "success": true/false,
--   "message": "...",
--   "source_week": 9,
--   "target_week": 10,
--   "schedules_created": 24,
--   "bookings_copied": 150,
--   "bookings_skipped": 5
-- }
```

### Step 3: Setup Free External Cron

#### Option A: cron-job.org (Recommended)

1. Go to https://cron-job.org
2. Sign up (free account)
3. Create new cron job:

```
Title: Auto-Copy Bookings Weekly
URL: https://YOUR_PROJECT.supabase.co/rest/v1/rpc/rpc_auto_copy_bookings
Method: POST
Schedule: Every Sunday at 20:00
Headers:
  apikey: YOUR_SUPABASE_ANON_KEY
  Authorization: Bearer YOUR_SUPABASE_ANON_KEY
  Content-Type: application/json
Body: {}
```

4. Save and enable

#### Option B: EasyCron (Alternative)

1. Go to https://www.easycron.com
2. Sign up (free tier: 1 cron job)
3. Create cron job with same settings as above

#### Option C: GitHub Actions (Free for public repos)

Create `.github/workflows/auto-copy-bookings.yml`:

```yaml
name: Auto-Copy Bookings Weekly

on:
  schedule:
    # Every Sunday at 20:00 UTC
    - cron: '0 20 * * 0'
  workflow_dispatch: # Allow manual trigger

jobs:
  auto-copy:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase RPC
        run: |
          curl -X POST \
            'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/rpc_auto_copy_bookings' \
            -H 'apikey: ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

Add secret in GitHub repo settings:
- `SUPABASE_ANON_KEY`: Your Supabase anon key

---

## Monitoring

### Check Last Run

```sql
-- Create a log table (optional)
CREATE TABLE IF NOT EXISTS auto_copy_logs (
    id SERIAL PRIMARY KEY,
    success BOOLEAN,
    message TEXT,
    source_week INTEGER,
    target_week INTEGER,
    schedules_created INTEGER,
    bookings_copied INTEGER,
    bookings_skipped INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Modify RPC function to log results
-- Add at the end before RETURN:
INSERT INTO auto_copy_logs (
    success, message, source_week, target_week,
    schedules_created, bookings_copied, bookings_skipped
) VALUES (
    true, format('Copied week %s to week %s', v_source_week, v_target_week),
    v_source_week, v_target_week,
    v_schedules_created, v_bookings_copied, v_bookings_skipped
);

-- View logs
SELECT * FROM auto_copy_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Comparison: Free vs Paid

| Feature | Free Solution | pg_cron (Paid) |
|---------|--------------|----------------|
| Cost | $0/month | $25/month |
| Reliability | 99%+ | 99.9%+ |
| Setup Time | 10 minutes | 5 minutes |
| Maintenance | Low | None |
| Dependency | External service | Built-in |
| Monitoring | Manual/logs | Built-in |

---

## Advantages of Free Solution

✅ **Zero cost** - No monthly fees
✅ **Easy setup** - Just create RPC + configure cron
✅ **Flexible** - Can use multiple cron services as backup
✅ **Portable** - Works with any Supabase plan
✅ **Testable** - Can manually trigger via HTTP

---

## Disadvantages

⚠️ **External dependency** - Relies on third-party cron service
⚠️ **Slightly less reliable** - External service might have downtime
⚠️ **Manual monitoring** - Need to check logs manually
⚠️ **API key exposure** - Need to store API key in external service

---

## Security Considerations

1. **Use anon key** (not service role key)
2. **Enable RLS** on tables
3. **Limit RPC access** to specific IPs (if possible)
4. **Monitor logs** for unauthorized access
5. **Rotate API keys** periodically

---

## Fallback Strategy

Keep client-side auto-copy as backup:
- If external cron fails, users can still trigger manually
- Client-side runs when user opens app
- Double protection ensures copy happens

---

## Installation Steps

1. Run `database/SETUP_RPC_AUTO_COPY.sql` in Supabase
2. Test RPC: `SELECT * FROM rpc_auto_copy_bookings()`
3. Sign up for cron-job.org (free)
4. Configure cron job with Supabase URL + API key
5. Test cron job (trigger manually)
6. Wait for Sunday 20:00 or trigger manually
7. Check logs to verify success

---

## Summary

**Free Solution = Supabase RPC + External Free Cron**

- ✅ $0/month cost
- ✅ Easy to setup (10 minutes)
- ✅ Reliable (99%+ uptime)
- ✅ Works on Supabase Free Tier
- ✅ No code changes needed
- ✅ Can be tested immediately

**Recommended for:**
- Free tier users
- Small to medium projects
- Budget-conscious teams
- Projects that don't need 99.9% uptime

**Next Step:** Create `SETUP_RPC_AUTO_COPY.sql` script
