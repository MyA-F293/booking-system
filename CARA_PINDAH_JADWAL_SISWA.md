# 📝 Cara Pindahkan Jadwal Siswa (Manual)

## Kapan Digunakan

Setelah auto-split, jika ada siswa yang jadwalnya salah dan mau pindah.

---

## 🔍 Step 1: Cari Booking Siswa

```sql
-- Ganti 'Nama Siswa' dengan nama siswa yang mau pindah
SELECT 
    b.id as booking_id,
    u.full_name,
    u.student_id,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    s.id as current_schedule_id
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Nama Siswa%'
    AND s.week_number = 9
    AND b.status = 'confirmed';
```

**Catat:**
- `booking_id` → ID booking yang mau dipindah
- `current_schedule_id` → Schedule sekarang

---

## 🎯 Step 2: Cari Schedule Tujuan

```sql
-- Ganti 'Oxford Class' dengan nama kelas yang sesuai
-- Ganti 'friday' dengan hari yang dimau
-- Ganti 'evening' dengan waktu yang dimau
SELECT 
    s.id as target_schedule_id,
    c.name,
    s.day,
    s.time_slot,
    s.phase,
    s.current_students,
    (10 - s.current_students) as available_slots
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'friday'
    AND s.time_slot = 'evening'
    AND s.week_number = 9
    AND s.current_students < 10;  -- Pastikan masih ada slot
```

**Catat:**
- `target_schedule_id` → Schedule tujuan
- `available_slots` → Slot yang tersedia (harus > 0)

---

## 🔄 Step 3: Pindahkan Booking

```sql
-- Ganti <booking_id> dengan ID dari Step 1
-- Ganti <target_schedule_id> dengan ID dari Step 2
UPDATE bookings
SET schedule_id = '<target_schedule_id>'
WHERE id = '<booking_id>';
```

---

## 🔢 Step 4: Update Current Students

```sql
-- Ganti <current_schedule_id> dengan schedule lama (Step 1)
-- Ganti <target_schedule_id> dengan schedule baru (Step 2)
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE schedule_id = schedules.id 
        AND status = 'confirmed'
)
WHERE id IN ('<current_schedule_id>', '<target_schedule_id>');
```

---

## ✅ Step 5: Verification

```sql
-- Verify siswa sudah di schedule baru
SELECT 
    u.full_name,
    c.name,
    s.day,
    s.time_slot,
    s.current_students
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Nama Siswa%'
    AND s.week_number = 9
    AND b.status = 'confirmed';
```

---

## 📋 Contoh Lengkap

**Scenario:** Faradilla mau pindah dari Oxford Friday Afternoon ke Evening

### Step 1: Cari booking Faradilla
```sql
SELECT 
    b.id as booking_id,
    u.full_name,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.id as current_schedule_id
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Faradilla%'
    AND s.week_number = 9
    AND b.status = 'confirmed';
```

**Hasil:**
- booking_id: `abc123...`
- current_schedule_id: `152e36a2-68ee-40dd-91c3-fe55ddb1a5da`

### Step 2: Cari schedule Evening
```sql
SELECT 
    s.id as target_schedule_id,
    s.current_students,
    (10 - s.current_students) as available_slots
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'friday'
    AND s.time_slot = 'evening'
    AND s.week_number = 9;
```

**Hasil:**
- target_schedule_id: `xyz789...`
- available_slots: 2 (masih ada slot)

### Step 3: Pindahkan
```sql
UPDATE bookings
SET schedule_id = 'xyz789...'
WHERE id = 'abc123...';
```

### Step 4: Update current_students
```sql
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE schedule_id = schedules.id 
        AND status = 'confirmed'
)
WHERE id IN ('152e36a2-68ee-40dd-91c3-fe55ddb1a5da', 'xyz789...');
```

### Step 5: Verify
```sql
SELECT 
    u.full_name,
    c.name,
    s.day,
    s.time_slot,
    s.current_students
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Faradilla%'
    AND s.week_number = 9;
```

**Hasil:**
- Faradilla sekarang di Friday Evening ✅

---

## ⚠️ Important Notes

1. **Check available slots** sebelum pindah (harus < 10)
2. **Update current_students** setelah pindah (penting!)
3. **Verify** setelah pindah untuk pastikan berhasil
4. Siswa akan otomatis lihat jadwal baru di portal

---

## 🎯 Quick Reference

**Pindah siswa:**
```sql
-- 1. Cari booking
SELECT b.id, u.full_name, s.id as schedule_id
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
WHERE u.full_name LIKE '%Nama%' AND s.week_number = 9;

-- 2. Cari schedule tujuan
SELECT s.id, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Class Name' AND s.day = 'day' 
    AND s.time_slot = 'time' AND s.week_number = 9;

-- 3. Pindahkan
UPDATE bookings SET schedule_id = '<new_id>' WHERE id = '<booking_id>';

-- 4. Update counts
UPDATE schedules SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
) WHERE id IN ('<old_id>', '<new_id>');
```

**Done!** 🎉
