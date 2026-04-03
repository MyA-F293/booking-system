# 🚀 JALANKAN 2 QUERY INI SEKARANG

## ✅ STATUS: READY TO RUN

Semua SQL sudah diperbaiki dan siap dijalankan!

---

## 📋 STEP 1: Hapus Schedule Konflik

**File:** `booking-system/database/DELETE_OXFORD_UPPER_STARTER_SUNDAY_EVENING.sql`

**Tujuan:** Hapus Oxford Upper Starter Sunday Evening Week 2 (1 student) yang konflik dengan Oxford Starter Sunday Evening Week 2 (7 students)

**Cara:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `DELETE_OXFORD_UPPER_STARTER_SUNDAY_EVENING.sql`
3. Klik **RUN**
4. Lihat hasil verification - harus 0 schedules remaining

**Expected Result:**
```
✅ VERIFICATION
remaining_schedules: 0

📊 REMAINING OXFORD SUNDAY EVENING
- Oxford Starter Sunday Evening (7 students) ✅
```

---

## 📋 STEP 2: Install Room Conflict Protection

**File:** `booking-system/database/INSTALL_ROOM_CONFLICT_PROTECTION_COMPLETE.sql`

**Tujuan:** Install trigger yang prevent 1 ruangan dipakai 2 schedule berbeda di waktu yang sama

**Cara:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `INSTALL_ROOM_CONFLICT_PROTECTION_COMPLETE.sql`
3. Klik **RUN**
4. Lihat hasil verification - semua harus ✅

**Expected Result:**
```
✅ TRIGGER STATUS
trigger_name: trigger_prevent_room_conflict_complete
status: ✅ ENABLED

✅ CONSTRAINT STATUS
constraint_name: schedules_unique_complete
status: ACTIVE

✅ FINAL CHECK
trigger_active: 1
constraint_active: 1
function_exists: 1
conclusion: ✅ ALL PROTECTIONS ACTIVE!
```

---

## 🧪 STEP 3: TEST

### Test 1: Room Conflict (HARUS BLOCKED)
```
Coba book: Oxford Upper Starter Sunday Evening Week 2
Expected: ❌ ERROR "Room conflict! Oxford Class is already occupied..."
```

### Test 2: Different Time (HARUS ALLOWED)
```
Coba book: Oxford Upper Starter Sunday Afternoon Week 2
Expected: ✅ SUCCESS
```

### Test 3: Different Room (HARUS ALLOWED)
```
Coba book: Tsinghua Starter Sunday Evening Week 2
Expected: ✅ SUCCESS
```

---

## 🎯 PROTECTION LOGIC

### Trigger Cek (Room Conflict):
- ✅ class_id (Oxford, Tsinghua, Harvard)
- ✅ day (sunday, monday, ...)
- ✅ time_slot (morning, afternoon, evening)
- ✅ phase (phase1, phase2, recap)
- ✅ week_number (1, 2, 3, ...)
- ✅ year (2026)

**TIDAK peduli:** program, level, batch (karena ruangan fisik cuma 1!)

### Constraint Cek (Exact Duplicate):
- ✅ Semua field termasuk program, level, batch

---

## ✅ CHECKLIST

- [ ] STEP 1: Jalankan DELETE query
- [ ] Verify: 0 schedules remaining
- [ ] STEP 2: Jalankan INSTALL query
- [ ] Verify: All protections active
- [ ] STEP 3: Test room conflict (harus blocked)
- [ ] STEP 4: Test different time (harus allowed)
- [ ] STEP 5: Test different room (harus allowed)

---

## 🎉 SETELAH SELESAI

Sistem akan protected dengan benar:
- ✅ 1 ruangan tidak bisa dipakai 2 schedule di waktu yang sama
- ✅ Error message jelas dan helpful
- ✅ User harus pilih waktu lain jika room conflict
- ✅ Semua field dicek: class_id, day, time_slot, phase, week, program, level, batch

**READY TO RUN!** 🚀
