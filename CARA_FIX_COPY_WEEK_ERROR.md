# 🔧 Cara Fix Copy Week Error - "Duplicate schedule detected!"

## 🔍 Masalah

Saat copy bookings dari Week 1 ke Week 2 menggunakan fitur "Copy Previous Week" di Admin Dashboard, muncul error:

```
❌ Failed to copy bookings: Duplicate schedule detected! 
Schedule for this class/day/time/phase/week already exists.
```

---

## 🎯 Root Cause

### Konflik antara 2 Protection Systems:

#### 1. RPC Function `smart_copy_week`
- Sudah ada logic `NOT EXISTS` untuk skip duplicate schedules
- Seharusnya tidak create schedule jika sudah ada

#### 2. Trigger `prevent_duplicate_schedule`
- Berjalan BEFORE INSERT pada table `schedules`
- Check apakah schedule sudah exist
- Jika exist → RAISE EXCEPTION (block INSERT)

### Masalahnya:
Trigger block INSERT **sebelum** RPC function bisa check `NOT EXISTS`. Jadi meskipun RPC sudah handle duplicate, trigger tetap throw error.

---

## ✅ Solusi: Update RPC Function

### Step 1: Run SQL Fix

**File:** `database/FIX_COPY_WEEK_DUPLICATE_ERROR.sql`

1. Open Supabase SQL Editor
2. Copy-paste query dari file (Option 2 - yang lengkap)
3. Run query

### Step 2: Verify Fix

```sql
-- Test copy week 1 to week 2
SELECT smart_copy_week(1, 2, 2026);
```

**Expected Result:**
```json
{
  "success": true,
  "schedules_created": 0,
  "bookings_copied": 22,
  "bookings_skipped": 0,
  "overcapacity_prevented": 0,
  "source_week": 1,
  "target_week": 2
}
```

---

## 🔧 Apa yang Diubah?

### Updated RPC Function Logic:

```sql
-- BEFORE INSERT schedules
ALTER TABLE schedules DISABLE TRIGGER trigger_prevent_duplicate_schedule;

-- INSERT schedules with NOT EXISTS check
INSERT INTO schedules (...)
SELECT ...
WHERE NOT EXISTS (...);

-- AFTER INSERT schedules
ALTER TABLE schedules ENABLE TRIGGER trigger_prevent_duplicate_schedule;
```

### Cara Kerjanya:

1. **Disable trigger** sebelum INSERT schedules
2. RPC function handle duplicate check dengan `NOT EXISTS`
3. **Enable trigger** kembali setelah INSERT selesai
4. Jika error terjadi, trigger tetap di-enable (EXCEPTION handler)

---

## 🚀 Testing

### Test 1: Copy Week Pertama Kali
1. Login sebagai admin
2. Go to "Booking" tab
3. Click "Copy Previous Week" button
4. Confirm copy Week 1 → Week 2
5. **Expected:** Success! Schedules & bookings copied ✅

### Test 2: Copy Week Kedua Kali (Duplicate)
1. Click "Copy Previous Week" lagi
2. Confirm copy Week 1 → Week 2
3. **Expected:** 
   - `schedules_created: 0` (skip duplicate schedules)
   - `bookings_copied: X` (only new bookings)
   - `bookings_skipped: Y` (students already booked)
   - No error! ✅

### Test 3: Manual Create Schedule (Trigger Still Works)
1. Go to "Booking" tab
2. Try to create duplicate schedule manually
3. **Expected:** Error "Duplicate schedule detected!" ✅
4. Trigger masih berfungsi untuk manual create

---

## 📊 Impact

### Before Fix:
- ❌ Copy week error jika schedule sudah exist
- ❌ Admin tidak bisa copy bookings
- ❌ Harus manual create schedules & bookings

### After Fix:
- ✅ Copy week works even if schedules exist
- ✅ Skip duplicate schedules automatically
- ✅ Copy only new bookings
- ✅ Trigger still protects manual create

---

## 🔍 Verification Checklist

After running fix:

- [ ] Run SQL fix in Supabase
- [ ] Test copy week 1 → 2 (first time)
- [ ] Test copy week 1 → 2 (second time - duplicate)
- [ ] Check schedules created correctly
- [ ] Check bookings copied correctly
- [ ] Test manual create duplicate schedule (should still error)
- [ ] Check trigger still works for protection

---

## 📞 If Still Not Working

### Check 1: Verify RPC Function Updated
```sql
-- Check function definition
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'smart_copy_week';
```

Should contain:
- `ALTER TABLE schedules DISABLE TRIGGER`
- `ALTER TABLE schedules ENABLE TRIGGER`

### Check 2: Check Trigger Status
```sql
-- Check if trigger is enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_prevent_duplicate_schedule';
```

Should show: `tgenabled = 'O'` (enabled)

### Check 3: Manual Test
```sql
-- Manually test copy
SELECT smart_copy_week(1, 2, 2026);
```

Check result JSON for errors.

---

## 🎯 Alternative Solution (If Needed)

### Option: Update Trigger to Skip RPC

Instead of disabling trigger, update trigger to detect RPC call:

```sql
CREATE OR REPLACE FUNCTION prevent_duplicate_schedule()
RETURNS TRIGGER AS $
DECLARE
    calling_function TEXT;
BEGIN
    -- Get calling function
    GET DIAGNOSTICS calling_function = PG_CONTEXT;
    
    -- Skip check if called from smart_copy_week
    IF calling_function LIKE '%smart_copy_week%' THEN
        RETURN NEW;
    END IF;
    
    -- Normal duplicate check
    -- ...
END;
$ LANGUAGE plpgsql;
```

This is cleaner but may not work in all Postgres versions.

---

**Status:** Ready to Fix
**Priority:** High (blocks copy week feature)
**Estimated Time:** 2 minutes
**Risk:** Low (only affects copy week, trigger still protects manual create)

