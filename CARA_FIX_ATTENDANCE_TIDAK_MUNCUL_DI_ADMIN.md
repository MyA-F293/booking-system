# Fix: Attendance Muncul di Student Tapi Tidak di Admin

## Masalah
Data attendance terlihat di student view tapi tidak muncul di admin attendance manager.

## Penyebab Kemungkinan
1. **Orphan records**: Attendance tanpa `student_id` atau `schedule_id` yang valid
2. **Duplicate records**: Multiple attendance untuk date/student/schedule yang sama
3. **Filter berbeda**: Admin filter berdasarkan schedule, student filter berdasarkan student_id
4. **Data corruption**: student_id atau schedule_id tidak match dengan tabel students/schedules

## Langkah Fix

### 1. Investigasi Data
Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek attendance orphan
SELECT 
  a.id,
  a.date,
  a.student_id,
  a.schedule_id,
  a.status,
  s.student_name,
  sch.class_name
FROM attendance a
LEFT JOIN students s ON a.student_id = s.id
LEFT JOIN schedules sch ON a.schedule_id = sch.id
WHERE s.id IS NULL OR sch.id IS NULL
ORDER BY a.date DESC;
```

### 2. Cek Duplicate
```sql
SELECT 
  date,
  student_id,
  schedule_id,
  COUNT(*) as count
FROM attendance
GROUP BY date, student_id, schedule_id
HAVING COUNT(*) > 1
ORDER BY date DESC;
```

### 3. Cleanup Orphan Records
**HATI-HATI**: Ini akan menghapus data yang tidak valid!

```sql
-- Backup dulu sebelum hapus
CREATE TABLE attendance_backup_orphan AS
SELECT * FROM attendance
WHERE id IN (
  SELECT a.id
  FROM attendance a
  LEFT JOIN students s ON a.student_id = s.id
  LEFT JOIN schedules sch ON a.schedule_id = sch.id
  WHERE s.id IS NULL OR sch.id IS NULL
);

-- Hapus orphan records
DELETE FROM attendance
WHERE id IN (
  SELECT a.id
  FROM attendance a
  LEFT JOIN students s ON a.student_id = s.id
  LEFT JOIN schedules sch ON a.schedule_id = sch.id
  WHERE s.id IS NULL OR sch.id IS NULL
);
```

### 4. Cleanup Duplicates
```sql
-- Backup duplicate dulu
CREATE TABLE attendance_backup_duplicate AS
SELECT * FROM attendance
WHERE id IN (
  SELECT a1.id
  FROM attendance a1
  INNER JOIN attendance a2 ON 
    a1.date = a2.date AND
    a1.student_id = a2.student_id AND
    a1.schedule_id = a2.schedule_id AND
    a1.id < a2.id
);

-- Hapus duplicate (keep yang terbaru)
DELETE FROM attendance
WHERE id IN (
  SELECT a1.id
  FROM attendance a1
  INNER JOIN attendance a2 ON 
    a1.date = a2.date AND
    a1.student_id = a2.student_id AND
    a1.schedule_id = a2.schedule_id AND
    a1.id < a2.id
);
```

### 5. Verify
Setelah cleanup, cek lagi di admin:

```sql
-- Cek total attendance yang valid
SELECT COUNT(*) as total_valid_attendance
FROM attendance a
INNER JOIN students s ON a.student_id = s.id
INNER JOIN schedules sch ON a.schedule_id = sch.id;

-- Cek attendance per student
SELECT 
  s.student_name,
  COUNT(a.id) as total_attendance
FROM students s
LEFT JOIN attendance a ON s.id = a.student_id
GROUP BY s.id, s.student_name
ORDER BY s.student_name;
```

## Pencegahan
Untuk mencegah masalah ini di masa depan, pastikan:

1. **Constraint di database** sudah aktif:
```sql
-- Cek constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'attendance'::regclass;
```

2. **Validation di aplikasi** sebelum insert attendance
3. **Unique constraint** untuk mencegah duplicate:
```sql
ALTER TABLE attendance
ADD CONSTRAINT attendance_unique_date_student_schedule
UNIQUE (date, student_id, schedule_id);
```

## Restore Jika Salah
Jika ada yang salah, restore dari backup:

```sql
-- Restore orphan
INSERT INTO attendance
SELECT * FROM attendance_backup_orphan;

-- Restore duplicate
INSERT INTO attendance
SELECT * FROM attendance_backup_duplicate;
```

## File Terkait
- `database/cleanup_orphan_attendance.sql` - Script investigasi dan cleanup
- `DUPLICATE_ATTENDANCE_PREVENTION.md` - Sistem pencegahan duplicate
- `CARA_HAPUS_DUPLIKAT_ATTENDANCE.md` - Guide hapus duplicate
