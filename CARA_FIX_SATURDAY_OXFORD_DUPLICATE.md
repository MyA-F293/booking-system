# 🔧 Cara Fix: Saturday Oxford Evening Duplicate Issue

## 📋 Ringkasan Masalah

**Kasus:**
- Admin coba booking/create Saturday Evening Oxford Class
- Error: "Duplicate schedule detected!"
- UI: Hanya tampil afternoon schedule (7/10 students)
- Database: Ada evening schedule tapi hidden (0 students, Batch 1)

**Data dari Database:**

| Week | Program | Level | Batch | Students | Created | Status |
|------|---------|-------|-------|----------|---------|--------|
| 1 | Campus & Career | Starter | 2 | 3 | 2026-04-02 02:51 | ✅ Visible |
| 2 | Campus & Career | Upper Starter | 1 | 0 | 2026-04-02 06:29 | ⚠️ Hidden |

---

## ❓ Pertanyaan: "Kok bisa dibuat lagi jadwal kosongnya dengan batch 1?"

### Jawaban Singkat:

Ada **3 kemungkinan** kenapa schedule Week 2 dibuat dengan Batch 1:

### 1️⃣ Copy Week Feature (PALING MUNGKIN) ✅

**Scenario:**
```
06:29 pagi → Admin/System run "Copy Previous Week"
Week 1 punya schedule: Upper Starter, Batch 1, 0 students
Copy ke Week 2 → Schedule baru: Upper Starter, Batch 1, 0 students
```

**Kenapa Batch 1?**
- Week 1 schedule dibuat dengan Batch 1
- Copy week TIDAK mengubah batch
- Copy week copy EXACT data dari source week

**Cara Check:**
```sql
-- Check apakah Week 1 punya schedule yang sama
SELECT 
    s.week_number,
    s.level,
    s.batch,
    s.current_students,
    s.created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase2'
  AND s.program = 'English Campus & Career'
  AND s.level = 'Upper Starter'
ORDER BY s.week_number;
```

**Jika hasilnya:**
- Week 1: Batch 1, 0 students
- Week 2: Batch 1, 0 students
- **Confirmed:** Dibuat oleh copy week feature ✅

### 2️⃣ Admin Manual Create (MUNGKIN) ⚠️

**Scenario:**
```
06:29 pagi → Admin buka dashboard
Admin klik "Create Schedule"
Admin pilih: Oxford, Saturday, Evening, Phase 2, Week 2
Admin pilih: Upper Starter, Batch 1 (salah pilih!)
Schedule dibuat dengan 0 students
```

**Kenapa Batch 1?**
- Admin salah pilih batch dropdown
- Seharusnya pilih Batch 2 atau 3
- Tapi pilih Batch 1 (old batch)

**Cara Check:**
```sql
-- Check apakah ada schedule lain yang dibuat pada waktu yang sama
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.week_number,
    s.batch,
    s.created_at,
    TO_CHAR(s.created_at, 'HH24:MI:SS') as time_only
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.created_at::date = '2026-04-02'
  AND s.created_at BETWEEN '2026-04-02 06:25:00' AND '2026-04-02 06:35:00'
ORDER BY s.created_at;
```

**Jika hasilnya:**
- Hanya 1 schedule (Oxford Saturday Evening): Manual create ✅
- Banyak schedules (10+ schedules): Copy week feature ✅

### 3️⃣ Student Booking Attempt (TIDAK MUNGKIN) ❌

**Scenario:**
```
06:29 pagi → Student (Upper Starter, Batch 1) coba booking
getOrCreateSchedule() create schedule baru
Tapi booking gagal (error)
Schedule tetap ada tapi 0 students
```

**Kenapa Tidak Mungkin?**
- Jam 06:29 pagi → Siswa masih tidur 😴
- Batch 1 adalah old batch → Seharusnya tidak ada siswa aktif
- Jika booking berhasil → current_students = 1 (bukan 0)

**Cara Check:**
```sql
-- Check apakah ada siswa Batch 1 yang aktif
SELECT 
    COUNT(*) as total_students,
    STRING_AGG(student_id, ', ') as student_ids
FROM users
WHERE batch = '1'
  AND role = 'student'
  AND is_active = true;
```

**Jika hasilnya:**
- 0 students: Batch 1 tidak aktif → Scenario ini TIDAK MUNGKIN ❌
- >0 students: Batch 1 masih aktif → Scenario ini MUNGKIN ⚠️

---

## 🔍 Root Cause: Design Mismatch

### Masalah Utama:

**Code Logic (getOrCreateSchedule):**
```javascript
// Check dengan: class_id, day, time, phase, week, program, level, batch
.eq('program', program)
.eq('level', level)
.eq('batch', batch)
```

**Trigger Logic (prevent_duplicate_schedule):**
```sql
-- Check dengan: class_id, day, time, phase, week (TANPA program/level/batch!)
WHERE class_id = NEW.class_id
  AND day = NEW.day
  AND time_slot = NEW.time_slot
  AND phase = NEW.phase
  AND week_number = NEW.week_number
```

**Impact:**
- Code check: Oxford Saturday Evening Week 2, **Starter, Batch 3**
- Database punya: Oxford Saturday Evening Week 2, **Upper Starter, Batch 1**
- Code: "Tidak ada, buat baru!"
- Trigger: "Sudah ada! Duplicate!" ❌
- **MISMATCH!**

---

## ✅ Solusi

### Solusi 1: Delete Empty Schedule (QUICK FIX - 2 menit)

**Jalankan query ini:**
```sql
-- Delete schedule kosong Week 2
DELETE FROM schedules
WHERE id = 'cbd9cb01-e035-4cde-8fa2-55cac3d8a609';
```

**Kemudian:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Test booking lagi
3. Seharusnya berhasil! ✅

**Kenapa ini aman?**
- Schedule kosong (0 students)
- Batch 1 adalah old batch
- Tidak ada data yang hilang
- Schedule bisa dibuat ulang otomatis saat ada yang booking

### Solusi 2: Delete ALL Empty Duplicates (COMPREHENSIVE FIX - 5 menit)

**Jalankan query ini:**
```sql
-- Delete semua empty duplicate schedules
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

**Impact:**
- ✅ Delete ALL empty duplicate schedules (not just Oxford)
- ✅ Keep oldest schedule per class/day/time/phase/week
- ✅ Prevent future duplicate errors

### Solusi 3: Add "Show Empty Schedules" Toggle (UI IMPROVEMENT - 30 menit)

**Problem:**
- Schedule ada di database tapi hidden di UI
- Admin tidak tahu schedule tersebut ada
- Admin coba create → Error "Duplicate!"

**Solution:**
Add toggle button in AdminBookingDashboard.jsx:

```javascript
// Add state
const [hideEmpty, setHideEmpty] = useState(true);

// Filter schedules
const visibleSchedules = hideEmpty
    ? schedules.filter(s => s.current_students > 0)
    : schedules;  // Show all including empty

// Add button in UI
<button 
    onClick={() => setHideEmpty(!hideEmpty)}
    className="btn btn-secondary"
>
    {hideEmpty ? '👁️ Show Empty Schedules' : '🙈 Hide Empty Schedules'}
</button>
```

**Impact:**
- ✅ Admin can see hidden empty schedules
- ✅ Admin can delete empty schedules manually
- ✅ Prevent confusion

---

## 🚀 Recommended Action Plan

### Step 1: Investigation (2 menit)

**Jalankan query ini untuk tahu penyebabnya:**
```sql
-- Check apakah dibuat oleh copy week
SELECT 
    s.week_number,
    s.level,
    s.batch,
    s.current_students,
    s.created_at,
    TO_CHAR(s.created_at, 'HH24:MI:SS') as time_only
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase2'
  AND s.program = 'English Campus & Career'
ORDER BY s.week_number, s.created_at;
```

**Interpretasi:**
- Jika Week 1 dan Week 2 sama-sama Batch 1: **Copy week** ✅
- Jika hanya Week 2 Batch 1: **Manual create** ⚠️

### Step 2: Quick Fix (2 menit)

**Delete empty schedule:**
```sql
DELETE FROM schedules
WHERE id = 'cbd9cb01-e035-4cde-8fa2-55cac3d8a609';
```

### Step 3: Comprehensive Fix (5 menit)

**Delete ALL empty duplicates:**
```sql
-- Run DELETE_ALL_EMPTY_DUPLICATES.sql
-- (Query sudah ada di file tersebut)
```

### Step 4: Verify (1 menit)

**Check hasil:**
```sql
-- Check apakah masih ada duplicate
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(*) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows (no duplicates) ✅

### Step 5: Test (2 menit)

1. Hard refresh browser (Ctrl + Shift + R)
2. Admin coba create schedule Oxford Saturday Evening
3. Student coba booking Oxford Saturday Evening
4. Seharusnya berhasil! ✅

---

## 📊 Prevention Strategy

### Short-term (Immediate):

1. **Delete empty duplicates** (sudah dilakukan di Step 2-3)
2. **Add "Show Empty Schedules" toggle** (UI improvement)
3. **Document batch system** (Batch 1 = old, Batch 2/3 = current)

### Long-term (Design Fix):

**Option A: Simplify Schedule Design**
- One schedule per class/day/time/phase/week
- Remove program/level/batch from unique constraint
- All students book to same schedule

**Option B: Fix Trigger Logic**
- Update trigger to check program/level/batch
- Allow multiple schedules for different levels/batches
- Match getOrCreateSchedule() logic

**Recommendation:** Option A (Simpler, easier to manage)

---

## 📝 Files Created

- `database/TRACE_WHO_CREATED_SCHEDULE.sql` - Investigation queries
- `CARA_FIX_SATURDAY_OXFORD_DUPLICATE.md` - This document

## 🎯 Summary

**Problem:** Empty schedule Week 2 created with Batch 1 (old batch)

**Root Cause:** 
- Copy week feature copied from Week 1 (Batch 1)
- OR Admin manual create with wrong batch selection

**Solution:**
1. Delete empty schedule
2. Delete ALL empty duplicates
3. Add "Show Empty Schedules" toggle
4. Test booking

**Result:** Students can book normally, no more duplicate errors ✅
