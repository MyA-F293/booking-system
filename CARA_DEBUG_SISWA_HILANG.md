# 🔍 Cara Debug Siswa Hilang Setelah Copy Week

## 📋 Problem Statement

**Yang Terjadi:**
- Kamu pilih siswa di Rabu untuk pindah ke Kamis-Sabtu
- Tapi pas cek jadwal, namanya tidak muncul
- Padahal di week 2 masih ada booking-nya

**Kemungkinan Penyebab:**
1. ❌ Booking tidak ter-copy dari week 1 ke week 2
2. ❌ Siswa ter-copy tapi ke hari yang salah
3. ❌ Jadwal Kamis-Sabtu tidak ter-create di week 2
4. ❌ Booking status bukan 'confirmed'
5. ❌ Schedule tidak is_open

---

## 🎯 Quick Investigation

### Step 1: Jalankan Debug Query

Copy paste ke Supabase SQL Editor:

```sql
-- File: database/DEBUG_MISSING_STUDENT_AFTER_COPY.sql
```

Atau jalankan 6 query di file tersebut satu per satu.

---

## 📊 Interpretasi Hasil

### TEST 1: Siswa Hilang Total

**Jika ada data:**
```
full_name       | student_id    | class_name | day       | time_slot
----------------|---------------|------------|-----------|----------
Andi            | EYSA26020001  | Oxford     | wednesday | afternoon
Budi            | EYSA26020002  | Harvard    | wednesday | evening
```

**Artinya:** Siswa ini ada di week 1 tapi TIDAK ada di week 2 sama sekali.

**Solusi:** Re-copy bookings untuk siswa ini.

---

### TEST 2: Siswa Pindah Hari

**Jika ada data:**
```
full_name | week1_day  | week2_day | week1_class | week2_class
----------|------------|-----------|-------------|------------
Andi      | wednesday  | thursday  | Oxford      | Oxford
Budi      | wednesday  | friday    | Harvard     | Harvard
```

**Artinya:** Siswa pindah hari setelah copy week.

**Solusi:** 
- Jika DISENGAJA (kamu yang pindahkan) → OK
- Jika TIDAK DISENGAJA → Bug di copy week function

---

### TEST 3 & 4: List Siswa

Bandingkan:
- TEST 3: Siswa di Rabu week 1
- TEST 4: Siswa di Kamis-Sabtu week 2

**Jika siswa di TEST 3 tidak muncul di TEST 4:**
→ Siswa tidak ter-copy ke week 2

---

### TEST 5: Jadwal Kosong

**Jika ada data:**
```
class_name | day      | time_slot | current_students | is_open
-----------|----------|-----------|------------------|--------
Oxford     | thursday | afternoon | 0                | true
Harvard    | friday   | evening   | 0                | true
```

**Artinya:** Ada jadwal tapi tidak ada siswa.

**Possible Reasons:**
1. Jadwal baru dibuat manual (belum ada siswa)
2. Booking tidak ter-copy
3. Siswa cancel booking

---

### TEST 6: Summary Per Hari

**Expected Pattern:**
```
week_number | day       | total_students | total_schedules
------------|-----------|----------------|----------------
1           | wednesday | 50             | 10
2           | wednesday | 50             | 10
2           | thursday  | 15             | 3
2           | friday    | 15             | 3
2           | saturday  | 20             | 4
```

**Jika total_students week 2 < week 1:**
→ Ada siswa yang hilang setelah copy

---

## 🔧 Solusi Berdasarkan Hasil

### Scenario 1: Siswa Hilang Total (TEST 1 ada data)

**Penyebab:** Copy week function tidak copy bookings dengan benar.

**Solusi:**
1. Backup data dulu
2. Re-copy bookings untuk siswa yang hilang
3. Atau re-run copy week function

```sql
-- Manual copy booking untuk siswa tertentu
INSERT INTO bookings (schedule_id, user_id, status, booking_date)
SELECT 
  s2.id,
  b1.user_id,
  'confirmed',
  NOW()
FROM bookings b1
JOIN schedules s1 ON b1.schedule_id = s1.id
JOIN schedules s2 ON s2.class_id = s1.class_id 
  AND s2.day = s1.day 
  AND s2.time_slot = s1.time_slot
  AND s2.week_number = 2
WHERE s1.week_number = 1
  AND b1.user_id = '[USER_ID_YANG_HILANG]'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b2 
    WHERE b2.user_id = b1.user_id 
      AND b2.schedule_id = s2.id
  );
```

---

### Scenario 2: Siswa Pindah Hari (TEST 2 ada data)

**Jika TIDAK DISENGAJA:**

**Penyebab:** Bug di copy week function (salah mapping).

**Solusi:** Install fix dari `FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`

**Jika DISENGAJA (kamu yang pindahkan):**

Ini normal behavior. Kamu memang pindahkan siswa dari Rabu ke Kamis-Sabtu.

---

### Scenario 3: Jadwal Kosong (TEST 5 ada data)

**Penyebab:** Jadwal ter-create tapi bookings tidak ter-copy.

**Solusi:**
1. Check apakah jadwal ini memang baru dibuat
2. Atau copy bookings dari week 1

```sql
-- Copy bookings ke jadwal kosong
INSERT INTO bookings (schedule_id, user_id, status, booking_date)
SELECT 
  '[SCHEDULE_ID_KOSONG]',
  b.user_id,
  'confirmed',
  NOW()
FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
WHERE s.week_number = 1
  AND s.class_id = '[CLASS_ID]'
  AND s.day = '[DAY]'
  AND s.time_slot = '[TIME_SLOT]';
```

---

## 🎯 Quick Fix - Manual Copy Booking

Jika kamu tahu siswa mana yang hilang:

```sql
-- 1. Cari user_id siswa
SELECT id, full_name, student_id 
FROM users 
WHERE full_name ILIKE '%[NAMA_SISWA]%';

-- 2. Cari schedule_id tujuan (Kamis-Sabtu week 2)
SELECT s.id, c.name, s.day, s.time_slot
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2
  AND s.day IN ('thursday', 'friday', 'saturday')
  AND c.name = '[CLASS_NAME]';

-- 3. Insert booking manual
INSERT INTO bookings (schedule_id, user_id, status, booking_date)
VALUES ('[SCHEDULE_ID]', '[USER_ID]', 'confirmed', NOW());

-- 4. Update current_students counter
UPDATE schedules
SET current_students = current_students + 1
WHERE id = '[SCHEDULE_ID]';
```

---

## 📞 Next Steps

1. **Jalankan DEBUG_MISSING_STUDENT_AFTER_COPY.sql**
2. **Share hasil TEST 1-6 dengan saya**
3. **Saya akan kasih solusi spesifik berdasarkan hasil**

---

## 🔗 Related Files

- Debug Query: `database/DEBUG_MISSING_STUDENT_AFTER_COPY.sql`
- Copy Week Fix: `database/FIX_COPY_WEEK_CLASS_MAPPING_BUG.sql`
- Verification: `database/VERIFY_CLASS_CHANGE_SIMPLE.sql`

---

**STATUS**: ⏳ Waiting for debug results...
