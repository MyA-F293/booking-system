# FIX: 30 Maret Seharusnya Week 1, Tapi Tampil Week 2

## Masalah
- Tanggal: 30 Maret 2026
- Week yang ditampilkan: Week 2
- Week yang seharusnya: Week 1

## Penyebab
Ada 2 kemungkinan:

### Kemungkinan 1: Batch Start Date Salah
Database menyimpan `batch_start_date` yang lebih awal dari 30 Maret (misalnya 23 Maret), sehingga sistem menghitung 30 Maret sebagai Week 2.

### Kemungkinan 2: GitHub Actions Sudah Increment
GitHub Actions sudah jalan dan increment week dari 1 ke 2, padahal seharusnya masih Week 1.

## Solusi

### Step 1: Cek Batch Start Date
Jalankan query ini di Supabase SQL Editor:

```sql
-- File: booking-system/database/CHECK_BATCH_START_DATE.sql
SELECT 
  current_week,
  batch_start_date,
  CURRENT_DATE as today,
  CURRENT_DATE - batch_start_date as days_since_start
FROM settings WHERE id = 1;
```

### Step 2: Fix Week ke 1
Jika 30 Maret seharusnya Week 1, jalankan query ini:

```sql
-- File: booking-system/database/SET_WEEK_1_FOR_30_MARCH.sql

-- Update batch_start_date ke 30 Maret dan set week ke 1
UPDATE settings 
SET 
  batch_start_date = '2026-03-30',
  current_week = 1,
  updated_at = NOW()
WHERE id = 1;

-- Verify
SELECT 
  current_week,
  batch_start_date,
  CURRENT_DATE as today
FROM settings WHERE id = 1;
```

### Step 3: Refresh Aplikasi
Setelah query dijalankan:
1. Refresh halaman booking system
2. Week seharusnya sudah berubah ke Week 1

## Catatan Penting

### Jika Batch Memang Mulai 23 Maret
Jika batch memang sudah mulai sejak 23 Maret, maka:
- 23-29 Maret = Week 1
- 30 Maret - 5 April = Week 2 ✅ (BENAR)

Dalam kasus ini, **tidak perlu fix** karena sistem sudah benar.

### Jika Batch Baru Mulai 30 Maret
Jika batch baru mulai hari ini (30 Maret), maka:
- 30 Maret - 5 April = Week 1
- Perlu update `batch_start_date` ke 30 Maret

## Sistem Week Otomatis

Setelah fix, sistem akan otomatis increment setiap Senin:
- Senin, 6 April 2026 → Week 2
- Senin, 13 April 2026 → Week 3
- Dan seterusnya...

GitHub Actions akan handle auto-increment setiap Senin jam 00:01 WIB.

## Quick Fix Command

Jika yakin 30 Maret = Week 1, copy-paste ini ke Supabase SQL Editor:

```sql
UPDATE settings 
SET batch_start_date = '2026-03-30', current_week = 1, updated_at = NOW()
WHERE id = 1;
```

Refresh aplikasi, selesai!
