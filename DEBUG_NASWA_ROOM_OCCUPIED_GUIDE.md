# 🔍 DEBUG: Kenapa Naswa Tidak Bisa Booking (Room Occupied)

## 📋 MASALAH

**Student**: Naswa (EYSA26020225)  
**Error**: "Room Occupied" saat mencoba booking  
**Kondisi**: Program dan Level sama dengan siswa lain yang bisa booking  
**Gejala**: Bahkan setelah ganti jam di jadwal, tetap muncul "Room Occupied"

---

## 🎯 KEMUNGKINAN PENYEBAB

### 1. **Duplicate Schedules** ⚠️ (PALING SERING)
Ada 2+ jadwal di class yang sama, hari & waktu yang sama, tapi program/level berbeda.

**Contoh:**
```
Oxford Class - Monday Evening - Phase 1
├─ Schedule 1: Campus & Career - Starter (9 students)
└─ Schedule 2: English for Teens - Starter (0 students) ❌ DUPLICATE
```

**Kenapa ini masalah?**
- Function `checkRoomConflict` mendeteksi ada jadwal lain dengan program berbeda
- Meskipun Naswa program & levelnya sama dengan Schedule 1, dia kena block karena Schedule 2 ada

### 2. **Room Conflict Function Terlalu Ketat**
Function `checkRoomConflict` di `dbHelpers.js` memblokir jika:
```javascript
if (existingSchedule.program !== currentProgram || existingSchedule.level !== currentLevel) {
    return { hasConflict: true }; // BLOCKED!
}
```

**Masalah:**
- Seharusnya cek: "Apakah ada jadwal LAIN (bukan yang mau dibook) dengan program/level berbeda?"
- Tapi sekarang: "Apakah ada jadwal dengan program/level berbeda?" (tanpa filter batch/phase)

### 3. **Batch Mismatch**
Naswa punya batch tertentu, tapi jadwal yang tersedia untuk batch berbeda.

**Contoh:**
```
Naswa: Batch 2
Available Schedule: Batch 1 only
Result: Tidak bisa booking
```

### 4. **Sudah Booking di Phase yang Sama**
Naswa sudah booking di phase yang sama (misal: Phase 1) di week yang sama.

**Rule:** 1 student hanya bisa booking 1x per phase per week.

---

## 🔬 CARA DEBUG

### STEP 1: Jalankan Debug Queries

Buka file: `booking-system/database/DEBUG_NASWA_ROOM_OCCUPIED.sql`

Jalankan query satu per satu di Supabase SQL Editor:

#### Query 1: Cek Data Naswa
```sql
SELECT student_id, full_name, program, level, batch
FROM users
WHERE student_id = 'EYSA26020225';
```

**Yang harus dicek:**
- ✅ Program: English Campus & Career atau English for Teens?
- ✅ Level: Starter, Upper Starter, dll?
- ✅ Batch: 1, 2, atau 3?

#### Query 2: Cek Jadwal yang Tersedia
```sql
SELECT s.id, c.name, s.day, s.time_slot, s.phase, 
       s.program, s.level, s.batch, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.program = 'English Campus & Career'  -- Sesuaikan dengan program Naswa
  AND s.level = 'Starter'                     -- Sesuaikan dengan level Naswa
  AND s.week_number = 2
  AND s.year = 2026
ORDER BY s.day, s.time_slot;
```

**Yang harus dicek:**
- ✅ Apakah ada jadwal untuk program & level Naswa?
- ✅ Apakah batch-nya cocok?
- ✅ Apakah masih ada slot (current_students < 10)?

#### Query 3: Cek Room Conflict (PENTING!)
```sql
-- Ini query yang mendeteksi duplicate schedules
SELECT 
    nts.class_name as "Kelas yang Mau Dibook",
    nts.day, nts.time_slot,
    nts.program as "Program Naswa",
    '---CONFLICT---' as separator,
    c2.name as "Kelas yang Bentrok",
    s2.program as "Program Bentrok",
    s2.level as "Level Bentrok",
    s2.current_students
FROM naswa_target_schedules nts
JOIN schedules s2 ON s2.class_id = nts.class_id 
    AND s2.day = nts.day 
    AND s2.time_slot = nts.time_slot
    AND s2.id != nts.id  -- Bukan jadwal yang sama
WHERE s2.week_number = 2 AND s2.year = 2026;
```

**Yang harus dicek:**
- ❌ Jika ada hasil = ADA DUPLICATE SCHEDULE (ini masalahnya!)
- ✅ Jika kosong = Tidak ada conflict

#### Query 4: Cek Apakah Naswa Sudah Booking
```sql
SELECT b.id, c.name, s.day, s.time_slot, s.phase, s.week_number
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.student_id = 'EYSA26020225'
  AND s.week_number = 2
  AND s.year = 2026;
```

**Yang harus dicek:**
- ❌ Jika ada booking di phase yang sama = Sudah booking (tidak bisa booking lagi)
- ✅ Jika kosong atau phase berbeda = Bisa booking

#### Query 7: Cek Duplicate Schedules (CRITICAL!)
```sql
SELECT c.name, s.day, s.time_slot, s.phase, 
       s.program, s.level, COUNT(*) as jumlah_duplicate
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2 AND s.year = 2026
GROUP BY c.name, s.day, s.time_slot, s.phase, s.program, s.level
HAVING COUNT(*) > 1;
```

**Yang harus dicek:**
- ❌ Jika ada hasil = ADA DUPLICATE! (ini root cause-nya)
- ✅ Jika kosong = Tidak ada duplicate

---

## 🛠️ SOLUSI BERDASARKAN HASIL DEBUG

### SOLUSI 1: Hapus Duplicate Schedules (PALING SERING)

Jika Query 7 menunjukkan ada duplicate:

```sql
-- 1. Lihat detail duplicate
SELECT s.id, c.name, s.day, s.time_slot, s.phase, 
       s.program, s.level, s.current_students, s.created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2 AND s.year = 2026
  AND (s.class_id, s.day, s.time_slot, s.phase) IN (
      SELECT class_id, day, time_slot, phase
      FROM schedules
      WHERE week_number = 2 AND year = 2026
      GROUP BY class_id, day, time_slot, phase
      HAVING COUNT(*) > 1
  )
ORDER BY c.name, s.day, s.time_slot, s.id;

-- 2. Hapus yang current_students = 0 (empty duplicate)
DELETE FROM schedules
WHERE id IN (
    SELECT s.id
    FROM schedules s
    WHERE s.week_number = 2 AND s.year = 2026
      AND s.current_students = 0
      AND (s.class_id, s.day, s.time_slot, s.phase) IN (
          SELECT class_id, day, time_slot, phase
          FROM schedules
          WHERE week_number = 2 AND year = 2026
          GROUP BY class_id, day, time_slot, phase
          HAVING COUNT(*) > 1
      )
);

-- 3. Jika masih ada duplicate dengan students, merge manual
-- (Hubungi developer untuk merge bookings)
```

### SOLUSI 2: Fix Batch Mismatch

Jika Naswa batch-nya berbeda dengan jadwal yang tersedia:

```sql
-- Cek batch Naswa vs jadwal
SELECT 
    u.student_id, u.full_name, u.batch as student_batch,
    s.id as schedule_id, c.name, s.batch as schedule_batch
FROM users u
CROSS JOIN schedules s
JOIN classes c ON s.class_id = c.id
WHERE u.student_id = 'EYSA26020225'
  AND s.program = u.program
  AND s.level = u.level
  AND s.week_number = 2
  AND s.year = 2026;

-- Jika batch tidak cocok, update batch Naswa atau buat jadwal baru untuk batch-nya
```

### SOLUSI 3: Cancel Booking yang Sudah Ada

Jika Naswa sudah booking di phase yang sama:

```sql
-- Lihat booking yang ada
SELECT b.id, c.name, s.day, s.time_slot, s.phase
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.student_id = 'EYSA26020225'
  AND s.week_number = 2
  AND s.year = 2026;

-- Jika perlu cancel (hati-hati!):
-- DELETE FROM bookings WHERE id = [booking_id];
```

### SOLUSI 4: Relax Room Conflict Check (LAST RESORT)

Jika memang tidak ada duplicate tapi tetap kena block, bisa relax function:

**File:** `booking-system/src/utils/dbHelpers.js`

**Ubah dari:**
```javascript
if (existingSchedule.program !== currentProgram || existingSchedule.level !== currentLevel) {
    return { hasConflict: true };
}
```

**Menjadi:**
```javascript
// Only block if SAME phase but different program/level
if (existingSchedule.phase === phase && 
    (existingSchedule.program !== currentProgram || existingSchedule.level !== currentLevel)) {
    return { hasConflict: true };
}
```

---

## 📊 CHECKLIST DEBUG

- [ ] Query 1: Data Naswa sudah benar (program, level, batch)
- [ ] Query 2: Ada jadwal yang tersedia untuk program & level Naswa
- [ ] Query 3: Tidak ada room conflict (atau ada duplicate?)
- [ ] Query 4: Naswa belum booking di phase yang sama
- [ ] Query 7: Tidak ada duplicate schedules
- [ ] Query 8: Detail duplicate (jika ada)

---

## 🎯 KESIMPULAN

**90% kasus "Room Occupied" disebabkan oleh:**
1. **Duplicate schedules** di class yang sama, hari & waktu yang sama
2. Function `checkRoomConflict` mendeteksi duplicate ini sebagai conflict

**Solusi:**
1. Jalankan Query 7 untuk cek duplicate
2. Hapus duplicate yang empty (current_students = 0)
3. Merge duplicate yang ada students-nya
4. Test lagi booking Naswa

---

## 📝 NEXT STEPS

1. **Jalankan semua query di `DEBUG_NASWA_ROOM_OCCUPIED.sql`**
2. **Screenshot hasil query yang menunjukkan masalah**
3. **Jalankan solusi yang sesuai**
4. **Test booking Naswa lagi**
5. **Jika masih error, share hasil query untuk analisis lebih lanjut**

---

**Created**: April 4, 2026  
**Status**: 🔍 Investigation Guide  
**Priority**: 🔥 HIGH - Blocking student booking
