# 🔧 Fix: Wrong Phase Input in Attendance

## 📋 Masalah yang Sebenarnya
Dari screenshot dan penjelasan Anda:
- **Data Monday ter-input sebagai Phase 2** ❌
- **Padahal Monday seharusnya Phase 1** ✅
- **Tooltip menunjukkan "Monday"** (data benar)
- **Tapi muncul di kolom I2 (Phase 2)** (penempatan salah karena phase-nya salah)

## 🎯 Root Cause
Ada 2 kemungkinan:

### 1. Schedule Monday Memiliki Phase2 (Salah!)
```
Schedule:
  day: monday
  phase: phase2  ❌ SALAH!
  
Seharusnya:
  day: monday
  phase: phase1  ✅ BENAR
```

### 2. Admin Submit Attendance ke Schedule yang Salah
Admin pilih schedule Monday yang phase-nya phase2, jadi attendance ter-record sebagai phase2.

## ✅ Solusi Cepat (2 Menit)

### STEP 1: Check Berapa Banyak yang Salah
```sql
-- Check Monday dengan phase2 (SALAH!)
SELECT 
    student_name,
    week_number,
    day,
    phase,
    class_name,
    time_slot
FROM attendance
WHERE day = 'monday' AND phase = 'phase2'
ORDER BY student_name;
```

**Expected:** Akan muncul list siswa yang Monday-nya ter-input sebagai phase2

---

### STEP 2: Fix Attendance Records
```sql
-- Update Monday dari phase2 ke phase1
UPDATE attendance
SET phase = 'phase1'
WHERE day = 'monday' AND phase = 'phase2';

-- Update Thursday dari phase1 ke phase2 (jika ada)
UPDATE attendance
SET phase = 'phase2'
WHERE day = 'thursday' AND phase = 'phase1';

-- Update Tuesday dari phase2 ke phase1 (jika ada)
UPDATE attendance
SET phase = 'phase1'
WHERE day = 'tuesday' AND phase = 'phase2';

-- Update Friday dari phase1 ke phase2 (jika ada)
UPDATE attendance
SET phase = 'phase2'
WHERE day = 'friday' AND phase = 'phase1';
```

**Expected Output:**
```
UPDATE 7  -- Jumlah record yang diperbaiki
```

---

### STEP 3: Check Schedules
```sql
-- Check apakah schedule juga salah
SELECT 
    class_name,
    day,
    phase,
    time_slot,
    week_number,
    current_students
FROM schedules
WHERE 
    (day IN ('monday', 'tuesday') AND phase = 'phase2')
    OR
    (day IN ('thursday', 'friday') AND phase = 'phase1')
ORDER BY class_name, day;
```

**Jika ada hasil:**
- Schedule juga salah ❌
- Perlu di-fix juga, lanjut STEP 4

**Jika kosong:**
- Schedule sudah benar ✅
- Skip STEP 4, langsung ke STEP 5

---

### STEP 4: Fix Schedules (Jika Perlu)
```sql
-- Fix Monday/Tuesday schedules
UPDATE schedules
SET phase = 'phase1'
WHERE day IN ('monday', 'tuesday') AND phase = 'phase2';

-- Fix Thursday/Friday schedules
UPDATE schedules
SET phase = 'phase2'
WHERE day IN ('thursday', 'friday') AND phase = 'phase1';
```

---

### STEP 5: Verify Fix
```sql
-- Check attendance setelah fix
SELECT 
    day,
    phase,
    COUNT(*) as count
FROM attendance
WHERE week_number IN (1, 2, 3)
GROUP BY day, phase
ORDER BY 
    CASE day
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
    END,
    phase;
```

**Expected Result:**
```
day       | phase   | count
----------|---------|-------
monday    | phase1  | 50    ✅
tuesday   | phase1  | 45    ✅
thursday  | phase2  | 7     ✅
friday    | phase2  | 5     ✅
sunday    | recap   | 0     ✅
```

**TIDAK boleh ada:**
```
monday    | phase2  | X     ❌
thursday  | phase1  | X     ❌
```

---

### STEP 6: Refresh Browser
1. Tekan `Ctrl + Shift + R` (hard refresh)
2. Atau buka Incognito window
3. Buka Admin Dashboard → Attendance
4. Check Attendance Matrix

**Sekarang:**
- Monday data → Muncul di kolom I1 (Phase 1) ✅
- Thursday data → Muncul di kolom I2 (Phase 2) ✅

---

## 📊 Penjelasan Phase System

### Correct Pattern:
```
Week Structure:
  Monday    → Phase 1 (I1)
  Tuesday   → Phase 1 (I1)
  Thursday  → Phase 2 (I2)
  Friday    → Phase 2 (I2)
  Sunday    → Recap (RC)
```

### Why This Matters:
- **Phase 1** = Pertemuan pertama dalam seminggu (awal materi)
- **Phase 2** = Pertemuan kedua dalam seminggu (lanjutan materi)
- **Recap** = Review/ujian akhir minggu

Jika Monday di-input sebagai Phase 2:
- Matrix akan menempatkan di kolom I2 ❌
- Padahal seharusnya di kolom I1 ✅

---

## 🚨 Pencegahan di Masa Depan

### 1. Pastikan Schedule Benar Sebelum Submit Attendance
Saat admin mau submit attendance, check:
- Monday/Tuesday → Harus pilih schedule dengan phase1
- Thursday/Friday → Harus pilih schedule dengan phase2

### 2. Validasi di Code (Optional)
Tambahkan validasi di `AdminAttendanceManager.jsx`:

```javascript
// Before submit, validate day-phase match
const validateDayPhase = (day, phase) => {
    const earlyWeek = ['monday', 'tuesday'];
    const lateWeek = ['thursday', 'friday'];
    
    if (earlyWeek.includes(day) && phase !== 'phase1') {
        return false; // Monday/Tuesday harus phase1
    }
    if (lateWeek.includes(day) && phase !== 'phase2') {
        return false; // Thursday/Friday harus phase2
    }
    return true;
};

// In handleSubmitAttendance
if (!validateDayPhase(selectedSchedule.day, selectedSchedule.phase)) {
    toast.error('Schedule phase tidak sesuai dengan hari!');
    return;
}
```

### 3. Database Constraint (Optional)
```sql
-- Add check constraint
ALTER TABLE attendance
ADD CONSTRAINT check_day_phase_match
CHECK (
    (day IN ('monday', 'tuesday') AND phase = 'phase1')
    OR
    (day IN ('thursday', 'friday') AND phase = 'phase2')
    OR
    (day = 'sunday' AND phase = 'recap')
    OR
    (day = 'wednesday')  -- Wednesday bisa phase1 atau phase2
);
```

---

## 🔍 Debug: Check Specific Student

Jika ada siswa tertentu yang masih salah:

```sql
-- Replace 'Amdi Yaya' with actual name
SELECT 
    week_number,
    day,
    phase,
    time_slot,
    class_name,
    status,
    created_at
FROM attendance
WHERE student_name = 'Amdi Yaya'
ORDER BY week_number, created_at;
```

Check:
- Apakah Monday-nya phase1? ✅
- Apakah Thursday-nya phase2? ✅

---

## ✅ Checklist

- [ ] Run STEP 1: Check berapa banyak yang salah
- [ ] Run STEP 2: Fix attendance records
- [ ] Run STEP 3: Check schedules
- [ ] Run STEP 4: Fix schedules (jika perlu)
- [ ] Run STEP 5: Verify fix
- [ ] STEP 6: Refresh browser dan check matrix
- [ ] Verify: Monday di kolom I1, Thursday di kolom I2

---

## 📞 Jika Masih Bermasalah

Jika setelah fix masih ada yang salah:

1. Screenshot attendance matrix yang masih salah
2. Run query ini dan share hasil:
```sql
SELECT * FROM attendance 
WHERE student_name = 'Nama Siswa Yang Salah'
ORDER BY week_number, day;
```
3. Check console browser untuk error

---

**Files:**
- `database/FIX_WRONG_PHASE_ATTENDANCE.sql` - Complete fix queries
- `FIX_WRONG_PHASE_INPUT.md` - This guide

**Estimated Time:** 2 minutes
**Risk Level:** Low (hanya update phase field)
