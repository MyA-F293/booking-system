# Week Management Update - 27 Juni 2026

## ✅ Changes Made

### 1. Removed Week Increment Button
**File**: `src/AdminDashboard.jsx`
**Commit**: `92dd7df`

#### What was removed:
- ChevronRight button (arrow icon) next to week display
- `incrementWeek()` function call
- Import of ChevronRight icon

#### Before:
```
Batch 4 | Week 4 →
                   ↑ (increment button)
```

#### After:
```
Batch 4 | Week 2
(no increment button)
```

---

## 📝 How to Update Week Now

### Method: Manual Database Update

**File**: `database/set_week_back_to_2.sql`

```sql
-- Set current week kembali ke Week 2
UPDATE settings
SET value = '2'
WHERE key = 'current_week';

-- Verify
SELECT key, value FROM settings WHERE key = 'current_week';
-- Expected: value = '2'
```

### Steps:
1. Open Supabase SQL Editor
2. Run the UPDATE query
3. Verify with SELECT query
4. Refresh aplikasi → Week akan berubah ke 2

---

## 🎯 Why This Change?

### Problems with Auto-Increment Button:
1. **Too easy to accidentally click** - Mengubah week tanpa sengaja
2. **No confirmation** - Langsung increment tanpa warning
3. **Hard to undo** - Harus manual ke database untuk rollback
4. **No control** - Tidak bisa skip atau jump ke week tertentu

### Benefits of Manual Update:
1. ✅ **Deliberate action** - Admin harus ke database (more careful)
2. ✅ **Full control** - Bisa set ke week berapa saja (1, 2, 5, 10, etc.)
3. ✅ **Audit trail** - Database query log tracked
4. ✅ **Safer** - Less chance of accidental changes

---

## 🔄 Week Management Workflow

### Current System:
```
Week storage: settings table
├─ key: 'current_week'
└─ value: '2' (string)

Update method: Manual SQL
Display: Real-time dari database
```

### To Change Week:
1. **Determine target week** (e.g., Week 3)
2. **Update database**:
   ```sql
   UPDATE settings SET value = '3' WHERE key = 'current_week';
   ```
3. **Verify**:
   ```sql
   SELECT key, value FROM settings WHERE key = 'current_week';
   ```
4. **Refresh app** → Week updated everywhere

---

## 📊 Impact on System

### Components Affected:
- ✅ Admin Dashboard header → Shows correct week
- ✅ Admin Booking Dashboard → Filters by week
- ✅ Student Dashboard → Shows current week bookings
- ✅ Teacher Dashboard → Shows current week attendance
- ✅ All statistics → Calculated based on current week

### Data Integrity:
- ✅ No data loss
- ✅ All existing schedules remain
- ✅ All bookings remain
- ✅ All attendance records remain

**Only display changes** - no data modified

---

## 🧪 Testing

### Test Cases:
1. **Week display**:
   - [ ] Admin Dashboard shows "Batch 4 | Week 2"
   - [ ] No arrow button visible
   - [ ] Week number accurate

2. **Week filtering**:
   - [ ] Admin Booking shows Week 2 schedules
   - [ ] Student Dashboard shows Week 2 bookings
   - [ ] Teacher Dashboard shows Week 2 classes

3. **Database query**:
   - [ ] UPDATE query runs successfully
   - [ ] SELECT verify shows correct value
   - [ ] App reflects change after refresh

---

## 🚀 Deployment

### Status:
- ✅ Code committed (`92dd7df`)
- ✅ Pushed to GitHub main branch
- 🔄 Auto-deploying via Netlify
- ⬜ Database update needed

### Post-Deployment Steps:
1. **Wait for deployment** (~2-3 minutes)
2. **Update database**:
   ```sql
   UPDATE settings SET value = '2' WHERE key = 'current_week';
   ```
3. **Verify in production**:
   - Check Admin Dashboard header
   - Confirm no increment button
   - Verify week displays as "Week 2"

---

## 📋 Quick Commands

### Set Week to 2:
```sql
UPDATE settings SET value = '2' WHERE key = 'current_week';
```

### Set Week to 3:
```sql
UPDATE settings SET value = '3' WHERE key = 'current_week';
```

### Check Current Week:
```sql
SELECT key, value FROM settings WHERE key = 'current_week';
```

### Rollback to Week 1:
```sql
UPDATE settings SET value = '1' WHERE key = 'current_week';
```

---

## 🛡️ Safety Notes

### Best Practices:
1. **Always verify** before updating week
2. **Check schedules** exist for target week
3. **Inform users** before changing week (if mid-operation)
4. **Test first** in staging/local if available

### Don't:
- ❌ Change week during active booking time
- ❌ Skip weeks without creating schedules
- ❌ Change week without verifying data exists
- ❌ Change week during class hours

### Do:
- ✅ Change week on weekends or off-hours
- ✅ Verify schedules exist for new week
- ✅ Check no pending operations
- ✅ Document the change

---

## 📞 Troubleshooting

### Issue: Week not updating in app
**Solution**: Hard refresh browser (Ctrl+F5)

### Issue: Wrong week after update
**Solution**: 
```sql
-- Check value type (should be string)
SELECT key, value, pg_typeof(value) FROM settings WHERE key = 'current_week';

-- Update with correct format
UPDATE settings SET value = '2' WHERE key = 'current_week';
```

### Issue: Multiple current_week records
**Solution**:
```sql
-- Check duplicates
SELECT * FROM settings WHERE key = 'current_week';

-- Keep only one (delete others if needed)
DELETE FROM settings WHERE key = 'current_week' AND value != '2';
```

---

## 🎓 For Future Reference

### When to Update Week:
- Start of new week (e.g., every Monday)
- After batch transition
- After copy week operation
- When fixing week-related issues

### Update Checklist:
- [ ] Confirm current week completed
- [ ] Verify next week schedules ready
- [ ] Check no active bookings in progress
- [ ] Update database
- [ ] Verify app reflects change
- [ ] Monitor for issues

---

## Status

✅ **Increment button removed**
✅ **Code deployed**
⬜ **Database week update** (run `set_week_back_to_2.sql`)

**Next**: Update database to set week back to 2.
