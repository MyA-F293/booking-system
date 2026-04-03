# 🔧 Cara Fix Duplicate Schedule Error (PERMANEN)

## 📋 Masalah yang Terus Berulang

### Kasus Kemarin:
- Oxford Class Monday Evening
- UI: Tidak ada jadwal malam
- Admin: Coba buat jadwal malam
- Error: "Duplicate schedule detected!" ❌

### Kasus Hari Ini:
- Oxford Class Saturday Evening
- UI: Tidak ada jadwal malam (hanya ada afternoon)
- Admin: Coba buat jadwal malam
- Error: "Duplicate schedule detected!" ❌

### Pola yang Sama:
1. UI tidak menampilkan jadwal (karena 0 siswa)
2. Database masih punya jadwal tersebut (hidden)
3. Admin coba buat jadwal baru
4. Trigger deteksi duplikat dan block
5. Error muncul

## 🔍 Root Cause

### Kenapa Jadwal Tidak Muncul di UI?

Di `AdminBookingDashboard.jsx` ada filter `hideEmpty`:
```javascript
const visibleSchedules = hideEmpty
    ? schedules.filter(s => s.current_students > 0)  // ← Filter ini!
    : schedules;
```

**Artinya:**
- Jadwal dengan 0 siswa = HIDDEN di UI ❌
- Tapi jadwal masih ada di database ✅
- Admin tidak tahu jadwal tersebut masih ada
- Admin coba buat jadwal baru
- Trigger deteksi duplikat → Error!

### Kenapa Jadwal Duplikat Ada di Database?

Beberapa kemungkinan:
1. **Copy week feature** membuat duplikat
2. **Delete dari UI gagal** (network error, RLS policy, dll)
3. **Browser cache** menampilkan data lama
4. **Race condition** (multiple admins create bersamaan)
5. **Trigger sempat disabled** (saat copy week)

## ✅ SOLUSI PERMANEN

### OPTION A: Fix Kasus Spesifik (Saturday Evening Oxford)

#### Step 1: Check Duplicate
Buka Supabase SQL Editor, jalankan:
```sql
-- File: booking-system/database/CHECK_SATURDAY_EVENING_OXFORD.sql
```

Copy-paste query dari file tersebut.

Expected result:
- Akan muncul list jadwal Saturday Evening Oxford Class
- Mungkin ada 1-2 jadwal dengan 0 students
- Ini yang menyebabkan error!

#### Step 2: Delete Duplicate
Jalankan query ini:
```sql
-- Delete Oxford Class Saturday Evening empty schedules
DELETE FROM schedules
WHERE id IN (
    SELECT s.id 
    FROM schedules s
    JOIN classes c ON s.class_id = c.id
    WHERE c.name = 'Oxford Class'
      AND s.day = 'saturday'
      AND s.time_slot = 'evening'
      AND s.current_students = 0
);
```

Expected: `DELETE X` (X = jumlah jadwal yang dihapus)

#### Step 3: Verify
```sql
-- Check no duplicates remain
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(s.id) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(s.id) > 1;
```

Expected: **0 rows** ✅

#### Step 4: Hard Refresh & Test
1. Tekan **Ctrl + Shift + R**
2. Tunggu 2-3 detik
3. Coba buat jadwal Saturday Evening Oxford Class
4. Seharusnya berhasil! ✅

---

### OPTION B: Fix Semua Sekaligus (RECOMMENDED!)

Daripada fix satu-satu setiap kali ada error, lebih baik fix SEMUA duplicate sekaligus!

#### Step 1: Check ALL Empty Duplicates
```sql
-- Check all duplicate empty schedules
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(s.id) as duplicate_count,
    STRING_AGG(s.id::text, ', ') as schedule_ids
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students = 0
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(s.id) > 1
ORDER BY duplicate_count DESC, c.name;
```

Ini akan menampilkan SEMUA jadwal duplikat yang kosong.

#### Step 2: Delete ALL Empty Duplicates
```sql
-- File: booking-system/database/DELETE_ALL_EMPTY_DUPLICATES.sql

WITH ranked_schedules AS (
    SELECT 
        s.id,
        s.class_id,
        s.day,
        s.time_slot,
        s.phase,
        s.week_number,
        s.program,
        s.level,
        s.batch,
        s.current_students,
        s.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY s.class_id, s.day, s.time_slot, s.phase, s.week_number, s.program, s.level, s.batch
            ORDER BY s.created_at ASC  -- Keep oldest
        ) as rank
    FROM schedules s
    WHERE s.current_students = 0
)
DELETE FROM schedules
WHERE id IN (
    SELECT id 
    FROM ranked_schedules 
    WHERE rank > 1  -- Delete all except oldest
);
```

Expected: `DELETE X` (X bisa 10-50+ tergantung berapa banyak duplikat)

#### Step 3: Verify No Duplicates
```sql
-- Check for any remaining duplicates
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(s.id) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(s.id) > 1;
```

Expected: **0 rows** ✅

#### Step 4: Hard Refresh & Test
1. Tekan **Ctrl + Shift + R**
2. Tunggu 2-3 detik
3. Coba buat jadwal apapun (Oxford Saturday Evening, dll)
4. Seharusnya berhasil! ✅

---

## 📊 PERBANDINGAN

### Option A: Fix Spesifik (Saturday Evening Oxford)
- ✅ Cepat (1 query)
- ✅ Aman (hanya Oxford Class)
- ❌ Masalah akan muncul lagi untuk kelas/hari lain
- ❌ Harus fix manual setiap kali ada error

### Option B: Fix Semua Sekaligus (RECOMMENDED!)
- ✅ Fix semua duplicate sekaligus
- ✅ Tidak perlu fix manual lagi
- ✅ Lebih efisien
- ✅ Aman (hanya delete jadwal kosong)
- ⚠️ Lebih banyak data yang dihapus (tapi semua kosong)

## 🎯 REKOMENDASI

**Gunakan OPTION B (Delete All Empty Duplicates)**

Kenapa?
1. Masalah ini sudah terjadi 2x (Monday, Saturday)
2. Kemungkinan besar ada duplikat lain yang belum ketemu
3. Lebih baik fix semua sekaligus daripada fix satu-satu
4. Aman karena hanya delete jadwal kosong (0 siswa)
5. Tidak ada data loss

## 🛡️ Data Safety

### Apa yang Dihapus?
- ✅ Jadwal dengan 0 siswa (empty)
- ✅ Yang duplikat (lebih dari 1 jadwal untuk class/day/time/phase/week yang sama)
- ✅ Hanya yang lebih baru (oldest schedule tetap ada)

### Apa yang TIDAK Dihapus?
- ✅ Jadwal dengan siswa (current_students > 0)
- ✅ Jadwal unik (tidak duplikat)
- ✅ Semua booking data
- ✅ Semua student data

### Contoh:

**Before:**
```
Oxford Class, Saturday, Evening, Phase 2, Week 2:
- Schedule 1: 0 students, created 2026-03-28  ← DELETED
- Schedule 2: 0 students, created 2026-03-29  ← DELETED
- Schedule 3: 0 students, created 2026-04-01  ← KEPT (oldest)
```

**After:**
```
Oxford Class, Saturday, Evening, Phase 2, Week 2:
- Schedule 3: 0 students, created 2026-04-01  ← KEPT
```

Hanya 1 jadwal yang tersisa, tidak ada duplikat!

## 🚀 QUICK ACTION

### Jalankan Sekarang (5 menit):

1. **Buka Supabase SQL Editor**
   https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Copy-paste query ini:**
```sql
-- Delete all empty duplicate schedules
WITH ranked_schedules AS (
    SELECT 
        s.id,
        s.class_id,
        s.day,
        s.time_slot,
        s.phase,
        s.week_number,
        s.program,
        s.level,
        s.batch,
        s.current_students,
        s.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY s.class_id, s.day, s.time_slot, s.phase, s.week_number, s.program, s.level, s.batch
            ORDER BY s.created_at ASC
        ) as rank
    FROM schedules s
    WHERE s.current_students = 0
)
DELETE FROM schedules
WHERE id IN (
    SELECT id 
    FROM ranked_schedules 
    WHERE rank > 1
);
```

3. **Klik RUN** ▶️

4. **Verify:**
```sql
-- Check no duplicates
SELECT 
    c.name, s.day, s.time_slot, s.phase, s.week_number,
    COUNT(s.id) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(s.id) > 1;
```

Expected: **0 rows** ✅

5. **Hard Refresh Browser**
   Tekan **Ctrl + Shift + R**

6. **Test Booking**
   - Coba buat jadwal Saturday Evening Oxford Class
   - Seharusnya berhasil tanpa error! ✅

---

## 🔧 TROUBLESHOOTING

### Jika Masih Error Setelah Delete

**Check 1: Verify deletion berhasil**
```sql
SELECT COUNT(*) FROM schedules WHERE current_students = 0;
```
Bandingkan dengan sebelum delete. Harusnya berkurang.

**Check 2: Check trigger status**
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'trigger_prevent_duplicate_schedule';
```
Expected: `tgenabled = 'O'` (enabled)

**Check 3: Clear browser cache**
- Hard refresh: Ctrl + Shift + R
- Atau clear all browser data
- Atau coba incognito mode

**Check 4: Check specific schedule**
```sql
-- Replace with your specific class/day/time
SELECT * FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2;
```

Harusnya hanya 1 row atau 0 rows.

---

## 📝 SUMMARY

**Masalah:** Duplicate schedule error terus berulang untuk kelas/hari yang berbeda
**Root Cause:** Jadwal duplikat dengan 0 siswa ada di database tapi hidden di UI
**Solusi:** Delete ALL empty duplicate schedules sekaligus
**Impact:** Fix semua duplicate issues, tidak perlu fix manual lagi
**Data Safety:** Aman, hanya delete jadwal kosong, tidak ada data loss

**Rekomendasi:** Gunakan OPTION B (Delete All Empty Duplicates) untuk fix permanen!

**Files:**
- `database/CHECK_SATURDAY_EVENING_OXFORD.sql` - Check Saturday Evening Oxford
- `database/DELETE_SATURDAY_EVENING_DUPLICATES.sql` - Delete Saturday Evening duplicates
- `database/DELETE_ALL_EMPTY_DUPLICATES.sql` - Delete ALL empty duplicates (RECOMMENDED!)

**Next Steps:**
1. Run SQL query (OPTION B recommended)
2. Hard refresh browser
3. Test booking
4. Seharusnya tidak ada error lagi! ✅

</content>
