# Reset Batch - Troubleshooting Guide

## Error: "Failed to load resource: the server responded with a status of 400"

### Penyebab
- RPC function `reset_batch` belum diinstall di database
- Function ada tapi dengan syntax yang salah
- Permission tidak diberikan dengan benar

### Solusi

#### 1. Install/Reinstall Function

Buka Supabase Dashboard → SQL Editor → New Query

Copy paste **SEMUA** query dari file: `database/CHECK_AND_INSTALL_RESET_BATCH.sql`

```sql
-- Drop existing function
DROP FUNCTION IF EXISTS public.reset_batch(TEXT);

-- Create function
CREATE OR REPLACE FUNCTION public.reset_batch(batch_number_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_attendance INT := 0;
    deleted_bookings INT := 0;
    deleted_students INT := 0;
    deleted_orphan_attendance INT := 0;
    deleted_schedules INT := 0;
    result JSON;
BEGIN
    -- Delete orphan attendance
    DELETE FROM attendance
    WHERE id IN (
        SELECT a.id
        FROM attendance a
        LEFT JOIN users u ON a.student_id = u.id::text
        WHERE u.id IS NULL
    );
    GET DIAGNOSTICS deleted_orphan_attendance = ROW_COUNT;

    -- Delete attendance from batch students
    DELETE FROM attendance
    WHERE student_id IN (
        SELECT id::text
        FROM users
        WHERE role = 'student' AND batch = batch_number_param
    );
    GET DIAGNOSTICS deleted_attendance = ROW_COUNT;

    -- Delete bookings from batch students
    DELETE FROM bookings
    WHERE user_id IN (
        SELECT id
        FROM users
        WHERE role = 'student' AND batch = batch_number_param
    );
    GET DIAGNOSTICS deleted_bookings = ROW_COUNT;

    -- Delete students
    DELETE FROM users
    WHERE role = 'student' AND batch = batch_number_param;
    GET DIAGNOSTICS deleted_students = ROW_COUNT;

    -- Delete ALL schedules
    DELETE FROM schedules;
    GET DIAGNOSTICS deleted_schedules = ROW_COUNT;

    -- Reset current_week
    UPDATE settings
    SET current_week = 1
    WHERE id = 1;

    -- Return result
    result := json_build_object(
        'success', true,
        'batch', batch_number_param,
        'deleted_students', deleted_students,
        'deleted_bookings', deleted_bookings,
        'deleted_attendance', deleted_attendance,
        'deleted_orphan_attendance', deleted_orphan_attendance,
        'deleted_schedules', deleted_schedules,
        'current_week_reset', true,
        'message', format('Batch %s reset complete: %s students, %s bookings, %s attendance, %s orphan records, %s schedules deleted. Current week reset to 1.', 
            batch_number_param, deleted_students, deleted_bookings, deleted_attendance, deleted_orphan_attendance, deleted_schedules)
    );

    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.reset_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_batch(TEXT) TO anon;
```

#### 2. Verify Installation

Jalankan query ini untuk memastikan function terinstall:

```sql
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'reset_batch';
```

**Expected Output:**
```
routine_name | routine_type | return_type
reset_batch  | FUNCTION     | json
```

#### 3. Test Function

Test dengan batch 1 (atau batch lain):

```sql
SELECT * FROM reset_batch('1');
```

**Expected Output:**
```json
{
  "success": true,
  "batch": "1",
  "deleted_students": 5,
  "deleted_bookings": 20,
  "deleted_attendance": 100,
  "deleted_orphan_attendance": 50,
  "deleted_schedules": 10,
  "current_week_reset": true,
  "message": "Batch 1 reset complete: 5 students, 20 bookings, 100 attendance, 50 orphan records, 10 schedules deleted. Current week reset to 1."
}
```

#### 4. Refresh Browser

Setelah function terinstall:
1. Tutup tab browser
2. Buka kembali admin dashboard
3. Login ulang
4. Coba fitur Reset Batch lagi

---

## Error: "Error resetting batch: Object"

### Penyebab
- Function return format tidak sesuai
- Error di dalam function execution

### Solusi

Check error detail di browser console (F12):
1. Buka Developer Tools (F12)
2. Tab Console
3. Lihat error message lengkap
4. Screenshot dan share untuk debugging

---

## Error: "Multiple requires a WHERE clause"

### Penyebab
- Query DELETE tanpa WHERE clause (sudah diperbaiki di function)

### Solusi
Function sudah menggunakan WHERE clause yang benar. Reinstall function menggunakan langkah di atas.

---

## Checklist Sebelum Menggunakan Fitur

- [ ] Function `reset_batch` sudah terinstall di Supabase
- [ ] Test function berhasil di SQL Editor
- [ ] Browser sudah di-refresh setelah install function
- [ ] Login ulang ke admin dashboard
- [ ] Backup data penting sebelum reset (optional)

---

## Manual Reset (Jika Function Tidak Bisa Diinstall)

Jika tidak bisa install function, gunakan manual SQL:

File: `database/RESET_BATCH_COMPLETE.sql`

**PERINGATAN**: Ganti `'1'` dengan batch number yang ingin dihapus!

```sql
-- Delete orphan attendance
DELETE FROM attendance
WHERE id IN (
    SELECT a.id
    FROM attendance a
    LEFT JOIN users u ON a.student_id = u.id::text
    WHERE u.id IS NULL
);

-- Delete attendance from batch
DELETE FROM attendance
WHERE student_id IN (
    SELECT id::text
    FROM users
    WHERE role = 'student' AND batch = '1'  -- GANTI INI
);

-- Delete bookings from batch
DELETE FROM bookings
WHERE user_id IN (
    SELECT id
    FROM users
    WHERE role = 'student' AND batch = '1'  -- GANTI INI
);

-- Delete students from batch
DELETE FROM users
WHERE role = 'student' AND batch = '1';  -- GANTI INI

-- Delete ALL schedules
DELETE FROM schedules;

-- Reset current_week
UPDATE settings
SET current_week = 1
WHERE id = 1;
```

---

## Kontak Support

Jika masih ada masalah:
1. Screenshot error message
2. Screenshot browser console (F12)
3. Screenshot hasil query verification
4. Hubungi developer

---

**Last Updated**: March 26, 2026
