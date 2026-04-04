# 🔍 Check Teacher "TBA" Issue

## Masalah
Beberapa kelas masih menampilkan "TBA" padahal seharusnya ada nama tutor.

## Penyebab
Kemungkinan ada jadwal (schedules) di database yang tidak punya `teacher_id` assigned.

## Langkah Cek

### 1️⃣ Buka Supabase SQL Editor

### 2️⃣ Jalankan Query Ini
```sql
-- Cek berapa jadwal yang tidak punya teacher
SELECT 
    program,
    COUNT(*) as jadwal_tanpa_teacher,
    SUM(current_students) as total_siswa_terdampak
FROM schedules
WHERE teacher_id IS NULL
  AND current_students > 0
GROUP BY program
ORDER BY jadwal_tanpa_teacher DESC;
```

### 3️⃣ Lihat Detail Jadwal Tanpa Teacher
```sql
-- Lihat detail jadwal mana saja yang tidak punya teacher
SELECT 
    s.id,
    s.program,
    s.level,
    s.day,
    s.time_slot,
    c.name as class_name,
    s.current_students,
    s.teacher_id
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.teacher_id IS NULL
  AND s.current_students > 0
ORDER BY s.program, s.day, s.time_slot;
```

### 4️⃣ Lihat Daftar Teacher yang Tersedia
```sql
-- Lihat teacher mana saja yang bisa di-assign
SELECT 
    id,
    name,
    teacher_id,
    is_active
FROM teachers
WHERE is_active = true
ORDER BY name;
```

## Hasil yang Diharapkan

### Jika Ada Jadwal Tanpa Teacher:
- Query pertama akan menunjukkan berapa jadwal per program yang tidak punya teacher
- Query kedua akan menunjukkan detail jadwal mana saja
- Query ketiga akan menunjukkan teacher mana yang bisa di-assign

### Jika Tidak Ada Masalah:
- Query pertama akan return 0 rows (tidak ada jadwal tanpa teacher)
- Berarti masalah "TBA" ada di tempat lain

## Next Steps

**Setelah dapat hasil query**, screenshot dan share hasilnya, lalu kita bisa:
1. Assign teacher yang tepat ke setiap jadwal
2. Buat SQL untuk update teacher_id
3. Verify semua jadwal sudah punya teacher

## File Terkait
- `booking-system/database/CHECK_TEACHER_ASSIGNMENTS.sql` - Query lengkap untuk investigasi
- `booking-system/ADMIN_VS_TUTOR_ATTENDANCE_ISSUE_CONTINUED.md` - Dokumentasi lengkap masalah ini
