# 🔄 Auto-Copy Booking - Server-Side Solution

## Current Problem

Auto-copy saat ini **client-side** (runs in browser):
- ❌ User must open web first
- ❌ Runs in JavaScript (browser)
- ❌ If no one opens web → no copy happens
- ❌ Depends on localStorage flag
- ❌ Not reliable for production

## Better Solution: Server-Side Auto-Copy

Auto-copy should run **server-side** (runs in database):
- ✅ Runs automatically without user interaction
- ✅ Scheduled to run every Sunday night
- ✅ Reliable and consistent
- ✅ No dependency on browser/localStorage

---

## Solution Options

### Option 1: Supabase pg_cron (Recommended)

Use PostgreSQL's pg_cron extension to schedule auto-copy.

**Pros:**
- ✅ Built into Supabase (free tier)
- ✅ Runs directly in database
- ✅ Very reliable
- ✅ Easy to setup

**Cons:**
- ⚠️ Requires pg_cron extension (may need to enable)
- ⚠️ Limited to SQL only

**Setup:**

```sql
-- Enable pg_cron extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to copy bookings
CREATE OR REPLACE FUNCTION auto_copy_bookings_weekly()
RETURNS void AS $$
DECLARE
    current_week_num INTEGER;
    current_year_num INTEGER;
    source_week INTEGER;
    target_week INTEGER;
BEGIN
    -- Get current week and year
    current_week_num := EXTRACT(WEEK FROM CURRENT_DATE);
    current_year_num := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Determine source and target weeks
    -- On Sunday, copy current week to next week
    IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
        source_week := current_week_num;
        target_week := current_week_num + 1;
    ELSE
        -- On other days, don't run
        RETURN;
    END IF;
    
    RAISE NOTICE 'Auto-copy: Week % to Week %', source_week, target_week;
    
    -- Create week schedules for target week
    INSERT INTO schedules (
        class_id, teacher_id, program, level, phase, day, time_slot,
        week_number, year, batch, current_students
    )
    SELECT 
        class_id, teacher_id, program, level, phase, day, time_slot,
        target_week, current_year_num, NULL, 0
    FROM schedules
    WHERE week_number = source_week
        AND year = current_year_num
        AND NOT EXISTS (
            SELECT 1 FROM schedules s2
            WHERE s2.class_id = schedules.class_id
                AND s2.day = schedules.day
                AND s2.time_slot = schedules.time_slot
                AND s2.phase = schedules.phase
                AND s2.week_number = target_week
                AND s2.year = current_year_num
        );
    
    -- Copy bookings
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
        s_target.week_number = target_week AND
        s_target.year = current_year_num
    WHERE s_source.week_number = source_week
        AND s_source.year = current_year_num
        AND b.status = 'confirmed'
        AND s_target.current_students < 10
        AND NOT EXISTS (
            SELECT 1 FROM bookings b2
            JOIN schedules s2 ON b2.schedule_id = s2.id
            WHERE b2.user_id = b.user_id
                AND s2.phase = s_source.phase
                AND s2.week_number = target_week
                AND s2.year = current_year_num
                AND b2.status = 'confirmed'
        );
    
    -- Update current_students count
    UPDATE schedules
    SET current_students = (
        SELECT COUNT(*)
        FROM bookings
        WHERE bookings.schedule_id = schedules.id
            AND bookings.status = 'confirmed'
    )
    WHERE week_number = target_week
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
    WHERE s.week_number = target_week
        AND s.year = current_year_num
        AND s.batch IS NULL
        AND s.current_students > 0;
    
    RAISE NOTICE 'Auto-copy completed for week %', target_week;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every Sunday at 20:00 (8 PM)
SELECT cron.schedule(
    'auto-copy-bookings-weekly',
    '0 20 * * 0',  -- Every Sunday at 20:00
    $$SELECT auto_copy_bookings_weekly()$$
);

-- Verify cron job is scheduled
SELECT * FROM cron.job;
```

---

### Option 2: Supabase Edge Function

Use Supabase Edge Functions (Deno) with cron trigger.

**Pros:**
- ✅ More flexible (can use TypeScript)
- ✅ Can call external APIs
- ✅ Better error handling

**Cons:**
- ⚠️ Requires Edge Function setup
- ⚠️ May have cold start delays
- ⚠️ More complex to setup

**Setup:**

```typescript
// supabase/functions/auto-copy-bookings/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current week
    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentYear = now.getFullYear()
    
    // Only run on Sunday
    if (now.getDay() !== 0) {
      return new Response(
        JSON.stringify({ message: 'Not Sunday, skipping' }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const sourceWeek = currentWeek
    const targetWeek = currentWeek + 1

    // Copy logic here (similar to SQL above)
    // ...

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Copied week ${sourceWeek} to ${targetWeek}` 
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
```

Then schedule with cron:
```bash
# In supabase dashboard, add cron trigger
# URL: https://your-project.supabase.co/functions/v1/auto-copy-bookings
# Schedule: 0 20 * * 0 (Every Sunday at 20:00)
```

---

### Option 3: External Cron Service (Easiest for Now)

Use external service like cron-job.org or EasyCron to call Supabase RPC.

**Pros:**
- ✅ Very easy to setup
- ✅ No code changes needed
- ✅ Works immediately

**Cons:**
- ⚠️ Depends on external service
- ⚠️ Need to expose RPC endpoint
- ⚠️ Less secure (need API key)

**Setup:**

1. Create RPC function in Supabase:
```sql
CREATE OR REPLACE FUNCTION rpc_auto_copy_bookings()
RETURNS json AS $$
BEGIN
    PERFORM auto_copy_bookings_weekly();
    RETURN json_build_object('success', true, 'message', 'Auto-copy completed');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Call from external cron:
```bash
# cron-job.org or similar
# URL: https://your-project.supabase.co/rest/v1/rpc/rpc_auto_copy_bookings
# Method: POST
# Headers: 
#   apikey: your-supabase-anon-key
#   Authorization: Bearer your-supabase-anon-key
# Schedule: Every Sunday at 20:00
```

---

## Recommended Implementation

**For Production: Use Option 1 (pg_cron)**

Reasons:
- ✅ Most reliable
- ✅ Built into Supabase
- ✅ No external dependencies
- ✅ Free tier compatible
- ✅ Runs directly in database

**For Quick Fix: Use Option 3 (External Cron)**

Reasons:
- ✅ Fastest to implement
- ✅ No code changes
- ✅ Works immediately
- ✅ Can switch to pg_cron later

---

## Migration Plan

### Phase 1: Quick Fix (Now)
1. Run `MANUAL_COPY_WEEK_9_TO_10.sql` to copy week 10
2. Setup external cron (Option 3) for future weeks
3. Keep client-side auto-copy as backup

### Phase 2: Proper Solution (Later)
1. Implement pg_cron (Option 1)
2. Test for 2-3 weeks
3. Remove client-side auto-copy
4. Remove external cron

---

## Installation Files

I'll create:
1. `database/SETUP_PGCRON_AUTO_COPY.sql` - pg_cron setup
2. `database/SETUP_RPC_AUTO_COPY.sql` - RPC for external cron
3. `AUTO_COPY_MIGRATION_GUIDE.md` - Step-by-step migration

---

## Summary

**Current:** Client-side (browser) ❌
**Better:** Server-side (database) ✅

**Quick Fix:** Run manual copy + setup external cron
**Long-term:** Implement pg_cron for fully automated solution

**Next Step:** Choose which option to implement first.
