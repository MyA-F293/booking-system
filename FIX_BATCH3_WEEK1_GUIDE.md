# FIX BATCH 3 & WEEK 1 DI ADMIN HEADER

## Masalah

Header admin menampilkan:
```
Batch 1 | Week 37
```

Seharusnya (Batch 3 baru mulai 1 Juni 2026):
```
Batch 3 | Week 1
```

## Penyebab

1. **Tabel `app_settings`** → `value.batch` masih berisi angka lama (1 atau 2)
2. **Tabel `settings`** → `current_week` masih 37 (dari batch sebelumnya)

## Solusi

Jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- STEP 1: Update batch number ke 3
UPDATE app_settings
SET value = jsonb_set(value, '{batch}', '3')
WHERE key = 'header_info';

-- STEP 2: Reset week ke 1 untuk Batch 3
UPDATE settings
SET current_week = 1,
    updated_at = NOW()
WHERE id = 1;

-- STEP 3: Verify
SELECT * FROM app_settings WHERE key = 'header_info';
SELECT * FROM settings WHERE id = 1;
```

## Setelah Jalankan SQL

1. **Refresh browser** admin dashboard
2. Header akan berubah jadi: **Batch 3 | Week 1** ✅
3. Siswa akan booking untuk **Week 1** (dimulai 1 Juni 2026)

## Catatan Penting

- Pastikan sudah reset batch terlebih dahulu jika ada data Batch 1/2 yang perlu dibersihkan
- Fungsi "Reset Batch" di admin akan otomatis hapus semua booking, attendance, dan schedule dari batch lama
- Kalau belum reset batch, data Batch 1/2 akan tetap ada dan bisa conflict dengan Batch 3

## File SQL

Lihat file: `database/fix_batch3_week1.sql`
