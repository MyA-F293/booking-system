# 🔧 Supabase SQL Editor - Simple Version

## Problem
Supabase SQL Editor doesn't support `DO` blocks (procedural SQL).

## Error
```
ERROR: 42601: syntax error at or near "$"
```

## Solution
Use **AUTO_SPLIT_SIMPLE.sql** instead - plain SQL only, no procedural blocks.

---

## What's Different?

### ❌ AUTO_SPLIT_SMART.sql (Doesn't work in Supabase)
```sql
DO $
DECLARE
    evening_id UUID;
BEGIN
    SELECT id INTO evening_id FROM ...
    UPDATE bookings SET ...
END $;
```

### ✅ AUTO_SPLIT_SIMPLE.sql (Works in Supabase!)
```sql
-- Direct UPDATE with hardcoded IDs
UPDATE bookings 
SET schedule_id = '46195dea-77c0-4424-82ad-27dcc0b3031b'
WHERE id IN (
    SELECT id FROM bookings
    WHERE schedule_id = '152e36a2-68ee-40dd-91c3-fe55ddb1a5da'
    ORDER BY created_at DESC LIMIT 8
);
```

---

## How AUTO_SPLIT_SIMPLE Works

### 1. Oxford Friday (18 → 10 + 8)
```sql
UPDATE bookings 
SET schedule_id = '46195dea-77c0-4424-82ad-27dcc0b3031b'  -- Evening
WHERE id IN (
    SELECT id FROM bookings
    WHERE schedule_id = '152e36a2-68ee-40dd-91c3-fe55ddb1a5da'  -- Afternoon
    ORDER BY created_at DESC LIMIT 8  -- Last 8 students
);
```

### 2. Oxford Tuesday (17 → 10 + 7)
```sql
UPDATE bookings 
SET schedule_id = '1ae90d7f-30e4-4b19-9d23-2188ee5d9c4c'  -- Evening
WHERE id IN (
    SELECT id FROM bookings
    WHERE schedule_id = '4b082a79-d5bc-4bee-8246-36ffc7df1981'  -- Afternoon
    ORDER BY created_at DESC LIMIT 7  -- Last 7 students
);
```

### 3. Harvard Friday (14 → 10 + 4)
```sql
UPDATE bookings 
SET schedule_id = '9d90f104-4d63-463f-940b-df212d65fa15'  -- Evening
WHERE id IN (
    SELECT id FROM bookings
    WHERE schedule_id = '1e999629-3828-4fe0-aef0-bfc3b8a10289'  -- Afternoon
    ORDER BY created_at DESC LIMIT 4  -- Last 4 students
);
```

### 4. Update Counts
```sql
UPDATE schedules 
SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) 
WHERE week_number = 9;
```

---

## Schedule IDs Used

From your STEP 3 results:

| Class | Day | Time | Schedule ID |
|-------|-----|------|-------------|
| Harvard | Friday | Afternoon | 1e999629-3828-4fe0-aef0-bfc3b8a10289 |
| Harvard | Friday | Evening | 9d90f104-4d63-463f-940b-df212d65fa15 |
| Oxford | Friday | Afternoon | 152e36a2-68ee-40dd-91c3-fe55ddb1a5da |
| Oxford | Friday | Evening | 46195dea-77c0-4424-82ad-27dcc0b3031b |
| Oxford | Tuesday | Afternoon | 4b082a79-d5bc-4bee-8246-36ffc7df1981 |
| Oxford | Tuesday | Evening | 1ae90d7f-30e4-4b19-9d23-2188ee5d9c4c |

---

## How to Run

1. Open Supabase SQL Editor
2. Copy entire `AUTO_SPLIT_SIMPLE.sql`
3. Paste in editor
4. Click "Run"
5. Wait for completion
6. Check verification results

---

## Expected Result

```
✅ Oxford Friday: 10 (Afternoon) + 8 (Evening)
✅ Oxford Tuesday: 10 (Afternoon) + 7 (Evening)
✅ Harvard Friday: 10 (Afternoon) + 4 (Evening)
```

All classes ≤ 10 students!

---

## Verification

After running, the last query should show:

```
No rows returned (0 overcapacity classes) ✅
```

And the final query should show all week 9 schedules with correct counts.

---

## Why This Works

- ✅ No procedural blocks (DO, DECLARE, BEGIN, END)
- ✅ Plain SQL only (UPDATE, SELECT)
- ✅ Hardcoded IDs from your database
- ✅ Works in Supabase SQL Editor
- ✅ Same result as smart version

---

**Use AUTO_SPLIT_SIMPLE.sql - it's ready to run!** 🚀
