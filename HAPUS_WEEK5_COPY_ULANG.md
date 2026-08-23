# Hapus Week 5 & Copy Ulang dari Week 4

## 🎯 Strategi

Daripada delete 2 schedule satu per satu, lebih aman **hapus semua Week 5** lalu **copy ulang** dari Week 4 yang benar.

### Kenapa Strategi Ini?
✅ **Lebih bersih** - Tidak ada resiko schedule yang missed
✅ **Lebih aman** - Week 4 adalah source of truth yang benar
✅ **Lebih cepat** - 1 operasi vs hunting 2 schedule
✅ **Guaranteed correct** - Hasil pasti 71 schedules yang match Week 4

---

## ⚠️ WARNING: Data Loss Risk

### Data yang Akan Terhapus:
1. **Semua schedules Week 5** (73 schedules)
2. **Semua bookings Week 5** (jika ada siswa yang sudah booking)
3. **Semua attendance Week 5** (jika ada yang sudah diisi)

### Kapan Aman Dilakukan?
✅ Week 5 belum dibuka untuk booking
✅ Belum ada siswa yang booking Week 5
✅ Belum ada attendance record Week 5
✅ Week 5 baru saja di-copy (fresh)

### Kapan TIDAK Aman?
❌ Sudah banyak siswa booking Week 5
❌ Sudah ada attendance data Week 5
❌ Week 5 sudah berjalan (current week)

---

## 📋 Execution Steps

File: **`database/delete_all_week5_recopy.sql`**

### STEP 1: Backup Count
Check current state:
- Week 4: 71 schedules (correct)
- Week 5: 73 schedules (akan dihapus)

### STEP 2: Check Bookings Week 5
**CRITICAL CHECK!**
- Count total bookings
- Count unique students

**Decision:**
- If **0 bookings** → SAFE to proceed ✅
- If **> 0 bookings** → **DON'T DELETE!** ❌ Use alternative method

### STEP 3: Check Attendance Week 5
**CRITICAL CHECK!**
- Count attendance records

**Decision:**
- If **0 attendance** → SAFE to proceed ✅
- If **> 0 attendance** → **DON'T DELETE!** ❌ Data loss!

### STEP 4: Delete Bookings (if any)
Cascade delete bookings untuk Week 5.

### STEP 5: Delete Attendance (if any)
Cascade delete attendance untuk Week 5.

### STEP 6: Delete All Week 5 Schedules
Hapus 73 schedules.

### STEP 7: Verify Clean
Confirm Week 5 = 0 schedules.

### STEP 8: Copy Week 4 → 5
Run RPC `smart_copy_week(4, 5, 2026)`.

### STEP 9: Verify Count
Check hasil:
- Week 4: 71 schedules ✅
- Week 5: 71 schedules ✅

### STEP 10: Verify Saturday Phase2
Confirm Saturday phase2 distribution sama.

---

## 🔄 Alternative: Selective Delete

Jika Week 5 sudah punya bookings/attendance:

### Option A: Delete 2 Schedule Saja
File: `database/final_delete_extra_schedules.sql`
- Only delete 2 extra schedules
- Keep existing bookings/attendance
- Manual fix, tapi safe

### Option B: Move Bookings First
1. Identify bookings di 2 extra schedules
2. Move bookings ke schedule yang correct
3. Delete 2 extra schedules
4. Verify no data loss

---

## 📊 Expected Results

### Before:
```
Week 4: 71 schedules ✅
Week 5: 73 schedules ❌ (2 extra)
```

### After:
```
Week 4: 71 schedules ✅
Week 5: 71 schedules ✅ (clean copy)
Saturday phase2: Sama antara Week 4 dan 5 ✅
```

---

## 🚨 Rollback Plan

Jika terjadi masalah setelah delete:

### Immediate Rollback:
```sql
-- Re-copy from Week 4
SELECT smart_copy_week(4, 5, 2026);
```

### Full Restore:
Jika ada data bookings/attendance yang hilang:
1. Check backup (jika ada)
2. Manual re-entry
3. Contact affected students

---

## ✅ Pre-Execution Checklist

Sebelum jalankan Step 4-6 (DELETE):

- [ ] Step 2 result = **0 bookings** (or acceptable loss)
- [ ] Step 3 result = **0 attendance** (or acceptable loss)
- [ ] Confirm Week 5 is future week (not current)
- [ ] Backup schedules table (optional but recommended)
- [ ] Admin approval for data deletion

---

## 🎯 Decision Tree

```
Check Step 2 (Bookings)?
├─ 0 bookings → ✅ PROCEED to delete
└─ >0 bookings → Ask:
   ├─ Acceptable to lose? → ✅ PROCEED with caution
   └─ Not acceptable? → ❌ Use Alternative (selective delete)

Check Step 3 (Attendance)?
├─ 0 attendance → ✅ PROCEED to delete
└─ >0 attendance → ❌ STOP! Use Alternative method
```

---

## Status

🟡 **Ready to Execute**

**Jalankan Step 1-3 DULU** untuk assess safety before delete!
