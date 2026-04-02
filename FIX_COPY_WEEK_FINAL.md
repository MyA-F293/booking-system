# 🔧 Fix Copy Week - FINAL SOLUTION

## 🔍 Masalah Baru

Setelah fix syntax error, muncul error baru:
```
duplicate key value violates unique constraint "unique_schedule_no_batch"
```

**Root Cause:**
Ada 2 unique constraints di table schedules:
1. `unique_schedule_combination` - untuk schedule dengan batch
2. `unique_schedule_no_batch` - untuk schedule tanpa batch

Kedua constraint ini mencegah INSERT duplicate, bahkan setelah trigger dimatikan.

---

## ✅ Solusi Final

### Gunakan `ON CONFLICT DO NOTHING`

Tambahkan clause ini di INSERT statement untuk handle duplicate constraint violations secara graceful:

```sql
INSERT INTO schedules (...)
SELECT ...
WHERE NOT EXISTS (...)
ON CONFLICT (class_id, day, time_slot, phase, week_number, year) 
DO NOTHING;
```

**Cara Kerjanya:**
1. NOT EXISTS check mencegah duplicate di application level
2. Jika tetap ada duplicate (race condition), ON CONFLICT handle di database level
3. DO NOTHING = skip duplicate, lanjutkan proses
4. Tidak ada error, tidak ada data corruption

---

## 🚀 Cara Fix

### Step 1: Run SQL Fix Baru

**File:** `database/FIX_COPY_WEEK_COMPLETE.sql`

1. Open Supabase SQL Editor
2. Copy-paste SEMUA query dari file
3. Run query
4. Verify: "Query executed successfully"

### Step 2: Test Copy Week

1. Login admin
2. Go to Booking tab
3. Click "Copy Previous Week"
4. Confirm copy Week 1 → Week 2

**Expected Result:**
```
✅ Smart Copy Complete!
📅 Schedules created: 0 (or number of new schedules)
✅ Bookings copied: X
⏭️ Skipped: Y (already booked)
```

No error! ✅

---

## 🛡️ Protection Layers

Setelah fix ini, ada 4 layer proteksi:

### Layer 1: NOT EXISTS Check (Application Level)
```sql
WHERE NOT EXISTS (
    SELECT 1 FROM schedules s2
    WHERE s2.class_id = s.class_id
      AND s2.day = s.day
      ...
)
```
- Check duplicate sebelum INSERT
- Skip jika sudah ada

### Layer 2: ON CONFLICT DO NOTHING (Database Level)
```sql
ON CONFLICT (class_id, day, time_slot, phase, week_number, year) 
DO NOTHING;
```
- Handle duplicate constraint violations
- Skip duplicate tanpa error

### Layer 3: Unique Constraints (Always Active)
```sql
CONSTRAINT unique_schedule_combination UNIQUE (...)
CONSTRAINT unique_schedule_no_batch UNIQUE (...)
```
- Tidak bisa dimatikan
- Final safety net

### Layer 4: Trigger (Manual Operations)
```sql
CREATE TRIGGER trigger_prevent_duplicate_schedule
```
- Proteksi manual create schedule
- Hanya bypass saat RPC copy

---

## 📊 Perbedaan dengan Fix Sebelumnya

### Fix Lama (Error):
```sql
INSERT INTO schedules (...)
SELECT ...
WHERE NOT EXISTS (...);
-- ❌ Error jika constraint violation
```

### Fix Baru (Success):
```sql
INSERT INTO schedules (...)
SELECT ...
WHERE NOT EXISTS (...)
ON CONFLICT (...) DO NOTHING;
-- ✅ Skip duplicate, no error
```

---

## 🔍 Kenapa Ini Terjadi?

### Skenario Race Condition:

1. **Admin A** click "Copy Week" → Start transaction
2. **Admin B** click "Copy Week" (0.1 detik kemudian) → Start transaction
3. **Admin A** check NOT EXISTS → OK, no duplicate
4. **Admin B** check NOT EXISTS → OK, no duplicate (A belum commit)
5. **Admin A** INSERT schedule → Success
6. **Admin B** INSERT schedule → ❌ Duplicate constraint violation!

### Dengan ON CONFLICT:

1. **Admin A** click "Copy Week" → Start transaction
2. **Admin B** click "Copy Week" (0.1 detik kemudian) → Start transaction
3. **Admin A** check NOT EXISTS → OK, no duplicate
4. **Admin B** check NOT EXISTS → OK, no duplicate
5. **Admin A** INSERT schedule → Success
6. **Admin B** INSERT schedule → ON CONFLICT → DO NOTHING → ✅ Success (skip duplicate)

---

## ✅ Verification Checklist

After running fix:

- [ ] Run SQL fix: `FIX_COPY_WEEK_COMPLETE.sql`
- [ ] Test copy week 1 → 2 (first time)
- [ ] Test copy week 1 → 2 (second time - duplicate)
- [ ] Check no error appears
- [ ] Check schedules created correctly
- [ ] Check bookings copied correctly
- [ ] Test manual create duplicate schedule (should still error)

---

## 📞 If Still Error

### Check 1: Verify Function Updated
```sql
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'smart_copy_week';
```

Should contain: `ON CONFLICT (...) DO NOTHING`

### Check 2: Check Constraints
```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'schedules'::regclass 
  AND contype = 'u';
```

Should show both unique constraints.

### Check 3: Manual Test
```sql
SELECT smart_copy_week(1, 2, 2026);
```

Should return success JSON without error.

---

**Status:** Ready to Fix (Complete Solution)
**Priority:** High
**Risk:** Very Low (multiple protection layers)
**Estimated Time:** 2 minutes
