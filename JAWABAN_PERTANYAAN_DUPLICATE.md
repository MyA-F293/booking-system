# 💬 Jawaban Pertanyaan: Kenapa Schedule Jadi 0 & Student Tidak Bisa Booking

## ❓ Pertanyaan 1: "Kok bisa sampai nol gitu?"

### Jawaban Singkat:
Ada 3 kemungkinan kenapa `current_students = 0`:

1. **Schedule baru dibuat, belum ada siswa** (NORMAL) ✅
   - Admin create schedule
   - Belum ada yang booking
   - Counter = 0

2. **Copy week dari schedule kosong** (NORMAL) ✅
   - Week 1 tidak ada siswa
   - Copy ke Week 2
   - Week 2 juga 0 siswa

3. **Siswa di-delete oleh admin** (NORMAL) ✅
   - Ada 3 siswa
   - Admin delete semua
   - Trigger auto-update counter ke 0

### Dari Screenshot:
Schedule ID `9c5b1-ed43-6c2e-8f2a-58c2d1d3e489`:
- Created: 2026-03-22 (11 hari yang lalu)
- Program: English Campus & Career
- Level: Upper Starter
- Batch: 1
- current_students: 0

**Kemungkinan besar:** Schedule dibuat 11 hari lalu (mungkin dari copy week atau admin create manual), tapi tidak ada siswa yang booking. Ini **NORMAL**.

---

## ❓ Pertanyaan 2: "Kok student tidak bisa booking?"

### Jawaban Singkat:
Error "Duplicate schedule detected!" muncul karena:

**Trigger `prevent_duplicate_schedule` block schedule creation**

### Kenapa Trigger Block?

Trigger check apakah sudah ada schedule untuk:
- ✅ Oxford Class
- ✅ Saturday
- ✅ Evening
- ✅ Phase 2
- ✅ Week 2

Trigger **TIDAK** check:
- ❌ Program (Campus & Career vs English for Teens)
- ❌ Level (Starter vs Upper Starter)
- ❌ Batch (1 vs 2 vs 3)

### Contoh Kasus:

**Database punya:**
- Oxford Saturday Evening Week 2, **Upper Starter**, Batch 1, 0 students

**Student coba booking:**
- Oxford Saturday Evening Week 2, **Starter**, Batch 3

**Flow:**
```
1. System check: Ada schedule untuk Starter Batch 3? → TIDAK ADA
2. System coba create schedule baru
3. Trigger check: Ada schedule untuk Oxford Saturday Evening Week 2? → ADA! (Upper Starter)
4. Trigger block: "Duplicate schedule detected!" ❌
```

**Masalahnya:**
- System check dengan **program/level/batch** ✅
- Trigger check **TANPA program/level/batch** ❌
- **MISMATCH LOGIC!**

### Kenapa Ini Terjadi?

**Design Decision:**
- Trigger dirancang untuk: **1 schedule per class/day/time/phase/week**
- Code dirancang untuk: **Multiple schedules per class/day/time/phase/week** (untuk different program/level/batch)

**Conflict!**

---

## ✅ Solusi

### Solusi Cepat (5 menit):

**Jalankan query ini di Supabase:**
```sql
-- Check berapa schedule Oxford Saturday Evening Week 2
SELECT 
    s.id,
    s.program,
    s.level,
    s.batch,
    s.current_students,
    COUNT(b.id) as actual_bookings
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2
GROUP BY s.id, s.program, s.level, s.batch, s.current_students;
```

**Jika hasilnya:**
- **1 schedule:** Tidak ada duplicate, tapi schedule kosong (0 students)
- **2+ schedules:** ADA DUPLICATE! Ini masalahnya!

### Jika Ada Duplicate (2+ schedules):

**Delete empty duplicates:**
```sql
WITH ranked_schedules AS (
    SELECT 
        s.id,
        s.class_id,
        s.day,
        s.time_slot,
        s.phase,
        s.week_number,
        s.current_students,
        s.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY s.class_id, s.day, s.time_slot, s.phase, s.week_number
            ORDER BY 
                CASE WHEN s.current_students > 0 THEN 0 ELSE 1 END,
                s.created_at ASC
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

**Kemudian:**
1. Hard refresh (Ctrl + Shift + R)
2. Test booking lagi
3. Seharusnya berhasil! ✅

### Jika Hanya 1 Schedule (tidak ada duplicate):

**Ini berarti schedule memang kosong (0 students), tapi trigger tetap block.**

**2 opsi:**

**Opsi A: Delete schedule kosong ini**
```sql
DELETE FROM schedules
WHERE id = '9c5b1-ed43-6c2e-8f2a-58c2d1d3e489';
```

**Opsi B: Student booking ke schedule yang ada**
- Student harus booking dengan **exact match**:
  - Program: English Campus & Career
  - Level: Upper Starter
  - Batch: 1
- Jika student level Starter → Tidak bisa booking ke schedule ini
- Harus create schedule baru untuk Starter

**Tapi trigger block create schedule baru!**

**Solusi:** Delete schedule kosong, biar system bisa create schedule baru untuk level yang sesuai.

---

## 🎯 Kesimpulan

### Kenapa Schedule Jadi 0?
**Jawaban:** Schedule dibuat 11 hari lalu tapi tidak ada siswa yang booking. Ini **NORMAL**.

### Kenapa Student Tidak Bisa Booking?
**Jawaban:** Ada 2 kemungkinan:
1. **Duplicate schedules exist** (multiple schedules untuk Oxford Saturday Evening Week 2)
2. **Schedule level mismatch** (schedule untuk Upper Starter, tapi student level Starter)

### Solusi:
1. **Check duplicate** dengan query di atas
2. **Jika ada duplicate:** Delete empty duplicates
3. **Jika tidak ada duplicate:** Delete schedule kosong, biar system create baru
4. **Hard refresh** browser
5. **Test booking** lagi

---

## 🚀 Quick Action

**Jalankan query ini sekarang:**
```sql
-- Check duplicate
SELECT 
    COUNT(s.id) as duplicate_count,
    STRING_AGG(s.id::text, ' | ') as schedule_ids,
    STRING_AGG(s.program || ' - ' || s.level || ' - Batch ' || s.batch, ' | ') as details
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2;
```

**Jika duplicate_count = 1:**
```sql
-- Delete schedule kosong
DELETE FROM schedules
WHERE id = '9c5b1-ed43-6c2e-8f2a-58c2d1d3e489';
```

**Jika duplicate_count > 1:**
```sql
-- Delete empty duplicates
WITH ranked_schedules AS (
    SELECT 
        s.id,
        s.class_id,
        s.day,
        s.time_slot,
        s.phase,
        s.week_number,
        s.current_students,
        s.created_at,
        ROW_NUMBER() OVER (
            PARTITION BY s.class_id, s.day, s.time_slot, s.phase, s.week_number
            ORDER BY 
                CASE WHEN s.current_students > 0 THEN 0 ELSE 1 END,
                s.created_at ASC
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

**Kemudian:**
- Hard refresh (Ctrl + Shift + R)
- Test booking
- Seharusnya berhasil! ✅

</content>
