# 🔥 FIX OXFORD TRIGGER ISSUE - FINAL SOLUTION

## 🚨 MASALAH SEBENARNYA

Anda sudah jalankan fix constraint, tapi **MASIH ERROR**. Kenapa?

Karena error-nya **BUKAN** dari constraint, tapi dari **TRIGGER/FUNCTION**!

### Bukti:
```javascript
// Error message dari console:
Message: "Duplicate schedule detected! Schedule for this class/day/time/phase/week already exists."
Hint: "Please refresh the page and check existing schedules."
Code: "23505"
```

Error message ini adalah **CUSTOM MESSAGE** dari trigger, bukan error PostgreSQL biasa!

## 🎯 ROOT CAUSE

Ada **TRIGGER** di database yang:
1. Check duplicate schedule
2. Tapi check-nya **SALAH** (tidak include program & level)
3. Raise error dengan custom message
4. Block INSERT sebelum masuk database

Trigger ini kemungkinan dibuat dari file:
- `PREVENT_DUPLICATE_SCHEDULES.sql`
- `INSTALL_DATABASE_PROTECTION.sql`
- `DUPLICATE_PREVENTION_SYSTEM.md`

## ⚡ SOLUSI 3 LANGKAH

### LANGKAH 1: Buka Supabase SQL Editor
```
https://supabase.com/dashboard/project/zckdzifjyoglyqnxdtaw/sql
```

### LANGKAH 2: Copy-Paste Query Ini (SEMUA SEKALIGUS)

```sql
-- ═══════════════════════════════════════════════════════════
-- AGGRESSIVE FIX: DROP ALL DUPLICATE TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- 1. Drop semua trigger
DROP TRIGGER IF EXISTS prevent_duplicate_schedule ON schedules CASCADE;
DROP TRIGGER IF EXISTS check_duplicate_schedule ON schedules CASCADE;
DROP TRIGGER IF EXISTS prevent_schedule_conflict ON schedules CASCADE;
DROP TRIGGER IF EXISTS check_schedule_duplicate ON schedules CASCADE;
DROP TRIGGER IF EXISTS validate_schedule_uniqueness ON schedules CASCADE;
DROP TRIGGER IF EXISTS check_duplicate_schedule_complete ON schedules CASCADE;

-- 2. Drop semua function
DROP FUNCTION IF EXISTS prevent_duplicate_schedule() CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_schedule() CASCADE;
DROP FUNCTION IF EXISTS prevent_schedule_conflict() CASCADE;
DROP FUNCTION IF EXISTS check_schedule_duplicate() CASCADE;
DROP FUNCTION IF EXISTS validate_schedule_uniqueness() CASCADE;
DROP FUNCTION IF EXISTS prevent_duplicate_schedule_complete() CASCADE;

-- 3. Drop constraint lama (jika ada)
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_class_day_time_phase_week_key CASCADE;

-- 4. Buat constraint baru yang BENAR
ALTER TABLE schedules
DROP CONSTRAINT IF EXISTS schedules_unique_complete CASCADE;

ALTER TABLE schedules
ADD CONSTRAINT schedules_unique_complete
UNIQUE (class_id, program, level, phase, day, time_slot, week_number, year, batch);

-- 5. Verify
SELECT 
  'Triggers' AS type,
  COUNT(*) AS count
FROM pg_trigger
WHERE tgrelid = 'schedules'::regclass
  AND tgisinternal = false

UNION ALL

SELECT 
  'Constraints' AS type,
  COUNT(*) AS count
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
  AND contype = 'u'
  AND conname = 'schedules_unique_complete';
```

### LANGKAH 3: Test Booking Oxford

**PENTING:** Setelah jalankan query:
1. **Tutup semua tab browser** yang buka booking system
2. **Buka tab baru**
3. **Login lagi**
4. **Test booking Oxford**
5. Seharusnya **BERHASIL** ✅

## 📊 EXPECTED RESULT

Setelah jalankan query di atas:

```
✅ Triggers: 0 (semua trigger dihapus)
✅ Constraints: 1 (schedules_unique_complete)
```

## 🔍 KENAPA TSINGHUA BISA TAPI OXFORD TIDAK?

Karena trigger check duplicate seperti ini:

```sql
-- Trigger lama (SALAH)
SELECT COUNT(*) FROM schedules
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number;
-- TIDAK check program & level!
```

Hasilnya:
- **Oxford Starter** Recap Sunday Evening Week 2 → ✅ Dibuat (belum ada)
- **Oxford Upper Starter** Recap Sunday Evening Week 2 → ❌ BLOCKED (trigger pikir ini duplicate!)
- **Tsinghua Upper Starter** Recap Sunday Evening Week 2 → ✅ Dibuat (belum ada Tsinghua Starter)

## 💡 SOLUSI PERMANEN

Setelah drop trigger, gunakan **CONSTRAINT** saja untuk prevent duplicate:

```sql
UNIQUE (class_id, program, level, phase, day, time_slot, week_number, year, batch)
```

Constraint ini:
- ✅ Lebih cepat (database level)
- ✅ Lebih akurat (include semua field penting)
- ✅ Tidak perlu trigger
- ✅ Allow multiple levels di class yang sama

## 📝 CATATAN PENTING

Jika setelah ini masih error:
1. Cek apakah ada **RLS POLICY** yang bermasalah
2. Cek apakah ada **FUNCTION** lain yang dipanggil
3. Kirim screenshot error baru ke saya

Tapi seharusnya setelah drop semua trigger, Oxford booking akan **BERHASIL**!
