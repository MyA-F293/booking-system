# 🎯 QUICK ACTION CARD - Fix Overcapacity

## ⚡ DO THIS NOW (15 minutes total)

---

## STEP 1: Fix Overcapacity (5 minutes) 🚨

```
File: database/AUTO_SPLIT_SIMPLE.sql ⭐ (Works in Supabase!)
Action: Copy → Paste in Supabase SQL Editor → Run
Result: All classes ≤ 10 students
```

**What happens:**
- Oxford Friday: 18 → 10 (Afternoon) + 8 (Evening)
- Oxford Tuesday: 17 → 10 (Afternoon) + 7 (Evening)
- Harvard Friday: 14 → 10 (Afternoon) + 4 (Evening)
- Harvard Monday: 11 → 10 (Afternoon) + 1 (Evening)

**Verify:**
```sql
-- Should return 0 rows
SELECT c.name, s.day, s.time_slot, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9 AND s.current_students > 10;
```

---

## STEP 2: Prevent Future Duplicates (10 minutes) 🛡️

```
File: database/PREVENT_DUPLICATE_SCHEDULES.sql
Action: Copy → Paste in Supabase SQL Editor → Run
Result: 5 layers of protection installed
```

**What happens:**
- ✅ Unique constraint installed
- ✅ Trigger to prevent duplicates
- ✅ Trigger to auto-set batch
- ✅ Index for performance
- ✅ Frontend validation (already active)

**Verify:**
```sql
-- Should show all protections ACTIVE
SELECT 'Unique Constraint' as type, conname as name
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass 
    AND conname = 'unique_schedule_no_batch';
```

---

## STEP 3: Notify Students (Manual) 📧

```
Subject: Update Jadwal Kelas Minggu Ini

Halo,

Jadwal kelas minggu ini telah diupdate.
Silakan cek jadwal Anda di portal.

Jika jadwal tidak sesuai, hubungi admin untuk pindah.

Terima kasih!
```

---

## STEP 4: Handle Requests (As needed) 🔄

If students want to change schedules:

**Guide:** `CARA_PINDAH_JADWAL_SISWA.md`

**Quick steps:**
1. Find student booking
2. Find target schedule
3. Move booking
4. Update current_students
5. Verify

---

## 📊 Expected Final Result

**Week 9 Schedules:**
- Oxford Friday Afternoon: 10 ✅
- Oxford Friday Evening: 8 ✅
- Oxford Tuesday Afternoon: 10 ✅
- Oxford Tuesday Evening: 7 ✅
- Harvard Friday Afternoon: 10 ✅
- Harvard Friday Evening: 4 ✅
- Harvard Monday Afternoon: 10 ✅
- Harvard Monday Evening: 1 ✅

**Total: 8 schedules, all ≤ 10 students** ✅

---

## ✅ Checklist

- [ ] Run `AUTO_SPLIT_NOW.sql`
- [ ] Verify no overcapacity (query above)
- [ ] Run `PREVENT_DUPLICATE_SCHEDULES.sql`
- [ ] Verify protections active (query above)
- [ ] Notify students
- [ ] Handle schedule change requests (if any)

---

## 📁 Files to Use

1. ⚡ `database/AUTO_SPLIT_NOW.sql` - RUN FIRST
2. 🛡️ `database/PREVENT_DUPLICATE_SCHEDULES.sql` - RUN SECOND
3. 📖 `RUN_THIS_NOW.md` - Detailed guide
4. 🔄 `CARA_PINDAH_JADWAL_SISWA.md` - Manual move guide

---

## ⚠️ Important Notes

- Siswa yang dipindahkan = siswa yang booking terakhir
- Semua siswa tetap di batch 1
- Tidak ada data yang hilang
- Siswa akan otomatis lihat jadwal baru

---

## 🎉 After This

**All issues resolved!**
- ✅ No more overcapacity
- ✅ No more duplicate schedules
- ✅ Batch auto-set from first student
- ✅ Database protected with triggers

**System is production-ready!** 🚀

---

**Total Time: 15 minutes**
**Difficulty: Easy (copy-paste-run)**
**Risk: Low (all data preserved)**

**LET'S GO!** 💪
