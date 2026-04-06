# 🚀 JALANKAN INI: Pindahkan Week 15 ke Week 2

## Status: READY TO RUN ✅

Query sudah lengkap dan siap dijalankan!

---

## 📋 Ringkasan Masalah

**Masalah:**
- Database `settings.current_week = 15` (seharusnya 2)
- Siswa melihat Week 15 di tab "New" untuk booking
- 2 siswa sudah booking 6 jadwal di Week 15
- Week 15 adalah 13 minggu ke depan (salah!)

**Penyebab:**
- Kemungkinan GitHub Actions cron berjalan 13x dalam 13 hari
- Atau manual `increment_week()` dipanggil 13x
- Week 2 → Week 15 (naik 13 minggu)

**Siswa Terdampak:**
1. Andi Nadila Salsabila Muslim (EYSA26020105) - 3 bookings
2. Azlam Nas (EYSA26020018) - 3 bookings

---

## ✅ Solusi: Pindahkan (Bukan Hapus!)

**Kenapa pindahkan lebih baik?**
- ✅ Siswa tidak kehilangan booking
- ✅ Tidak perlu booking ulang manual
- ✅ Tidak perlu inform siswa (otomatis)
- ✅ Lebih profesional dan user-friendly
- ✅ Tidak ada data loss

**Apa yang akan dilakukan?**
1. Buat jadwal Week 2 yang missing (Fahd & Tokyo Sunday Afternoon)
2. Pindahkan semua 6 booking dari Week 15 ke Week 2
3. Update counter `current_students` di Week 2
4. Hapus jadwal Week 15 yang sudah kosong
5. Reset `current_week` dari 15 ke 2
6. Hapus semua week 3-14 (future weeks)

---

## 📊 Detail Booking yang Akan Dipindahkan

### Student 1: Andi Nadila Salsabila Muslim (EYSA26020105)
**3 bookings akan dipindahkan:**
- ✅ Fahd Class - Sunday Afternoon (Recap) → Week 2 (akan dibuat)
- ✅ Tsinghua Class - Tuesday Afternoon (Phase1) → Week 2 (sudah ada)
- ✅ Tsinghua Class - Friday Afternoon (Phase2) → Week 2 (sudah ada)

### Student 2: Azlam Nas (EYSA26020018)
**3 bookings akan dipindahkan:**
- ✅ Harvard Class - Tuesday Evening (Phase1) → Week 2 (sudah ada)
- ✅ Oxford Class - Thursday Evening (Phase2) → Week 2 (sudah ada)
- ✅ Tokyo Class - Sunday Afternoon (Recap) → Week 2 (akan dibuat)

---

## 🔧 Cara Menjalankan

### Step 1: Buka Supabase SQL Editor
1. Login ke Supabase Dashboard
2. Pilih project booking system
3. Klik "SQL Editor" di sidebar kiri

### Step 2: Copy Query
1. Buka file: `booking-system/database/MOVE_WEEK_15_TO_WEEK_2.sql`
2. Copy SEMUA isi file (Ctrl+A, Ctrl+C)

### Step 3: Jalankan Query
1. Paste di SQL Editor (Ctrl+V)
2. Klik tombol "Run" atau tekan Ctrl+Enter
3. Tunggu sampai selesai (sekitar 5-10 detik)

### Step 4: Verifikasi Hasil
Query akan otomatis menampilkan hasil verifikasi:
- ✅ Schedules created (2 schedules: Fahd & Tokyo)
- ✅ Bookings moved (6 bookings)
- ✅ Counters updated (Week 2 schedules)
- ✅ Week 15 deleted (0 schedules remaining)
- ✅ Current week reset (current_week = 2)
- ✅ Future weeks deleted (max_week = 2)

---

## 📊 Expected Results

### Before:
```
settings.current_week = 15
Week 15 schedules = 6
Week 15 bookings = 6
Week 2 schedules = 4 (missing Fahd & Tokyo Sunday)
```

### After:
```
settings.current_week = 2
Week 15 schedules = 0 (deleted)
Week 15 bookings = 0 (moved to Week 2)
Week 2 schedules = 6 (added Fahd & Tokyo Sunday)
Week 2 bookings = 6 (moved from Week 15)
Future weeks (3-14) = 0 (deleted)
```

---

## 🔍 Verifikasi Manual (Optional)

Jika ingin double-check setelah menjalankan query:

### Check 1: Current Week
```sql
SELECT current_week FROM settings WHERE id = 1;
-- Expected: 2
```

### Check 2: Week 15 Schedules
```sql
SELECT COUNT(*) FROM schedules WHERE week_number = 15;
-- Expected: 0
```

### Check 3: Week 2 Bookings
```sql
SELECT u.full_name, COUNT(b.id) as bookings
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
WHERE s.week_number = 2
AND u.student_id IN ('EYSA26020105', 'EYSA26020018')
GROUP BY u.full_name;
-- Expected: Andi (3), Azlam (3)
```

### Check 4: Future Weeks
```sql
SELECT MAX(week_number) FROM schedules;
-- Expected: 2
```

---

## 🎯 Apa yang Terjadi di Student App?

**Sebelum fix:**
- Tab "Current" menampilkan Week 15 ❌
- Tab "New" menampilkan Week 16 ❌
- Siswa bingung kenapa week-nya loncat

**Setelah fix:**
- Tab "Current" menampilkan Week 2 ✅
- Tab "New" menampilkan Week 3 ✅
- Booking Andi & Azlam otomatis muncul di Week 2 ✅
- Siswa tidak perlu action apapun ✅

---

## 💬 Perlu Inform Siswa? (Optional)

**Tidak wajib**, karena booking mereka otomatis muncul di Week 2.

Tapi jika ingin inform (via WhatsApp):

```
ℹ️ Update Sistem

Halo Andi/Azlam! 👋

Kami telah memperbaiki sistem booking. 
Booking kamu untuk Week 15 sudah otomatis 
dipindahkan ke Week 2 (week yang benar).

Tidak perlu action dari kamu! 
Jadwal kelas tetap sama. 😊

Terima kasih,
Admin EYSA
```

---

## 🔧 Next Steps Setelah Fix

### 1. Verifikasi GitHub Actions
```bash
# Check cron schedule
cat .github/workflows/auto-increment-week.yml
```

Expected cron: `'1 17 * * 0'` (weekly, Sunday 5:01 PM)

### 2. Monitor Next Week Increment
- Tunggu sampai Sunday, April 13, 2026 jam 17:01
- Check apakah `current_week` naik dari 2 ke 3
- Jika naik lebih dari 1, ada masalah di GitHub Actions

### 3. Add Safeguards (Optional)
Tambahkan validation di `increment_week()` function:
```sql
-- Prevent increment if already incremented today
IF (SELECT updated_at::date FROM settings WHERE id = 1) = CURRENT_DATE THEN
    RAISE EXCEPTION 'Week already incremented today!';
END IF;
```

---

## 🚨 Troubleshooting

### Issue 1: Query Error "duplicate key"
**Penyebab:** Week 2 schedule sudah ada (admin lain buat manual)

**Solusi:** 
- Query akan skip schedule yang sudah ada
- Booking tetap akan dipindahkan
- Tidak masalah, lanjutkan saja

### Issue 2: Query Error "foreign key constraint"
**Penyebab:** Ada data orphan (booking tanpa schedule)

**Solusi:**
```sql
-- Check orphan bookings
SELECT * FROM bookings 
WHERE schedule_id NOT IN (SELECT id FROM schedules);

-- Delete orphan bookings
DELETE FROM bookings 
WHERE schedule_id NOT IN (SELECT id FROM schedules);
```

### Issue 3: Counter Mismatch
**Penyebab:** Trigger `update_schedule_student_count` tidak jalan

**Solusi:**
```sql
-- Fix all counters
UPDATE schedules
SET current_students = (
    SELECT COUNT(*) FROM bookings WHERE schedule_id = schedules.id
)
WHERE week_number = 2;
```

---

## 📁 Files Related

- `database/MOVE_WEEK_15_TO_WEEK_2.sql` - Main query (COMPLETE ✅)
- `database/CHECK_WEEK_15_DETAIL.sql` - Check current state
- `SOLUSI_PINDAHKAN_WEEK_15_KE_WEEK_2.md` - Full documentation
- `KENAPA_WEEK_15_MUNCUL.md` - Root cause analysis
- `KENAPA_SISWA_BISA_BOOKING_WEEK_15.md` - Code analysis
- `MESSAGE_TO_AFFECTED_STUDENTS_WEEK_15.md` - Message templates

---

## ✅ Checklist

Sebelum menjalankan:
- [ ] Backup database (optional tapi recommended)
- [ ] Baca dokumentasi ini sampai selesai
- [ ] Pastikan tidak ada admin lain yang sedang edit schedules

Setelah menjalankan:
- [ ] Verifikasi `current_week = 2`
- [ ] Verifikasi Week 15 schedules = 0
- [ ] Verifikasi Week 2 bookings = 6 (Andi & Azlam)
- [ ] Test di student app (login sebagai Andi atau Azlam)
- [ ] Check GitHub Actions cron schedule
- [ ] (Optional) Inform 2 siswa via WhatsApp

---

## 🎉 Summary

**What we're doing:**
- Moving 6 bookings from Week 15 to Week 2
- Creating 2 missing Week 2 schedules
- Resetting current_week from 15 to 2
- Deleting all future weeks (3-15)

**Impact:**
- 2 students affected (Andi & Azlam)
- 6 bookings moved (not deleted)
- 0 data loss
- 0 manual work for students

**Result:**
- System back to normal ✅
- Students see correct weeks ✅
- Bookings preserved ✅
- Professional solution ✅

---

**Status:** READY TO RUN ✅  
**Priority:** HIGH 🚨  
**Risk:** LOW ✅  
**User Experience:** EXCELLENT 🌟

**Jalankan sekarang!** 🚀
