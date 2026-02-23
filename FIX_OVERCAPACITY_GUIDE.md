# 🚨 Fix Overcapacity Classes - Panduan

## Masalah

Setelah jalankan fix duplicate, ada kelas yang berisi lebih dari 10 siswa.

## Penyebab

Ketika duplicate schedules di-merge, semua booking dari duplicate schedules dipindahkan ke 1 schedule. Ini bisa menyebabkan 1 schedule punya lebih dari 10 siswa.

**Contoh:**
```
Before fix:
- Schedule A (Oxford Monday): 8 siswa
- Schedule B (Oxford Monday duplicate): 5 siswa
Total: 13 siswa di 2 schedule berbeda

After fix:
- Schedule A (Oxford Monday): 13 siswa ❌ (lebih dari 10!)
- Schedule B: Deleted
```

---

## 🔍 Step 1: Investigasi

Jalankan query ini untuk lihat kelas mana yang overcapacity:

```sql
-- File: booking-system/database/INVESTIGATE_OVERCAPACITY.sql
```

Hasil akan tampilkan:
- Nama kelas
- Hari dan waktu
- Jumlah siswa (lebih dari 10)
- Daftar nama siswa

---

## 🛠️ Step 2: Fix Otomatis (Recalculate)

Pertama, coba recalculate `current_students`:

```sql
-- File: booking-system/database/FIX_OVERCAPACITY_CLASSES.sql
-- Jalankan STEP 2
```

Ini akan update `current_students` berdasarkan jumlah booking aktual.

---

## 🎯 Step 3: Manual Fix (Jika Masih Overcapacity)

Jika setelah recalculate masih ada kelas dengan lebih dari 10 siswa, perlu manual fix:

### Opsi 1: Buat Schedule Baru (Recommended)

Untuk kelas yang overcapacity, buat schedule baru dengan waktu berbeda:

**Contoh: Oxford Class Monday Afternoon punya 13 siswa**

```sql
-- 1. Lihat siswa di kelas tersebut
SELECT 
    u.full_name,
    u.student_id,
    u.batch,
    b.created_at
FROM bookings b
JOIN users u ON b.user_id = u.id
WHERE b.schedule_id = '<schedule_id_overcapacity>'
    AND b.status = 'confirmed'
ORDER BY b.created_at;

-- 2. Buat schedule baru (Oxford Monday Evening)
INSERT INTO schedules (class_id, day, time_slot, phase, week_number, year, program, level, batch, current_students)
SELECT 
    class_id,
    day,
    'evening' as time_slot,  -- Waktu berbeda
    phase,
    week_number,
    year,
    program,
    level,
    batch,
    0 as current_students
FROM schedules
WHERE id = '<schedule_id_overcapacity>';

-- 3. Pindahkan 3 siswa terakhir ke schedule baru
-- (Ambil ID schedule baru dari hasil INSERT di atas)
UPDATE bookings
SET schedule_id = '<new_schedule_id>'
WHERE id IN (
    SELECT b.id
    FROM bookings b
    WHERE b.schedule_id = '<schedule_id_overcapacity>'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC
    LIMIT 3
);

-- 4. Update current_students
UPDATE schedules
SET current_students = (
    SELECT COUNT(*)
    FROM bookings
    WHERE schedule_id = schedules.id
        AND status = 'confirmed'
)
WHERE id IN ('<schedule_id_overcapacity>', '<new_schedule_id>');
```

### Opsi 2: Pindahkan ke Schedule Lain yang Ada

Jika ada schedule lain di hari/waktu berbeda yang masih ada slot:

```sql
-- 1. Cari schedule lain yang masih ada slot
SELECT 
    s.id,
    c.name,
    s.day,
    s.time_slot,
    s.current_students,
    (10 - s.current_students) as available_slots
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9
    AND s.current_students < 10
    AND c.name = 'Oxford Class'  -- Kelas yang sama
ORDER BY s.current_students;

-- 2. Pindahkan siswa ke schedule yang ada slot
UPDATE bookings
SET schedule_id = '<target_schedule_id>'
WHERE id IN (
    SELECT b.id
    FROM bookings b
    WHERE b.schedule_id = '<overcapacity_schedule_id>'
        AND b.status = 'confirmed'
    ORDER BY b.created_at DESC
    LIMIT 3  -- Sesuaikan dengan jumlah yang perlu dipindah
);

-- 3. Update current_students
UPDATE schedules
SET current_students = (
    SELECT COUNT(*)
    FROM bookings
    WHERE schedule_id = schedules.id
        AND status = 'confirmed'
)
WHERE id IN ('<overcapacity_schedule_id>', '<target_schedule_id>');
```

---

## ✅ Step 4: Verification

Setelah fix, verify tidak ada lagi kelas overcapacity:

```sql
-- Should return 0 rows
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students > 10
    AND s.week_number >= 9;
```

---

## 🛡️ Pencegahan Kedepan

Untuk mencegah overcapacity di masa depan:

### 1. Database Trigger (Recommended)

Buat trigger yang mencegah booking jika kelas sudah penuh:

```sql
-- Sudah ada di: booking-system/database/PREVENT_DUPLICATE_SCHEDULES.sql
-- Trigger akan auto-reject booking jika kelas penuh
```

### 2. Frontend Validation

Frontend sudah ada validasi:
```javascript
if (schedule.current_students >= 10) {
    toast.error('Class is full!');
    return;
}
```

---

## 📊 Monitoring

Query untuk monitoring kelas yang hampir penuh:

```sql
-- Kelas dengan 8-10 siswa (hampir penuh)
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.week_number,
    s.current_students,
    (10 - s.current_students) as slots_remaining
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students >= 8
    AND s.current_students <= 10
    AND s.week_number >= 9
ORDER BY s.current_students DESC, c.name;
```

---

## 🎯 Summary

1. ✅ Jalankan `INVESTIGATE_OVERCAPACITY.sql` untuk lihat kelas overcapacity
2. ✅ Jalankan `FIX_OVERCAPACITY_CLASSES.sql` untuk recalculate
3. ✅ Jika masih overcapacity, manual fix dengan:
   - Buat schedule baru (waktu berbeda), atau
   - Pindahkan ke schedule lain yang ada slot
4. ✅ Verify tidak ada lagi overcapacity
5. ✅ Install trigger untuk pencegahan kedepan

**Setelah fix, tidak akan ada lagi kelas dengan lebih dari 10 siswa!** 🎉
