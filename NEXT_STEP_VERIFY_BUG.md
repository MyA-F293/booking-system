# 🎯 NEXT STEP: Verify Bug Exists

## Status
✅ Database schema confirmed  
✅ Fix created and ready  
✅ Simple verification query ready  
⏳ **WAITING**: Run verification to confirm bug  

---

## 📋 What You Need to Do NOW

### Step 1: Run Verification Query (2 minutes)

1. Open Supabase SQL Editor
2. Copy paste isi file: `database/VERIFY_CLASS_CHANGE_SIMPLE.sql`
3. Execute
4. Check hasil TEST 1

---

## 🔍 What to Look For

### TEST 1 Results - Critical Fields:

```
class_changed    | Berapa siswa yang berubah class?
percent_changed  | Berapa persen yang berubah?
verdict          | Apakah bug confirmed?
```

### Expected Results (if bug exists):

```
total_students   | 999
class_changed    | 345 (atau > 0)
class_preserved  | 654
percent_changed  | 34.50%
verdict          | 🔴 BUG CONFIRMED - Ada class mapping issue!
```

### If No Bug:

```
total_students   | 999
class_changed    | 0
class_preserved  | 999
percent_changed  | 0.00%
verdict          | 🟢 NO BUG - Semua class preserved
```

---

## 📊 What Each Test Shows

### TEST 1: Summary
- Total berapa siswa yang affected
- Berapa yang berubah class vs preserved
- Percentage dan verdict

### TEST 2: Detail
- List user_id yang berubah class
- From class → To class
- Schedule info (program, level, day, time)
- Max 50 rows untuk quick review

### TEST 3: Breakdown
- Pattern perpindahan class
- Misal: Oxford → Tokyo (10 students)
- Sorted by student_count descending

---

## ⚡ Quick Decision Tree

```
Run VERIFY_CLASS_CHANGE_SIMPLE.sql
         |
         v
   Check TEST 1
         |
    /---------\
   /           \
  v             v
class_changed > 0    class_changed = 0
  |                    |
  v                    v
BUG CONFIRMED!      NO BUG FOUND
  |                    |
  v                    v
Deploy FIX          No action needed
```

---

## 🚀 If Bug Confirmed (class_changed > 0)

### Next Steps:

1. **Review TEST 2 & TEST 3**
   - Lihat pattern perpindahan
   - Confirm ini match dengan report sebelumnya (345 students)

2. **Deploy Fix**
   - File: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
   - Guide: `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`
   - Quick test: `QUICK_TEST_COPY_WEEK_FIX.md`

3. **Test Fix**
   - Delete week 2 schedules
   - Run new function: `SELECT copy_week_schedules(1, 2);`
   - Verify: class_changed = 0

---

## ❌ If No Bug Found (class_changed = 0)

Possible reasons:
1. Bug sudah di-fix sebelumnya
2. Data sudah di-correct manually
3. Copy week belum pernah dijalankan

**Action**: No fix needed, tapi install new function anyway untuk prevent future issues.

---

## 📝 Copy Paste This to Supabase

```sql
-- ============================================
-- VERIFY CLASS CHANGE - SIMPLE VERSION
-- ============================================

-- TEST 1: Count students yang berubah class
SELECT 
    '📊 SUMMARY - CLASS CHANGES' as test_name,
    COUNT(DISTINCT b1.user_id) as total_students,
    SUM(CASE WHEN s1.class_id != s2.class_id THEN 1 ELSE 0 END) as class_changed,
    SUM(CASE WHEN s1.class_id = s2.class_id THEN 1 ELSE 0 END) as class_preserved,
    ROUND(
        100.0 * SUM(CASE WHEN s1.class_id != s2.class_id THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) as percent_changed,
    CASE 
        WHEN SUM(CASE WHEN s1.class_id != s2.class_id THEN 1 ELSE 0 END) > 0 
        THEN '🔴 BUG CONFIRMED - Ada class mapping issue!'
        ELSE '🟢 NO BUG - Semua class preserved'
    END as verdict
FROM bookings b1
JOIN schedules s1 ON b1.schedule_id = s1.id
JOIN bookings b2 ON b2.user_id = b1.user_id
JOIN schedules s2 ON b2.schedule_id = s2.id
WHERE s1.week_number = 1
  AND s2.week_number = 2
  AND s1.year = 2026
  AND s2.year = 2026
  AND b1.status = 'confirmed'
  AND b2.status = 'confirmed';
```

---

## 🎯 Your Action

**SEKARANG**: 
1. Copy query di atas
2. Paste ke Supabase SQL Editor
3. Execute
4. Share hasil TEST 1 dengan saya

**Format hasil**:
```
total_students: [number]
class_changed: [number]
percent_changed: [number]%
verdict: [text]
```

---

## 📞 After You Run It

Tell me:
- ✅ "Bug confirmed, class_changed = 345" → I'll guide you to deploy fix
- ✅ "No bug, class_changed = 0" → I'll explain next steps
- ❌ "Error: [error message]" → I'll help troubleshoot

---

## 🔗 Related Files

- Verification: `database/VERIFY_CLASS_CHANGE_SIMPLE.sql`
- Fix: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
- Quick Test: `QUICK_TEST_COPY_WEEK_FIX.md`
- Full Guide: `COPY_WEEK_FIX_DEPLOYMENT_GUIDE.md`

---

**STATUS**: ⏳ Waiting for verification results...
