# 🚀 JALANKAN INI SEKARANG - Fix Overcapacity

## Status: READY TO EXECUTE ✅

User sudah setuju: "auto split aja asal sesuai"

---

## 📋 Yang Harus Dilakukan (2 Steps)

### STEP 1: Fix Overcapacity (URGENT - 5 menit)

**File:** `booking-system/database/AUTO_SPLIT_WITH_FEEDBACK.sql` ⭐ (Shows progress step by step!)

**IMPORTANT:** Run each section ONE BY ONE, not all at once!

**Apa yang dilakukan:**
- Split 4 kelas overcapacity ke Afternoon + Evening
- Oxford Friday: 18 siswa → 10 (Afternoon) + 8 (Evening)
- Oxford Tuesday: 17 siswa → 10 (Afternoon) + 7 (Evening)
- Harvard Friday: 14 siswa → 10 (Afternoon) + 4 (Evening)
- Harvard Monday: 11 siswa → 10 (Afternoon) + 1 (Evening)

**Cara:**
1. Buka Supabase SQL Editor
2. Copy-paste semua isi file `AUTO_SPLIT_NOW.sql`
3. Klik "Run"
4. Lihat hasil verification (should show 0 overcapacity)

**Hasil:**
- ✅ Semua kelas max 10 siswa
- ✅ 4 schedule baru Evening dibuat otomatis
- ✅ Siswa yang booking terakhir dipindah ke Evening
- ✅ Tidak ada data hilang

---

### STEP 2: Install Duplicate Prevention (10 menit)

**File:** `booking-system/database/PREVENT_DUPLICATE_SCHEDULES.sql`

**Apa yang dilakukan:**
- Install 5 layer protection agar duplicate tidak terjadi lagi
- Auto-set batch dari siswa pertama yang booking
- Trigger untuk prevent duplicate schedules

**Cara:**
1. Buka Supabase SQL Editor
2. Copy-paste semua isi file `PREVENT_DUPLICATE_SCHEDULES.sql`
3. Klik "Run"
4. Lihat hasil verification (should show all protections ACTIVE)

**Hasil:**
- ✅ Tidak bisa buat duplicate schedule lagi
- ✅ Batch auto-set dari siswa pertama
- ✅ Database protected dengan trigger + constraint

---

## ✅ Verification

Setelah jalankan kedua file, verify dengan query ini:

```sql
-- Check no more overcapacity (should return 0 rows)
SELECT 
    c.name, s.day, s.time_slot, s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9 AND s.current_students > 10;

-- Check all week 9 schedules
SELECT 
    c.name, s.day, s.time_slot, s.phase, s.current_students,
    (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id AND b.status = 'confirmed') as actual
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 9 AND s.current_students > 0
ORDER BY c.name, s.day, s.time_slot;
```

---

## 📊 Expected Results

**Week 9 Schedules After Fix:**

Oxford Class:
- Friday Afternoon: 10 siswa ✅
- Friday Evening: 8 siswa ✅
- Tuesday Afternoon: 10 siswa ✅
- Tuesday Evening: 7 siswa ✅

Harvard Class:
- Friday Afternoon: 10 siswa ✅
- Friday Evening: 4 siswa ✅
- Monday Afternoon: 10 siswa ✅
- Monday Evening: 1 siswa ✅

**Total: 8 schedules, semua ≤ 10 siswa** ✅

---

## 🔔 After Fix

1. **Notifikasi Siswa** (Manual)
   ```
   Subject: Update Jadwal Kelas Minggu Ini
   
   Halo,
   
   Jadwal kelas minggu ini telah diupdate.
   Silakan cek jadwal Anda di portal.
   
   Jika jadwal tidak sesuai, hubungi admin untuk pindah.
   
   Terima kasih!
   ```

2. **Handle Request Pindah** (Jika ada)
   - Siswa bisa request pindah jadwal via admin
   - Admin pindahkan manual via dashboard

---

## ⚠️ Important Notes

1. Siswa yang dipindahkan = siswa yang **booking terakhir** (created_at DESC)
2. Semua siswa tetap di batch 1
3. Tidak ada data yang hilang
4. Siswa akan otomatis lihat jadwal baru mereka di portal

---

## 🎯 Summary

**STEP 1:** Jalankan `AUTO_SPLIT_NOW.sql` → Fix overcapacity (5 menit)
**STEP 2:** Jalankan `PREVENT_DUPLICATE_SCHEDULES.sql` → Prevent future duplicates (10 menit)

**Total Time:** 15 menit

**Setelah ini, masalah overcapacity SELESAI dan tidak akan terjadi lagi!** 🎉
