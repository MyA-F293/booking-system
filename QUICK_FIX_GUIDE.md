# Quick Fix Guide - Duplicate Schedules

## Masalah yang Ditemukan:
- ✅ 24 duplicate schedules untuk Oxford Class Saturday Phase2
- ✅ Over-capacity (11/10 students)
- ✅ Trigger `enforce_schedule_capacity` sudah ada (konflik)

## Solusi Cepat - 5 Langkah

### LANGKAH 0: Backup Database
**WAJIB!** Buat backup dulu di Supabase Dashboard → Database → Backups

---

### LANGKAH 1: Lihat Masalahnya
Jalankan query ini untuk melihat 24 duplikat:

```sql
SELECT 
    s.id,
    c.name as class_name,
    s.day,
    s.phase,
    s.time_slot,
    s.current_students,
    COALESCE(t.name, 'No Teacher') as teacher_name,
    (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id AND b.status = 'confirmed') as actual_bookings
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN teachers t ON s.teacher_id = t.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'saturday'
    AND s.phase = 'phase2'
    AND s.time_slot = 'afternoon'
ORDER BY s.current_students DESC, s.created_at ASC;
```

**Output yang diharapkan:** 24 rows dengan berbagai current_students (0, 1, 11, dll)

---

### LANGKAH 2: Bersihkan Trigger Lama
Jalankan query ini untuk menghapus trigger yang konflik:

```sql
-- Drop all old triggers
DROP TRIGGER IF EXISTS check_schedule_capacity ON bookings CASCADE;
DROP TRIGGER IF EXISTS enforce_schedule_capacity ON bookings CASCADE;
DROP TRIGGER IF EXISTS update_schedule_count_on_insert ON bookings CASCADE;
DROP TRIGGER IF EXISTS update_schedule_count_on_delete ON bookings CASCADE;
DROP TRIGGER IF EXISTS update_schedule_count_on_update ON bookings CASCADE;

-- Drop all old functions
DROP FUNCTION IF EXISTS check_schedule_capacity() CASCADE;
DROP FUNCTION IF EXISTS update_schedule_student_count() CASCADE;
```

**Output yang diharapkan:** `DROP TRIGGER` dan `DROP FUNCTION` beberapa kali

---

### LANGKAH 3: Hapus Duplikat Schedules
Jalankan query ini untuk menghapus 23 duplikat (keep 1 terbaik):

```sql
WITH ranked_schedules AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY class_id, day, phase, time_slot, week_number, year, COALESCE(batch, '')
            ORDER BY 
                CASE WHEN teacher_id IS NOT NULL THEN 0 ELSE 1 END,
                current_students DESC,
                created_at ASC
        ) as rank
    FROM schedules
)
DELETE FROM schedules
WHERE id IN (
    SELECT id 
    FROM ranked_schedules 
    WHERE rank > 1
);
```

**Output yang diharapkan:** `DELETE 23` (atau jumlah duplikat yang ada)

---

### LANGKAH 4: Perbaiki Student Count
Jalankan query ini untuk menghitung ulang semua student count:

```sql
-- Hapus duplikat bookings dulu
WITH ranked_bookings AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY schedule_id, user_id
            ORDER BY created_at ASC
        ) as rank
    FROM bookings
    WHERE status = 'confirmed'
)
DELETE FROM bookings
WHERE id IN (
    SELECT id 
    FROM ranked_bookings 
    WHERE rank > 1
);

-- Recalculate semua counts
UPDATE schedules s
SET current_students = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.schedule_id = s.id
    AND b.status = 'confirmed'
);
```

**Output yang diharapkan:** 
- `DELETE X` (duplikat bookings)
- `UPDATE X` (semua schedules)

---

### LANGKAH 5: Tambah Proteksi
Jalankan query ini untuk mencegah masalah di masa depan:

```sql
-- Add unique constraints
ALTER TABLE schedules 
DROP CONSTRAINT IF EXISTS unique_schedule_combination;

ALTER TABLE schedules
ADD CONSTRAINT unique_schedule_combination 
UNIQUE (class_id, day, phase, time_slot, week_number, year, batch);

ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS unique_booking_per_student;

ALTER TABLE bookings
ADD CONSTRAINT unique_booking_per_student
UNIQUE (schedule_id, user_id);

-- Add capacity check trigger
CREATE OR REPLACE FUNCTION check_schedule_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity INTEGER := 10;
BEGIN
    SELECT current_students INTO current_count
    FROM schedules
    WHERE id = NEW.schedule_id;

    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Schedule is at full capacity (% students)', max_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_schedule_capacity
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION check_schedule_capacity();

-- Add auto-update trigger
CREATE OR REPLACE FUNCTION update_schedule_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE schedules
        SET current_students = current_students + 1
        WHERE id = NEW.schedule_id;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE schedules
        SET current_students = GREATEST(current_students - 1, 0)
        WHERE id = OLD.schedule_id;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE schedules
            SET current_students = GREATEST(current_students - 1, 0)
            WHERE id = OLD.schedule_id;
        END IF;
        
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE schedules
            SET current_students = current_students + 1
            WHERE id = NEW.schedule_id;
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_count_on_insert
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();

CREATE TRIGGER update_schedule_count_on_delete
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_schedule_student_count();

CREATE TRIGGER update_schedule_count_on_update
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_schedule_student_count();
```

**Output yang diharapkan:** 
- `ALTER TABLE` (2x)
- `CREATE FUNCTION` (2x)
- `CREATE TRIGGER` (4x)

---

## Verifikasi Akhir

Jalankan query ini untuk memastikan semuanya sudah benar:

```sql
-- Check 1: No more duplicates
SELECT 
    'Duplicate Schedules' as check,
    COUNT(*) as issues
FROM (
    SELECT class_id, day, phase, time_slot, week_number, year, COALESCE(batch, '') as batch
    FROM schedules
    GROUP BY class_id, day, phase, time_slot, week_number, year, COALESCE(batch, '')
    HAVING COUNT(*) > 1
) duplicates

UNION ALL

-- Check 2: No over-capacity
SELECT 
    'Over Capacity (>10)',
    COUNT(*)
FROM schedules
WHERE current_students > 10

UNION ALL

-- Check 3: Counts match
SELECT 
    'Count Mismatches',
    COUNT(*)
FROM (
    SELECT s.id
    FROM schedules s
    LEFT JOIN bookings b ON b.schedule_id = s.id AND b.status = 'confirmed'
    GROUP BY s.id, s.current_students
    HAVING s.current_students != COUNT(b.id)
) mismatches;
```

**Output yang diharapkan:** Semua issues = 0

---

## Summary

Setelah selesai, Anda akan memiliki:
- ✅ Tidak ada duplikat schedules
- ✅ Semua student count akurat
- ✅ Maksimal 10 students per schedule (enforced)
- ✅ Tidak bisa add student yang sama 2x
- ✅ Auto-update count saat booking berubah

## Troubleshooting

**Jika masih ada error:**
1. Jalankan `check-existing-triggers.sql` untuk lihat trigger apa yang masih ada
2. Jalankan `clean-all-triggers.sql` untuk bersihkan semua
3. Ulangi dari Langkah 3

**Jika data hilang:**
- Restore dari backup yang dibuat di Langkah 0
- Hubungi untuk bantuan lebih lanjut
