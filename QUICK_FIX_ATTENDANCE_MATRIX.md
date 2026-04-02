# ⚡ Quick Fix: Attendance Matrix Placement

## 🎯 Masalah
Data attendance terisi di kolom phase yang salah di Attendance Matrix.
- Contoh: Data Monday (Phase 1) muncul di kolom I2 (Phase 2)
- Padahal saat hover, tooltip menunjukkan "Monday" yang benar
- Database phase sudah benar (Phase Mismatch = 0)

## 🔍 Penyebab
Kemungkinan ada **duplicate attendance records** atau **data dengan phase yang salah** meskipun schedule-nya benar.

## 🚀 Solusi Cepat (5 Menit)

### STEP 1: Check Duplicate Records
Buka Supabase SQL Editor, jalankan:
```sql
-- Check for duplicate attendance (same student, week, phase)
SELECT 
    student_id,
    student_name,
    week_number,
    phase,
    COUNT(*) as duplicate_count,
    STRING_AGG(day || ' (' || time_slot || ')', ', ') as days
FROM attendance
GROUP BY student_id, student_name, week_number, phase
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**Hasil:**
- Jika ada hasil → Ada duplicate, lanjut STEP 2 ❌
- Jika kosong → Tidak ada duplicate, lanjut STEP 3 ✅

---

### STEP 2: Delete Duplicate Records (Jika Ada)
```sql
-- Delete duplicates, keep the most recent one
DELETE FROM attendance a
WHERE a.id NOT IN (
    SELECT DISTINCT ON (student_id, week_number, phase)
        id
    FROM attendance
    ORDER BY student_id, week_number, phase, created_at DESC
);
```

**Expected Output:**
```
DELETE 5  -- atau angka lain
```

---

### STEP 3: Check Phase Values
```sql
-- Check if all phase values are correct
SELECT 
    DISTINCT phase,
    COUNT(*) as count
FROM attendance
GROUP BY phase
ORDER BY phase;
```

**Expected Output:**
```
phase1  | 106
phase2  | 7
recap   | 0
```

Jika ada nilai lain selain `phase1`, `phase2`, `recap` → Ada typo, lanjut STEP 4

---

### STEP 4: Fix Invalid Phase Values (Jika Ada)
```sql
-- Fix common typos
UPDATE attendance
SET phase = 'phase1'
WHERE phase LIKE '%phase%1%' AND phase != 'phase1';

UPDATE attendance
SET phase = 'phase2'
WHERE phase LIKE '%phase%2%' AND phase != 'phase2';

UPDATE attendance
SET phase = 'recap'
WHERE phase LIKE '%recap%' AND phase != 'recap';
```

---

### STEP 5: Check Specific Student
Ganti nama siswa sesuai yang bermasalah di screenshot:
```sql
-- Check attendance untuk siswa tertentu
SELECT 
    week_number,
    phase,
    day,
    time_slot,
    status,
    class_name,
    created_at
FROM attendance
WHERE student_name LIKE '%Andi Nurul%'  -- Ganti nama
ORDER BY week_number, created_at;
```

Lihat apakah:
- Ada duplicate records untuk week/phase yang sama
- Phase value sudah benar (phase1, phase2, recap)
- Day sesuai dengan phase (Monday = phase1, Thursday = phase2)

---

### STEP 6: Refresh Browser
1. Buka Admin Dashboard
2. Tekan `Ctrl + Shift + R` (hard refresh + clear cache)
3. Atau buka Incognito/Private window
4. Buka tab "Attendance"
5. Check Attendance Matrix

---

## 🔍 Debug Console

Buka browser Console (F12) dan lihat log saat load Attendance Matrix:

```
🏗️ Building attendance matrix...
📊 Total attendance records: 113
👥 Total students: 112
🔍 Matching attendance records to students...
   ✅ Matched: 113
   ❌ Unmatched: 0
```

**Jika ada "Unmatched":**
- Berarti ada student_id yang tidak cocok
- Jalankan query di STEP 5 untuk check data siswa tersebut

---

## 📊 Kemungkinan Penyebab Lain

### 1. Browser Cache
- Matrix di-render dari cached data
- **Fix:** Hard refresh `Ctrl + Shift + R`

### 2. Duplicate Records
- Ada 2+ attendance untuk student/week/phase yang sama
- Matrix ambil yang pertama (bisa salah)
- **Fix:** Delete duplicates di STEP 2

### 3. Phase Value Typo
- Phase value bukan exactly 'phase1', 'phase2', 'recap'
- Bisa ada spasi, huruf besar, atau typo
- **Fix:** Check di STEP 3 dan fix di STEP 4

### 4. Data Imported Wrong
- Saat import CSV, phase mapping salah
- Monday data di-import sebagai phase2
- **Fix:** Re-import atau manual update

---

## 📊 Alternative: Check Specific Student

Jika ada siswa tertentu yang salah, check datanya:
```sql
-- Replace 'Andi Nurul Amriana' with actual student name
SELECT 
    a.week_number,
    a.phase,
    a.status,
    s.phase AS schedule_phase,
    a.class_name,
    a.day
FROM attendance a
LEFT JOIN schedules s ON a.schedule_id = s.id
WHERE a.student_name = 'Andi Nurul Amriana'
ORDER BY a.week_number, a.phase;
```

---

## ✅ Done!

Setelah fix:
- Phase 1 attendance → Kolom Phase 1 ✅
- Phase 2 attendance → Kolom Phase 2 ✅
- Recap attendance → Kolom Recap ✅

---

**Files Created:**
- `database/CHECK_ATTENDANCE_MATRIX_NOW.sql` - Diagnosis
- `database/FIX_ATTENDANCE_PHASE_MISMATCH.sql` - Complete fix
- `FIX_ATTENDANCE_MATRIX_PLACEMENT.md` - Detailed guide
