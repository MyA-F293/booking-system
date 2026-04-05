# 📅 Penjelasan: Week 1 vs Booking Week 2

## Pertanyaan
"Kok week 1 tapi booking week 2? Apakah aman?"

## Jawaban: ✅ INI NORMAL DAN AMAN!

### Sistem Week Dijelaskan

#### Current Week = 1
- Ini adalah **week yang sedang berjalan sekarang**
- Week 1 = 30 Maret - 5 April 2026
- Hari ini: **5 April 2026 (Minggu)**

#### Booking Week = 2
- Ini adalah **week yang siswa book untuk minggu depan**
- Week 2 = 6 April - 12 April 2026
- Siswa book untuk **minggu depan** (advance booking)

### Kenapa Begini?

Sistem booking EYSA dirancang untuk:
1. **Booking dibuka Kamis-Sabtu** setiap minggu
2. **Siswa book untuk minggu depan** (bukan minggu ini)
3. **Current week auto-increment** setiap Minggu pukul 00:00 UTC

### Timeline Contoh

```
Week 1 (30 Mar - 5 Apr):
├─ Kamis 3 Apr: Booking DIBUKA untuk Week 2
├─ Jumat 4 Apr: Siswa bisa book Week 2
├─ Sabtu 5 Apr: Siswa bisa book Week 2
└─ Minggu 6 Apr 00:00 UTC: GitHub Actions increment current_week → 2

Week 2 (6 Apr - 12 Apr):
├─ Senin-Rabu: Kelas berjalan (Week 2)
├─ Kamis 10 Apr: Booking DIBUKA untuk Week 3
├─ Jumat 11 Apr: Siswa bisa book Week 3
├─ Sabtu 12 Apr: Siswa bisa book Week 3
└─ Minggu 13 Apr 00:00 UTC: GitHub Actions increment current_week → 3
```

---

## ⚠️ JANGAN Update current_week Manual!

### Kenapa?
- `current_week` sudah di-set **auto-increment via GitHub Actions**
- Setiap Minggu pukul 00:00 UTC, GitHub Actions akan:
  1. Panggil API Supabase
  2. Increment `current_week` + 1
  3. Copy schedules dari week sekarang ke week depan

### Kalau Di-update Manual?
- ❌ Sistem auto-increment akan kacau
- ❌ Week bisa loncat-loncat
- ❌ Schedules tidak ter-copy dengan benar

---

## ✅ Yang Harus Dilakukan Sekarang

### 1️⃣ Tambah Kolom force_close_booking SAJA

Jalankan SQL ini di Supabase:

```sql
-- Tambah kolom force_close_booking (TIDAK UBAH current_week!)
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS force_close_booking BOOLEAN DEFAULT FALSE;

-- Verify (pastikan current_week tetap 1)
SELECT id, current_week, force_close_booking FROM settings WHERE id = 1;
```

**Expected**:
- `current_week = 1` ✅ (TIDAK BERUBAH)
- `force_close_booking = false` ✅ (BARU DITAMBAHKAN)

### 2️⃣ Tunggu Deploy Netlify

Code sudah di-push. Netlify akan auto-deploy (~2-3 menit).

### 3️⃣ Test Force Close Feature

#### Test Admin:
1. Login admin
2. Klik "Force Close" → Booking tertutup
3. Refresh → Setting tetap
4. Klik lagi → Booking terbuka

#### Test Siswa:
1. Login siswa
2. Refresh page (Ctrl+F5)
3. Harus lihat perubahan yang sama dengan admin

---

## 🔍 Cek Status Week System

### Cek Current Week:
```sql
SELECT 
    id,
    current_week,
    force_close_booking,
    updated_at
FROM settings
WHERE id = 1;
```

### Cek GitHub Actions Status:
1. Buka: https://github.com/[your-repo]/actions
2. Lihat workflow: "Auto Increment Week"
3. Cek last run: Harus setiap Minggu

### Cek Schedules:
```sql
-- Cek schedules week 1 dan 2
SELECT 
    week_number,
    COUNT(*) as total_schedules,
    COUNT(DISTINCT program) as programs,
    COUNT(DISTINCT class_name) as classes
FROM schedules
WHERE week_number IN (1, 2)
GROUP BY week_number
ORDER BY week_number;
```

**Expected**:
- Week 1: Ada schedules (week sekarang)
- Week 2: Ada schedules (week depan, untuk booking)

---

## 📊 Summary

| Item | Status | Keterangan |
|------|--------|------------|
| `current_week = 1` | ✅ BENAR | Week yang sedang berjalan |
| Booking untuk week 2 | ✅ BENAR | Advance booking untuk minggu depan |
| Auto-increment setup | ✅ AKTIF | GitHub Actions setiap Minggu |
| Force close column | ⏳ PENDING | Perlu jalankan SQL |
| Code deployment | ✅ DONE | Sudah di-push ke GitHub |

---

## 🎯 Action Items

1. ✅ **Jangan** update `current_week` manual
2. ⏳ **Jalankan** SQL untuk tambah `force_close_booking` column
3. ⏳ **Tunggu** Netlify deploy selesai
4. ⏳ **Test** force close feature (admin + siswa)

---

**Kesimpulan**: Week 1 dengan booking week 2 adalah **NORMAL dan AMAN**. Ini adalah cara sistem booking EYSA bekerja (advance booking 1 minggu ke depan).

**Created**: April 5, 2026  
**Status**: ✅ Explained  
**Priority**: 📚 Documentation
