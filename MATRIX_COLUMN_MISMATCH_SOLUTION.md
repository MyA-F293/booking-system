# 🔧 Solution: Matrix Column Mismatch

## 📋 Problem Description
- **Symptom:** Data Monday (Phase 1) muncul di kolom I2 (Phase 2) di Attendance Matrix
- **Tooltip:** Menunjukkan data yang benar (Monday, Phase 1)
- **Database:** Phase sudah benar (Phase Mismatch = 0)
- **Conclusion:** Masalah ada di **duplicate records** atau **rendering logic**

## 🎯 Root Cause Analysis

### Scenario 1: Duplicate Attendance Records
Jika ada 2 attendance records untuk student yang sama di week dan phase yang sama:
```
Student: Andi Nurul Amriana
Week: 1
Phase: phase1
Records:
  1. Monday, 16:00, Present (created first)
  2. Thursday, 19:00, Present (created later)
```

Matrix akan mengambil record pertama yang ditemukan, tapi bisa salah urutannya.

### Scenario 2: Phase Value Typo
```
Database: phase = 'Phase1' (huruf besar P)
Code expects: phase = 'phase1' (huruf kecil)
Result: Tidak match, data tidak muncul di kolom yang benar
```

### Scenario 3: Browser Cache
Matrix di-render dari cached data lama yang belum di-update.

## ✅ Solution Steps

### STEP 1: Check for Duplicates
```sql
SELECT 
    student_name,
    week_number,
    phase,
    COUNT(*) as count,
    STRING_AGG(day, ', ') as days
FROM attendance
WHERE week_number IN (1, 2, 3)
GROUP BY student_name, week_number, phase
HAVING COUNT(*) > 1
ORDER BY student_name, week_number;
```

**If duplicates found:**
```sql
-- Delete duplicates, keep most recent
DELETE FROM attendance a
WHERE a.id NOT IN (
    SELECT DISTINCT ON (student_id, week_number, phase)
        id
    FROM attendance
    ORDER BY student_id, week_number, phase, created_at DESC
);
```

### STEP 2: Verify Phase Values
```sql
-- Check for typos or case issues
SELECT 
    phase,
    COUNT(*) as count,
    LENGTH(phase) as length,
    phase = 'phase1' as is_phase1,
    phase = 'phase2' as is_phase2,
    phase = 'recap' as is_recap
FROM attendance
GROUP BY phase;
```

**Expected:**
```
phase   | count | length | is_phase1 | is_phase2 | is_recap
--------|-------|--------|-----------|-----------|----------
phase1  | 106   | 6      | true      | false     | false
phase2  | 7     | 6      | false     | true      | false
recap   | 0     | 5      | false     | false     | true
```

**If wrong values found:**
```sql
-- Fix case issues
UPDATE attendance
SET phase = LOWER(phase)
WHERE phase != LOWER(phase);

-- Fix typos
UPDATE attendance
SET phase = 'phase1'
WHERE phase LIKE '%phase%1%' AND phase != 'phase1';
```

### STEP 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito mode

### STEP 4: Verify in UI
1. Open Admin Dashboard
2. Go to Attendance tab
3. Scroll to Attendance Matrix
4. Hover over cells to check:
   - Monday data → Should be in I1 column
   - Thursday data → Should be in I2 column
   - Sunday data → Should be in RC column

## 🔍 Debug Checklist

Run these queries to diagnose:

### 1. Check Specific Student
```sql
SELECT 
    week_number,
    phase,
    day,
    time_slot,
    status,
    created_at
FROM attendance
WHERE student_name = 'Andi Nurul Amriana'  -- Replace with actual name
ORDER BY week_number, created_at;
```

### 2. Check Day-Phase Pattern
```sql
-- Monday should be phase1, Thursday should be phase2
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

### 3. Check for Orphaned Records
```sql
-- Attendance without valid schedule
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

## 🎨 Matrix Column Structure

```
Header:  | I1 (Phase 1) | I2 (Phase 2) | RC (Recap) |
Data:    | weekData.phase1 | weekData.phase2 | weekData.recap |
```

Mapping in code:
```javascript
// AttendanceReportExcel.jsx line 143-145
if (record.phase === 'phase1') phaseKey = 'phase1';  // → I1 column
else if (record.phase === 'phase2') phaseKey = 'phase2';  // → I2 column
else if (record.phase === 'recap') phaseKey = 'recap';  // → RC column
```

## 🚨 Common Mistakes

### 1. Wrong Phase in Database
```sql
-- WRONG: Monday with phase2
INSERT INTO attendance (day, phase, ...) 
VALUES ('monday', 'phase2', ...);

-- CORRECT: Monday with phase1
INSERT INTO attendance (day, phase, ...) 
VALUES ('monday', 'phase1', ...);
```

### 2. Case Sensitivity
```sql
-- WRONG
phase = 'Phase1'  -- Capital P
phase = 'PHASE1'  -- All caps

-- CORRECT
phase = 'phase1'  -- All lowercase
```

### 3. Extra Spaces
```sql
-- WRONG
phase = ' phase1'  -- Leading space
phase = 'phase1 '  -- Trailing space

-- CORRECT
phase = 'phase1'  -- No spaces
```

## 📊 Expected Data Pattern

For a typical student in Week 1:

```
Day       | Phase   | Column in Matrix
----------|---------|------------------
Monday    | phase1  | I1 (Week 1)
Thursday  | phase2  | I2 (Week 1)
Sunday    | recap   | RC (Week 1)
```

If Monday data appears in I2 column:
- ❌ Database has: day='monday', phase='phase2'
- ✅ Should be: day='monday', phase='phase1'

## ✅ Verification

After fix, run this query:
```sql
-- Should return 0 anomalies
SELECT 
    COUNT(*) as anomaly_count
FROM attendance
WHERE 
    (day IN ('monday', 'tuesday') AND phase = 'phase2')
    OR
    (day IN ('thursday', 'friday') AND phase = 'phase1')
    OR
    (day = 'sunday' AND phase != 'recap');
```

Expected: `anomaly_count: 0`

## 📞 Still Having Issues?

If problem persists after all steps:

1. Take screenshot of:
   - Attendance Matrix showing wrong placement
   - Tooltip when hovering (showing correct day)
   - Browser Console logs

2. Run this comprehensive check:
```sql
-- File: database/DEBUG_SPECIFIC_STUDENT_MATRIX.sql
```

3. Share results for further analysis

---

**Files Created:**
- `database/DEBUG_SPECIFIC_STUDENT_MATRIX.sql` - Detailed diagnosis
- `database/FIX_MATRIX_COLUMN_PLACEMENT.sql` - Fix queries
- `QUICK_FIX_ATTENDANCE_MATRIX.md` - Quick guide
- `MATRIX_COLUMN_MISMATCH_SOLUTION.md` - This file
