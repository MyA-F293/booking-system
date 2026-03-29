# ✅ TESTING CHECKLIST DETAIL - EYSA Booking System

**Tanggal:** 28 Maret 2026  
**Versi:** 2.0 (Detail Version)  
**Tester:** _____________  
**Browser:** _____________  
**Device:** _____________

---

## 🎯 CARA PAKAI CHECKLIST INI

1. **Persiapan:** Pastikan aplikasi sudah running (localhost atau production)
2. **Baca dengan teliti:** Setiap test case punya langkah detail dan expected result
3. **Lakukan testing:** Ikuti langkah satu per satu, jangan skip
4. **Catat hasil:** Centang ✅ PASS atau ❌ FAIL, tulis notes jika ada masalah
5. **Screenshot:** Ambil screenshot untuk setiap error atau bug
6. **Verifikasi database:** Untuk test tertentu, cek database untuk memastikan data tersimpan
7. **Test ulang:** Jika FAIL, coba test ulang setelah fix untuk memastikan

---

## 📋 FASE 1: LOGIN & AUTHENTICATION

### ✅ Test 1.1: Login Admin - Happy Path
**Tujuan:** Memastikan admin bisa login dengan credentials yang benar

**Pre-condition:**
- Aplikasi sudah running
- Admin account sudah ada di database (username: admin, password: admin123)

**Langkah Detail:**
1. Buka browser (Chrome/Firefox/Edge)
2. Akses URL aplikasi (misal: http://localhost:5173 atau https://portal.eysa.com)
3. Halaman login akan muncul dengan 3 pilihan: Admin, Student, Teacher
4. Klik button "Admin Login" (warna biru)
5. Form login admin akan muncul
6. Ketik username: `admin` (huruf kecil semua)
7. Ketik password: `admin123`
8. Klik button "Login" atau tekan Enter
9. Tunggu loading (biasanya 1-2 detik)

**Expected Result:**
- ✅ Redirect ke halaman Admin Dashboard
- ✅ URL berubah ke `/admin` atau `/admin-dashboard`
- ✅ Header menampilkan nama "Admin" atau "Administrator"
- ✅ Menu admin muncul: Dashboard, Students, Teachers, Classes, Schedules, Attendance, Bulk Operations
- ✅ Stats cards muncul (Total Students, Total Teachers, Total Schedules, dll)
- ✅ Current Week ditampilkan di header (misal: "Week 11")
- ✅ Tidak ada error di console browser (F12)

**Verification:**
- [ ] Bisa akses semua menu admin
- [ ] Nama admin muncul di header
- [ ] Stats cards menampilkan angka yang benar
- [ ] Tidak ada error 404 atau 500

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### ✅ Test 1.2: Login Admin - Wrong Password
**Tujuan:** Memastikan sistem menolak login dengan password salah

**Langkah:**
1. Buka halaman login
2. Klik "Admin Login"
3. Username: `admin`
4. Password: `wrongpassword` (password salah)
5. Klik "Login"

**Expected Result:**
- ❌ Login DITOLAK
- ❌ Muncul error message: "Invalid credentials" atau "Username atau password salah"
- ❌ Tetap di halaman login (tidak redirect)
- ❌ Form tidak di-clear (username masih terisi)

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 1.3: Login Admin - Empty Fields
**Tujuan:** Memastikan validasi required fields

**Langkah:**
1. Buka halaman login
2. Klik "Admin Login"
3. Biarkan username dan password kosong
4. Klik "Login"

**Expected Result:**
- ❌ Login DITOLAK
- ❌ Muncul error: "Username is required" atau "Please fill all fields"
- ❌ Tetap di halaman login

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 1.4: Login Student - Happy Path
**Tujuan:** Memastikan student bisa login dengan credentials yang benar

**Pre-condition:**
- Student account sudah ada di database
- Student ID format: EYSA26010XXX
- Password default: student123

**Langkah Detail:**
1. Buka halaman login
2. Klik button "Student Login" (warna hijau)
3. Form login student akan muncul
4. Ketik Student ID: `EYSA26010001` (atau ID student yang ada di database)
5. Ketik password: `student123`
6. Klik "Login"
7. Tunggu loading

**Expected Result:**
- ✅ Redirect ke halaman Student Dashboard
- ✅ URL berubah ke `/student` atau `/student-dashboard`
- ✅ Header menampilkan nama student (misal: "Welcome, John Doe")
- ✅ Menampilkan program dan level student (misal: "English Campus & Career - Starter")
- ✅ Menu student muncul: Dashboard, New Booking, My Bookings
- ✅ Current Week ditampilkan (misal: "Week 11")
- ✅ Jika ada bookings, ditampilkan di "My Bookings"

**Verification:**
- [ ] Nama student benar sesuai database
- [ ] Program dan level benar
- [ ] Bisa akses menu New Booking
- [ ] Bisa akses menu My Bookings

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### ✅ Test 1.5: Login Student - Wrong Student ID
**Tujuan:** Memastikan sistem menolak Student ID yang tidak ada

**Langkah:**
1. Buka halaman login
2. Klik "Student Login"
3. Student ID: `EYSA99999999` (ID yang tidak ada)
4. Password: `student123`
5. Klik "Login"

**Expected Result:**
- ❌ Login DITOLAK
- ❌ Muncul error: "Student not found" atau "Invalid credentials"

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 1.6: Login Teacher - Happy Path
**Tujuan:** Memastikan teacher bisa login dengan credentials yang benar

**Pre-condition:**
- Teacher account sudah ada di database
- Teacher ID format: TCHR0XXX
- Password default: teacher123

**Langkah Detail:**
1. Buka halaman login
2. Klik button "Teacher Login" (warna orange)
3. Form login teacher akan muncul
4. Ketik Teacher ID: `TCHR0001` (atau ID teacher yang ada)
5. Ketik password: `teacher123`
6. Klik "Login"

**Expected Result:**
- ✅ Redirect ke halaman Teacher Dashboard
- ✅ Header menampilkan nama teacher (misal: "Sir Brian")
- ✅ Menu teacher muncul: Attendance Management
- ✅ List schedules yang di-assign ke teacher ini muncul
- ✅ Bisa klik schedule untuk submit attendance

**Verification:**
- [ ] Nama teacher benar
- [ ] Hanya muncul schedules yang di-assign ke teacher ini
- [ ] Bisa akses attendance form

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

## 📋 FASE 2: ADMIN - STUDENT MANAGEMENT

### ✅ Test 2.1: Create Student Manual
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Students"
3. Klik "Create New Student"
4. Isi form:
   - Student ID: (auto atau manual)
   - Full Name: "Test Student"
   - Batch: 2
   - Program: "English Campus & Career"
   - Level: "Starter"
5. Klik "Save"

**Expected:** 
- Student berhasil dibuat
- Muncul di student list
- Bisa login dengan password: student123

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 2.2: Bulk Import Students
**Langkah:**
1. Login sebagai Admin
2. Klik "Bulk Operations"
3. Tab "Import Students"
4. Download template Excel
5. Isi template dengan 2-3 students
6. Upload file
7. Preview data
8. Klik "Import"

**Expected:**
- Semua students berhasil diimport
- Muncul summary: X success, Y failed
- Students muncul di student list

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 2.3: Edit Student
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Students"
3. Pilih student
4. Klik "Edit"
5. Ubah Level (misal: Starter → Upper Starter)
6. Klik "Save"

**Expected:** Data student berhasil diupdate

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 3: ADMIN - SCHEDULE MANAGEMENT

### ✅ Test 3.1: Create Schedule
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Schedules"
3. Klik "Create Schedule"
4. Isi form:
   - Program: "English Campus & Career"
   - Level: "Starter"
   - Phase: "Phase 1"
   - Day: "Monday"
   - Time Slot: "Afternoon"
   - Class: "Oxford"
   - Teacher: (pilih teacher)
5. Klik "Save"

**Expected:**
- Schedule berhasil dibuat
- Muncul di schedule list
- Available untuk student booking

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 3.2: View Schedule Details
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Schedules"
3. Pilih schedule
4. Klik "View Details"

**Expected:**
- Menampilkan detail schedule
- Menampilkan list students yang book
- Menampilkan current_students / max_capacity

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 4: STUDENT - BOOKING

### ✅ Test 4.1: Student Book Class (Happy Path)
**Langkah:**
1. Login sebagai Student
2. Klik "New Booking"
3. Pilih Program: "English Campus & Career"
4. Pilih Level: "Starter"
5. Pilih Day: "Monday"
6. Pilih Time Slot: "Afternoon"
7. Pilih Class: "Oxford"
8. Klik "Book Now"
9. Konfirmasi

**Expected:**
- Booking berhasil
- Muncul notifikasi success
- Booking muncul di "My Bookings"
- Counter current_students bertambah 1

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 4.2: Validasi Phase Rule (Tidak Bisa Book 2x)
**Langkah:**
1. Login sebagai Student (yang sudah book Phase 1)
2. Coba book lagi Phase 1 di hari lain
3. Klik "Book Now"

**Expected:**
- Booking DITOLAK
- Muncul error: "You have already booked a schedule for this phase"

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 4.3: Validasi Capacity (Class Full)
**Langkah:**
1. Cek capacity class (misal: Oxford max 15)
2. Book sampai full (15 students)
3. Login sebagai student ke-16
4. Coba book class yang sama

**Expected:**
- Booking DITOLAK
- Muncul error: "Class is full"
- Button "Book Now" disabled

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 4.4: Cancel Booking
**Langkah:**
1. Login sebagai Student
2. Buka "My Bookings"
3. Pilih booking yang aktif
4. Klik "Cancel"
5. Konfirmasi

**Expected:**
- Booking status berubah jadi "Cancelled"
- Counter current_students berkurang 1
- Slot tersedia kembali

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 5: TEACHER - ATTENDANCE

### ✅ Test 5.1: Submit Attendance
**Langkah:**
1. Login sebagai Teacher
2. Pilih schedule dari list
3. Sistem menampilkan student list
4. Tandai attendance untuk setiap student:
   - Present / Late / Absent
5. Klik "Submit Attendance"

**Expected:**
- Attendance berhasil disimpan
- Muncul notifikasi success
- Admin bisa lihat di report

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 5.2: Edit Attendance
**Langkah:**
1. Login sebagai Teacher
2. Pilih schedule yang sudah ada attendance
3. Ubah status student (misal: Absent → Late)
4. Klik "Update Attendance"

**Expected:**
- Attendance berhasil diupdate
- Perubahan tersimpan

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 6: ADMIN - REPORTING

### ✅ Test 6.1: View Attendance Report
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Attendance"
3. Filter by:
   - Week: (pilih week)
   - Program: "English Campus & Career"
   - Level: "Starter"
4. Klik "View Report"

**Expected:**
- Menampilkan attendance data sesuai filter
- Menampilkan summary: Total Present, Late, Absent

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 6.2: Export to Excel
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Attendance"
3. Pilih filter
4. Klik "Export to Excel"

**Expected:**
- File Excel ter-download
- Format Excel sesuai (NO, NAME, LEVEL, Week 1-8, TOTAL)
- Data lengkap dan akurat
- TIDAK ADA kolom email, phone, dll

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 7: SYSTEM SETTINGS

### ✅ Test 7.1: Increment Week (Manual)
**Langkah:**
1. Login sebagai Admin
2. Lihat current week di header
3. Klik button "Next Week" (▶)
4. Konfirmasi

**Expected:**
- Week bertambah 1 (misal: Week 11 → Week 12)
- Semua students lihat week baru
- Students bisa book lagi untuk week baru

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 7.2: Reset Batch
**Langkah:**
1. Login sebagai Admin
2. Klik menu "Actions" atau "Settings"
3. Klik "Reset Batch"
4. Konfirmasi (WARNING: This will delete all data)

**Expected:**
- Week = 1
- Bookings table kosong
- Schedules table kosong
- Attendance table kosong
- Students, teachers, classes TETAP ADA

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 8: BULK OPERATIONS

### ✅ Test 8.1: Bulk Import Attendance
**Langkah:**
1. Login sebagai Admin
2. Klik "Bulk Operations"
3. Tab "Import Attendance"
4. Download template
5. Isi template dengan data attendance
6. Upload file
7. Klik "Import"

**Expected:**
- Attendance berhasil diimport
- Smart matching untuk student names
- Summary: X success, Y failed

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 9: INTEGRATION TEST (Full Journey)

### ✅ Test 9.1: Complete Student Journey
**Langkah:**
1. Admin create student
2. Student login
3. Student book schedule
4. Teacher submit attendance
5. Admin view report
6. Admin export Excel

**Expected:** Semua step berhasil tanpa error

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 9.2: Week Transition
**Langkah:**
1. Current week = 11
2. Students book untuk week 11
3. Admin increment ke week 12
4. Verify students bisa book lagi
5. Verify week 11 bookings masih ada

**Expected:**
- Week berubah ke 12
- Students bisa book lagi
- Week 11 data tetap ada

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📊 SUMMARY

**Total Test Cases:** 20  
**Passed:** _____  
**Failed:** _____  
**Pass Rate:** _____%

---

## 🐛 BUGS FOUND

### Bug #1
**Title:** _______________________________________________  
**Severity:** Critical / High / Medium / Low  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** _______________________________________________  
**Actual:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### Bug #2
**Title:** _______________________________________________  
**Severity:** Critical / High / Medium / Low  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** _______________________________________________  
**Actual:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### Bug #3
**Title:** _______________________________________________  
**Severity:** Critical / High / Medium / Low  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** _______________________________________________  
**Actual:** _______________________________________________  
**Screenshot:** _______________________________________________

---

## ✅ SIGN-OFF

**Tester Name:** _______________________________________________  
**Date:** _______________________________________________  
**Signature:** _______________________________________________  

**Recommendation:**
[ ] APPROVED - Ready for Production  
[ ] APPROVED WITH CONDITIONS - Fix minor bugs first  
[ ] REJECTED - Fix critical bugs and retest

**Comments:** _______________________________________________

---

**Prepared by:** Kiro AI  
**Date:** 28 Maret 2026
