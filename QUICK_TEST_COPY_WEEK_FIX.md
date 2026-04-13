# ⚡ Quick Test - Copy Week Fix

## 🎯 Quick 5-Minute Test

Untuk verify fix bekerja dengan cepat.

---

## Step 1: Install Function (1 menit)

```sql
-- Copy paste isi file: database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql
-- Atau jalankan di Supabase SQL Editor
```

---

## Step 2: Clean Target Week (30 detik)

```sql
-- Hapus week 2 (atau week target lainnya)
DELETE FROM bookings 
WHERE schedule_id IN (SELECT id FROM schedules WHERE week = 2);

DELETE FROM schedules WHERE week = 2;
```

---

## Step 3: Run Copy (30 detik)

```sql
-- Copy dari week 1 ke week 2
SELECT copy_week_schedules(1, 2);
```

Expected output:
```json
{
  "success": true,
  "schedules_copied": 50,
  "bookings_copied": 999,
  "message": "Successfully copied..."
}
```

---

## Step 4: Verify (2 menit)

### Quick Check - Class Preservation
```sql
WITH source_data AS (
  SELECT s.class_id, b.user_id
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 1 AND b.user_id IS NOT NULL
),
target_data AS (
  SELECT s.class_id, b.user_id
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 2 AND b.user_id IS NOT NULL
)
SELECT 
  COUNT(*) as total_students,
  SUM(CASE WHEN sd.class_id = td.class_id THEN 1 ELSE 0 END) as class_preserved,
  SUM(CASE WHEN sd.class_id != td.class_id THEN 1 ELSE 0 END) as class_changed,
  CASE 
    WHEN SUM(CASE WHEN sd.class_id != td.class_id THEN 1 ELSE 0 END) = 0 
    THEN '✅ SUCCESS - Fix bekerja!'
    ELSE '❌ FAILED - Masih ada bug'
  END as verdict
FROM source_data sd
JOIN target_data td ON sd.user_id = td.user_id;
```

### Expected Result:
```
total_students | class_preserved | class_changed | verdict
---------------|-----------------|---------------|------------------
999            | 999             | 0             | ✅ SUCCESS
```

---

## Step 5: Test Specific Students (1 menit)

```sql
-- Check Nilna, Talitha, dll yang sebelumnya bermasalah
WITH source_data AS (
  SELECT s.class_id, s.class_name, b.user_id, b.student_name
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 1
),
target_data AS (
  SELECT s.class_id, s.class_name, b.user_id, b.student_name
  FROM schedules s
  LEFT JOIN bookings b ON s.id = b.schedule_id
  WHERE s.week = 2
)
SELECT 
  sd.student_name,
  sd.class_name as source_class,
  td.class_name as target_class,
  CASE 
    WHEN sd.class_id = td.class_id THEN '✅ FIXED'
    ELSE '❌ STILL BROKEN'
  END as status
FROM source_data sd
JOIN target_data td ON sd.user_id = td.user_id
WHERE sd.student_name ILIKE '%Nilna%'
   OR sd.student_name ILIKE '%Talitha%'
   OR sd.student_name ILIKE '%Afifah%';
```

### Expected Result:
```
student_name      | source_class | target_class | status
------------------|--------------|--------------|--------
Nilna Khaeriyah   | Oxford Class | Oxford Class | ✅ FIXED
Talitha           | Oxford Class | Oxford Class | ✅ FIXED
St. Nur Afifah    | Oxford Class | Oxford Class | ✅ FIXED
```

---

## ✅ Success Criteria

Fix berhasil jika:
- ✅ `class_changed = 0`
- ✅ `verdict = "✅ SUCCESS"`
- ✅ Nilna, Talitha, dll status = "✅ FIXED"

---

## ❌ If Failed

Jika masih ada `class_changed > 0`:

1. **Check function installed**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'copy_week_schedules';
```

2. **Check for data issues**:
```sql
-- Cek apakah ada duplicate class_id
SELECT class_id, COUNT(*) 
FROM schedules 
WHERE week = 1 
GROUP BY class_id 
HAVING COUNT(*) > 1;
```

3. **Rollback and retry**:
```sql
DELETE FROM bookings WHERE schedule_id IN (SELECT id FROM schedules WHERE week = 2);
DELETE FROM schedules WHERE week = 2;
-- Then reinstall function and retry
```

---

## 📋 Full Testing

Untuk comprehensive testing, gunakan:
- `database/TEST_COPY_WEEK_FIX.sql` (11 steps)
- `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md` (full guide)
