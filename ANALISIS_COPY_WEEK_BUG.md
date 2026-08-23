# Analisis Bug Copy Week: 2 Schedule Extra di Week 5

## 🔍 Problem Statement

Setelah copy Week 4 → Week 5:
- **Week 4**: 71 schedules
- **Week 5**: 73 schedules (2 extra)

2 schedule yang berlebih:
1. Saturday afternoon phase2 - class `e8c465de-9c4b-430e-bb6b-0e4ad1de5037`
2. Saturday evening phase2 - class `7bf33ed7-eed0-4e1c-938c-cd480fb2391c`

---

## 🧪 Hipotesis

### Hipotesis 1: Manual Add (bukan bug)
Admin sengaja menambah Saturday phase2 di Week 5 setelah copy week.

**Indikator:**
- ✅ Created_at = `2026-06-26 04:58:11` & `04:04:44` (beda waktu)
- 🔍 Perlu check: Apakah class ini punya schedule di week lain?

### Hipotesis 2: Bug RPC smart_copy_week
RPC function copy schedule yang tidak seharusnya di-copy.

**Kemungkinan root cause:**
1. **Schedule di Week 4 current_students = 0**
   - Seharusnya: RPC skip jadwal kosong (current_students = 0)
   - Tapi kenyataan: Di Week 5 jadi current_students = 1
   - **Kesimpulan**: Ada booking setelah copy, atau ada data inconsistency

2. **Schedule tidak ada di Week 4**
   - Seharusnya: Copy hanya dari Week 4
   - Tapi kenyataan: Muncul schedule baru
   - **Kesimpulan**: Ada logic yang copy dari week lain, atau manual add

3. **Race condition**
   - Copy week jalan 2x secara bersamaan
   - Schedule ke-copy duplikat

### Hipotesis 3: Class Baru
Class Saturday phase2 baru dibuka di Week 5.

**Indikator:**
- 🔍 Perlu check: Apakah class ini ada di Week 3, Week 4?
- 🔍 Perlu check: current_students = 1 → siapa yang booking?

---

## 📋 Langkah Investigasi

Jalankan: **`database/analyze_saturday_phase2_problem.sql`**

### STEP 1: Saturday phase2 di Week 4
Lihat apakah ada Saturday phase2 di Week 4.
- **Jika ADA**: Kenapa tidak ke-copy? (bug RPC filter)
- **Jika TIDAK ADA**: Dari mana datangnya? (manual add / copy dari week lain)

### STEP 2: Saturday phase2 di Week 5
Lihat total Saturday phase2 di Week 5.
- Expected: 0 atau sama dengan Week 4
- Actual: 2 (atau lebih?)

### STEP 3: Detail 2 Class
Lihat nama class, program, level, max_students.

### STEP 4: History Schedule 2 Class ini
Lihat schedule class ini di Week 3, 4, 5.
- Apakah mereka consistent punya Saturday phase2?
- Atau ini baru muncul di Week 5?

### STEP 5: Check RPC Function
Lihat RPC function `smart_copy_week` yang aktif di database.
- Apakah sudah pakai versi terbaru? (skip jadwal kosong)
- Atau masih pakai versi lama?

---

## 🎯 Expected Findings

### Scenario A: Bug di RPC
**Finding:**
- Saturday phase2 TIDAK ADA di Week 4
- Tapi muncul di Week 5 dengan created_at saat copy week

**Root cause:**
- RPC copy dari week lain (bukan Week 4)
- Atau ada logic yang auto-create schedule

**Fix:**
- Update RPC function
- Tambah logging untuk trace

### Scenario B: Manual Add
**Finding:**
- Saturday phase2 TIDAK ADA di Week 4
- Created_at berbeda (satu saat copy, satu manual)
- Class ini punya pattern consistent di week lain

**Root cause:**
- Admin sengaja tambah

**Fix:**
- Tidak perlu fix, ini intentional

### Scenario C: Data Inconsistency
**Finding:**
- Saturday phase2 ADA di Week 4 dengan current_students = 0
- Di-skip oleh RPC (correct behavior)
- Tapi muncul di Week 5 karena ada booking after copy

**Root cause:**
- Timing issue: copy week, lalu ada yang booking Saturday phase2

**Fix:**
- Tidak perlu fix, ini expected behavior

---

## 📊 Versi RPC yang Diharapkan

```sql
CREATE OR REPLACE FUNCTION smart_copy_week(...)
RETURNS JSON AS $
DECLARE
BEGIN
    FOR source_schedule IN
        SELECT * FROM schedules
        WHERE week_number = source_week_param
          AND year = year_param
          AND current_students > 0  -- ⭐ SKIP KOSONG!
    LOOP
        -- Check duplicate
        IF EXISTS (
            SELECT 1 FROM schedules
            WHERE class_id = source_schedule.class_id
              AND day = source_schedule.day
              AND time_slot = source_schedule.time_slot
              AND phase = source_schedule.phase
              AND week_number = target_week_param
              AND year = year_param
        ) THEN
            CONTINUE;  -- Skip duplicate
        END IF;
        
        -- Insert schedule...
    END LOOP;
END;
$ LANGUAGE plpgsql;
```

**Key points:**
1. ✅ Filter `current_students > 0` (skip jadwal kosong)
2. ✅ Check duplicate sebelum insert
3. ✅ Copy dari `source_week_param` saja (tidak dari week lain)

---

## 🚀 Action Plan

1. **Jalankan** `analyze_saturday_phase2_problem.sql` semua step
2. **Paste hasil** untuk analisis
3. **Tentukan** scenario (A/B/C)
4. **Decide**: Delete atau keep 2 schedule extra
5. **Fix RPC** jika memang ada bug
6. **Deploy** RPC update jika perlu

---

## Status

🔴 **Menunggu hasil investigasi**

Jalankan Step 1-4 untuk identifikasi root cause.
