# 🚀 JALANKAN 3 QUERY INI BERURUTAN

## ✅ URUTAN YANG BENAR

Jalankan query ini **BERURUTAN** di Supabase SQL Editor:

---

## 📋 QUERY 1: Drop Trigger Lama

**File:** `booking-system/database/DROP_ALL_TRIGGERS_CLEAN.sql`

**Tujuan:** Hapus semua trigger & function lama untuk clean slate

**Cara:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `DROP_ALL_TRIGGERS_CLEAN.sql`
3. Klik **RUN**
4. Lihat hasil verification

**Expected Result:**
```
✅ REMAINING TRIGGERS
trigger_count: 0

✅ REMAINING FUNCTIONS
function_count: 0

✅ CLEAN SLATE READY!
status: All old triggers and functions removed
```

---

## 📋 QUERY 2: Hapus Schedule Konflik

**File:** `booking-system/database/DELETE_OXFORD_UPPER_STARTER_SUNDAY_EVENING.sql`

**Tujuan:** Hapus Oxford Upper Starter Sunday Evening Week 2 yang konflik

**Cara:**
1. Copy-paste isi file `DELETE_OXFORD_UPPER_STARTER_SUNDAY_EVENING.sql`
2. Klik **RUN**
3. Lihat hasil verification

**Expected Result:**
```
✅ VERIFICATION
remaining_schedules: 0

📊 REMAINING OXFORD SUNDAY EVENING
- Oxford Starter Sunday Evening (7 students) ✅
```

---

## 📋 QUERY 3: Install Room Conflict Protection

**File:** `booking-system/database/INSTALL_ROOM_CONFLICT_PROTECTION_COMPLETE.sql`

**Tujuan:** Install trigger baru yang prevent room conflict

**Cara:**
1. Copy-paste isi file `INSTALL_ROOM_CONFLICT_PROTECTION_COMPLETE.sql`
2. Klik **RUN**
3. Lihat hasil verification

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

## 🧪 STEP 4: TEST

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

## ✅ CHECKLIST

- [ ] QUERY 1: Drop all triggers (verify: 0 triggers remaining)
- [ ] QUERY 2: Delete conflicting schedule (verify: 0 schedules remaining)
- [ ] QUERY 3: Install new protection (verify: all protections active)
- [ ] TEST 1: Room conflict blocked ❌
- [ ] TEST 2: Different time allowed ✅
- [ ] TEST 3: Different room allowed ✅

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

## 🎉 SETELAH SELESAI

Sistem akan protected dengan benar:
- ✅ 1 ruangan tidak bisa dipakai 2 schedule di waktu yang sama
- ✅ Error message jelas dan helpful
- ✅ User harus pilih waktu lain jika room conflict
- ✅ Semua field dicek: class_id, day, time_slot, phase, week, program, level, batch

**READY TO RUN!** 🚀
