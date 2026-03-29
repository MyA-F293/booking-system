# Cara Test Fix Tanggal Week

## Masalah yang Diperbaiki
Sebelumnya sistem menampilkan "Week 2" tapi tanggalnya salah (Jan 5 padahal seharusnya Jan 13).

## Yang Sudah Diperbaiki
✅ Fungsi `getDateForDayInWeek()` di `dbHelpers.js` sudah diupdate
✅ Sekarang menggunakan tanggal mulai batch yang sebenarnya (6 Januari 2026)
✅ Week number tetap 1-8, tapi tanggal mengikuti kalender yang benar

## Cara Test

### 1. Buka Aplikasi
```
http://localhost:5174
```

### 2. Login sebagai Student
Gunakan akun student yang sudah ada.

### 3. Cek Tanggal di Booking Dashboard

#### Week 1 (Sudah Lewat)
- Monday harus: **Mar 16**
- Tuesday harus: **Mar 17**
- Wednesday harus: **Mar 18**
- Thursday harus: **Mar 19**
- Friday harus: **Mar 20**
- Saturday harus: **Mar 21**
- Sunday harus: **Mar 22**

#### Week 2 (Current Week - Minggu Ini)
- Monday harus: **Mar 23**
- Tuesday harus: **Mar 24**
- Wednesday harus: **Mar 25**
- Thursday harus: **Mar 26**
- Friday harus: **Mar 27**
- Saturday harus: **Mar 28**
- Sunday harus: **Mar 29** ← Hari ini

#### Week 3 (Next Week - Untuk Booking)
- Monday harus: **Mar 30**
- Tuesday harus: **Mar 31**
- Wednesday harus: **Apr 1** ✅ (Masuk April!)
- Thursday harus: **Apr 2**
- Friday harus: **Apr 3**
- Saturday harus: **Apr 4**
- Sunday harus: **Apr 5**

### 4. Verifikasi di Admin Dashboard
1. Login sebagai admin
2. Buka Admin Booking Dashboard
3. Pilih Week 2
4. Pastikan tanggal sama dengan di atas

## Expected Result

### ✅ BENAR
```
Week 3, 2026
Monday Mar 30 - Fahd Class (Morning)
Tuesday Mar 31 - Harvard Class (Afternoon)
Wednesday Apr 1 - Oxford Class (Evening)  ← Masuk April!
```

### ❌ SALAH (Sebelumnya)
```
Week 3, 2026
Monday Jan 20 - Fahd Class (Morning)  ← Tanggal salah!
```

## Jika Tanggal Masih Salah

### Cek 1: Pastikan Dev Server Sudah Reload
```bash
# Restart dev server
npm run dev
```

### Cek 2: Clear Browser Cache
1. Tekan `Ctrl + Shift + R` (hard refresh)
2. Atau buka Incognito/Private window

### Cek 3: Cek Console Browser
1. Buka Developer Tools (F12)
2. Lihat Console tab
3. Cari error atau warning

## Konfigurasi Week Start Date

Jika batch Anda mulai di tanggal lain (bukan 6 Januari 2026):

### Edit `src/utils/dbHelpers.js`
```javascript
// Cari baris ini (sekitar line 760):
const week1StartDate = new Date(2026, 2, 16); // March 16, 2026

// Ganti dengan tanggal Senin pertama batch Anda:
const week1StartDate = new Date(2026, 2, 16); // March 16, 2026
// Format: new Date(tahun, bulan-1, tanggal)
// Bulan: 0=Jan, 1=Feb, 2=Mar, dst.
```

## Catatan Penting

1. **Week Start Date harus hari SENIN**
   - Sistem mengasumsikan minggu dimulai dari Senin
   - Pastikan tanggal yang diset adalah hari Senin

2. **Week Number tetap 1-8**
   - Tidak berubah, tetap menggunakan sistem week 1-8
   - Yang berubah hanya perhitungan tanggalnya

3. **Tanggal otomatis dihitung**
   - Week 1 Monday = 16 Mar
   - Week 2 Monday = 16 Mar + 7 hari = 23 Mar
   - Week 3 Monday = 16 Mar + 14 hari = 30 Mar
   - Week 3 Wednesday = 1 Apr (Masuk April!)
   - dst.

## Status
✅ Fixed - Siap untuk ditest!
🔄 Dev server running di http://localhost:5174
