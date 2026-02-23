# 🔍 Check Duplicate Schedules - Quick Guide

## Quick Check (30 seconds)

Copy-paste this in Supabase SQL Editor:

```sql
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(*) as count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY s.class_id, c.name, s.day, s.time_slot, s.phase, s.week_number, s.year
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Result Interpretation:

**0 rows returned:**
```
✅ No duplicates!
✅ Safe to install database protection
✅ Safe to increase class capacity
```

**Rows returned:**
```
⚠️ You have duplicates!
⚠️ Need to fix before installing protection
⚠️ Run: database/COMPREHENSIVE_DUPLICATE_FIX.sql
```

---

## Detailed Check (2 minutes)

For complete analysis, run:

**File:** `database/CHECK_DUPLICATES_NOW.sql`

This will show:
1. List of all duplicate schedules
2. Total count of duplicates
3. Which weeks are affected
4. Which classes are affected
5. Detailed plan for fixing

---

## What to Do Next

### If No Duplicates (0 rows):

1. ✅ Install database protection
   - Run: `database/PREVENT_DUPLICATE_SCHEDULES.sql`

2. ✅ Fix overcapacity (if needed)
   - Option 1: Increase capacity to 30
   - Option 2: Distribute students
   - Option 3: Cancel and rebook

3. ✅ Commit frontend changes
   ```bash
   git add .
   git commit -m "fix: prevent duplicate schedules"
   git push
   ```

### If Duplicates Found (rows returned):

1. ⚠️ Fix duplicates FIRST
   - Run: `database/COMPREHENSIVE_DUPLICATE_FIX.sql`
   - This will merge duplicates safely

2. ✅ Verify fix worked
   - Run quick check again
   - Should return 0 rows

3. ✅ Then install protection
   - Run: `database/PREVENT_DUPLICATE_SCHEDULES.sql`

---

## Common Scenarios

### Scenario 1: Fresh Database
```
Quick check → 0 rows
Action: Install protection immediately
Time: 5 minutes
```

### Scenario 2: After Running COMPREHENSIVE_DUPLICATE_FIX.sql
```
Quick check → 0 rows (duplicates cleaned)
Action: Install protection now
Time: 5 minutes
```

### Scenario 3: Duplicates Still Exist
```
Quick check → Multiple rows
Action: Run COMPREHENSIVE_DUPLICATE_FIX.sql first
Time: 10 minutes (fix + verify + install)
```

### Scenario 4: After UNDO_ALL_CHANGES.sql
```
Quick check → May show duplicates
Action: Run COMPREHENSIVE_DUPLICATE_FIX.sql again
Time: 10 minutes
```

---

## Files Reference

- `database/CHECK_DUPLICATES_NOW.sql` - Detailed duplicate check (this guide)
- `database/COMPREHENSIVE_DUPLICATE_FIX.sql` - Fix all duplicates
- `database/PREVENT_DUPLICATE_SCHEDULES.sql` - Install protection
- `RUN_DATABASE_PROTECTION_NOW.md` - Quick install guide

---

## Quick Decision Tree

```
Run quick check
    ↓
0 rows? → YES → Install protection → Done! ✅
    ↓
   NO
    ↓
Run COMPREHENSIVE_DUPLICATE_FIX.sql
    ↓
Run quick check again
    ↓
0 rows? → YES → Install protection → Done! ✅
    ↓
   NO → Contact support (shouldn't happen)
```

---

## Status Checklist

- [ ] Ran quick check
- [ ] Interpreted results
- [ ] Fixed duplicates (if needed)
- [ ] Verified 0 duplicates
- [ ] Ready to install protection

---

**Current Task:** Run quick check to see if duplicates exist
**Next Step:** Based on results, either fix duplicates or install protection
