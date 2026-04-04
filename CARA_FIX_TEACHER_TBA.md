# 🔧 Cara Fix Teacher "TBA" - Panduan Lengkap

## Masalah
Beberapa kelas menampilkan "TBA" padahal seharusnya ada nama tutor.

## Solusi (3 Langkah)

---

## 🎯 LANGKAH 1: Fix Program Name (WAJIB DULU!)

### Kenapa Harus Dulu?
- 21 siswa punya program name yang salah
- Ini bikin mereka tidak bisa booking
- Termasuk Naswa (EYSA26020225)

### Cara:
1. **Buka Supabase** → SQL Editor
2. **Buka file**: `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql`
3. **Jalankan step by step**:

#### STEP 1: Verify (Lihat dulu)
```sql
SELECT 
    student_id,
    full_name,
    program,
    level,
    batch,
    (SELECT COUNT(*) FROM bookings b WHERE b.user_id = users.id) as total_bookings
FROM users
WHERE program = 'Campus & Career'
  AND role = 'student'
ORDER BY full_name;
```
**Expected**: Muncul 21 siswa

#### STEP 2: Update (Fix sekarang)
```sql
UPDATE users
SET program = 'English Campus & Career'
WHERE program = 'Campus & Career'
  AND role = 'student';
```
**Expected**: "UPDATE 21"

#### STEP 3: Verify (Cek berhasil)
```sql
SELECT 
    program,
    COUNT(*) as total
FROM users
WHERE role = 'student'
GROUP BY program;
```
**Expected**: Tidak ada lagi "Campus & Career"

### ✅ Selesai!
- 21 siswa sekarang bisa booking
- Naswa bisa booking
- Program name konsisten

**Waktu**: 5-10 menit

---

## 🎯 LANGKAH 2: Cek Teacher Assignment

### Tujuan:
Cari tahu jadwal mana yang tidak punya teacher assigned.

### Cara:
1. **Buka Supabase** → SQL Editor
2. **Jalankan query ini**:

#### Query 1: Hitung Jadwal Tanpa Teacher
```sql
SELECT 
    program,
    COUNT(*) as jadwal_tanpa_teacher,
    SUM(current_students) as total_siswa_terdampak
FROM schedules
WHERE teacher_id IS NULL
  AND current_students > 0
GROUP BY program
ORDER BY jadwal_tanpa_teacher DESC;
```

#### Query 2: Lihat Detail Jadwal
```sql
SELECT 
    s.id,
    s.program,
    s.level,
    s.day,
    s.time_slot,
    c.name as class_name,
    s.current_students,
    s.teacher_id
FROM schedules s
LEFT JOIN classes c ON s.class_id = c.id
WHERE s.teacher_id IS NULL
  AND s.current_students > 0
ORDER BY s.program, s.day, s.time_slot;
```

#### Query 3: Lihat Teacher yang Tersedia
```sql
SELECT 
    id,
    name,
    teacher_id,
    is_active
FROM teachers
WHERE is_active = true
ORDER BY name;
```

### Hasil:
- **Jika ada jadwal tanpa teacher**: Lanjut ke LANGKAH 3
- **Jika tidak ada**: Masalah ada di tempat lain (kasih tau hasil query-nya)

**Waktu**: 5 menit

---

## 🎯 LANGKAH 3: Assign Teacher ke Jadwal

### Tujuan:
Assign teacher yang tepat ke setiap jadwal.

### Cara:
Berdasarkan hasil LANGKAH 2, kita akan buat query seperti ini:

#### Contoh: Assign Teacher A ke Campus & Career
```sql
-- Ganti 'Teacher A' dengan nama teacher yang sesuai
UPDATE schedules
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Teacher A')
WHERE program = 'English Campus & Career'
  AND teacher_id IS NULL
  AND current_students > 0;
```

#### Contoh: Assign Teacher B ke Teens
```sql
-- Ganti 'Teacher B' dengan nama teacher yang sesuai
UPDATE schedules
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Teacher B')
WHERE program = 'English for Teens'
  AND teacher_id IS NULL
  AND current_students > 0;
```

### Verify:
```sql
-- Cek tidak ada lagi jadwal tanpa teacher
SELECT 
    program,
    COUNT(*) as jadwal_tanpa_teacher
FROM schedules
WHERE teacher_id IS NULL
  AND current_students > 0
GROUP BY program;
```
**Expected**: 0 rows (tidak ada jadwal tanpa teacher)

**Waktu**: 10-15 menit

---

## 🧪 TESTING

### Test 1: Naswa Bisa Booking
1. Login sebagai Naswa (EYSA26020225)
2. Buka tab Booking
3. **Expected**: Banyak jadwal tersedia ✅
4. Book jadwal
5. **Expected**: Berhasil tanpa error ✅

### Test 2: Teacher Name Muncul
1. Login sebagai student mana saja
2. Buka tab Booking
3. Lihat class cards
4. **Expected**: Ada nama teacher (bukan "TBA") ✅

### Test 3: Occupied Room Menunjukkan Teacher yang Benar
1. Login sebagai student
2. Buka tab Booking
3. Lihat kelas yang occupied
4. **Expected**: Menunjukkan teacher yang sedang pakai kelas itu ✅

### Test 4: Create Student Baru
1. Login sebagai admin
2. Buka Student Management
3. Create student baru
4. **Expected**: Dropdown menunjukkan "English Campus & Career" ✅
5. Login sebagai student baru
6. Test booking
7. **Expected**: Berhasil ✅

---

## 📋 CHECKLIST LENGKAP

### Database:
- [ ] LANGKAH 1: Fix program name (21 siswa)
  - [ ] Verify 21 students
  - [ ] UPDATE (expect "UPDATE 21")
  - [ ] Verify no more "Campus & Career"
  
- [ ] LANGKAH 2: Cek teacher assignment
  - [ ] Run query 1 (count)
  - [ ] Run query 2 (details)
  - [ ] Run query 3 (available teachers)
  - [ ] Screenshot results
  
- [ ] LANGKAH 3: Assign teachers
  - [ ] Create UPDATE statements
  - [ ] Run SQL
  - [ ] Verify all schedules have teacher

### Testing:
- [ ] Test Naswa booking
- [ ] Test teacher display
- [ ] Test occupied rooms
- [ ] Test create new student

---

## ⏱️ TOTAL WAKTU

| Langkah | Waktu |
|---------|-------|
| 1. Fix program name | 5-10 menit |
| 2. Cek teacher assignment | 5 menit |
| 3. Assign teachers | 10-15 menit |
| Testing | 10-15 menit |
| **TOTAL** | **30-45 menit** |

---

## 🚨 PENTING!

### Harus Urut:
1. ✅ LANGKAH 1 dulu (program name)
2. ✅ LANGKAH 2 kedua (cek teacher)
3. ✅ LANGKAH 3 ketiga (assign teacher)
4. ✅ Testing terakhir

### Kenapa Urut?
- Program name fix bikin room conflict detection jalan
- Harus tahu dulu jadwal mana yang missing teacher
- Baru bisa assign teacher yang tepat
- Test setelah semua selesai

### Aman?
- ✅ 100% AMAN
- ✅ Hanya update text field dan foreign key
- ✅ Tidak hapus data
- ✅ Bookings tetap aman
- ✅ Bisa rollback kalau perlu

---

## 📁 FILE TERKAIT

### SQL Files:
- `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql` - Siap dijalankan
- `booking-system/database/CHECK_TEACHER_ASSIGNMENTS.sql` - Siap dijalankan

### Documentation:
- `booking-system/FIX_TEACHER_TBA_ACTION_PLAN.md` - Action plan lengkap (English)
- `booking-system/CHECK_TEACHER_TBA_ISSUE.md` - Panduan cek teacher
- `booking-system/FIX_PROGRAM_NAME_COMPLETE.md` - Detail program name fix

### Code (Sudah Fixed):
- ✅ `booking-system/src/AdminDashboard.jsx`
- ✅ `booking-system/src/utils/dbHelpers.js`
- ✅ `booking-system/src/BookingSystemDB.jsx`

---

## 🎯 MULAI DARI MANA?

**MULAI DARI LANGKAH 1**: Fix program name dulu!

Buka file: `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql`

Ini akan:
1. Fix 21 siswa yang tidak bisa booking
2. Fix Naswa
3. Bikin room conflict detection jalan
4. Siapkan untuk fix teacher assignment

**Setelah LANGKAH 1 selesai**, lanjut ke LANGKAH 2 untuk cek teacher assignment.

---

**Dibuat**: 4 April 2026  
**Status**: 🔄 Siap Dijalankan  
**Prioritas**: 🔥 TINGGI  
**Estimasi Waktu**: 30-45 menit total
