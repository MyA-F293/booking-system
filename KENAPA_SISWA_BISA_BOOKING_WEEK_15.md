# Kenapa Siswa Bisa Booking Week 15?

## Problem
Siswa tiba-tiba bisa booking Week 15 di tab "New", padahal seharusnya Week 2.

## Root Cause Analysis

### Code Student (BookingDashboard.jsx)

**Line 50-51:**
```javascript
const { currentWeek } = useWeek(); // Use database week from context
```

**Line 64-65:**
```javascript
const nextWeek = currentWeek + 1;
const displayWeek = selectedWeekTab === 'current' ? currentWeek : nextWeek;
```

**Line 107:**
```javascript
const filters = {
    week_number: displayWeek,  // Uses displayWeek from calculation above
    year: currentYear,
    _cacheBust: timestamp
};
```

### Flow Diagram

```
DATABASE
└─ settings.current_week = 15  ❌ WRONG! Should be 2

↓

CONTEXT (WeekContext.jsx)
└─ Reads from database
└─ Provides currentWeek = 15 to all components

↓

STUDENT DASHBOARD (BookingDashboard.jsx)
├─ currentWeek = 15 (from context)
├─ nextWeek = currentWeek + 1 = 16
└─ displayWeek = selectedWeekTab === 'current' ? 15 : 16

↓

TAB "CURRENT"
└─ Shows Week 15 schedules ❌

TAB "NEW" 
└─ Shows Week 16 schedules ❌

EXPECTED:
├─ currentWeek = 2
├─ nextWeek = 3
├─ Tab "Current" = Week 2
└─ Tab "New" = Week 3
```

## Kesimpulan

**CODE STUDENT BENAR!** ✅

Student dashboard mengambil `currentWeek` dari database via `useWeek()` context. Kalau database salah (current_week = 15), maka student akan lihat Week 15.

**MASALAH ADA DI DATABASE!** ❌

`settings.current_week` di-set ke 15, seharusnya 2.

## Why Database Wrong?

**Most Likely Cause:** GitHub Actions cron schedule

**Scenario:**
1. GitHub Actions seharusnya run weekly (every Sunday)
2. Tapi kalau cron salah, bisa run daily
3. Week di-increment 13 kali dalam 13 hari
4. Week 2 → Week 15

**Alternative Causes:**
- Manual `increment_week()` called 13 times
- Database corruption
- Copy week bug

## Solution

### Quick Fix

**1. Reset current_week di database:**
```sql
UPDATE settings
SET current_week = 2,
    updated_at = NOW()
WHERE id = 1;
```

**2. Delete Week 15 data:**
```sql
-- Delete bookings
DELETE FROM bookings
WHERE schedule_id IN (SELECT id FROM schedules WHERE week_number = 15);

-- Delete schedules
DELETE FROM schedules WHERE week_number = 15;
```

**3. Delete all future weeks (3-14):**
```sql
DELETE FROM bookings
WHERE schedule_id IN (SELECT id FROM schedules WHERE week_number > 2);

DELETE FROM schedules WHERE week_number > 2;
```

### Prevention

**1. Fix GitHub Actions cron (if wrong):**
```yaml
# CORRECT: Weekly (every Sunday)
on:
  schedule:
    - cron: '0 0 * * 0'  # Sunday at midnight UTC

# WRONG: Daily
on:
  schedule:
    - cron: '0 0 * * *'  # Every day at midnight
```

**2. Add safeguards to increment_week():**
- 6-day cooldown (don't increment if updated < 6 days ago)
- Max week limit (don't increment beyond Week 20)
- Return detailed JSON with success/failure reasons

**3. Monitor weekly:**
- Check `current_week` matches calendar
- Check GitHub Actions runs only once per week
- Check no future weeks created accidentally

## Code Review

### Student Dashboard Logic ✅ CORRECT

```javascript
// BookingDashboard.jsx line 64-65
const nextWeek = currentWeek + 1;
const displayWeek = selectedWeekTab === 'current' ? currentWeek : nextWeek;
```

**This is CORRECT behavior:**
- Tab "Current" shows current week schedules
- Tab "New" shows next week schedules (for advance booking)
- Students book for NEXT week, not current week

**Example (when database is correct):**
- Database: `current_week = 2`
- Tab "Current": Shows Week 2 (ongoing classes)
- Tab "New": Shows Week 3 (book for next week)

**Example (when database is wrong):**
- Database: `current_week = 15` ❌
- Tab "Current": Shows Week 15 ❌
- Tab "New": Shows Week 16 ❌

### WeekContext.jsx ✅ CORRECT

```javascript
// Reads from database
const { data, error } = await supabase
    .from('settings')
    .select('current_week')
    .eq('id', 1)
    .single();

setCurrentWeek(data.current_week);
```

**This is CORRECT behavior:**
- Context reads from database
- Provides single source of truth
- All components use same week value

**If database is wrong, all components will be wrong!**

## Testing After Fix

### Step 1: Verify Database
```sql
SELECT current_week FROM settings WHERE id = 1;
-- Expected: 2
```

### Step 2: Verify No Future Weeks
```sql
SELECT DISTINCT week_number FROM schedules ORDER BY week_number;
-- Expected: Only 1 and 2
```

### Step 3: Test Student Dashboard
1. Login as student
2. Check tab "Current" → Should show Week 2
3. Check tab "New" → Should show Week 3
4. Try booking → Should work for Week 3

### Step 4: Verify Context
```javascript
// In browser console
console.log('Current Week:', currentWeek);
// Expected: 2
```

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Student Code | ✅ CORRECT | Uses database value correctly |
| WeekContext | ✅ CORRECT | Reads from database correctly |
| Database | ❌ WRONG | current_week = 15 (should be 2) |
| GitHub Actions | ⚠️ CHECK | May be running daily instead of weekly |

**Action Required:**
1. ✅ Run `FIX_WEEK_15_NOW.sql` to reset database
2. ✅ Check GitHub Actions cron schedule
3. ✅ Add safeguards to `increment_week()` function
4. ✅ Inform affected students
5. ✅ Monitor next week increment

---

**Files:**
- `src/components/BookingDashboard.jsx` - Student booking logic (CORRECT)
- `src/contexts/WeekContext.jsx` - Week context provider (CORRECT)
- `database/FIX_WEEK_15_NOW.sql` - Fix queries
- `database/CHECK_WEEK_15_DETAIL.sql` - Check affected data
- `.github/workflows/auto-increment-week.yml` - Cron schedule

**Priority:** CRITICAL  
**Impact:** All students affected  
**Fix Time:** 5 minutes (run SQL queries)
