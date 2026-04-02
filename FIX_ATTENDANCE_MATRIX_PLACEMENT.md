# 🔧 Fix Attendance Matrix Placement Issue

## 📋 Masalah
Beberapa data attendance di Admin Attendance Matrix terisi di kolom phase yang salah:
- Seharusnya di Phase 1, tapi muncul di Phase 2
- Atau sebaliknya

## 🔍 Penyebab Masalah
Ada 2 kemungkinan penyebab:

### 1. **Phase Mismatch** (Paling Umum)
- Data attendance memiliki `phase` yang berbeda dengan `schedule.phase`
- Ini terjadi jika:
  - Schedule di-update setelah attendance disubmit
  - Ada bug saat submit attendance
  - Data di-import dengan phase yang salah

### 2. **Orphaned Attendance**
- Attendance record memiliki `schedule_id` yang tidak valid
- Schedule sudah dihapus tapi attendance masih ada

## ✅ Solusi

### STEP 1: Diagnosa Masalah
Jalankan query ini di Supabase SQL Editor:

```sql
-- Check for phase mismatch
SELECT 
    a.student_name,
    a.week_number,
    a.phase AS attendance_phase,
    s.phase AS schedule_phase,
    a.class_name,
    a.day,
    a.status
FROM attendance a
INNER JOIN schedules s ON a.schedule_id = s.id
WHERE a.phase != s.phase
ORDER BY a.student_name, a.week_number;
```

**Jika ada hasil:**
- Berarti ada phase mismatch ❌
- Lanjut ke STEP 2

**Jika tidak ada hasil:**
- Phase sudah benar ✅
- Masalah mungkin di rendering, lanjut ke STEP 4

---

### STEP 2: Fix Phase Mismatch

Jalankan file SQL ini:
```bash
database/FIX_ATTENDANCE_PHASE_MISMATCH.sql
```

Atau jalankan query ini:
```sql
-- Update attendance.phase to match schedules.phase
UPDATE attendance a
SET phase = s.phase
FROM schedules s
WHERE a.schedule_id = s.id
AND a.phase != s.phase;
```

**Expected Result:**
```
UPDATE 15  -- Jumlah record yang diperbaiki
```

---

### STEP 3: Verify Fix

```sql
-- Should return 0 mismatched records
SELECT COUNT(*) as mismatched_count
FROM attendance a
INNER JOIN schedules s ON a.schedule_id = s.id
WHERE a.phase != s.phase;
```

**Expected Result:**
```
mismatched_count: 0
```

---

### STEP 4: Check for Orphaned Records

```sql
-- Find attendance with invalid schedule_id
SELECT 
    a.id,
    a.student_name,
    a.week_number,
    a.phase,
    a.schedule_id
FROM attendance a
LEFT JOIN schedules s ON a.schedule_id = s.id
WHERE s.id IS NULL;
```

**Jika ada hasil:**
- Ada orphaned attendance ❌
- Hapus dengan query:

```sql
DELETE FROM attendance a
WHERE NOT EXISTS (
    SELECT 1 FROM schedules s WHERE s.id = a.schedule_id
);
```

---

### STEP 5: Clear Browser Cache

Setelah fix database, clear cache browser:

1. **Chrome/Edge:**
   - Tekan `Ctrl + Shift + Delete`
   - Pilih "Cached images and files"
   - Clear

2. **Firefox:**
   - Tekan `Ctrl + Shift + Delete`
   - Pilih "Cache"
   - Clear

3. **Atau Hard Refresh:**
   - Tekan `Ctrl + F5`

---

### STEP 6: Verify di UI

1. Buka Admin Dashboard
2. Klik tab "Attendance"
3. Scroll ke bawah ke "Attendance Matrix"
4. Check apakah data sudah benar:
   - Phase 1 attendance di kolom Phase 1 ✅
   - Phase 2 attendance di kolom Phase 2 ✅
   - Recap attendance di kolom Recap ✅

---

## 🔍 Debug Mode

Jika masih ada masalah, aktifkan debug mode:

1. Buka browser Console (F12)
2. Refresh halaman Attendance
3. Lihat log:

```
🏗️ Building attendance matrix...
📊 Total attendance records: 150
👥 Total students: 50
🔍 Matching attendance records to students...
   ✅ Matched: 145
   ❌ Unmatched: 5
```

**Jika ada "Unmatched":**
- Berarti ada student_id yang tidak cocok
- Jalankan query:

```sql
-- Find unmatched student_ids
SELECT DISTINCT
    a.student_id AS attendance_student_id,
    a.student_name,
    u.student_id AS user_student_id,
    u.full_name
FROM attendance a
LEFT JOIN users u ON a.student_id = u.student_id
WHERE u.id IS NULL;
```

---

## 📊 Prevention

Untuk mencegah masalah ini di masa depan:

### 1. Jangan Edit Schedule Setelah Attendance Disubmit
- Jika perlu edit, hapus attendance dulu
- Atau buat schedule baru

### 2. Validasi Phase Saat Submit
Sudah ada di kode:
```javascript
// AdminAttendanceManager.jsx line 327
phase: selectedSchedule.phase,  // ✅ Ambil dari schedule
```

### 3. Database Constraint (Optional)
Tambahkan constraint untuk memastikan phase match:

```sql
-- Add check constraint (optional, might cause issues with updates)
ALTER TABLE attendance
ADD CONSTRAINT check_phase_match
CHECK (
    phase IN ('phase1', 'phase2', 'recap')
);
```

---

## 🎯 Quick Fix Command

Jika ingin fix cepat tanpa baca detail:

```sql
-- Run this in Supabase SQL Editor
UPDATE attendance a
SET phase = s.phase
FROM schedules s
WHERE a.schedule_id = s.id
AND a.phase != s.phase;

-- Then verify
SELECT COUNT(*) FROM attendance a
INNER JOIN schedules s ON a.schedule_id = s.id
WHERE a.phase != s.phase;
-- Should return 0
```

Lalu refresh browser dengan `Ctrl + F5`.

---

## 📞 Jika Masih Bermasalah

Jika setelah semua langkah di atas masih ada masalah:

1. Screenshot Attendance Matrix yang salah
2. Jalankan query debug:
```sql
-- Get specific student's attendance
SELECT * FROM attendance 
WHERE student_name = 'Nama Siswa Yang Bermasalah'
ORDER BY week_number, phase;
```
3. Share hasil query dan screenshot

---

## ✅ Checklist

- [ ] Jalankan `FIX_ATTENDANCE_PHASE_MISMATCH.sql`
- [ ] Verify 0 mismatched records
- [ ] Check for orphaned records
- [ ] Clear browser cache
- [ ] Verify di UI Attendance Matrix
- [ ] Check console log untuk errors

---

**Status:** Ready to fix ✅
**Estimated Time:** 5 minutes
**Risk Level:** Low (hanya update phase field)
