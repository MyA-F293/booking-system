# 🚀 Quick Install - Database Protection

## ⚡ 3-Step Installation (5 minutes)

### Step 1: Check Duplicates (30 seconds)

Copy-paste this in Supabase SQL Editor:

```sql
SELECT 
    c.name, s.day, s.time_slot, s.phase, s.week_number,
    COUNT(*) as count
FROM schedules s
JOIN classes c ON s.class_id = c.id
GROUP BY s.class_id, c.name, s.day, s.time_slot, s.phase, s.week_number, s.year
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows

**If you see rows:** Run `database/COMPREHENSIVE_DUPLICATE_FIX.sql` first

---

### Step 2: Install Protection (2 minutes)

1. Open Supabase SQL Editor
2. Open file: `database/PREVENT_DUPLICATE_SCHEDULES.sql`
3. Copy ALL content
4. Paste in SQL Editor
5. Click "Run"

**Expected Output:**
```
✅ Unique constraint created
✅ Triggers created
✅ Index created
✅ Protection active
```

---

### Step 3: Verify (1 minute)

Copy-paste this in Supabase SQL Editor:

```sql
-- Should return 4 rows (1 constraint + 2 triggers + 1 index)
SELECT 'Constraint' as type, conname as name FROM pg_constraint 
WHERE conrelid = 'schedules'::regclass AND conname = 'unique_schedule_no_batch'
UNION ALL
SELECT 'Trigger', trigger_name FROM information_schema.triggers 
WHERE trigger_name LIKE '%schedule%'
UNION ALL
SELECT 'Index', indexname FROM pg_indexes 
WHERE indexname = 'idx_schedules_unique_combo';
```

**Expected:** 4 rows showing all protections

---

## ✅ Done!

You now have:
- 🛡️ Unique constraint (prevents duplicates)
- 🛡️ Trigger validation (extra check)
- 🛡️ Auto-set batch (from first student)
- 🛡️ Performance index (fast queries)

**Total Protection:** 5 layers (4 database + 1 frontend)

---

## 🧪 Quick Test (Optional)

Try creating duplicate schedule in admin dashboard:
1. Create schedule: Oxford Class, Monday, Afternoon, Phase1, Week 10
2. Try creating same schedule again
3. Should show error: "Schedule already exists!"

✅ If error shows → Protection working!
❌ If no error → Check Step 3 verification

---

## 📝 Files

- `database/PREVENT_DUPLICATE_SCHEDULES.sql` - Main installation script
- `database/CHECK_REMAINING_DUPLICATES.sql` - Check for duplicates
- `INSTALL_DATABASE_PROTECTION.md` - Detailed guide
- `RUN_DATABASE_PROTECTION_NOW.md` - This quick guide

---

## ⚠️ Important

- Run this AFTER fixing overcapacity
- Run this AFTER cleaning duplicates
- Backup is optional but recommended
- Can be rolled back if needed

---

## 🆘 Need Help?

**Error: "duplicate key violates constraint"**
→ You have duplicates. Run `COMPREHENSIVE_DUPLICATE_FIX.sql` first

**Error: "constraint already exists"**
→ Protection already installed. Check Step 3 verification

**Trigger not working**
→ Check triggers are enabled in Step 3

---

**Ready?** Go to Step 1! ⬆️
