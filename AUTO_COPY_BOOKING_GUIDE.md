# 🔄 Auto-Copy Booking - Panduan Lengkap

## ✅ Fitur Sudah Aktif!

Fitur auto-copy booking **SUDAH ADA** dan **SUDAH AKTIF** di sistem!

---

## 🎯 Cara Kerja

### Konsep Dasar:
Siswa **TIDAK PERLU** pilih jadwal setiap minggu. Sistem otomatis copy booking minggu lalu ke minggu baru.

### Kapan Auto-Copy Jalan?

**Opsi 1: Minggu Malam (Jam 20:00 keatas)**
```
- Sistem otomatis copy booking minggu ini ke minggu depan
- Contoh: Minggu malam minggu 9 → copy ke minggu 10
- Ini waktu ideal untuk auto-copy
```

**Opsi 2: Senin-Sabtu (Backup)**
```
- Kalau siswa tidak buka app Minggu malam
- Sistem copy booking minggu lalu ke minggu ini
- Contoh: Senin minggu 10 → copy dari minggu 9
```

---

## 📋 Contoh Skenario

### Skenario 1: Siswa Buka App Minggu Malam

**Minggu 9 (Senin-Sabtu):**
```
Faradilla booking: Oxford Class Monday Afternoon ✅
```

**Minggu 9 (Minggu jam 20:00):**
```
Faradilla buka app → Sistem auto-copy booking ke minggu 10 ✅
Notifikasi: "✅ 1 jadwal minggu lalu sudah di-copy otomatis!"
```

**Minggu 10 (Senin):**
```
Faradilla login → Sudah ada booking Oxford Class Monday Afternoon ✅
Faradilla bisa:
- Tetap pakai jadwal ini (tidak perlu pilih lagi) ✅
- Atau pindah ke jadwal lain (cancel dan pilih baru) ✅
```

### Skenario 2: Siswa Tidak Buka App Minggu Malam

**Minggu 9:**
```
Faradilla booking: Oxford Class Monday Afternoon ✅
Faradilla tidak buka app Minggu malam ❌
```

**Minggu 10 (Senin pagi):**
```
Faradilla buka app → Sistem auto-copy booking dari minggu 9 ✅
Notifikasi: "✅ 1 jadwal minggu lalu sudah di-copy otomatis!"
Faradilla sudah ada booking Oxford Class Monday Afternoon ✅
```

### Skenario 3: Siswa Mau Pindah Jadwal

**Minggu 10 (Senin):**
```
Faradilla login → Sudah ada booking Oxford Class Monday Afternoon (auto-copy)
Faradilla mau pindah ke Tuesday Evening:
1. Cancel booking Monday Afternoon
2. Pilih booking Tuesday Evening
3. Done! ✅
```

---

## 🛡️ Proteksi & Validasi

### 1. Tidak Double Booking
```
Sistem cek dulu apakah siswa sudah ada booking untuk phase tersebut
Kalau sudah ada → skip (tidak copy)
```

### 2. Tidak Copy Kalau Kelas Penuh
```
Sistem cek dulu apakah kelas sudah penuh (max 10 siswa)
Kalau penuh → skip (tidak copy)
```

### 3. Tidak Copy 2 Kali
```
Sistem pakai localStorage untuk tracking
Kalau sudah di-copy untuk minggu tersebut → skip
```

### 4. Auto-Create Schedule
```
Kalau schedule minggu depan belum ada → sistem buat otomatis
Batch di-set NULL dulu → nanti auto-set dari siswa pertama
```

---

## 🔍 Cara Cek Apakah Auto-Copy Jalan

### 1. Cek Console Log (Developer)
```javascript
// Buka browser console (F12)
// Lihat log:
🔄 autoCopyBookings: Checking if copy needed...
📅 Current week: 9
📅 Sunday night mode: copying week 9 to week 10
📋 autoCopyBookings: Found 5 bookings to copy
✅ Copied booking for user xxx to week 10
🎉 autoCopyBookings: Successfully copied 5 bookings to week 10
```

### 2. Cek Notifikasi (User)
```
Kalau auto-copy berhasil, muncul notifikasi:
"✅ 1 jadwal minggu lalu sudah di-copy otomatis!"
```

### 3. Cek Booking Dashboard (User)
```
Login sebagai siswa → Lihat jadwal minggu depan
Kalau sudah ada booking → auto-copy berhasil ✅
```

---

## 🚨 Troubleshooting

### Masalah 1: Auto-Copy Tidak Jalan

**Kemungkinan Penyebab:**
1. Schedule minggu depan belum dibuat admin
2. Kelas sudah penuh (10 siswa)
3. Siswa sudah ada booking untuk phase tersebut
4. Batch tidak match

**Solusi:**
```javascript
// Cek console log untuk error
// Lihat reason kenapa tidak di-copy:
{ copied: false, reason: 'already_copied' }
{ copied: false, reason: 'class_full' }
{ copied: false, reason: 'already_booked_phase' }
```

### Masalah 2: Booking Di-Copy Tapi Tidak Muncul

**Kemungkinan Penyebab:**
1. Batch tidak match (schedule batch 1, siswa batch 2)
2. Filter di frontend menyembunyikan booking

**Solusi:**
```sql
-- Cek di database apakah booking ada
SELECT 
    b.id,
    u.full_name,
    u.batch as user_batch,
    s.batch as schedule_batch,
    c.name as class_name,
    s.day,
    s.week_number
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE b.status = 'confirmed'
    AND s.week_number = 10
ORDER BY u.full_name;
```

### Masalah 3: Schedule Tidak Auto-Create

**Kemungkinan Penyebab:**
1. Unique constraint error (duplicate schedule)
2. Missing required fields

**Solusi:**
```javascript
// Cek console log untuk error
// Lihat error dari getOrCreateSchedule()
❌ Error creating schedule: duplicate key violates unique constraint
```

---

## 🎯 Best Practices

### Untuk Admin:

1. **Buat Schedule Awal Minggu**
   ```
   Setiap Minggu malam atau Senin pagi
   Buat schedule untuk minggu depan
   Sistem akan auto-copy booking ke schedule tersebut
   ```

2. **Jangan Hapus Schedule yang Sudah Ada Booking**
   ```
   Kalau schedule sudah ada booking
   Jangan dihapus → siswa akan kehilangan booking
   ```

3. **Monitor Auto-Copy**
   ```
   Cek setiap Senin pagi
   Apakah booking sudah di-copy otomatis
   Kalau ada masalah → cek console log
   ```

### Untuk Siswa:

1. **Buka App Minggu Malam**
   ```
   Buka app Minggu malam (setelah jam 20:00)
   Sistem akan auto-copy booking ke minggu depan
   ```

2. **Cek Booking Senin Pagi**
   ```
   Login Senin pagi
   Cek apakah booking sudah di-copy
   Kalau belum → refresh page
   ```

3. **Pindah Jadwal Kalau Perlu**
   ```
   Kalau mau pindah jadwal:
   1. Cancel booking lama
   2. Pilih booking baru
   ```

---

## 📊 Statistik & Monitoring

### Query untuk Cek Auto-Copy

**Cek Booking Per Minggu:**
```sql
SELECT 
    s.week_number,
    COUNT(*) as total_bookings,
    COUNT(DISTINCT b.user_id) as unique_students
FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
WHERE b.status = 'confirmed'
    AND s.week_number IN (9, 10)
GROUP BY s.week_number
ORDER BY s.week_number;
```

**Cek Siswa yang Belum Ada Booking Minggu Depan:**
```sql
-- Siswa yang ada booking minggu 9 tapi tidak ada minggu 10
SELECT 
    u.full_name,
    u.student_id,
    u.batch
FROM users u
WHERE u.id IN (
    SELECT DISTINCT user_id
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE s.week_number = 9
        AND b.status = 'confirmed'
)
AND u.id NOT IN (
    SELECT DISTINCT user_id
    FROM bookings b
    JOIN schedules s ON b.schedule_id = s.id
    WHERE s.week_number = 10
        AND b.status = 'confirmed'
);
```

---

## 🔧 Update Terbaru

### Yang Baru Diperbaiki:

1. ✅ Tambah field `batch` dan `current_students` di scheduleData
2. ✅ Tambah toast notification untuk user
3. ✅ Reload bookings setelah auto-copy
4. ✅ Better logging untuk debugging

### Commit:
```bash
git add .
git commit -m "Fix auto-copy booking: add batch field and user notification"
git push
```

---

## 🎉 Kesimpulan

**Fitur auto-copy booking SUDAH AKTIF!**

- ✅ Siswa tidak perlu pilih jadwal setiap minggu
- ✅ Sistem otomatis copy booking minggu lalu
- ✅ Siswa bisa pindah jadwal kalau mau
- ✅ Proteksi lengkap (tidak double booking, tidak copy kalau penuh)
- ✅ Auto-create schedule kalau belum ada

**Cara Kerja:**
1. Minggu malam (jam 20:00+) → auto-copy ke minggu depan
2. Senin-Sabtu → auto-copy dari minggu lalu (backup)
3. Siswa bisa tetap pakai atau pindah jadwal

**Sudah jalan dengan baik!** 🚀
