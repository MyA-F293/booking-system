# JALANKAN QUERY INI: Hapus Fahd Class Kosong

## Masalah
Tombol "Clean" di Quick Insights tidak merespon saat diklik.

## Solusi: Gunakan Query SQL Manual

### Langkah 1: Buka Supabase SQL Editor
1. Login ke Supabase Dashboard
2. Pilih project booking system
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New query"

### Langkah 2: Copy-Paste Query Ini

```sql
-- STEP 1: Lihat dulu jadwal yang akan dihapus
SELECT 
    s.id,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.current_students,
    s.week_number,
    TO_CHAR(s.created_at, 'DD Mon HH24:MI') as created_at
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Fahd Class'
    AND s.current_students = 0
    AND s.week_number = 2
    AND s.year = 2026
ORDER BY s.day, s.time_slot, s.phase;
```

### Langkah 3: Klik "Run" untuk Melihat Data

Hasilnya akan menampilkan jadwal Fahd yang kosong (0 siswa).

### Langkah 4: Hapus Jadwal Kosong

Jika sudah yakin, jalankan query ini:

```sql
-- STEP 2: Hapus jadwal Fahd Class yang kosong
DELETE FROM schedules
WHERE id IN (
    SELECT s.id
    FROM schedules s
    JOIN classes c ON s.class_id = c.id
    WHERE c.name = 'Fahd Class'
        AND s.current_students = 0
        AND s.week_number = 2
        AND s.year = 2026
);
```

### Langkah 5: Verifikasi Hasil

```sql
-- STEP 3: Cek jadwal Fahd yang tersisa
SELECT 
    '🏛️ FAHD CLASS' as kelas,
    s.day as hari,
    s.time_slot as waktu,
    s.phase as fase,
    s.current_students as siswa,
    (10 - s.current_students) as slot_tersedia
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Fahd Class'
    AND s.week_number = 2
    AND s.year = 2026
ORDER BY s.day;
```

## Hasil yang Diharapkan

Setelah menjalankan query, seharusnya:
- ✅ Jadwal Tuesday Afternoon (duplikat) terhapus
- ✅ Jadwal Saturday Evening (kosong) terhapus
- ✅ Tersisa hanya jadwal yang ada siswanya:
  - Thursday Evening Phase2 - 9 siswa
  - Friday Evening Phase2 - 8 siswa

## Refresh Admin Dashboard

Setelah query berhasil:
1. Kembali ke Admin Dashboard
2. Hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)
3. Quick Insights seharusnya tidak menampilkan "Empty Schedules" lagi

## Jika Ingin Hapus SEMUA Empty Schedules (Bukan Hanya Fahd)

```sql
-- HATI-HATI: Ini akan hapus SEMUA jadwal kosong di database
DELETE FROM schedules
WHERE current_students = 0;
```

---
**Catatan**: Query SQL manual ini lebih pasti daripada tombol UI yang tidak merespon.
