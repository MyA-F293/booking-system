# 🔄 Solusi Restore Jadwal Asli Siswa

## Masalah

Setelah jalankan `COMPREHENSIVE_DUPLICATE_FIX.sql`, schedule yang berbeda ter-merge jadi satu, sehingga:
- Siswa yang pilih jadwal berbeda sekarang jadi 1 kelas
- Kelas jadi overcapacity (lebih dari 10 siswa)
- Siswa tidak tahu jadwal mereka berubah

## Tantangan

**Tidak ada backup data sebelum merge!** Jadi kita tidak tahu jadwal asli masing-masing siswa.

---

## 🎯 Solusi yang Tersedia

### Opsi 1: Restore Berdasarkan Waktu Booking (Otomatis)

**Asumsi:** Siswa yang booking di waktu berdekatan kemungkinan dari schedule yang sama.

**Cara:**
1. Lihat waktu booking setiap siswa (`created_at`)
2. Siswa yang booking lebih dulu = schedule asli (keep di Afternoon)
3. Siswa yang booking belakangan = schedule duplicate (pindah ke Evening)

**Kelebihan:**
- ✅ Otomatis
- ✅ Cepat

**Kekurangan:**
- ❌ Mungkin tidak akurat 100%
- ❌ Siswa mungkin tidak di jadwal asli mereka

**File:** `database/RESTORE_ORIGINAL_SCHEDULES.sql`

---

### Opsi 2: Manual Assignment (Paling Akurat)

**Cara:**
1. Tanya siswa satu per satu jadwal asli mereka
2. Atau lihat dari catatan/screenshot sebelumnya
3. Manual assign siswa ke jadwal yang benar

**Kelebihan:**
- ✅ 100% akurat
- ✅ Siswa pasti di jadwal asli mereka

**Kekurangan:**
- ❌ Butuh waktu lama
- ❌ Harus tanya semua siswa

---

### Opsi 3: Biarkan Siswa Pilih Ulang

**Cara:**
1. Cancel semua booking untuk week 9
2. Buat schedule baru (Afternoon + Evening untuk setiap kelas)
3. Kasih tahu siswa untuk pilih jadwal ulang
4. Siswa pilih jadwal yang mereka mau

**Kelebihan:**
- ✅ Siswa bisa pilih jadwal yang mereka mau
- ✅ Tidak perlu tebak-tebakan
- ✅ Fresh start

**Kekurangan:**
- ❌ Siswa harus pilih ulang
- ❌ Mungkin ada yang lupa pilih

---

### Opsi 4: Split Berdasarkan Urutan Booking + Konfirmasi

**Cara:**
1. Split otomatis berdasarkan waktu booking (Opsi 1)
2. Kasih tahu siswa jadwal baru mereka
3. Siswa bisa request pindah kalau salah
4. Admin pindahkan manual kalau ada request

**Kelebihan:**
- ✅ Cepat (otomatis dulu)
- ✅ Bisa koreksi kalau salah
- ✅ Fleksibel

**Kekurangan:**
- ❌ Mungkin ada beberapa siswa yang harus pindah

---

## 🤔 Rekomendasi Saya

**Opsi 4: Split Otomatis + Konfirmasi**

Alasan:
1. Paling praktis (tidak perlu tanya semua siswa dulu)
2. Bisa koreksi kalau ada yang salah
3. Siswa tetap bisa request pindah

### Langkah-langkah:

**Step 1: Split Otomatis (5 menit)**
```sql
-- Jalankan: database/RESTORE_ORIGINAL_SCHEDULES.sql
-- Lihat hasil split berdasarkan waktu booking
```

**Step 2: Review Split (5 menit)**
```
Lihat hasil split:
- Apakah masuk akal?
- Apakah ada pola yang jelas?
```

**Step 3: Execute Split (5 menit)**
```sql
-- Jalankan: URGENT_FIX_OVERCAPACITY.md
-- Split kelas overcapacity ke Afternoon + Evening
```

**Step 4: Notifikasi Siswa (Manual)**
```
Kirim pesan ke siswa:
"Jadwal kelas minggu ini telah diupdate. 
Silakan cek jadwal Anda di portal.
Jika jadwal tidak sesuai, hubungi admin untuk pindah."
```

**Step 5: Handle Request Pindah (Manual)**
```
Kalau ada siswa yang jadwalnya salah:
- Admin pindahkan manual via dashboard
- Atau jalankan query UPDATE bookings
```

---

## 📊 Contoh: Oxford Friday

### Before Fix (Sebelum COMPREHENSIVE_DUPLICATE_FIX):
```
Schedule A (Afternoon): 10 siswa
Schedule B (Evening): 8 siswa
Total: 18 siswa di 2 schedule berbeda
```

### After Wrong Fix (Sekarang):
```
Schedule A (Afternoon): 18 siswa ❌
Schedule B: Deleted
```

### After Restore (Yang Kita Mau):
```
Schedule A (Afternoon): 10 siswa ✅
Schedule C (Evening): 8 siswa ✅
```

**Pertanyaan:** Siswa mana yang harusnya di Afternoon, mana yang di Evening?

**Jawaban Opsi 1 (Otomatis):**
- 10 siswa yang booking PERTAMA → Afternoon
- 8 siswa yang booking TERAKHIR → Evening

**Jawaban Opsi 2 (Manual):**
- Tanya setiap siswa jadwal asli mereka

**Jawaban Opsi 3 (Pilih Ulang):**
- Semua siswa pilih ulang

**Jawaban Opsi 4 (Otomatis + Konfirmasi):**
- Split otomatis dulu (seperti Opsi 1)
- Siswa bisa request pindah kalau salah

---

## 🚀 Action Plan (Opsi 4 - Recommended)

### Hari Ini:

1. **Jalankan RESTORE_ORIGINAL_SCHEDULES.sql** (5 menit)
   - Lihat hasil split berdasarkan waktu booking
   - Review apakah masuk akal

2. **Jalankan URGENT_FIX_OVERCAPACITY.md** (10 menit)
   - Split kelas overcapacity
   - Verify tidak ada lagi overcapacity

3. **Kirim Notifikasi ke Siswa** (Manual)
   ```
   Subject: Update Jadwal Kelas Minggu Ini
   
   Halo,
   
   Jadwal kelas minggu ini telah diupdate.
   Silakan cek jadwal Anda di portal: [link]
   
   Jika jadwal tidak sesuai dengan pilihan Anda,
   silakan hubungi admin untuk pindah jadwal.
   
   Terima kasih!
   ```

### Besok:

4. **Handle Request Pindah** (Manual)
   - Siswa yang jadwalnya salah bisa request pindah
   - Admin pindahkan via dashboard atau SQL

5. **Verify Semua OK** (5 menit)
   - Check tidak ada lagi overcapacity
   - Check siswa sudah di jadwal yang benar

---

## 📝 Query untuk Handle Request Pindah

Kalau ada siswa yang mau pindah jadwal:

```sql
-- Contoh: Pindahkan Faradilla dari Afternoon ke Evening

-- 1. Cari booking ID Faradilla
SELECT b.id, u.full_name, c.name, s.day, s.time_slot
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Faradilla%'
    AND s.week_number = 9;

-- 2. Cari schedule Evening yang mau dituju
SELECT s.id, c.name, s.day, s.time_slot, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
    AND s.day = 'friday'
    AND s.time_slot = 'evening'
    AND s.week_number = 9;

-- 3. Pindahkan booking
UPDATE bookings
SET schedule_id = '<evening_schedule_id>'
WHERE id = '<faradilla_booking_id>';

-- 4. Update current_students
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) FROM bookings 
    WHERE schedule_id = schedules.id AND status = 'confirmed'
)
WHERE id IN ('<afternoon_schedule_id>', '<evening_schedule_id>');
```

---

## ✅ Summary

**Pilih Opsi 4:**
1. Split otomatis berdasarkan waktu booking
2. Notifikasi siswa untuk cek jadwal
3. Handle request pindah manual
4. Verify semua OK

**Estimasi Waktu Total:** 30 menit + handle request

**Apakah ini solusi yang Anda mau?** Atau mau pilih opsi lain?
