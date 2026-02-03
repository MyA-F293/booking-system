# Cara Menghapus Attendance Siswa Berdasarkan Status

## 🎯 Untuk: Muh Fikri Syahputra (EYSA26010054)
## ✅ Hapus: "Present" (Hijau) saja
## ⚠️ Pertahankan: "Late" (Kuning)

## 📋 Langkah-Langkah

### 1️⃣ Buka Supabase SQL Editor
- Login ke https://supabase.com
- Pilih project Anda
- Klik **SQL Editor** di sidebar kiri

### 2️⃣ Cek Data Berdasarkan Status (PENTING!)
Copy paste query ini untuk melihat attendance berdasarkan status:

```sql
SELECT 
    id,
    student_id,
    student_name,
    class_name,
    week_number,
    status,
    created_at
FROM attendance
WHERE student_id = 'EYSA26010054'
ORDER BY status, created_at DESC;
```

**Klik Run** - Akan tampil semua record, dikelompokkan berdasarkan status.

### 3️⃣ Hitung Record per Status
```sql
SELECT 
    status,
    COUNT(*) as total_records,
    student_name
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY status, student_name;
```

**Klik Run** - Akan tampil:
- `present`: 1 (ini yang akan dihapus)
- `late`: 1 (ini akan dipertahankan)

### 4️⃣ HAPUS Hanya "Present" (MAIN STEP) ⚠️
**Query ini HANYA hapus yang status "present", pertahankan "late"!**

```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'present';
```

**Klik Run** - Akan tampil message: "DELETE 1" (atau berapa banyak record "present")

### 5️⃣ Verifikasi Berhasil
```sql
SELECT 
    status,
    COUNT(*) as remaining_records
FROM attendance
WHERE student_id = 'EYSA26010054'
GROUP BY status;
```

**Klik Run** - Harusnya tampil:
- `late`: 1 ✅ (masih ada)
- `present`: tidak muncul ✅ (sudah dihapus)

## 🎯 Hasil yang Diharapkan

### Sebelum:
```
Muh Fikri Syahputra
Present: 1 (hijau)
Late: 1 (kuning)
```

### Setelah:
```
Muh Fikri Syahputra
Present: 0 (dihapus)
Late: 1 (tetap ada) ✅
```

## 🎯 Opsi Alternatif

### Opsi A: Hapus "Present" untuk Week Tertentu Saja
```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'present'
  AND week_number = 6
  AND year = 2026;
```

### Opsi B: Hapus "Absent" Saja (Pertahankan Present & Late)
```sql
DELETE FROM attendance
WHERE student_id = 'EYSA26010054'
  AND status = 'absent';
```

### Opsi C: Hapus "Present" untuk Beberapa Siswa
```sql
DELETE FROM attendance
WHERE student_id IN (
    'EYSA26010054',  -- Muh Fikri Syahputra
    'EYSA26010055',  -- Siswa lain
    'EYSA26010056'   -- Siswa lain
)
AND status = 'present';
```

## 📊 Status Attendance

| Status | Warna | Arti | Action |
|--------|-------|------|--------|
| `present` | 🟢 Hijau | Hadir | **DIHAPUS** |
| `late` | 🟡 Kuning | Terlambat | **DIPERTAHANKAN** ✅ |
| `absent` | 🔴 Merah | Tidak Hadir | Tidak terpengaruh |

## ⚠️ PENTING!

### Yang Dihapus:
- ✅ Record dengan status "present" (hijau)
- ✅ Hanya untuk siswa EYSA26010054

### Yang TIDAK Dihapus:
- ❌ Record dengan status "late" (kuning) - **TETAP ADA**
- ❌ Record dengan status "absent" (merah)
- ❌ Akun siswa
- ❌ Booking siswa

## 💡 Tips

1. **Selalu jalankan Step 2 & 3 dulu** untuk melihat data
2. **Pastikan status yang dihapus benar** (`present`, `late`, atau `absent`)
3. **Screenshot sebelum dihapus** untuk backup
4. **Jika salah, tidak bisa di-undo** - data hilang permanen

## 📁 File SQL Lengkap
Semua query ada di: `database/delete_student_attendance.sql`

## 🎉 Kesimpulan

Query ini akan:
- ✅ Hapus attendance "present" (hijau)
- ✅ Pertahankan attendance "late" (kuning)
- ✅ Siswa tetap punya record "late" di database
- ✅ Di Attendance Report: Present = 0, Late = 1

---
**Dibuat:** 3 Februari 2026
**Student:** Muh Fikri Syahputra (EYSA26010054)
**Action:** Delete "present" only, keep "late"
