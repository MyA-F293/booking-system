# ⚡ Cara Fix Force Close Booking

## Masalah
Admin nyalakan "Force Close" tapi siswa masih lihat booking tutup dengan jadwal normal.

## Solusi Cepat (3 Langkah)

### 1️⃣ Update Database (5 menit)

Buka **Supabase SQL Editor**, jalankan:

```sql
-- Tambah kolom force_close_booking
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS force_close_booking BOOLEAN DEFAULT FALSE;

-- Set nilai awal (booking terbuka)
UPDATE settings
SET force_close_booking = FALSE
WHERE id = 1;

-- Cek berhasil
SELECT id, current_week, force_close_booking FROM settings WHERE id = 1;
```

**Expected**: `force_close_booking = false`

### 2️⃣ Tunggu Deploy (2-3 menit)

Code sudah di-push ke GitHub. Netlify akan auto-deploy.

Cek status deploy di: https://app.netlify.com

### 3️⃣ Test (2 menit)

#### Test Admin:
1. Login sebagai admin
2. Klik tombol "Force Close" (merah)
3. Harus muncul toast: "Booking FORCE CLOSED"
4. Refresh page → setting tetap

#### Test Siswa:
1. Login sebagai siswa
2. Refresh page (Ctrl+F5)
3. Harus lihat: "Booking is FORCE CLOSED" (merah)
4. Tidak bisa book

#### Test Toggle:
1. Admin klik "Force Close" lagi (buka)
2. Siswa refresh
3. Booking harus terbuka

---

## Kenapa Ini Terjadi?

**BEFORE**:
- Setting disimpan di `localStorage` browser admin
- Siswa punya `localStorage` sendiri
- Tidak tersinkronisasi ❌

**AFTER**:
- Setting disimpan di database `settings` table
- Semua user baca dari database yang sama
- Tersinkronisasi ✅

---

## Troubleshooting

### Siswa masih lihat booking tutup:
1. Cek database:
   ```sql
   SELECT force_close_booking FROM settings WHERE id = 1;
   ```
2. Siswa refresh page (Ctrl+F5)
3. Cek console log siswa (F12)

### Admin toggle tidak jalan:
1. Cek console log admin (F12)
2. Harus ada: "✅ Force Close Booking updated in database"
3. Jika error, screenshot dan share

---

## File Terkait

- `booking-system/src/contexts/BookingModeContext.jsx` - Fixed ✅
- `booking-system/database/ADD_FORCE_CLOSE_COLUMN.sql` - SQL script
- `booking-system/FIX_FORCE_CLOSE_NOT_WORKING.md` - Dokumentasi lengkap

---

**Total Waktu**: ~10 menit  
**Status**: ✅ Fixed & Deployed  
**Prioritas**: 🔥 HIGH
