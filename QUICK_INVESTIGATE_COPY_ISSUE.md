# Quick: Investigasi Copy Week Issue

## 🚨 Problem
Copy week tidak 100% - ada siswa hilang, ada yang pindah kelas otomatis.

## 🔍 Investigasi Sekarang (5 menit)

### Run Query Ini:
```
booking-system/database/INVESTIGATE_COPY_WEEK_ISSUE.sql
```

### Apa yang Akan Ditemukan:

1. **Siswa yang Hilang**
   - Talitha Raabih Faatihah
   - St. Nur Afifah
   - Ada di week lama? ✓ atau ✗
   - Ada di week baru? ✓ atau ✗

2. **Siswa yang Pindah Otomatis**
   - Nilna (Tokyo → Oxford)
   - Kenapa pindah?

3. **Timing Analysis**
   - Kapan copy dijalankan?
   - Kapan siswa booking?
   - Siapa yang booking duluan?

4. **Kapasitas Kelas**
   - Kelas mana yang full?
   - Full sebelum atau sesudah copy?

5. **Success Rate**
   - Berapa % siswa ter-copy?
   - Berapa siswa hilang?

## 🎯 Kemungkinan Penyebab

### Penyebab 1: Race Condition ⚡
```
12:00:00 AM - Copy dimulai
12:00:05 AM - Siswa baru booking (kelas jadi full)
12:00:10 AM - Copy coba masukkan siswa lama (GAGAL - full)
```

**Ciri-ciri:**
- Ada booking jam 00:00-00:05
- Kelas jadi full cepat
- Siswa lama tidak masuk

### Penyebab 2: Kelas Sudah Full 🔴
```
Sebelum copy:
- Siswa baru booking duluan
- Kelas jadi full
- Copy tidak bisa masukkan siswa lama
```

**Ciri-ciri:**
- Kelas full sebelum copy
- Banyak booking baru
- Siswa lama hilang

### Penyebab 3: Bug di Copy Function 🐛
```
Copy function skip beberapa siswa
- Tidak ada pattern jelas
- Random siswa hilang
```

**Ciri-ciri:**
- Success rate < 95%
- Siswa hilang random
- Tidak terkait kapasitas

## 💡 Solusi

### Solusi Cepat (Sekarang):
1. Restore siswa yang hilang manual
2. Pindahkan siswa yang salah kelas

### Solusi Permanen:
1. **Lock schedule saat copy**
   - Tidak ada booking baru saat copy
   - Copy selesai dulu, baru buka booking

2. **Priority system**
   - Siswa lama prioritas
   - Siswa baru booking slot kosong

3. **Verification step**
   - Check jumlah siswa sebelum vs sesudah
   - Alert admin jika ada yang hilang

## 📊 Expected Results

Query akan show:
```
========================================
COPY WEEK SUMMARY
========================================
Previous Week (1) Students: 45
Current Week (2) Students: 43
Missing Students: 2
New Students: 0
Copy Success Rate: 95.56%
========================================

MISSING FROM CURRENT WEEK:
- Talitha Raabih Faatihah (Oxford - Wednesday evening)
- St. Nur Afifah (Oxford - Wednesday evening)
```

## ⏭️ Next Steps

1. **Run investigation query** (5 min)
2. **Identify root cause** (2 min)
3. **Create fix query** (5 min)
4. **Implement prevention** (10 min)

---

**Total time:** ~22 minutes

**Files:**
- `database/INVESTIGATE_COPY_WEEK_ISSUE.sql` - Investigation
- `CARA_LACAK_COPY_WEEK_ISSUE.md` - Detailed guide
- `MASALAH_COPY_WEEK_TIDAK_100_PERSEN.md` - Problem analysis
