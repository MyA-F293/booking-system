# Masalah: Copy Week Tidak 100%

## ✅ UPDATE: ANALISIS SELESAI

**KESIMPULAN PENTING**: 
- ❌ Analisis ChatGPT SALAH - kode copy week SUDAH BENAR
- ✅ Kode SUDAH pakai `class_id` dalam JOIN
- ✅ Kode SUDAH ada capacity check dan duplicate prevention
- 🔍 Root cause sebenarnya: Race condition / Timing / Overcapacity prevention

**Baca analisis lengkap**: `ANALISIS_COPY_WEEK_VS_CHATGPT.md`

**Next step**: Jalankan `database/INVESTIGATE_COPY_WEEK_COMPLETE.sql` untuk konfirmasi penyebab actual

---

## Laporan User

### Kasus 1: Siswa Tidak Ter-copy
**Siswa yang hilang:**
- Talitha Raabih Faatihah
- St. Nur Afifah

**Jadwal:** Rabu malam (Wednesday evening)

**Kronologi:**
1. Pekan kemarin ada namanya di jadwal Rabu malam
2. Admin tekan tombol copy jam 12 malam
3. Pekan ini jadwal Rabu malam tidak ada nama mereka
4. Padahal jadwal Rabu malam belum full

### Kasus 2: Siswa Pindah Kelas Otomatis
**Siswa:** Nilna

**Kronologi:**
1. Pekan kemarin: Tokyo Class
2. Pekan ini: Oxford Class
3. Padahal tidak pernah ubah-ubah
4. Oxford Class sudah full

### Kasus 3: Nama Baru Muncul
**Jadwal:** Maksimal 10 orang
**Masalah:** Ada nama baru di jadwal, tapi nama lama tidak diikutkan

## Analisis Masalah

### Kemungkinan Penyebab

#### 1. Race Condition (Timing Issue)
```
SCENARIO:
12:00 AM - Admin tekan tombol Copy Week
12:00:05 AM - Copy process dimulai
12:00:10 AM - Siswa mulai booking kelas baru
12:00:15 AM - Copy process selesai (tapi siswa sudah booking duluan)

RESULT:
- Siswa yang booking duluan masuk ke jadwal baru
- Siswa lama tidak ter-copy karena kelas sudah full
```

#### 2. Kapasitas Penuh Sebelum Copy
```
SCENARIO:
Week 2 (lama): Oxford Class - 10 siswa
Week 3 (baru): Oxford Class - 0 siswa

Siswa baru booking Week 3 Oxford:
- Siswa A booking → 1/10
- Siswa B booking → 2/10
- ... (8 siswa lagi booking)
- Total: 10/10 (FULL)

Copy Week dijalankan:
- Coba copy 10 siswa lama
- Tapi kelas sudah full
- Siswa lama tidak masuk ❌
```

#### 3. Copy Function Tidak Handle Overcapacity
```javascript
// Kemungkinan logic di copy function:
for (booking in old_week_bookings) {
    if (new_schedule.current_students < 10) {
        // Copy booking
    } else {
        // Skip (kelas full) ❌
    }
}
```

## Investigasi

### Query 1: Check Timing Copy vs Booking
Cek kapan copy dijalankan vs kapan siswa booking

### Query 2: Check Kapasitas Sebelum Copy
Cek apakah kelas sudah full sebelum copy

### Query 3: Check Siswa yang Hilang
Cek siswa yang ada di week lama tapi tidak di week baru

### Query 4: Check Siswa yang Pindah Otomatis
Cek siswa yang pindah kelas tanpa action manual

## Solusi

### Solusi 1: Copy Dulu, Baru Buka Booking
```
1. Admin tekan Copy Week
2. System tutup booking sementara
3. Copy semua siswa dari week lama
4. Buka booking untuk siswa baru
```

### Solusi 2: Prioritas Copy Over New Booking
```
1. Copy function jalan dulu
2. Siswa lama punya prioritas
3. Siswa baru hanya bisa booking slot kosong
```

### Solusi 3: Increase Capacity Temporarily
```
1. Saat copy, naikkan capacity sementara
2. Copy semua siswa lama
3. Kembalikan capacity ke normal
4. Siswa yang over capacity tetap bisa masuk
```

### Solusi 4: Lock Schedule During Copy
```
1. Lock schedule saat copy process
2. Tidak ada booking baru bisa masuk
3. Setelah copy selesai, unlock
```

## Rekomendasi

**BEST SOLUTION: Kombinasi 1 + 4**

1. **Lock schedule during copy**
   - Prevent race condition
   - Ensure copy completes first

2. **Copy dulu, baru buka booking**
   - Siswa lama punya prioritas
   - Siswa baru booking slot kosong

3. **Add verification step**
   - Check jumlah siswa sebelum vs sesudah copy
   - Alert admin jika ada yang hilang

## Next Steps

1. Run investigasi query
2. Identify exact cause
3. Implement solution
4. Test thoroughly
5. Deploy fix

---

**Files:**
- `database/INVESTIGATE_COPY_WEEK_ISSUE.sql` - Investigation queries
- `database/FIX_COPY_WEEK_PRIORITY.sql` - Fix with priority system
- `COPY_WEEK_TIMING_GUIDE.md` - Best practice guide
