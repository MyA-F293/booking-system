# Cara Test Fix Program Selection

## Masalah yang Diperbaiki
Sebelumnya, siswa bisa memilih program sendiri saat booking, padahal mereka sudah punya program yang ditentukan di database. Ini bisa menyebabkan:
- Data tidak konsisten
- Siswa booking jadwal program yang salah
- Error di laporan

## Yang Sudah Diperbaiki

### 1. Program Otomatis Terisi
Sekarang program siswa otomatis terisi dari database, tidak bisa diganti-ganti.

### 2. Tampilan Program Berubah
**Sebelum**: Ada 2 tombol untuk pilih program (Campus & Career / English for Teens)
**Sekarang**: Hanya tampil program yang sudah ditentukan (tidak bisa diklik)

### 3. Validasi Ketat
Sistem akan cek:
- Apakah siswa punya program yang ditentukan?
- Apakah program yang dipilih sesuai dengan program siswa?
- Apakah siswa Teens mencoba booking Harvard Class?

## Cara Test

### Test 1: Siswa dengan Program yang Sudah Ditentukan
1. Login sebagai siswa (contoh: Rosnawati)
2. Buka halaman booking
3. **Harusnya**: Muncul kotak biru dengan tulisan "Your Program" dan nama program (contoh: "English Campus & Career")
4. **Harusnya**: Kotak program tidak bisa diklik (locked)
5. Pilih level, phase, day, time
6. **Harusnya**: Hanya muncul jadwal untuk program yang sesuai
7. Coba booking kelas
8. **Harusnya**: Berhasil booking

### Test 2: Siswa Tanpa Program
1. Login sebagai siswa yang belum ada programnya
2. Buka halaman booking
3. **Harusnya**: Muncul kotak merah dengan peringatan "⚠️ No program assigned"
4. Coba booking kelas
5. **Harusnya**: Muncul error "You do not have an assigned program. Please contact admin."

### Test 3: Cek Data di Database
1. Buka Supabase
2. Buka tabel `users`
3. Cek kolom `program` untuk siswa yang login
4. **Harusnya**: Program di database sama dengan yang tampil di halaman booking

### Test 4: Admin Ubah Program Siswa
1. Login sebagai admin
2. Edit program siswa (contoh: dari "Campus & Career" ke "English for Teens")
3. Logout admin
4. Login sebagai siswa yang tadi diubah
5. Buka halaman booking
6. **Harusnya**: Program yang tampil sudah berubah sesuai yang baru

## Screenshot yang Diharapkan

### Tampilan Baru (Program Locked)
```
┌─────────────────────────────────────────┐
│ 1. Your Program                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Assigned Program                    │ │
│ │ English Campus & Career         ✓   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Tampilan Lama (Program Bisa Dipilih) - SUDAH DIHAPUS
```
┌─────────────────────────────────────────┐
│ 1. Select Program                       │
│                                         │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ Campus &     │  │ English for  │     │
│ │ Career       │  │ Teens        │     │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

## Pesan Error yang Mungkin Muncul

### Error 1: Tidak Ada Program
```
⚠️ You do not have an assigned program. Please contact admin.
```
**Solusi**: Admin harus set program untuk siswa ini di Admin Dashboard

### Error 2: Program Tidak Sesuai
```
❌ You can only book classes for your assigned program: English Campus & Career
```
**Solusi**: Sistem otomatis reset ke program yang benar

### Error 3: Harvard Class untuk Teens Only
```
❌ Harvard Class is exclusively for English for Teens program students!
```
**Solusi**: Siswa Campus & Career tidak bisa booking Harvard Class

## Keuntungan Fix Ini

1. ✅ Data konsisten - siswa hanya bisa booking program mereka
2. ✅ Tidak bingung - jelas program mana yang mereka ikuti
3. ✅ Mencegah error - validasi ketat sebelum booking
4. ✅ UX lebih baik - tidak perlu ingat program apa
5. ✅ Laporan akurat - semua booking sesuai program siswa

## File yang Diubah
- `booking-system/src/BookingSystemDB.jsx` - Komponen booking utama

## Catatan Penting
- Admin masih bisa ubah program siswa via Admin Dashboard
- Siswa akan langsung lihat program baru setelah admin ubah
- Booking yang sudah ada tidak terpengaruh
- Fix ini mencegah masalah di masa depan

## Jika Ada Masalah

### Masalah: Program tidak muncul
**Cek**:
1. Apakah siswa punya program di database? (cek tabel `users` kolom `program`)
2. Apakah format program benar? ("Campus & Career" atau "English for Teens")

### Masalah: Masih bisa pilih program
**Cek**:
1. Apakah sudah refresh browser? (Ctrl+F5)
2. Apakah file `BookingSystemDB.jsx` sudah ter-deploy?

### Masalah: Error saat booking
**Cek**:
1. Lihat console browser (F12) untuk error detail
2. Cek apakah program siswa sesuai dengan jadwal yang dipilih
3. Cek apakah validasi berjalan dengan benar

## Kontak
Jika ada masalah atau pertanyaan, hubungi developer.
