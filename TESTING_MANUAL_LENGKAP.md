# 📋 MANUAL TESTING LENGKAP - EYSA Booking System

**Tanggal:** 28 Maret 2026  
**Versi:** 2.0 (Super Detail)  
**Tester:** _____________  
**Browser:** _____________  
**Device:** _____________  
**Environment:** [ ] Localhost  [ ] Production

---

## 🎯 PETUNJUK PENGGUNAAN

### Sebelum Mulai Testing:
1. ✅ Pastikan aplikasi sudah running
2. ✅ Pastikan database sudah ada data (students, teachers, schedules)
3. ✅ Siapkan tool screenshot (Snipping Tool, Lightshot, dll)
4. ✅ Buka browser console (F12) untuk monitor error
5. ✅ Siapkan akses ke Supabase untuk cek database

### Cara Testing:
1. **Baca Pre-condition** - Pastikan kondisi awal terpenuhi
2. **Ikuti Langkah Detail** - Jangan skip langkah
3. **Cek Expected Result** - Bandingkan dengan hasil actual
4. **Verifikasi Database** - Untuk test tertentu, cek database
5. **Catat Result** - Centang PASS/FAIL dan tulis notes
6. **Screenshot Error** - Ambil screenshot jika ada masalah

### Severity Level:
- **CRITICAL:** Sistem crash, tidak bisa digunakan
- **HIGH:** Fitur utama tidak berfungsi
- **MEDIUM:** Fitur berfungsi tapi ada bug
- **LOW:** Cosmetic issue, typo, dll

---

## 📋 FASE 1: AUTHENTICATION & AUTHORIZATION

### 🔐 Test 1.1: Login Admin - Happy Path

**Test ID:** AUTH-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa login dengan credentials yang benar

**Pre-condition:**
- Aplikasi sudah running
- Admin account ada di database:
  - Username: `admin`
  - Password: `admin123`
  - Role: `admin`

**Test Data:**
```
Username: admin
Password: admin123
```

**Langkah Detail:**
1. Buka browser (Chrome/Firefox/Edge recommended)
2. Akses URL aplikasi:
   - Localhost: `http://localhost:5173`
   - Production: `https://portal.eysa.com`
3. Halaman login akan muncul dengan 3 pilihan role
4. Klik button **"Admin Login"** (warna biru, icon 👨‍💼)
5. Form login admin akan slide in dari kanan
6. Pada field "Username", ketik: `admin` (huruf kecil semua, no space)
7. Pada field "Password", ketik: `admin123`
8. Klik button **"Login"** atau tekan **Enter**
9. Tunggu loading indicator (spinner orange)
10. Observe redirect dan tampilan dashboard

**Expected Result:**
✅ **Redirect & URL:**
- Redirect otomatis ke `/admin` atau `/admin-dashboard`
- URL bar berubah sesuai route

✅ **Header:**
- Nama "Admin" atau "Administrator" muncul di kanan atas
- Current Week ditampilkan (misal: "Week 11")
- Button "Next Week" (▶) muncul di samping week
- Logout button muncul

✅ **Navigation Menu:**
- Dashboard (active/highlighted)
- Students
- Teachers
- Classes
- Schedules
- Attendance
- Bulk Operations
- Settings/Actions

✅ **Dashboard Content:**
- Stats cards muncul dengan data:
  - Total Students (angka)
  - Total Teachers (angka)
  - Total Schedules (angka)
  - Total Bookings (angka)
  - Attendance Rate (persentase)
- Charts/graphs muncul (jika ada)
- Recent activities muncul (jika ada)

✅ **Console:**
- Tidak ada error merah di console (F12)
- Hanya log info/success yang muncul

**Verification Checklist:**
- [ ] URL berubah ke `/admin`
- [ ] Nama admin muncul di header
- [ ] Current week muncul (misal: Week 11)
- [ ] Semua menu admin muncul
- [ ] Stats cards menampilkan angka (bukan 0 semua)
- [ ] Tidak ada error di console
- [ ] Bisa klik menu lain (Students, Teachers, dll)

**Database Verification:**
```sql
-- Cek di Supabase SQL Editor
SELECT * FROM users WHERE username = 'admin' AND role = 'admin';
-- Should return 1 row
```

**Result:** [ ] PASS  [ ] FAIL  
**Actual Result:** _______________________________________________  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________  
**Bug ID (if fail):** _______________________________________________

---

### 🔐 Test 1.2: Login Admin - Wrong Password

**Test ID:** AUTH-002  
**Priority:** HIGH  
**Tujuan:** Memastikan sistem menolak login dengan password salah (security)

**Pre-condition:**
- Aplikasi running
- Admin account ada dengan password: `admin123`

**Test Data:**
```
Username: admin
Password: wrongpassword (SALAH)
```

**Langkah:**
1. Buka halaman login
2. Klik "Admin Login"
3. Username: `admin`
4. Password: `wrongpassword` (password yang salah)
5. Klik "Login"
6. Observe response

**Expected Result:**
❌ **Login DITOLAK:**
- Tidak redirect ke dashboard
- Tetap di halaman login

❌ **Error Message:**
- Muncul toast/alert error
- Message: "Invalid credentials" atau "Username atau password salah"
- Warna merah/error

❌ **Form State:**
- Username field masih terisi "admin"
- Password field di-clear (kosong)
- Focus kembali ke password field

❌ **Security:**
- Tidak ada info spesifik (jangan bilang "password salah", harus "invalid credentials")
- Tidak ada delay yang lama (prevent brute force tapi jangan terlalu lama)

**Verification:**
- [ ] Login ditolak
- [ ] Error message muncul
- [ ] Tetap di halaman login
- [ ] Password field di-clear
- [ ] Tidak ada info spesifik tentang username/password

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🔐 Test 1.3: Login Admin - Empty Fields

**Test ID:** AUTH-003  
**Priority:** MEDIUM  
**Tujuan:** Memastikan validasi required fields

**Langkah:**
1. Buka halaman login
2. Klik "Admin Login"
3. Biarkan username dan password **KOSONG**
4. Klik "Login"

**Expected Result:**
❌ **Validation Error:**
- Muncul error: "Username is required" atau "Please fill all fields"
- Border field berubah merah
- Login button disabled atau tidak submit

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🔐 Test 1.4: Login Student - Happy Path

**Test ID:** AUTH-004  
**Priority:** CRITICAL  
**Tujuan:** Memastikan student bisa login dan melihat dashboard mereka

**Pre-condition:**
- Student account ada di database:
  - Student ID: `EYSA26010001` (atau ID lain yang ada)
  - Password: `student123`
  - is_active: `true`
  - Program: "English Campus & Career"
  - Level: "Starter"
  - Batch: 2

**Test Data:**
```
Student ID: EYSA26010001
Password: student123
```

**Langkah Detail:**
1. Buka halaman login
2. Klik button **"Student Login"** (warna hijau, icon 👨‍🎓)
3. Form login student akan muncul
4. Pada field "Student ID", ketik: `EYSA26010001`
5. Pada field "Password", ketik: `student123`
6. Klik "Login"
7. Tunggu loading
8. Observe dashboard

**Expected Result:**
✅ **Redirect:**
- URL berubah ke `/student` atau `/student-dashboard`

✅ **Header:**
- Nama student muncul (misal: "Welcome, John Doe")
- Program dan level muncul (misal: "English Campus & Career - Starter")
- Current Week muncul (misal: "Week 11")
- Logout button muncul

✅ **Navigation Menu:**
- Dashboard
- New Booking (atau "Book Class")
- My Bookings

✅ **Dashboard Content:**
- Welcome message dengan nama student
- Info program dan level
- Current week info
- Booking summary (jika ada bookings):
  - Total bookings this week
  - Upcoming classes
  - Attendance summary
- Quick action buttons:
  - "Book New Class"
  - "View My Bookings"

✅ **My Bookings Section (jika ada):**
- List bookings dengan info:
  - Class name (Oxford, Cambridge, dll)
  - Day & Time
  - Phase (Phase 1, Phase 2, Recap)
  - Week number
  - Status (Confirmed/Cancelled)
  - Cancel button (jika masih aktif)

**Verification:**
- [ ] URL berubah ke `/student`
- [ ] Nama student benar sesuai database
- [ ] Program dan level benar
- [ ] Current week benar
- [ ] Menu student muncul (3 menu)
- [ ] Bisa klik "New Booking"
- [ ] Bisa klik "My Bookings"
- [ ] Tidak ada error di console

**Database Verification:**
```sql
SELECT * FROM users 
WHERE student_id = 'EYSA26010001' 
AND role = 'student' 
AND is_active = true;
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 🔐 Test 1.5: Login Student - Inactive Account

**Test ID:** AUTH-005  
**Priority:** HIGH  
**Tujuan:** Memastikan student yang di-deactivate tidak bisa login

**Pre-condition:**
- Student account ada tapi `is_active = false`

**Test Data:**
```
Student ID: (student yang inactive)
Password: student123
```

**Langkah:**
1. Buka halaman login
2. Klik "Student Login"
3. Masukkan Student ID yang inactive
4. Password: `student123`
5. Klik "Login"

**Expected Result:**
❌ **Login DITOLAK:**
- Error: "Account is inactive" atau "Please contact admin"
- Tidak bisa login

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🔐 Test 1.6: Login Teacher - Happy Path

**Test ID:** AUTH-006  
**Priority:** CRITICAL  
**Tujuan:** Memastikan teacher bisa login dan submit attendance

**Pre-condition:**
- Teacher account ada:
  - Teacher ID: `TCHR0001`
  - Password: `teacher123`
  - Name: "Sir Brian" (atau nama lain)
  - is_active: `true`
- Teacher sudah di-assign ke minimal 1 schedule

**Test Data:**
```
Teacher ID: TCHR0001
Password: teacher123
```

**Langkah:**
1. Buka halaman login
2. Klik **"Teacher Login"** (warna orange, icon 👨‍🏫)
3. Teacher ID: `TCHR0001`
4. Password: `teacher123`
5. Klik "Login"

**Expected Result:**
✅ **Redirect:**
- URL berubah ke `/teacher` atau `/teacher-dashboard`

✅ **Header:**
- Nama teacher muncul (misal: "Sir Brian")
- Current Week muncul
- Logout button

✅ **Navigation:**
- Attendance Management (main menu)

✅ **Dashboard Content:**
- List schedules yang di-assign ke teacher ini
- Setiap schedule menampilkan:
  - Program & Level
  - Phase (Phase 1, Phase 2, Recap)
  - Day & Time
  - Class name
  - Week number
  - Student count (misal: "15 students")
  - Button "Submit Attendance" atau "View Attendance"

✅ **Functionality:**
- Bisa klik schedule untuk submit attendance
- Hanya muncul schedules yang di-assign ke teacher ini
- Tidak muncul schedules teacher lain

**Verification:**
- [ ] Nama teacher benar
- [ ] Hanya muncul schedules teacher ini
- [ ] Bisa klik schedule
- [ ] Bisa akses attendance form

**Database Verification:**
```sql
-- Cek teacher
SELECT * FROM users WHERE teacher_id = 'TCHR0001' AND role = 'teacher';

-- Cek schedules yang di-assign
SELECT * FROM schedules WHERE teacher_id = 'TCHR0001';
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 2: ADMIN - STUDENT MANAGEMENT

### 👥 Test 2.1: Create Student Manual - Happy Path

**Test ID:** ADMIN-STU-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa create student secara manual

**Pre-condition:**
- Login sebagai Admin
- Berada di Admin Dashboard

**Test Data:**
```
Student ID: EYSA26010099 (atau auto-generate)
Full Name: Test Student Alpha
Batch: 2
Program: English Campus & Career
Level: Starter
Password: student123 (default)
```

**Langkah Detail:**
1. Login sebagai Admin
2. Klik menu **"Students"** di sidebar
3. Halaman student list akan muncul
4. Klik button **"Create New Student"** atau **"+ Add Student"** (biasanya di kanan atas)
5. Modal/form create student akan muncul
6. Isi form:
   - **Student ID:** 
     - Jika auto-generate: biarkan kosong atau klik "Generate"
     - Jika manual: ketik `EYSA26010099`
   - **Full Name:** `Test Student Alpha`
   - **Batch:** Pilih `2` dari dropdown
   - **Program:** Pilih `English Campus & Career` dari dropdown
   - **Level:** Pilih `Starter` dari dropdown
   - **Password:** Biarkan default (student123) atau ketik manual
7. Klik button **"Save"** atau **"Create Student"**
8. Tunggu loading
9. Observe response

**Expected Result:**
✅ **Success Response:**
- Muncul toast success: "Student created successfully"
- Modal/form tertutup otomatis
- Kembali ke student list

✅ **Student List:**
- Student baru muncul di list
- Data benar:
  - Student ID: EYSA26010099
  - Name: Test Student Alpha
  - Batch: 2
  - Program: English Campus & Career
  - Level: Starter
  - Status: Active (icon hijau atau badge "Active")

✅ **Student Can Login:**
- Logout dari admin
- Login sebagai student dengan:
  - Student ID: EYSA26010099
  - Password: student123
- Login berhasil
- Dashboard student muncul dengan data yang benar

**Verification Checklist:**
- [ ] Student berhasil dibuat
- [ ] Muncul di student list
- [ ] Data benar semua
- [ ] Student bisa login
- [ ] Password default (student123) berfungsi
- [ ] Status active

**Database Verification:**
```sql
-- Cek student baru
SELECT * FROM users 
WHERE student_id = 'EYSA26010099' 
AND role = 'student';

-- Should return 1 row with correct data
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 👥 Test 2.2: Create Student - Duplicate Student ID

**Test ID:** ADMIN-STU-002  
**Priority:** HIGH  
**Tujuan:** Memastikan sistem mencegah duplicate Student ID

**Pre-condition:**
- Login sebagai Admin
- Student dengan ID `EYSA26010001` sudah ada

**Test Data:**
```
Student ID: EYSA26010001 (DUPLICATE)
Full Name: Duplicate Test
Batch: 2
Program: English Campus & Career
Level: Starter
```

**Langkah:**
1. Login sebagai Admin
2. Klik menu "Students"
3. Klik "Create New Student"
4. Isi form dengan Student ID yang sudah ada: `EYSA26010001`
5. Isi field lainnya
6. Klik "Save"

**Expected Result:**
❌ **Create DITOLAK:**
- Muncul error: "Student ID already exists" atau "Duplicate Student ID"
- Student tidak dibuat
- Form tidak tertutup (bisa edit)
- Field Student ID di-highlight merah

**Verification:**
- [ ] Error message muncul
- [ ] Student tidak dibuat (cek database)
- [ ] Form masih terbuka untuk edit

**Database Verification:**
```sql
-- Cek jumlah student dengan ID ini
SELECT COUNT(*) FROM users WHERE student_id = 'EYSA26010001';
-- Should return 1 (not 2)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 👥 Test 2.3: Create Student - Empty Required Fields

**Test ID:** ADMIN-STU-003  
**Priority:** MEDIUM  
**Tujuan:** Memastikan validasi required fields

**Langkah:**
1. Login sebagai Admin
2. Klik "Students" → "Create New Student"
3. Biarkan field **Full Name** kosong
4. Isi field lainnya
5. Klik "Save"

**Expected Result:**
❌ **Validation Error:**
- Error: "Full Name is required"
- Field Full Name di-highlight merah
- Form tidak submit

**Test Variations:**
- [ ] Full Name kosong → Error
- [ ] Batch tidak dipilih → Error
- [ ] Program tidak dipilih → Error
- [ ] Level tidak dipilih → Error

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 👥 Test 2.4: Bulk Import Students - Happy Path

**Test ID:** ADMIN-STU-004  
**Priority:** HIGH  
**Tujuan:** Memastikan admin bisa import multiple students dari Excel

**Pre-condition:**
- Login sebagai Admin
- Siapkan file Excel dengan format yang benar

**Test Data (Excel):**
```
student_id       | full_name        | batch | program                    | level
EYSA26010101     | Bulk Student 1   | 2     | English Campus & Career    | Starter
EYSA26010102     | Bulk Student 2   | 2     | English Campus & Career    | Upper Starter
EYSA26010103     | Bulk Student 3   | 2     | English Teens              | Intermediate
```

**Langkah Detail:**
1. Login sebagai Admin
2. Klik menu **"Bulk Operations"**
3. Tab **"Import Students"** (atau klik tab ini jika ada multiple tabs)
4. Klik button **"Download Template"**
5. File Excel template ter-download (misal: `student_import_template.xlsx`)
6. Buka file Excel
7. Isi data sesuai test data di atas (3 students)
8. Save file Excel
9. Kembali ke aplikasi
10. Klik button **"Choose File"** atau **"Upload Excel"**
11. Pilih file Excel yang sudah diisi
12. File ter-upload, muncul preview data (5 rows pertama)
13. Verify preview data benar
14. Klik button **"Import X Students"** (X = jumlah students)
15. Tunggu proses import (loading indicator)
16. Observe result

**Expected Result:**
✅ **Upload Success:**
- File ter-upload tanpa error
- Preview data muncul (5 rows pertama)
- Data di preview benar sesuai Excel

✅ **Import Success:**
- Muncul summary:
  - "Successfully imported 3 students"
  - "Success: 3"
  - "Failed: 0"
- Toast success muncul
- Modal tertutup atau ada button "View Students"

✅ **Student List:**
- Klik menu "Students"
- 3 students baru muncul di list:
  - EYSA26010101 - Bulk Student 1
  - EYSA26010102 - Bulk Student 2
  - EYSA26010103 - Bulk Student 3
- Data benar semua (batch, program, level)
- Status: Active

✅ **Students Can Login:**
- Test login untuk salah satu student:
  - Student ID: EYSA26010101
  - Password: student123
- Login berhasil

**Verification:**
- [ ] File Excel ter-upload
- [ ] Preview data benar
- [ ] Import berhasil (3/3)
- [ ] Summary muncul
- [ ] Students muncul di list
- [ ] Data benar semua
- [ ] Students bisa login

**Database Verification:**
```sql
SELECT * FROM users 
WHERE student_id IN ('EYSA26010101', 'EYSA26010102', 'EYSA26010103')
AND role = 'student';
-- Should return 3 rows
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 👥 Test 2.5: Bulk Import - Invalid Data

**Test ID:** ADMIN-STU-005  
**Priority:** MEDIUM  
**Tujuan:** Memastikan sistem handle invalid data dengan baik

**Test Data (Excel dengan error):**
```
student_id       | full_name        | batch | program                    | level
EYSA26010001     | Duplicate ID     | 2     | English Campus & Career    | Starter  ← DUPLICATE
EYSA26010201     | Valid Student    | 2     | English Campus & Career    | Starter  ← VALID
                 | No ID            | 2     | English Campus & Career    | Starter  ← MISSING ID
EYSA26010202     | Invalid Program  | 2     | Wrong Program Name         | Starter  ← INVALID PROGRAM
```

**Langkah:**
1. Login sebagai Admin
2. Bulk Operations → Import Students
3. Upload Excel dengan data di atas
4. Klik "Import"

**Expected Result:**
⚠️ **Partial Success:**
- Summary:
  - "Success: 1" (EYSA26010201)
  - "Failed: 3"
- Error details:
  - "EYSA26010001: Student ID already exists"
  - "Row 3: Student ID is required"
  - "EYSA26010202: Invalid program name"

✅ **Valid Data Imported:**
- EYSA26010201 berhasil diimport
- Muncul di student list

❌ **Invalid Data Rejected:**
- 3 rows lainnya tidak diimport
- Error message jelas untuk setiap row

**Verification:**
- [ ] 1 student berhasil diimport
- [ ] 3 students ditolak
- [ ] Error message jelas
- [ ] Valid data tetap diimport

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

Saya akan lanjutkan dengan fase-fase berikutnya. Apakah format detail seperti ini sudah sesuai? Atau ada yang perlu ditambahkan/dikurangi?