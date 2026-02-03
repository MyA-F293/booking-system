# Cara Menghapus Data Duplikat di Tabel Attendance

## 🎯 Tujuan
Menghapus data attendance yang duplikat (sama schedule_id + student_id) tapi tetap simpan 1 record.

## 📋 Langkah-Langkah

### 1. Buka Supabase Dashboard
1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### 2. Cek Berapa Banyak Duplikat (OPSIONAL)
Copy paste query ini untuk melihat berapa banyak duplikat:

```sql
SELECT 
    schedule_id,
    student_id,
    student_name,
    COUNT(*) as duplicate_count
FROM attendance
GROUP BY schedule_id, student_id, student_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**Klik "Run"** - Ini akan menampilkan daftar student yang punya duplikat dan berapa kali duplikat.

### 3. Lihat Detail Record Duplikat (OPSIONAL)
Copy paste query ini untuk melihat detail semua record yang duplikat:

```sql
WITH duplicates AS (
    SELECT 
        schedule_id,
        student_id,
        COUNT(*) as count
    FROM attendance
    GROUP BY schedule_id, student_id
    HAVING COUNT(*) > 1
)
SELECT 
    a.id,
    a.schedule_id,
    a.student_id,
    a.student_name,
    a.status,
    a.created_at,
    a.teacher_name,
    a.class_name
FROM attendance a
INNER JOIN duplicates d 
    ON a.schedule_id = d.schedule_id 
    AND a.student_id = d.student_id
ORDER BY a.schedule_id, a.student_id, a.created_at DESC;
```

**Klik "Run"** - Ini akan menampilkan semua record duplikat, diurutkan dari yang terbaru.

### 4. HAPUS DUPLIKAT (MAIN STEP) ⚠️
**PERHATIAN:** Ini akan menghapus data secara permanen!

Copy paste query ini:

```sql
DELETE FROM attendance
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY schedule_id, student_id 
                ORDER BY created_at DESC
            ) as row_num
        FROM attendance
    ) ranked
    WHERE row_num > 1
);
```

**Klik "Run"** - Ini akan:
- ✅ Hapus semua record duplikat
- ✅ Simpan 1 record terbaru (created_at paling baru)
- ✅ Return message: "DELETE X" (X = jumlah record yang dihapus)

### 5. Verifikasi Duplikat Sudah Hilang
Copy paste query ini untuk memastikan tidak ada duplikat lagi:

```sql
SELECT 
    schedule_id,
    student_id,
    student_name,
    COUNT(*) as duplicate_count
FROM attendance
GROUP BY schedule_id, student_id, student_name
HAVING COUNT(*) > 1;
```

**Klik "Run"** - Jika berhasil, hasilnya harus **0 rows** (tidak ada duplikat lagi).

## 🔍 Penjelasan

### Apa yang Dihapus?
- Record duplikat dengan `schedule_id + student_id` yang sama
- Hanya record LAMA yang dihapus
- Record TERBARU (created_at paling baru) tetap disimpan

### Contoh:
Jika ada 2 record untuk "Nur Dwifanni" di "Tsinghua Class":
```
Record 1: created_at = 2026-02-03 10:00:00  ← DIHAPUS
Record 2: created_at = 2026-02-03 10:05:00  ← DISIMPAN (terbaru)
```

### Kenapa Simpan yang Terbaru?
- Biasanya submit kedua adalah yang benar (koreksi dari submit pertama)
- Jika ingin simpan yang LAMA, gunakan query alternatif di file SQL

## 📁 File SQL
Semua query ada di: `database/remove_duplicate_attendance.sql`

## ⚠️ PENTING!

### Sebelum Menjalankan:
1. ✅ Pastikan Anda sudah login sebagai admin di Supabase
2. ✅ Jalankan Step 1 & 2 dulu untuk melihat data yang akan dihapus
3. ✅ (Opsional) Backup data dulu jika perlu

### Setelah Menjalankan:
1. ✅ Jalankan Step 5 untuk verifikasi
2. ✅ Cek di aplikasi apakah data sudah benar
3. ✅ Sistem pencegahan duplikat sudah aktif untuk submit berikutnya

## 🎉 Hasil Akhir
- ✅ Tidak ada lagi data duplikat
- ✅ Setiap student hanya punya 1 attendance per schedule
- ✅ Data yang tersimpan adalah yang terbaru
- ✅ Submit berikutnya otomatis dicegah duplikat

## 💡 Tips
- Jika ragu, jalankan Step 1 & 2 dulu untuk melihat data
- Jika ada pertanyaan, tanya dulu sebelum menjalankan Step 4
- Setelah ini, sistem sudah otomatis mencegah duplikat baru

## 📞 Bantuan
Jika ada masalah atau pertanyaan, hubungi developer.

---
**Dibuat:** 3 Februari 2026
**Status:** Ready to use
