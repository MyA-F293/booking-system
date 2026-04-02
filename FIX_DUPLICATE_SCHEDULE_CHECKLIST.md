# ✅ Checklist: Fix Duplicate Schedule Error

## 🎯 Tujuan
Mengatasi error "Duplicate schedule detected!" saat membuat jadwal Oxford Class Monday Evening Phase 1, TANPA menghilangkan 7 siswa yang sudah enrolled.

## ⚠️ PENTING
Ada 7 siswa di Week 1 schedule! Kita harus gunakan solusi yang aman agar siswa tidak kehilangan booking mereka.

## 📋 Langkah-Langkah

### ☑️ Step 1: Buka Supabase SQL Editor
1. Login ke Supabase Dashboard
2. Pilih project booking system
3. Klik "SQL Editor" di sidebar kiri

### ☑️ Step 2: Jalankan SQL Merge (SAFE)
1. Buka file: `booking-system/database/MERGE_OXFORD_DUPLICATES_SAFE.sql`
2. Copy OPTION A (RECOMMENDED) - hanya 1 query:
   ```sql
   DELETE FROM schedules
   WHERE id = '475230e7-3356-4898-931d-898bbcf46484';
   ```
3. Paste ke Supabase SQL Editor
4. Klik "Run" atau tekan Ctrl + Enter
5. Tunggu sampai muncul "Success"

**Kenapa OPTION A?**
- ✅ Week 1 sudah ada 7 siswa enrolled
- ✅ Week 2 kosong (0 siswa)
- ✅ Paling aman - tidak ada data loss
- ✅ Paling simple - hanya 1 DELETE query

**Expected Output:**
```
DELETE 1    -- Deleted 1 schedule (Week 2 yang kosong)
```

**Alternative: OPTION B** (jika ingin siswa di Week 2)
```sql
-- Move bookings dari Week 1 ke Week 2
UPDATE bookings
SET schedule_id = '475230e7-3356-4898-931d-898bbcf46484'
WHERE schedule_id = 'da862ee7-4eea-4976-b084-277c9fd21454';

-- Update student count
UPDATE schedules
SET current_students = 7
WHERE id = '475230e7-3356-4898-931d-898bbcf46484';

-- Delete Week 1 schedule
DELETE FROM schedules
WHERE id = 'da862ee7-4eea-4976-b084-277c9fd21454';
```

### ☑️ Step 3: Verify Schedules Terhapus
Jalankan query verification (sudah ada di file SQL):
```sql
SELECT 
    s.id,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    s.current_students,
    c.name as class_name
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'monday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase1'
ORDER BY s.week_number;
```

**Expected Result:** 0 rows (no schedules found) ✅

### ☑️ Step 4: Hard Refresh Browser
1. Buka browser dengan booking system admin
2. Tekan **Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac)
3. Tunggu 2-3 detik sampai page reload selesai
4. Browser akan load data fresh dari database

### ☑️ Step 5: Coba Buat Schedule Lagi (Jika Perlu)

**Setelah OPTION A (Week 2 terhapus):**

Sekarang kamu bisa:

**Cara 1: Create Schedule Manual untuk Week 2**
1. Klik tombol "Create Schedule"
2. Isi form:
   - Class: Oxford Class
   - Day: Monday
   - Time Slot: Evening
   - Phase: Phase 1
   - Week: 2
   - Program: (pilih program)
   - Level: (pilih level)
3. Klik "Save"

**Cara 2: Gunakan Copy Week (RECOMMENDED)**
1. Pastikan di Week 1
2. Klik "Copy Previous Week" atau "Copy to Next Week"
3. Week 1 akan dicopy ke Week 2 (termasuk 7 siswa!)
4. Lebih cepat dan aman

**Expected Result:** 
```
✅ Schedule created successfully!
```

### ☑️ Step 6: Verify Siswa Masih Ada
Jalankan query ini untuk memastikan siswa tidak hilang:
```sql
SELECT 
    s.week_number,
    COUNT(b.id) as total_students,
    STRING_AGG(u.full_name, ', ') as student_names
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
LEFT JOIN users u ON b.user_id = u.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'monday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase1'
GROUP BY s.week_number;
```

**Expected Result:**
- Week 1: 7 students (nama-nama siswa) ✅
- Week 2: (kosong atau ada siswa jika sudah dicopy)

---

## 🔍 Troubleshooting

### Masalah: Masih muncul "Duplicate schedule detected!"

**Solusi 1: Cek apakah SQL sudah dijalankan**
```sql
-- Jalankan query ini untuk cek
SELECT COUNT(*) as total
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'monday'
  AND s.time_slot = 'evening'
  AND s.phase = 'phase1';
```
- Jika total > 0, berarti schedule masih ada
- Jalankan ulang SQL delete

**Solusi 2: Hard refresh lagi**
- Tekan Ctrl + Shift + R beberapa kali
- Atau clear browser cache completely
- Atau coba di browser lain (incognito mode)

**Solusi 3: Tunggu beberapa detik**
- Database mungkin masih sync
- Tunggu 5-10 detik
- Refresh page normal (F5)
- Coba create lagi

### Masalah: Error lain muncul

**Error: "Class is full!"**
- Schedule sudah ada dan penuh (10 students)
- Cek di list schedules apakah schedule sudah ada
- Jika sudah ada, tidak perlu create lagi

**Error: "Invalid data!"**
- Cek semua field sudah diisi
- Pastikan kombinasi day-phase benar:
  - Monday = Phase 1 only
  - Thursday = Phase 2 only
  - Sunday = Recap only

---

## 📊 Summary

**Before:**
- ❌ 2 duplicate schedules di database
- ❌ Browser cache menampilkan data lama
- ❌ Error saat create schedule
- ⚠️ 7 siswa di Week 1 terancam kehilangan booking

**After (OPTION A):**
- ✅ Week 2 duplicate terhapus
- ✅ Week 1 tetap ada dengan 7 siswa aman
- ✅ Browser cache cleared
- ✅ Bisa create Week 2 schedule baru atau copy dari Week 1
- ✅ Tidak ada data loss!

**Time Required:** ~3 minutes

**Risk:** Very Low (hanya delete schedule kosong, siswa tetap aman)

---

## 📝 Notes

- ✅ 7 siswa di Week 1 tetap aman, tidak perlu re-book
- ✅ Gunakan Copy Week untuk copy Week 1 ke Week 2 (termasuk siswa)
- ✅ Selalu hard refresh setelah delete schedule
- ✅ Jangan double-click tombol Create

**File Reference:**
- SQL: `booking-system/database/MERGE_OXFORD_DUPLICATES_SAFE.sql`
- Guide: `booking-system/CARA_FIX_DUPLICATE_SCHEDULE_ERROR.md`
