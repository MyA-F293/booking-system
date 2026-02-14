# 🚀 Launch Guide - Fresh Start for Students

## Tujuan
Membersihkan semua bookings untuk launching pertama kali ke students, dengan backup lengkap untuk safety.

---

## 📋 Checklist Persiapan

- [ ] Proteksi database sudah aktif (triggers)
- [ ] Semua schedules sudah dibuat
- [ ] Teachers sudah di-assign
- [ ] Students sudah terdaftar
- [ ] Siap untuk clean bookings

---

## 🔄 Step-by-Step Process

### STEP 1: Backup Bookings (5 menit)

**File:** `database/LAUNCH_PREPARATION.sql`

1. Buka Supabase SQL Editor
2. Copy dan run **STEP 1** dari file
3. **COPY SEMUA OUTPUT** dan simpan sebagai `backup_bookings_before_launch.txt`
4. Simpan di tempat aman (Google Drive, local file, dll)

**Output yang harus disimpan:**
```
Backup Date: 2026-02-14
Total Bookings: 150
Confirmed Bookings: 145

INSERT INTO bookings (id, schedule_id, user_id, status, created_at, updated_at) VALUES
('id-1', 'schedule-1', 'user-1', 'confirmed', '2026-02-01', NULL),
('id-2', 'schedule-2', 'user-2', 'confirmed', '2026-02-02', NULL),
...
```

---

### STEP 2: Backup Schedules (2 menit)

1. Run **STEP 2** dari file
2. **COPY SEMUA OUTPUT** dan simpan sebagai `backup_schedules_before_launch.txt`

**Output yang harus disimpan:**
```
Oxford Class | saturday | phase2 | afternoon | Week 7 | Students: 11 | Sir Nasrullah
Harvard Class | monday | phase1 | afternoon | Week 7 | Students: 8 | Miss Tenri
...
```

---

### STEP 3: Check Summary (1 menit)

1. Run **STEP 3** dari file
2. **COPY OUTPUT** dan simpan sebagai `summary_before_clean.txt`

**Output:**
```
📊 BEFORE CLEAN SUMMARY
Total Schedules: 50
Total Bookings: 150
Confirmed Bookings: 145
Schedules with Students: 35
Total Students Enrolled: 280
Empty Schedules: 15
```

---

### STEP 4: Clean Bookings (1 menit)

**⚠️ WARNING: This will DELETE all bookings!**

1. Pastikan backup sudah disimpan (Step 1-3)
2. Uncomment code di **STEP 4**:

```sql
-- Delete all bookings
DELETE FROM bookings;

-- Verify deletion
SELECT 'Bookings deleted: ' || COUNT(*)::text as result FROM bookings;
```

3. Run query
4. **Expected output:** `Bookings deleted: 0`

---

### STEP 5: Reset Schedule Counts (1 menit)

1. Uncomment code di **STEP 5**:

```sql
-- Reset all counts to 0
UPDATE schedules
SET current_students = 0;

-- Verify reset
SELECT 
    'Schedules reset: ' || COUNT(*)::text as result,
    'Total students: ' || SUM(current_students)::text as total
FROM schedules;
```

2. Run query
3. **Expected output:** `Total students: 0`

---

### STEP 6: Verify Clean State (1 menit)

1. Run **STEP 6** dari file
2. Check output:

**Expected:**
```
✅ AFTER CLEAN VERIFICATION
Total Bookings: 0 (should be 0)
Total Students in Schedules: 0 (should be 0)
Schedules Ready: 50
Teachers Assigned: 45
Protection Active: YES ✅
```

---

## ✅ Final Checklist

Sebelum launch ke students, pastikan:

- [x] Backup bookings saved ✅
- [x] Backup schedules saved ✅
- [x] Summary saved ✅
- [x] Bookings deleted (count = 0) ✅
- [x] Schedule counts reset (all = 0) ✅
- [x] Verification passed ✅
- [x] Protection triggers active ✅
- [x] Teachers assigned ✅
- [x] **READY FOR LAUNCH!** 🚀

---

## 📊 What Happens After Clean

### What Stays:
- ✅ **Schedules** - All classes, days, times, weeks
- ✅ **Teachers** - All assignments intact
- ✅ **Students** - All user accounts
- ✅ **Classes** - All class data
- ✅ **Protection** - Triggers active (max 10 per class)

### What Gets Cleaned:
- ❌ **Bookings** - All deleted (fresh start)
- ❌ **Schedule Counts** - Reset to 0

### Result:
- 🚀 Fresh system ready for students
- 📚 All schedules available for booking
- 👥 Students can start booking classes
- 🛡️ Protection active (max 10 per class)
- 🔄 Auto-update counts when students book

---

## 🆘 Restore Instructions (If Needed)

Jika perlu restore bookings:

### Option 1: From Backup File
```sql
-- 1. Open: backup_bookings_before_launch.txt
-- 2. Copy all INSERT statements
-- 3. Paste and run in Supabase SQL Editor
-- 4. Verify:
SELECT COUNT(*) FROM bookings;
```

### Option 2: Manual Restore
```sql
-- Use the backup INSERT statements you saved
INSERT INTO bookings (id, schedule_id, user_id, status, created_at, updated_at) VALUES
('id-1', 'schedule-1', 'user-1', 'confirmed', '2026-02-01', NULL),
('id-2', 'schedule-2', 'user-2', 'confirmed', '2026-02-02', NULL);
-- ... etc

-- Then recalculate counts
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
    AND b.status = 'confirmed'
);
```

---

## 🧪 Test After Launch

### Test 1: Student Can Book
1. Login sebagai student
2. Pilih schedule
3. Book class
4. **Expected:** Success, count = 1

### Test 2: Capacity Limit Works
1. Book 10 students ke satu schedule
2. Try to book 11th student
3. **Expected:** Error "Class is full!"

### Test 3: Count Updates Automatically
1. Book student → count +1
2. Remove student → count -1
3. **Expected:** Count always accurate

---

## 📁 Files Created

1. **`LAUNCH_PREPARATION.sql`** - Main script untuk backup & clean
2. **`LAUNCH_GUIDE.md`** - Panduan ini
3. **Backup files** (yang Anda simpan):
   - `backup_bookings_before_launch.txt`
   - `backup_schedules_before_launch.txt`
   - `summary_before_clean.txt`

---

## 🎯 Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Backup bookings |
| 2 | 2 min | Backup schedules |
| 3 | 1 min | Check summary |
| 4 | 1 min | Clean bookings |
| 5 | 1 min | Reset counts |
| 6 | 1 min | Verify |
| **Total** | **11 min** | **Ready to launch!** |

---

## 🚀 Launch Day Checklist

**Morning (Before Students Access):**
- [ ] Run backup (Step 1-3)
- [ ] Clean bookings (Step 4-5)
- [ ] Verify clean state (Step 6)
- [ ] Test booking as student
- [ ] Announce to students: "System is ready!"

**During Launch:**
- [ ] Monitor bookings in real-time
- [ ] Check for errors
- [ ] Verify capacity limits working
- [ ] Verify counts updating correctly

**After Launch:**
- [ ] Check total bookings
- [ ] Verify no over-capacity
- [ ] Check for any errors
- [ ] Celebrate! 🎉

---

## ✅ Success Criteria

System is ready when:
- ✅ All bookings = 0
- ✅ All schedule counts = 0
- ✅ Protection triggers active
- ✅ Teachers assigned
- ✅ Students can book
- ✅ Capacity limit enforced
- ✅ Counts update automatically

**YOU'RE READY TO LAUNCH!** 🚀
