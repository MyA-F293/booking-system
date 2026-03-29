# Fix Week/Date Display Inconsistency

## Masalah
Sistem menampilkan "Week 2, 2026" tapi tanggalnya menunjukkan "Monday Jan 5" yang tidak sesuai dengan minggu sebenarnya.

## Penyebab
Fungsi `getDateForDayInWeek()` menggunakan perhitungan ISO week yang dimulai dari 4 Januari, bukan dari tanggal mulai batch yang sebenarnya.

## Solusi

### 1. Tambah Kolom `week_1_start_date` ke Settings Table
```sql
-- Jalankan query ini di Supabase SQL Editor
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS week_1_start_date DATE DEFAULT '2026-01-06';

-- Set tanggal mulai Week 1 (GANTI dengan tanggal Senin pertama batch Anda)
UPDATE public.settings
SET week_1_start_date = '2026-01-06'
WHERE id = 1;
```

### 2. Update Fungsi `getDateForDayInWeek()` di `dbHelpers.js`
Fungsi sudah diupdate untuk menggunakan tanggal mulai Week 1 yang tetap (6 Januari 2026) sebagai acuan, bukan ISO week.

**Sebelum:**
- Menggunakan ISO week calculation (dimulai dari 4 Januari)
- Week 1 Monday = 30 Desember 2025 (salah!)

**Sesudah:**
- Menggunakan tanggal mulai batch yang sebenarnya (6 Januari 2026)
- Week 1 Monday = 6 Januari 2026 ✅
- Week 2 Monday = 13 Januari 2026 ✅
- Week 3 Monday = 20 Januari 2026 ✅

## Cara Test

### Test 1: Cek Tanggal Week 1
```javascript
// Di browser console
import { getDateForDayInWeek } from './utils/dbHelpers';

// Week 1, Monday
const date = getDateForDayInWeek('monday', 1, 2026);
console.log(date); // Harus: Mon Jan 06 2026
```

### Test 2: Cek Tanggal Week 2
```javascript
// Week 2, Monday
const date = getDateForDayInWeek('monday', 2, 2026);
console.log(date); // Harus: Mon Jan 13 2026
```

### Test 3: Cek di UI
1. Buka halaman booking
2. Pilih Week 2
3. Lihat tanggal di setiap hari
4. Pastikan Monday = 13 Jan, Tuesday = 14 Jan, dst.

## Konfigurasi Week Start Date

Jika batch Anda mulai di tanggal lain, update di 2 tempat:

### 1. Database (Optional - untuk future enhancement)
```sql
UPDATE public.settings
SET week_1_start_date = '2026-01-13'  -- Ganti dengan tanggal Senin pertama batch Anda
WHERE id = 1;
```

### 2. Code (Wajib untuk sekarang)
Edit file `src/utils/dbHelpers.js`:
```javascript
// Line ~760
const week1StartDate = new Date(2026, 0, 6); // Ganti 6 dengan tanggal Senin pertama
```

## Catatan Penting

1. **Week Start Date harus hari SENIN**
   - Sistem mengasumsikan minggu dimulai dari Senin
   - Jika batch mulai hari lain, gunakan Senin terdekat sebelumnya

2. **Week Number tetap 1-8**
   - Tidak menggunakan ISO week number
   - Week 1 = minggu pertama batch
   - Week 8 = minggu terakhir batch

3. **Tanggal mengikuti kalender sebenarnya**
   - Week 1 Monday = 6 Jan 2026
   - Week 1 Tuesday = 7 Jan 2026
   - Week 2 Monday = 13 Jan 2026
   - dst.

## Files Modified
- ✅ `src/utils/dbHelpers.js` - Updated `getDateForDayInWeek()` function
- ✅ `database/ADD_WEEK_START_DATE.sql` - SQL untuk tambah kolom (optional)

## Status
✅ Fixed - Tanggal sekarang mengikuti minggu kalender yang sebenarnya
