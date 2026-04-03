# 🚨 JALANKAN INI DULU - FIX OXFORD BOOKING (UPDATE)

## 📊 MASALAH
- **Oxford Class**: Gagal booking dengan error "duplicate" tapi schedule tidak ada
- **Tsinghua Class**: Berhasil booking tanpa masalah
- **Error message**: "Duplicate schedule detected! Schedule for this class/day/time/phase/week already exists."

## 🎯 PENYEBAB SEBENARNYA

Ini **BUKAN** masalah constraint! Ini masalah **TRIGGER atau FUNCTION** yang raise custom error message.

Lihat error message-nya:
```
Message: "Duplicate schedule detected! Schedule for this class/day/time/phase/week already exists."
Hint: "Please refresh the page and check existing schedules."
```

Ini adalah **CUSTOM ERROR** dari trigger/function, bukan error constraint PostgreSQL biasa!

## ⚡ SOLUSI BENAR

### 1. Buka Supabase SQL Editor
```
https://supabase.com/dashboard/project/zckdzifjyoglyqnxdtaw/sql
```

### 2. Jalankan Query Ini (DROP TRIGGER)
```sql
-- Drop semua trigger yang bermasalah
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules CASCADE;
DROP TRIGGER IF EXISTS check_duplicate_schedule ON schedules CASCADE;
DROP TRIGGER IF EXISTS prevent_schedule_conflict ON schedules CASCADE;
DROP TRIGGER IF EXISTS check_schedule_duplicate ON schedules CASCADE;
DROP TRIGGER IF EXISTS validate_schedule_uniqueness ON schedules CASCADE;

-- Drop function yang raise error
DROP FUNCTION IF EXISTS prevent_duplicate_schedule() CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_schedule() CASCADE;
DROP FUNCTION IF EXISTS prevent_schedule_conflict() CASCADE;
DROP FUNCTION IF EXISTS check_schedule_duplicate() CASCADE;
DROP FUNCTION IF EXISTS validate_schedule_uniqueness() CASCADE;
```

### 3. Buat Trigger Baru yang Benar
```sql
-- Function baru yang check duplicate dengan BENAR
CREATE OR REPLACE FUNCTION prevent_duplicate_schedule_complete()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check EXACT duplicate (include program & level)
  SELECT COUNT(*) INTO existing_count
  FROM schedules
  WHERE class_id = NEW.class_id
    AND program = NEW.program
    AND level = NEW.level
    AND phase = NEW.phase
    AND day = NEW.day
    AND time_slot = NEW.time_slot
    AND week_number = NEW.week_number
    AND year = NEW.year
    AND batch = NEW.batch
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Exact duplicate schedule exists';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger baru
CREATE TRIGGER check_duplicate_schedule_complete
  BEFORE INSERT OR UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_schedule_complete();
```

### 4. Test Booking Oxford Lagi
- **JANGAN** refresh dulu
- Tutup browser tab
- Buka tab baru
- Login lagi
- Test booking Oxford
- Seharusnya **BERHASIL** ✅

## 📋 VERIFIKASI

```sql
-- Cek trigger yang aktif sekarang
SELECT 
  tgname,
  tgenabled,
  pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'schedules'::regclass
  AND tgisinternal = false;
```

Expected: Hanya ada `check_duplicate_schedule_complete`

## 🔍 KENAPA CONSTRAINT FIX TIDAK BERHASIL?

Karena masalahnya **BUKAN** constraint, tapi **TRIGGER**!

Trigger lama check duplicate seperti ini:
```sql
-- Trigger lama (SALAH)
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number
-- TIDAK check program & level!
```

Trigger baru check duplicate seperti ini:
```sql
-- Trigger baru (BENAR)
WHERE class_id = NEW.class_id
  AND program = NEW.program      -- ✅ ADDED
  AND level = NEW.level          -- ✅ ADDED
  AND phase = NEW.phase
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND week_number = NEW.week_number
  AND year = NEW.year
  AND batch = NEW.batch
```

## ✅ EXPECTED RESULT

- ✅ Oxford booking: **BERHASIL**
- ✅ Tsinghua booking: **TETAP BERHASIL**
- ✅ Duplicate prevention: **TETAP AKTIF** (tapi lebih akurat)
- ✅ Multiple levels di class yang sama: **ALLOWED**
