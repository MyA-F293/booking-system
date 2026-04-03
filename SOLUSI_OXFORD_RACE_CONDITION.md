# SOLUSI: Oxford Booking Race Condition

## 🔍 ANALISIS MASALAH

Dari console log terlihat pola yang jelas:

### ❌ OXFORD CLASS - GAGAL
```
INSERT failed: "Duplicate schedule detected!"
SELECT query: NO SCHEDULE FOUND
Retry 5x: Semua gagal
Error: "Schedule exists but could not be retrieved"
```

### ✅ TSINGHUA CLASS - BERHASIL
```
Booking successful!
Class: Tsinghua Class
Phase: Recap Class
Day: Sunday, Apr 12
Time: Evening - 19:00 - 20:30
```

## 🎯 PENYEBAB

Ada **3 kemungkinan** penyebab race condition ini:

### 1. **UNIQUE CONSTRAINT Terlalu Ketat**
```sql
-- Constraint yang mungkin bermasalah:
UNIQUE (class_id, day, time_slot, phase, week_number, year)
```

Constraint ini memblokir INSERT tapi tidak membuat schedule, sehingga:
- INSERT gagal dengan error 409
- SELECT tidak menemukan schedule
- Retry terus gagal

### 2. **TRIGGER yang Reject INSERT**
```sql
-- Trigger yang mungkin ada:
CREATE TRIGGER prevent_duplicate_schedule
BEFORE INSERT ON schedules
...
```

Trigger bisa reject INSERT sebelum data masuk database.

### 3. **RLS POLICY yang Berbeda per Class**
Mungkin ada policy yang lebih ketat untuk Oxford class.

## 🔧 SOLUSI

### SOLUSI 1: Hapus Constraint yang Bermasalah (RECOMMENDED)

```sql
-- 1. Cek constraint yang ada
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
  AND contype = 'u'; -- unique constraints

-- 2. Drop constraint yang bermasalah
-- Ganti 'nama_constraint' dengan nama yang ditemukan
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_class_day_time_phase_week_key;

ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS schedules_unique_schedule;

-- 3. Buat constraint baru yang lebih tepat
-- Hanya prevent duplicate EXACT schedule (termasuk program & level)
ALTER TABLE schedules
ADD CONSTRAINT schedules_unique_complete
UNIQUE (class_id, program, level, phase, day, time_slot, week_number, year, batch);
```

### SOLUSI 2: Disable Trigger Sementara

```sql
-- 1. Cek trigger yang ada
SELECT 
  tgname,
  tgenabled,
  pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'schedules'::regclass
  AND tgisinternal = false;

-- 2. Disable trigger yang bermasalah
ALTER TABLE schedules 
DISABLE TRIGGER prevent_duplicate_schedule;

-- Atau disable semua trigger user-defined
ALTER TABLE schedules 
DISABLE TRIGGER USER;
```

### SOLUSI 3: Perbaiki Logic di getOrCreateSchedule

Ubah pendekatan dari "INSERT first" ke "SELECT first":

```javascript
// Di dbHelpers.js - function getOrCreateSchedule

// BEFORE (INSERT first - menyebabkan race condition)
try {
  const { data, error } = await supabase
    .from('schedules')
    .insert(scheduleData)
    .select()
    .single();
  
  if (error) {
    // Coba SELECT...
  }
}

// AFTER (SELECT first - lebih aman)
// 1. Coba SELECT dulu
const { data: existing } = await supabase
  .from('schedules')
  .select('*')
  .match({
    class_id: scheduleData.class_id,
    program: scheduleData.program,
    level: scheduleData.level,
    phase: scheduleData.phase,
    day: scheduleData.day,
    time_slot: scheduleData.time_slot,
    week_number: scheduleData.week_number,
    year: scheduleData.year,
    batch: scheduleData.batch
  })
  .maybeSingle();

// 2. Kalau ada, return existing
if (existing) {
  return { data: existing, error: null };
}

// 3. Kalau tidak ada, baru INSERT
const { data, error } = await supabase
  .from('schedules')
  .insert(scheduleData)
  .select()
  .single();

// 4. Kalau INSERT gagal karena duplicate, SELECT lagi
if (error && error.code === '23505') {
  const { data: retry } = await supabase
    .from('schedules')
    .select('*')
    .match({ /* same filters */ })
    .single();
  
  return { data: retry, error: null };
}
```

## 📋 LANGKAH EKSEKUSI

### STEP 1: Debug Dulu
```bash
# Jalankan query debug
psql -f booking-system/database/DEBUG_OXFORD_VS_TSINGHUA.sql
```

### STEP 2: Identifikasi Masalah
Lihat hasil query untuk tahu:
- Constraint apa yang ada?
- Trigger apa yang aktif?
- Apakah ada schedule Oxford yang "hidden"?

### STEP 3: Pilih Solusi
Berdasarkan hasil debug:
- Kalau ada constraint bermasalah → Gunakan SOLUSI 1
- Kalau ada trigger bermasalah → Gunakan SOLUSI 2  
- Kalau tidak ada keduanya → Gunakan SOLUSI 3

### STEP 4: Test
```bash
# Test booking Oxford lagi
# Seharusnya berhasil tanpa error
```

## 🎯 KENAPA TSINGHUA BERHASIL?

Kemungkinan:
1. **Tsinghua belum pernah dibuat** untuk kombinasi yang sama
2. **Oxford sudah pernah dibuat** tapi kemudian dihapus (constraint masih "ingat")
3. **Constraint hanya trigger** untuk class tertentu

## ✅ EXPECTED RESULT

Setelah fix:
```
✅ Oxford booking: SUCCESS
✅ Tsinghua booking: SUCCESS  
✅ Semua class: Bisa dibook tanpa error
```

## 📝 CATATAN

- **JANGAN** hapus semua constraint - hanya yang bermasalah
- **BACKUP** database sebelum drop constraint
- **TEST** di lokal dulu sebelum production
