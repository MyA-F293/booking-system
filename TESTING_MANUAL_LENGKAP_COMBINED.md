# 📋 MANUAL TESTING LENGKAP - EYSA Booking System
## COMPLETE TESTING GUIDE (All Parts Combined)

**Tanggal:** 28 Maret 2026  
**Versi:** 2.0 (Super Detail - Combined)  
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

## 📋 DAFTAR ISI

### PART 1: AUTHENTICATION & STUDENT MANAGEMENT
- Fase 1: Authentication & Authorization (6 tests)
- Fase 2: Admin - Student Management (5 tests)

### PART 2: SCHEDULE & BOOKING MANAGEMENT
- Fase 3: Admin - Schedule Management (5 tests)
- Fase 4: Student - Booking System (5 tests)

### PART 3: ATTENDANCE & REPORTING
- Fase 5: Teacher - Attendance Management (4 tests)
- Fase 6: Admin - Attendance Reporting (5 tests)
- Fase 7: System Settings & Week Management (2 tests)

### PART 4: INTEGRATION & BUG REPORTING
- Fase 8: Integration Testing (4 tests)
- Bug Report Template
- Testing Summary & Sign-Off

**Total: 36 Test Cases**

---

# ═══════════════════════════════════════════════════════════════════
# PART 1: AUTHENTICATION & STUDENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════════
# PART 2: SCHEDULE & BOOKING MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

## 📋 FASE 3: ADMIN - SCHEDULE MANAGEMENT

### 📅 Test 3.1: Create Schedule - Happy Path

**Test ID:** ADMIN-SCH-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa create schedule untuk kelas

**Pre-condition:**
- Login sebagai Admin
- Teacher sudah ada di database (misal: TCHR0001)
- Class sudah ada (Oxford, Cambridge, Harvard, Tsinghua)
- Current week = 11 (atau week yang aktif)

**Test Data:**
```
Program: English Campus & Career
Level: Starter
Phase: Phase 1
Day: Monday
Time Slot: Afternoon (16:00-18:00)
Class: Oxford
Week Number: 11 (current week)
Year: 2026
Batch: 2
Teacher: Sir Brian (TCHR0001)
Max Capacity: 15 (default dari class)
```

**Langkah Detail:**
1. Login sebagai Admin
2. Klik menu **"Schedules"** di sidebar
3. Halaman schedule list akan muncul
4. Klik button **"Create Schedule"** atau **"+ Add Schedule"**
5. Modal/form create schedule akan muncul
6. Isi form dengan data di atas:
   - **Program:** Pilih "English Campus & Career" dari dropdown
   - **Level:** Pilih "Starter" dari dropdown
   - **Phase:** Pilih "Phase 1" dari dropdown
   - **Day:** Pilih "Monday" dari dropdown
   - **Time Slot:** Pilih "Afternoon" dari dropdown
   - **Class:** Pilih "Oxford" dari dropdown
   - **Week Number:** Auto-fill dengan current week (11) atau pilih manual
   - **Year:** Auto-fill dengan 2026
   - **Batch:** Pilih "2" dari dropdown
   - **Teacher:** Pilih "Sir Brian" dari dropdown (optional)
7. Verify preview/summary jika ada
8. Klik button **"Save"** atau **"Create Schedule"**
9. Tunggu loading
10. Observe response

**Expected Result:**
✅ **Success Response:**
- Muncul toast success: "Schedule created successfully"
- Modal tertutup otomatis
- Kembali ke schedule list

✅ **Schedule List:**
- Schedule baru muncul di list
- Data benar:
  - Program: English Campus & Career
  - Level: Starter
  - Phase: Phase 1
  - Day: Monday
  - Time: Afternoon (16:00-18:00)
  - Class: Oxford
  - Week: 11
  - Batch: 2
  - Teacher: Sir Brian
  - Current Students: 0
  - Max Capacity: 15
  - Status: Active

✅ **Available for Booking:**
- Logout dari admin
- Login sebagai student (program: English Campus & Career, level: Starter)
- Klik "New Booking"
- Schedule yang baru dibuat muncul di available schedules
- Bisa di-book

**Verification Checklist:**
- [ ] Schedule berhasil dibuat
- [ ] Muncul di schedule list
- [ ] Data benar semua
- [ ] current_students = 0
- [ ] max_capacity = 15
- [ ] Available untuk student booking
- [ ] Teacher bisa lihat schedule ini di dashboard

**Database Verification:**
```sql
-- Cek schedule baru
SELECT * FROM schedules 
WHERE program = 'English Campus & Career'
AND level = 'Starter'
AND phase = 'phase1'
AND day = 'Monday'
AND time_slot = 'afternoon'
AND class_name = 'Oxford'
AND week_number = 11
AND year = 2026
AND batch = 2;

-- Should return 1 row
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 📅 Test 3.2: Create Schedule - Duplicate Prevention

**Test ID:** ADMIN-SCH-002  
**Priority:** HIGH  
**Tujuan:** Memastikan sistem mencegah duplicate schedule (same class, day, time, week)

**Pre-condition:**
- Schedule sudah ada:
  - Oxford - Monday - Afternoon - Week 11

**Test Data:**
```
Program: English Campus & Career (bisa beda)
Level: Upper Starter (bisa beda)
Phase: Phase 2 (bisa beda)
Day: Monday (SAMA)
Time Slot: Afternoon (SAMA)
Class: Oxford (SAMA)
Week Number: 11 (SAMA)
```

**Langkah:**
1. Login sebagai Admin
2. Klik "Schedules" → "Create Schedule"
3. Isi form dengan data di atas (Oxford - Monday - Afternoon - Week 11)
4. Klik "Save"

**Expected Result:**
❌ **Create DITOLAK:**
- Error: "Schedule already exists for this class at this time" atau "Duplicate schedule detected"
- Error detail: "Oxford is already booked on Monday Afternoon for Week 11"
- Schedule tidak dibuat
- Form tidak tertutup (bisa edit)

**Business Rule:**
- 1 class hanya bisa dipakai 1 schedule di waktu yang sama
- Ini untuk prevent room conflict

**Verification:**
- [ ] Error message muncul
- [ ] Schedule tidak dibuat
- [ ] Database tidak ada duplicate

**Database Verification:**
```sql
-- Cek jumlah schedule Oxford - Monday - Afternoon - Week 11
SELECT COUNT(*) FROM schedules 
WHERE class_name = 'Oxford'
AND day = 'Monday'
AND time_slot = 'afternoon'
AND week_number = 11;

-- Should return 1 (not 2)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 📅 Test 3.3: View Schedule Details

**Test ID:** ADMIN-SCH-003  
**Priority:** MEDIUM  
**Tujuan:** Memastikan admin bisa view detail schedule dan list students

**Pre-condition:**
- Schedule sudah ada
- Ada students yang sudah book schedule ini

**Langkah:**
1. Login sebagai Admin
2. Klik menu "Schedules"
3. Pilih schedule yang sudah ada bookings
4. Klik button **"View Details"** atau klik row schedule
5. Modal/page detail schedule akan muncul

**Expected Result:**
✅ **Schedule Info:**
- Program & Level
- Phase
- Day & Time
- Class name
- Week number
- Batch
- Teacher name
- Current Students / Max Capacity (misal: 12/15)

✅ **Student List:**
- List students yang book schedule ini
- Setiap student menampilkan:
  - Student ID
  - Full Name
  - Booking date/time
  - Status (Confirmed/Cancelled)
- Sorted by booking date (oldest first)

✅ **Actions:**
- Button "Edit Schedule" (jika belum ada bookings)
- Button "Delete Schedule" (jika belum ada bookings)
- Button "View Attendance" (jika sudah ada attendance)
- Button "Close"

**Verification:**
- [ ] Detail schedule benar
- [ ] Student list muncul
- [ ] Jumlah students sesuai current_students
- [ ] Actions button muncul

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 📅 Test 3.4: Edit Schedule

**Test ID:** ADMIN-SCH-004  
**Priority:** MEDIUM  
**Tujuan:** Memastikan admin bisa edit schedule (dengan batasan)

**Pre-condition:**
- Schedule sudah ada
- Schedule belum ada bookings (current_students = 0)

**Langkah:**
1. Login sebagai Admin
2. Klik "Schedules"
3. Pilih schedule yang belum ada bookings
4. Klik "Edit"
5. Ubah teacher (misal: dari Sir Brian ke Miss Sarah)
6. Klik "Save"

**Expected Result:**
✅ **Edit Success:**
- Schedule berhasil diupdate
- Teacher berubah
- Data lain tetap sama

**Business Rule:**
- Jika sudah ada bookings, tidak bisa edit (atau hanya bisa edit teacher)
- Jika sudah ada attendance, tidak bisa edit sama sekali

**Verification:**
- [ ] Edit berhasil
- [ ] Teacher berubah
- [ ] Data lain tidak berubah

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 📅 Test 3.5: Delete Schedule

**Test ID:** ADMIN-SCH-005  
**Priority:** MEDIUM  
**Tujuan:** Memastikan admin bisa delete schedule (dengan batasan)

**Pre-condition:**
- Schedule sudah ada
- Schedule belum ada bookings (current_students = 0)

**Langkah:**
1. Login sebagai Admin
2. Klik "Schedules"
3. Pilih schedule yang belum ada bookings
4. Klik "Delete"
5. Konfirmasi delete

**Expected Result:**
✅ **Delete Success:**
- Schedule berhasil dihapus
- Tidak muncul di schedule list
- Toast success muncul

**Business Rule:**
- Jika sudah ada bookings, tidak bisa delete
- Harus cancel semua bookings dulu

**Verification:**
- [ ] Delete berhasil
- [ ] Schedule tidak muncul di list
- [ ] Database tidak ada schedule ini

**Database Verification:**
```sql
-- Cek schedule sudah terhapus
SELECT * FROM schedules WHERE id = '[schedule_id]';
-- Should return 0 rows
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 4: STUDENT - BOOKING SYSTEM

### 🎫 Test 4.1: Student Book Class - Happy Path

**Test ID:** STU-BOOK-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan student bisa book class dengan sukses

**Pre-condition:**
- Login sebagai Student
- Student info:
  - Program: English Campus & Career
  - Level: Starter
  - Batch: 2
- Schedule available:
  - Oxford - Monday - Afternoon - Phase 1 - Week 11
  - Current students: 5/15 (masih ada slot)
- Student belum book Phase 1 di week ini

**Test Data:**
```
Program: English Campus & Career
Level: Starter
Day: Monday
Time Slot: Afternoon
Class: Oxford
Phase: Phase 1
Week: 11
```

**Langkah Detail:**
1. Login sebagai Student
2. Klik menu **"New Booking"** atau **"Book Class"**
3. Halaman booking akan muncul
4. **Step 1: Select Program**
   - Program auto-selected (English Campus & Career) sesuai student profile
   - Atau pilih dari dropdown jika student punya multiple programs
5. **Step 2: Select Level**
   - Level auto-selected (Starter) sesuai student profile
   - Atau pilih dari dropdown
6. **Step 3: Select Day**
   - Pilih "Monday" dari list days
7. **Step 4: Select Time Slot**
   - Pilih "Afternoon" dari list time slots
8. **Step 5: Select Class**
   - List available classes akan muncul
   - Setiap class menampilkan:
     - Class name (Oxford)
     - Phase (Phase 1)
     - Current students / Max capacity (5/15)
     - Teacher name
     - Status badge (Available/Full/Occupied)
   - Pilih "Oxford"
9. **Step 6: Confirm Booking**
   - Summary booking muncul:
     - Program: English Campus & Career
     - Level: Starter
     - Day: Monday
     - Time: Afternoon (16:00-18:00)
     - Class: Oxford
     - Phase: Phase 1
     - Week: 11
     - Teacher: Sir Brian
   - Klik button **"Confirm Booking"** atau **"Book Now"**
10. Tunggu loading (1-2 detik)
11. Observe response

**Expected Result:**
✅ **Success Response:**
- Muncul toast success: "Booking successful!" atau "Class booked successfully"
- Confetti animation (optional)
- Redirect ke "My Bookings" atau stay di booking page

✅ **My Bookings:**
- Booking baru muncul di "My Bookings"
- Data benar:
  - Class: Oxford
  - Day: Monday
  - Time: Afternoon (16:00-18:00)
  - Phase: Phase 1
  - Week: 11
  - Status: Confirmed (badge hijau)
  - Booked at: [timestamp]
- Button "Cancel" muncul

✅ **Schedule Updated:**
- current_students bertambah dari 5 ke 6
- Jika admin view schedule, student ini muncul di student list

✅ **Validation Passed:**
- Student tidak bisa book Phase 1 lagi di week ini
- Jika coba book lagi, muncul error

**Verification Checklist:**
- [ ] Booking berhasil
- [ ] Toast success muncul
- [ ] Muncul di "My Bookings"
- [ ] Data benar semua
- [ ] Status: Confirmed
- [ ] current_students bertambah 1
- [ ] Student muncul di schedule detail (admin view)
- [ ] Tidak bisa book Phase 1 lagi

**Database Verification:**
```sql
-- Cek booking baru
SELECT * FROM bookings 
WHERE student_id = '[student_id]'
AND schedule_id = '[schedule_id]'
AND status = 'confirmed';

-- Cek current_students bertambah
SELECT current_students FROM schedules WHERE id = '[schedule_id]';
-- Should be 6 (was 5)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 🎫 Test 4.2: Booking Validation - Phase Rule

**Test ID:** STU-BOOK-002  
**Priority:** CRITICAL  
**Tujuan:** Memastikan student tidak bisa book 2x di phase yang sama

**Pre-condition:**
- Login sebagai Student
- Student sudah book Phase 1 - Monday - Afternoon

**Test Data:**
```
Coba book lagi:
Phase: Phase 1 (SAMA)
Day: Tuesday (BEDA)
Time: Evening (BEDA)
```

**Langkah:**
1. Login sebagai Student (yang sudah book Phase 1)
2. Klik "New Booking"
3. Pilih Program & Level
4. Pilih Day: Tuesday
5. Pilih Time: Evening
6. Pilih Class yang Phase 1
7. Klik "Book Now"

**Expected Result:**
❌ **Booking DITOLAK:**
- Error message: "You have already booked a schedule for Phase 1 this week"
- Error detail: "You booked Oxford - Monday - Afternoon for Phase 1"
- Button "Book Now" disabled atau tidak bisa klik
- Atau class dengan Phase 1 tidak muncul di available list

**Business Rule:**
- 1 student hanya bisa book 1 schedule per phase per week
- Phase 1, Phase 2, dan Recap dihitung terpisah
- Student bisa book Phase 1, Phase 2, dan Recap di week yang sama (total 3 bookings)

**Verification:**
- [ ] Booking ditolak
- [ ] Error message jelas
- [ ] Tidak ada booking baru di database
- [ ] current_students tidak bertambah

**Database Verification:**
```sql
-- Cek jumlah booking Phase 1 untuk student ini di week ini
SELECT COUNT(*) FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
WHERE b.student_id = '[student_id]'
AND s.phase = 'phase1'
AND s.week_number = 11
AND b.status = 'confirmed';

-- Should return 1 (not 2)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🎫 Test 4.3: Booking Validation - Capacity Full

**Test ID:** STU-BOOK-003  
**Priority:** CRITICAL  
**Tujuan:** Memastikan student tidak bisa book class yang sudah full

**Pre-condition:**
- Schedule Oxford - Monday - Afternoon
- Max capacity: 15
- Current students: 15 (FULL)

**Langkah:**
1. Login sebagai Student (student ke-16)
2. Klik "New Booking"
3. Pilih Program, Level, Day, Time
4. Observe available classes

**Expected Result:**
❌ **Class Not Available:**
- Oxford tidak muncul di available classes
- Atau muncul dengan badge "Full" (warna merah)
- Button "Book" disabled
- Tooltip: "Class is full (15/15)"

**Alternative:**
- Jika tetap bisa klik, muncul error saat confirm:
  - "Class is full. Please choose another class or time."

**Verification:**
- [ ] Class full tidak bisa di-book
- [ ] Badge "Full" muncul
- [ ] Error message jelas
- [ ] current_students tetap 15 (tidak jadi 16)

**Database Verification:**
```sql
-- Cek current_students tidak melebihi max_capacity
SELECT current_students, max_capacity 
FROM schedules 
WHERE id = '[schedule_id]';

-- current_students should be <= max_capacity
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🎫 Test 4.4: Booking Validation - Room Exclusivity

**Test ID:** STU-BOOK-004  
**Priority:** HIGH  
**Tujuan:** Memastikan 1 room hanya bisa dipakai 1 program di waktu yang sama

**Pre-condition:**
- Schedule 1: Oxford - Monday - Afternoon - English Campus & Career
- Schedule 2: Oxford - Monday - Afternoon - English Teens (CONFLICT)

**Scenario:**
- Student A (English Campus & Career) book Oxford - Monday - Afternoon
- Student B (English Teens) coba book Oxford - Monday - Afternoon

**Expected Result:**
❌ **Room Occupied:**
- Oxford tidak muncul untuk Student B
- Atau muncul dengan badge "Occupied by English Campus & Career"
- Tidak bisa di-book

**Business Rule:**
- 1 ruangan (class) hanya bisa dipakai 1 program di waktu yang sama
- Ini untuk prevent room conflict

**Verification:**
- [ ] Room occupied tidak bisa di-book
- [ ] Badge "Occupied" muncul
- [ ] Error message jelas

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🎫 Test 4.5: Cancel Booking

**Test ID:** STU-BOOK-005  
**Priority:** HIGH  
**Tujuan:** Memastikan student bisa cancel booking mereka

**Pre-condition:**
- Login sebagai Student
- Student punya booking aktif (status: Confirmed)

**Langkah:**
1. Login sebagai Student
2. Klik menu **"My Bookings"**
3. List bookings akan muncul
4. Pilih booking yang aktif (status: Confirmed)
5. Klik button **"Cancel"** (biasanya warna merah)
6. Modal konfirmasi muncul:
   - "Are you sure you want to cancel this booking?"
   - "Class: Oxford - Monday - Afternoon"
   - Button "Yes, Cancel" dan "No, Keep It"
7. Klik **"Yes, Cancel"**
8. Tunggu loading
9. Observe response

**Expected Result:**
✅ **Cancel Success:**
- Toast success: "Booking cancelled successfully"
- Booking status berubah dari "Confirmed" ke "Cancelled"
- Badge berubah dari hijau ke abu-abu/merah
- Button "Cancel" hilang (tidak bisa cancel lagi)
- Timestamp "Cancelled at" muncul

✅ **Schedule Updated:**
- current_students berkurang 1
- Slot tersedia kembali untuk student lain
- Student tidak muncul di schedule detail (admin view)

✅ **Can Book Again:**
- Student bisa book Phase 1 lagi (karena booking di-cancel)
- Slot Phase 1 available lagi

**Verification:**
- [ ] Cancel berhasil
- [ ] Status berubah ke "Cancelled"
- [ ] current_students berkurang 1
- [ ] Slot available lagi
- [ ] Student bisa book lagi

**Database Verification:**
```sql
-- Cek booking status
SELECT status, cancelled_at FROM bookings WHERE id = '[booking_id]';
-- status should be 'cancelled', cancelled_at should have timestamp

-- Cek current_students berkurang
SELECT current_students FROM schedules WHERE id = '[schedule_id]';
-- Should be decreased by 1
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

# ═══════════════════════════════════════════════════════════════════
# PART 3: ATTENDANCE & REPORTING
# ═══════════════════════════════════════════════════════════════════

## 📋 FASE 5: TEACHER - ATTENDANCE MANAGEMENT

### ✅ Test 5.1: Submit Attendance - Happy Path

**Test ID:** TCHR-ATT-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan teacher bisa submit attendance untuk students

**Pre-condition:**
- Login sebagai Teacher (TCHR0001 - Sir Brian)
- Teacher di-assign ke schedule:
  - Oxford - Monday - Afternoon - Phase 1 - Week 11
- Schedule punya students yang sudah book (misal: 12 students)
- Attendance belum disubmit untuk schedule ini

**Test Data:**
```
Schedule: Oxford - Monday - Afternoon - Phase 1 - Week 11
Students: 12 students
Attendance:
- 10 students: Present
- 1 student: Late
- 1 student: Absent
```

**Langkah Detail:**
1. Login sebagai Teacher (TCHR0001)
2. Dashboard teacher akan muncul
3. List schedules yang di-assign ke teacher ini muncul
4. Pilih schedule: **Oxford - Monday - Afternoon - Phase 1 - Week 11**
5. Klik button **"Submit Attendance"** atau **"Mark Attendance"**
6. Halaman/modal attendance form akan muncul
7. **Attendance Form:**
   - Header menampilkan:
     - Class: Oxford
     - Day: Monday
     - Time: Afternoon (16:00-18:00)
     - Phase: Phase 1
     - Week: 11
     - Total Students: 12
   - Table/list students:
     - Column: No, Student ID, Full Name, Status
     - Setiap row punya 3 buttons/radio: Present, Late, Absent
8. **Mark Attendance:**
   - Student 1-10: Klik "Present" (icon ✓, warna hijau)
   - Student 11: Klik "Late" (icon ⏱, warna kuning)
   - Student 12: Klik "Absent" (icon ✗, warna merah)
9. **Verify All Marked:**
   - Pastikan semua 12 students sudah ditandai
   - Counter muncul: "Marked: 12/12"
   - Button "Submit" enabled (warna hijau)
10. Klik button **"Submit Attendance"**
11. Modal konfirmasi muncul:
    - "Submit attendance for 12 students?"
    - Summary: 10 Present, 1 Late, 1 Absent
    - Button "Yes, Submit" dan "Cancel"
12. Klik **"Yes, Submit"**
13. Tunggu loading
14. Observe response

**Expected Result:**
✅ **Submit Success:**
- Toast success: "Attendance submitted successfully for 12 students"
- Modal tertutup
- Kembali ke teacher dashboard

✅ **Schedule Status:**
- Schedule menampilkan badge "Attendance Submitted" (warna hijau)
- Button berubah dari "Submit Attendance" ke "View/Edit Attendance"
- Timestamp "Submitted at" muncul

✅ **Admin Can View:**
- Admin bisa view attendance report
- Data attendance muncul:
  - 10 Present
  - 1 Late
  - 1 Absent
- Per student attendance tercatat

✅ **Student Can View:**
- Student bisa view attendance mereka
- Status muncul di "My Bookings" atau "My Attendance"

**Verification Checklist:**
- [ ] Attendance berhasil disubmit
- [ ] Toast success muncul
- [ ] Badge "Submitted" muncul
- [ ] Admin bisa view report
- [ ] Student bisa view attendance
- [ ] Data benar (10 Present, 1 Late, 1 Absent)
- [ ] Week number benar (11)

**Database Verification:**
```sql
-- Cek attendance records
SELECT 
  student_id,
  status,
  week_number,
  phase,
  submitted_by,
  submitted_at
FROM attendance 
WHERE schedule_id = '[schedule_id]'
AND week_number = 11;

-- Should return 12 rows
-- 10 with status='present'
-- 1 with status='late'
-- 1 with status='absent'
-- submitted_by should be 'TCHR0001'
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### ✅ Test 5.2: Submit Attendance - Incomplete Marking

**Test ID:** TCHR-ATT-002  
**Priority:** HIGH  
**Tujuan:** Memastikan teacher tidak bisa submit jika ada student yang belum ditandai

**Pre-condition:**
- Login sebagai Teacher
- Schedule punya 12 students

**Langkah:**
1. Login sebagai Teacher
2. Pilih schedule
3. Klik "Submit Attendance"
4. Mark hanya 10 students (2 students belum ditandai)
5. Coba klik "Submit"

**Expected Result:**
❌ **Submit DITOLAK:**
- Button "Submit" disabled (warna abu-abu)
- Error message: "Please mark attendance for all students"
- Counter: "Marked: 10/12" (warna merah)
- Highlight students yang belum ditandai (border merah)

**Verification:**
- [ ] Submit ditolak
- [ ] Error message muncul
- [ ] Button disabled
- [ ] Students yang belum ditandai di-highlight

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 5.3: Edit Attendance

**Test ID:** TCHR-ATT-003  
**Priority:** MEDIUM  
**Tujuan:** Memastikan teacher bisa edit attendance yang sudah disubmit

**Pre-condition:**
- Login sebagai Teacher
- Attendance sudah disubmit untuk schedule ini
- Student A status: Absent

**Langkah:**
1. Login sebagai Teacher
2. Pilih schedule yang sudah ada attendance
3. Klik button **"Edit Attendance"** atau **"View/Edit Attendance"**
4. Attendance form muncul dengan data yang sudah disubmit
5. Ubah status Student A dari "Absent" ke "Late"
6. Klik **"Update Attendance"**
7. Konfirmasi update

**Expected Result:**
✅ **Update Success:**
- Toast success: "Attendance updated successfully"
- Status Student A berubah dari Absent ke Late
- Timestamp "Updated at" muncul
- Summary berubah:
  - Before: 10 Present, 1 Late, 1 Absent
  - After: 10 Present, 2 Late, 0 Absent

✅ **History (Optional):**
- Jika ada audit log, perubahan tercatat:
  - "Student A: Absent → Late"
  - "Updated by: TCHR0001"
  - "Updated at: [timestamp]"

**Verification:**
- [ ] Update berhasil
- [ ] Status berubah
- [ ] Summary benar
- [ ] Admin lihat data yang updated

**Database Verification:**
```sql
-- Cek status updated
SELECT status, updated_at FROM attendance 
WHERE student_id = '[student_A_id]'
AND schedule_id = '[schedule_id]';

-- status should be 'late'
-- updated_at should have new timestamp
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### ✅ Test 5.4: View Attendance History

**Test ID:** TCHR-ATT-004  
**Priority:** LOW  
**Tujuan:** Memastikan teacher bisa view attendance history

**Langkah:**
1. Login sebagai Teacher
2. Klik menu "Attendance History" (jika ada)
3. Filter by week atau date range
4. View list attendance yang sudah disubmit

**Expected Result:**
✅ **History List:**
- List attendance records
- Setiap record menampilkan:
  - Schedule info (class, day, time, phase, week)
  - Date submitted
  - Total students
  - Summary (X Present, Y Late, Z Absent)
  - Button "View Details"

**Verification:**
- [ ] History list muncul
- [ ] Data benar
- [ ] Bisa filter by week
- [ ] Bisa view details

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 6: ADMIN - ATTENDANCE REPORTING

### 📊 Test 6.1: View Attendance Report - Filter by Week

**Test ID:** ADMIN-REP-001  
**Priority:** HIGH  
**Tujuan:** Memastikan admin bisa view attendance report dengan filter

**Pre-condition:**
- Login sebagai Admin
- Ada attendance data untuk Week 11

**Langkah Detail:**
1. Login sebagai Admin
2. Klik menu **"Attendance"** atau **"Reports"**
3. Halaman attendance report akan muncul
4. **Filter Section:**
   - Week: Pilih "Week 11" dari dropdown
   - Program: Pilih "English Campus & Career" (optional)
   - Level: Pilih "Starter" (optional)
   - Class: Pilih "All" atau specific class (optional)
5. Klik button **"View Report"** atau **"Apply Filter"**
6. Tunggu loading
7. Observe report

**Expected Result:**
✅ **Report Header:**
- Title: "Attendance Report - Week 11"
- Date range: [start date] - [end date]
- Filter applied: Program, Level, Class

✅ **Summary Cards:**
- Total Students: 50
- Total Present: 120 (dari 150 total sessions)
- Total Late: 20
- Total Absent: 10
- Attendance Rate: 80% (Present / Total)

✅ **Report Table:**
- Columns:
  - No
  - Student ID
  - Full Name
  - Program
  - Level
  - Phase 1 (✓/⏱/✗)
  - Phase 2 (✓/⏱/✗)
  - Recap (✓/⏱/✗)
  - Total Present
  - Total Late
  - Total Absent
  - Attendance Rate (%)
- Data sorted by Student ID atau Name
- Pagination (jika > 50 rows)

✅ **Visual Indicators:**
- ✓ = Present (hijau)
- ⏱ = Late (kuning)
- ✗ = Absent (merah)
- - = No data (abu-abu)

✅ **Actions:**
- Button "Export to Excel"
- Button "Print Report"
- Button "Refresh"

**Verification:**
- [ ] Report muncul
- [ ] Filter berfungsi
- [ ] Summary benar
- [ ] Table data benar
- [ ] Visual indicators jelas
- [ ] Pagination berfungsi

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 📊 Test 6.2: Export Attendance to Excel

**Test ID:** ADMIN-REP-002  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa export attendance report ke Excel

**Pre-condition:**
- Login sebagai Admin
- Attendance report sudah ditampilkan (Week 11)

**Langkah:**
1. Login sebagai Admin
2. View attendance report (Week 11)
3. Klik button **"Export to Excel"** (icon 📊)
4. Tunggu proses export (1-3 detik)
5. File Excel akan ter-download
6. Buka file Excel
7. Verify content

**Expected Result:**
✅ **File Downloaded:**
- File name: `EYSA_Attendance_Week_11_2026-03-28.xlsx`
- File size: reasonable (< 5MB untuk 100 students)
- File format: .xlsx (Excel 2007+)

✅ **Excel Content:**
- **Sheet 1: Attendance Matrix**
  - Header Row 1: Week numbers (Week 1, Week 2, ..., Week 8)
  - Header Row 2: Phase labels (I1, I2, RC untuk setiap week)
  - Data Rows:
    - Column A: No (1, 2, 3, ...)
    - Column B: Student ID (EYSA26010001, ...)
    - Column C: Full Name
    - Column D: Program
    - Column E: Level
    - Column F-onwards: Attendance data (✓, ⏱, ✗, -)
    - Last 3 columns: Total Present, Total Late, Total Absent

✅ **Excel Formatting:**
- Header: Bold, background color (biru/orange)
- Data: Aligned center
- Borders: All cells
- Column width: Auto-fit
- Freeze panes: Row 1-2, Column A-C

✅ **Data Accuracy:**
- Semua students muncul
- Data attendance benar (match dengan database)
- Summary totals benar
- **TIDAK ADA kolom email, phone, atau data pribadi lain**

**Verification Checklist:**
- [ ] File ter-download
- [ ] File bisa dibuka di Excel
- [ ] Format Excel benar
- [ ] Header jelas
- [ ] Data lengkap dan akurat
- [ ] Tidak ada kolom yang tidak perlu (email, phone)
- [ ] Summary totals benar
- [ ] Visual indicators (✓, ⏱, ✗) muncul

**Database Verification:**
```sql
-- Cek jumlah students di Excel vs database
SELECT COUNT(DISTINCT student_id) FROM attendance 
WHERE week_number = 11;

-- Cek total Present
SELECT COUNT(*) FROM attendance 
WHERE week_number = 11 AND status = 'present';

-- Should match Excel totals
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot Excel:** _______________________________________________

---

### 📊 Test 6.3: Export Excel - Empty Data

**Test ID:** ADMIN-REP-003  
**Priority:** MEDIUM  
**Tujuan:** Memastikan export berfungsi meskipun tidak ada data

**Pre-condition:**
- Login sebagai Admin
- Filter by Week 1 (belum ada attendance data)

**Langkah:**
1. Login sebagai Admin
2. View attendance report
3. Filter: Week 1 (no data)
4. Klik "Export to Excel"

**Expected Result:**
✅ **File Downloaded:**
- File ter-download
- Excel berisi header tapi no data rows
- Message di Excel: "No attendance data for Week 1"

**Alternative:**
- Muncul warning: "No data to export. Please select different filter."
- Export tidak jalan

**Verification:**
- [ ] Handle empty data dengan baik
- [ ] Tidak error/crash
- [ ] Message jelas

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 📊 Test 6.4: View Attendance by Student

**Test ID:** ADMIN-REP-004  
**Priority:** MEDIUM  
**Tujuan:** Memastikan admin bisa view attendance history per student

**Langkah:**
1. Login sebagai Admin
2. Klik menu "Students"
3. Pilih student
4. Klik tab "Attendance History"
5. View attendance records untuk student ini

**Expected Result:**
✅ **Student Attendance History:**
- List attendance records
- Setiap record menampilkan:
  - Week number
  - Date
  - Class
  - Phase
  - Status (Present/Late/Absent)
  - Teacher name
- Summary:
  - Total sessions: 24
  - Present: 20 (83%)
  - Late: 2 (8%)
  - Absent: 2 (8%)
- Chart/graph (optional):
  - Attendance trend over weeks

**Verification:**
- [ ] History muncul
- [ ] Data benar
- [ ] Summary benar
- [ ] Chart muncul (jika ada)

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 📊 Test 6.5: Attendance Analytics Dashboard

**Test ID:** ADMIN-REP-005  
**Priority:** LOW  
**Tujuan:** Memastikan admin bisa view analytics dashboard

**Langkah:**
1. Login sebagai Admin
2. Klik menu "Dashboard" atau "Analytics"
3. View attendance analytics

**Expected Result:**
✅ **Analytics Dashboard:**
- **Overall Stats:**
  - Total students: 100
  - Average attendance rate: 85%
  - Total sessions: 500
  - Total present: 425

- **Charts:**
  - Attendance trend (line chart)
  - Attendance by program (pie chart)
  - Attendance by level (bar chart)
  - Top performers (table)
  - Low attendance students (table)

- **Filters:**
  - Date range
  - Program
  - Level
  - Batch

**Verification:**
- [ ] Dashboard muncul
- [ ] Stats benar
- [ ] Charts muncul
- [ ] Filters berfungsi

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 📋 FASE 7: SYSTEM SETTINGS & WEEK MANAGEMENT

### ⚙️ Test 7.1: Manual Increment Week

**Test ID:** SYS-WEEK-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa increment week secara manual

**Pre-condition:**
- Login sebagai Admin
- Current week: 11

**Langkah Detail:**
1. Login sebagai Admin
2. Observe current week di header: "Week 11"
3. Klik button **"Next Week"** (▶) di samping week number
4. Modal konfirmasi muncul:
   - "Increment week from 11 to 12?"
   - "This will allow students to book for Week 12"
   - "Current bookings for Week 11 will remain"
   - Button "Yes, Increment" dan "Cancel"
5. Klik **"Yes, Increment"**
6. Tunggu loading (1-2 detik)
7. Observe response

**Expected Result:**
✅ **Week Incremented:**
- Toast success: "Week incremented to 12"
- Header berubah dari "Week 11" ke "Week 12"
- UI refresh otomatis

✅ **Student View:**
- Logout dari admin
- Login sebagai student
- Current week muncul: "Week 12"
- Students bisa book untuk Week 12
- Booking rules reset (bisa book Phase 1, 2, Recap lagi)

✅ **Previous Week Data:**
- Week 11 bookings tetap ada
- Week 11 attendance tetap ada
- Week 11 schedules tetap ada
- Tidak ada data yang hilang

✅ **Database:**
- settings.current_week = 12
- updated_at timestamp updated

**Verification:**
- [ ] Week berubah dari 11 ke 12
- [ ] Toast success muncul
- [ ] UI refresh
- [ ] Students lihat Week 12
- [ ] Students bisa book lagi
- [ ] Week 11 data tetap ada

**Database Verification:**
```sql
-- Cek current week
SELECT current_week, updated_at FROM settings WHERE id = 1;
-- current_week should be 12

-- Cek Week 11 data masih ada
SELECT COUNT(*) FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
WHERE s.week_number = 11;
-- Should return > 0 (data tetap ada)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### ⚙️ Test 7.2: Reset Batch

**Test ID:** SYS-BATCH-001  
**Priority:** CRITICAL  
**Tujuan:** Memastikan admin bisa reset batch untuk semester baru

**Pre-condition:**
- Login sebagai Admin
- Current week: 12
- Ada data: bookings, schedules, attendance

**⚠️ WARNING:**
- Test ini akan DELETE semua data batch
- Jangan test di production!
- Backup database dulu!

**Langkah Detail:**
1. Login sebagai Admin
2. Klik menu **"Settings"** atau **"Actions"**
3. Scroll ke section "Batch Management"
4. Klik button **"Reset Batch"** (warna merah, icon ⚠️)
5. Modal konfirmasi muncul dengan WARNING:
   ```
   ⚠️ WARNING: RESET BATCH
   
   This will DELETE:
   - All bookings
   - All schedules
   - All attendance records
   
   This will KEEP:
   - Students
   - Teachers
   - Classes
   - Settings (week will reset to 1)
   
   This action CANNOT be undone!
   
   Type "RESET" to confirm:
   [input field]
   
   [Cancel] [Reset Batch]
   ```
6. Ketik "RESET" di input field
7. Klik button **"Reset Batch"**
8. Tunggu proses (5-10 detik)
9. Observe response

**Expected Result:**
✅ **Reset Success:**
- Toast success: "Batch reset successfully. Week is now 1."
- Modal tertutup
- UI refresh

✅ **Week Reset:**
- Current week berubah ke 1
- Header menampilkan "Week 1"

✅ **Data Deleted:**
- Bookings table kosong
- Schedules table kosong
- Attendance table kosong

✅ **Data Kept:**
- Students tetap ada (semua students)
- Teachers tetap ada (semua teachers)
- Classes tetap ada (Oxford, Cambridge, dll)
- Settings tetap ada (hanya current_week yang reset)

✅ **Student View:**
- Login sebagai student
- Current week: 1
- My Bookings: kosong
- New Booking: tidak ada schedules available (karena schedules dihapus)

✅ **Admin Can Start Fresh:**
- Admin bisa create schedules baru untuk Week 1
- Students bisa book lagi dari awal

**Verification Checklist:**
- [ ] Reset berhasil
- [ ] Week = 1
- [ ] Bookings deleted
- [ ] Schedules deleted
- [ ] Attendance deleted
- [ ] Students tetap ada
- [ ] Teachers tetap ada
- [ ] Classes tetap ada

**Database Verification:**
```sql
-- Cek current week
SELECT current_week FROM settings WHERE id = 1;
-- Should be 1

-- Cek bookings kosong
SELECT COUNT(*) FROM bookings;
-- Should be 0

-- Cek schedules kosong
SELECT COUNT(*) FROM schedules;
-- Should be 0

-- Cek attendance kosong
SELECT COUNT(*) FROM attendance;
-- Should be 0

-- Cek students tetap ada
SELECT COUNT(*) FROM users WHERE role = 'student';
-- Should be > 0 (students tetap ada)

-- Cek teachers tetap ada
SELECT COUNT(*) FROM users WHERE role = 'teacher';
-- Should be > 0 (teachers tetap ada)

-- Cek classes tetap ada
SELECT COUNT(*) FROM classes;
-- Should be > 0 (classes tetap ada)
```

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

# ═══════════════════════════════════════════════════════════════════
# PART 4: INTEGRATION TESTING & BUG REPORTING
# ═══════════════════════════════════════════════════════════════════

## 📋 FASE 8: INTEGRATION TESTING (End-to-End)

### 🔄 Test 8.1: Complete Student Journey

**Test ID:** INT-001  
**Priority:** CRITICAL  
**Tujuan:** Test complete flow dari create student sampai view attendance

**Scenario:** Full student lifecycle

**Langkah Detail:**

**Step 1: Admin Creates Student**
1. Login sebagai Admin
2. Create student manual:
   - Student ID: EYSA26010999
   - Name: Integration Test Student
   - Batch: 2
   - Program: English Campus & Career
   - Level: Starter
3. Verify student created

**Step 2: Student Login**
4. Logout dari admin
5. Login sebagai student (EYSA26010999 / student123)
6. Verify dashboard muncul

**Step 3: Admin Creates Schedule**
7. Logout dari student
8. Login sebagai admin
9. Create schedule:
   - Oxford - Monday - Afternoon - Phase 1 - Week 11
   - Teacher: Sir Brian
10. Verify schedule created

**Step 4: Student Books Class**
11. Logout dari admin
12. Login sebagai student (EYSA26010999)
13. Book class: Oxford - Monday - Afternoon - Phase 1
14. Verify booking success
15. Verify muncul di "My Bookings"

**Step 5: Teacher Submits Attendance**
16. Logout dari student
17. Login sebagai teacher (TCHR0001)
18. Select schedule: Oxford - Monday - Afternoon
19. Mark attendance:
    - Integration Test Student: Present
20. Submit attendance
21. Verify attendance submitted

**Step 6: Admin Views Report**
22. Logout dari teacher
23. Login sebagai admin
24. View attendance report (Week 11)
25. Verify Integration Test Student muncul dengan status Present

**Step 7: Student Views Attendance**
26. Logout dari admin
27. Login sebagai student (EYSA26010999)
28. View "My Bookings" atau "My Attendance"
29. Verify attendance status: Present

**Expected Result:**
✅ **All Steps Success:**
- Setiap step berhasil tanpa error
- Data flow dari admin → student → teacher → admin → student
- Tidak ada data loss
- Tidak ada error di console

**Verification:**
- [ ] Student created
- [ ] Student bisa login
- [ ] Schedule created
- [ ] Student bisa book
- [ ] Booking muncul di My Bookings
- [ ] Teacher bisa submit attendance
- [ ] Admin bisa view report
- [ ] Student bisa view attendance
- [ ] Tidak ada error di semua step

**Time Estimate:** 10-15 minutes

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________  
**Screenshot:** _______________________________________________

---

### 🔄 Test 8.2: Week Transition Flow

**Test ID:** INT-002  
**Priority:** HIGH  
**Tujuan:** Test flow saat week increment

**Scenario:**
1. Current week: 11
2. Students book untuk Week 11
3. Admin increment ke Week 12
4. Verify students bisa book lagi
5. Verify Week 11 data tetap ada

**Langkah:**

**Step 1: Setup (Week 11)**
1. Login sebagai admin
2. Verify current week: 11
3. Create schedule untuk Week 11 (jika belum ada)

**Step 2: Student Books Week 11**
4. Login sebagai student
5. Book Phase 1 untuk Week 11
6. Verify booking success

**Step 3: Admin Increments Week**
7. Login sebagai admin
8. Klik "Next Week" (▶)
9. Confirm increment
10. Verify week berubah ke 12

**Step 4: Student Can Book Again**
11. Login sebagai student
12. Verify current week: 12
13. Verify bisa book Phase 1 lagi (rules reset)
14. Book Phase 1 untuk Week 12
15. Verify booking success

**Step 5: Verify Week 11 Data**
16. Login sebagai admin
17. View bookings untuk Week 11
18. Verify Week 11 bookings tetap ada
19. View attendance untuk Week 11
20. Verify Week 11 attendance tetap ada

**Expected Result:**
✅ **Week Transition Success:**
- Week increment dari 11 ke 12
- Students bisa book lagi untuk Week 12
- Week 11 data tetap ada (tidak hilang)
- Booking rules reset untuk Week 12

**Verification:**
- [ ] Week increment berhasil
- [ ] Students lihat Week 12
- [ ] Students bisa book lagi
- [ ] Week 11 bookings tetap ada
- [ ] Week 11 attendance tetap ada
- [ ] Tidak ada data loss

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🔄 Test 8.3: Capacity & Validation Flow

**Test ID:** INT-003  
**Priority:** HIGH  
**Tujuan:** Test semua validation rules bekerja bersama

**Scenario:**
1. Create schedule dengan capacity 3
2. 3 students book (full)
3. Student ke-4 tidak bisa book (capacity full)
4. Student 1 cancel booking
5. Student ke-4 bisa book (slot available)
6. Student 1 coba book lagi Phase 1 (ditolak - phase rule)

**Langkah:**

**Step 1: Setup**
1. Login sebagai admin
2. Create schedule:
   - Oxford - Monday - Afternoon - Phase 1
   - Max capacity: 3 (edit jika perlu)

**Step 2: Fill to Capacity**
3. Login sebagai Student 1 → Book → Success
4. Login sebagai Student 2 → Book → Success
5. Login sebagai Student 3 → Book → Success
6. Verify current_students = 3/3

**Step 3: Test Capacity Full**
7. Login sebagai Student 4
8. Try to book → Should FAIL
9. Verify error: "Class is full"

**Step 4: Cancel & Rebook**
10. Login sebagai Student 1
11. Cancel booking → Success
12. Verify current_students = 2/3

13. Login sebagai Student 4
14. Try to book → Should SUCCESS
15. Verify current_students = 3/3

**Step 5: Test Phase Rule**
16. Login sebagai Student 1
17. Try to book Phase 1 again → Should FAIL
18. Verify error: "Already booked Phase 1"

**Expected Result:**
✅ **All Validations Work:**
- Capacity validation works
- Phase rule validation works
- Cancel frees up slot
- Slot available after cancel

**Verification:**
- [ ] 3 students bisa book
- [ ] Student ke-4 ditolak (full)
- [ ] Cancel berhasil
- [ ] Slot available setelah cancel
- [ ] Student ke-4 bisa book
- [ ] Phase rule validation works

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

### 🔄 Test 8.4: Bulk Operations Flow

**Test ID:** INT-004  
**Priority:** MEDIUM  
**Tujuan:** Test bulk import students dan attendance

**Scenario:**
1. Bulk import 10 students
2. Create schedules
3. Students book
4. Bulk import attendance

**Langkah:**

**Step 1: Bulk Import Students**
1. Login sebagai admin
2. Bulk Operations → Import Students
3. Upload Excel dengan 10 students
4. Verify all 10 imported

**Step 2: Create Schedules**
5. Create 3 schedules untuk Week 11

**Step 3: Students Book**
6. Login sebagai 5 students
7. Each student books 1 class
8. Verify 5 bookings created

**Step 4: Bulk Import Attendance**
9. Login sebagai admin
10. Bulk Operations → Import Attendance
11. Upload Excel dengan attendance data
12. Verify attendance imported

**Expected Result:**
✅ **Bulk Operations Success:**
- 10 students imported
- Schedules created
- Students bisa book
- Attendance imported

**Verification:**
- [ ] Bulk import students works
- [ ] All students bisa login
- [ ] Schedules created
- [ ] Students bisa book
- [ ] Bulk import attendance works

**Result:** [ ] PASS  [ ] FAIL  
**Notes:** _______________________________________________

---

## 🐛 BUG REPORT TEMPLATE

### Bug Report Form

**Bug ID:** BUG-___  
**Reported By:** _______________  
**Date:** _______________  
**Environment:** [ ] Localhost  [ ] Production

---

**Title:** _______________________________________________

**Severity:**
- [ ] CRITICAL - System crash, data loss, security issue
- [ ] HIGH - Major feature broken, blocking workflow
- [ ] MEDIUM - Feature works but has issues
- [ ] LOW - Cosmetic issue, typo, minor UX issue

**Priority:**
- [ ] P0 - Fix immediately
- [ ] P1 - Fix in current sprint
- [ ] P2 - Fix in next sprint
- [ ] P3 - Fix when possible

**Module:**
- [ ] Authentication
- [ ] Student Management
- [ ] Teacher Management
- [ ] Schedule Management
- [ ] Booking System
- [ ] Attendance Management
- [ ] Reporting
- [ ] Bulk Operations
- [ ] System Settings
- [ ] Other: _______________

---

**Description:**
_______________________________________________
_______________________________________________
_______________________________________________

**Steps to Reproduce:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
4. _______________________________________________
5. _______________________________________________

**Expected Result:**
_______________________________________________
_______________________________________________

**Actual Result:**
_______________________________________________
_______________________________________________

**Frequency:**
- [ ] Always (100%)
- [ ] Often (> 50%)
- [ ] Sometimes (< 50%)
- [ ] Rare (< 10%)
- [ ] Once

**Browser/Device:**
- Browser: _______________
- Version: _______________
- OS: _______________
- Device: _______________
- Screen Size: _______________

**Console Error (if any):**
```
[Paste console error here]
```

**Network Error (if any):**
```
[Paste network error here]
```

**Database State (if relevant):**
```sql
-- SQL query to check database state
```

**Screenshot:**
- [ ] Attached
- File: _______________

**Video Recording:**
- [ ] Attached
- File: _______________

**Workaround (if any):**
_______________________________________________
_______________________________________________

**Related Bugs:**
- BUG-___ : _______________
- BUG-___ : _______________

**Assigned To:** _______________  
**Status:** [ ] Open  [ ] In Progress  [ ] Fixed  [ ] Closed  [ ] Won't Fix

**Fix Notes:**
_______________________________________________
_______________________________________________

**Verified By:** _______________  
**Verified Date:** _______________

---

## 📊 TESTING SUMMARY

### Overall Statistics

**Testing Period:** _______________ to _______________  
**Tester(s):** _______________  
**Environment:** [ ] Localhost  [ ] Staging  [ ] Production

---

### Test Execution Summary

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| Authentication | 6 | ___ | ___ | ___ | ___% |
| Admin - Students | 5 | ___ | ___ | ___ | ___% |
| Admin - Schedules | 5 | ___ | ___ | ___ | ___% |
| Student - Booking | 5 | ___ | ___ | ___ | ___% |
| Teacher - Attendance | 4 | ___ | ___ | ___ | ___% |
| Admin - Reporting | 5 | ___ | ___ | ___ | ___% |
| System Settings | 2 | ___ | ___ | ___ | ___% |
| Integration Tests | 4 | ___ | ___ | ___ | ___% |
| **TOTAL** | **36** | **___** | **___** | **___** | **___%** |

---

### Bug Summary

| Severity | Count | Fixed | Remaining |
|----------|-------|-------|-----------|
| CRITICAL | ___ | ___ | ___ |
| HIGH | ___ | ___ | ___ |
| MEDIUM | ___ | ___ | ___ |
| LOW | ___ | ___ | ___ |
| **TOTAL** | **___** | **___** | **___** |

---

### Critical Bugs (Must Fix Before Launch)

1. **BUG-___:** _______________________________________________
   - Status: _______________
   - Assigned: _______________

2. **BUG-___:** _______________________________________________
   - Status: _______________
   - Assigned: _______________

3. **BUG-___:** _______________________________________________
   - Status: _______________
   - Assigned: _______________

---

### High Priority Bugs

1. **BUG-___:** _______________________________________________
2. **BUG-___:** _______________________________________________
3. **BUG-___:** _______________________________________________

---

### Known Issues (Not Blocking)

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Performance Issues

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Usability Issues

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Recommendations

**Must Have (Before Launch):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Should Have (Nice to Have):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Could Have (Future Enhancement):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Browser Compatibility

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | ___ | [ ] Pass [ ] Fail | _______________ |
| Firefox | ___ | [ ] Pass [ ] Fail | _______________ |
| Safari | ___ | [ ] Pass [ ] Fail | _______________ |
| Edge | ___ | [ ] Pass [ ] Fail | _______________ |
| Mobile Chrome | ___ | [ ] Pass [ ] Fail | _______________ |
| Mobile Safari | ___ | [ ] Pass [ ] Fail | _______________ |

---

### Device Testing

| Device | OS | Screen Size | Status | Notes |
|--------|----|-----------| -------|-------|
| Desktop | Windows 11 | 1920x1080 | [ ] Pass [ ] Fail | ___ |
| Laptop | MacOS | 1440x900 | [ ] Pass [ ] Fail | ___ |
| Tablet | iPad | 1024x768 | [ ] Pass [ ] Fail | ___ |
| Mobile | Android | 375x667 | [ ] Pass [ ] Fail | ___ |
| Mobile | iPhone | 390x844 | [ ] Pass [ ] Fail | ___ |

---

### Sign-Off

**QA Lead:**
- Name: _______________
- Date: _______________
- Signature: _______________
- Recommendation: [ ] APPROVED  [ ] APPROVED WITH CONDITIONS  [ ] REJECTED

**Comments:**
_______________________________________________
_______________________________________________
_______________________________________________

**Conditions (if any):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Project Manager:**
- Name: _______________
- Date: _______________
- Signature: _______________
- Approval: [ ] YES  [ ] NO  [ ] CONDITIONAL

**Comments:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Stakeholder:**
- Name: _______________
- Date: _______________
- Signature: _______________
- Approval: [ ] YES  [ ] NO  [ ] CONDITIONAL

**Comments:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 📝 TESTING NOTES

### Day 1: _______________
**Tester:** _______________  
**Tests Executed:** _______________  
**Passed:** ___  **Failed:** ___  **Blocked:** ___  
**Bugs Found:** ___  
**Notes:**
_______________________________________________
_______________________________________________

---

### Day 2: _______________
**Tester:** _______________  
**Tests Executed:** _______________  
**Passed:** ___  **Failed:** ___  **Blocked:** ___  
**Bugs Found:** ___  
**Notes:**
_______________________________________________
_______________________________________________

---

### Day 3: _______________
**Tester:** _______________  
**Tests Executed:** _______________  
**Passed:** ___  **Failed:** ___  **Blocked:** ___  
**Bugs Found:** ___  
**Notes:**
_______________________________________________
_______________________________________________

---

## 🎯 CONCLUSION

**Overall Assessment:**
_______________________________________________
_______________________________________________
_______________________________________________

**System Readiness:**
- [ ] READY FOR PRODUCTION
- [ ] READY WITH MINOR FIXES
- [ ] NOT READY - MAJOR ISSUES
- [ ] NOT READY - CRITICAL ISSUES

**Next Steps:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Estimated Fix Time:** _______________

**Target Launch Date:** _______________

---

**Document Prepared By:** _______________  
**Date:** 28 Maret 2026  
**Version:** 2.0 (Final - Combined)

---

## 📚 RELATED DOCUMENTS

- TESTING_MANUAL_LENGKAP_COMBINED.md ← You are here (All parts combined)
- QA_TESTING_COMPREHENSIVE_GUIDE.md (Quick reference)
- TESTING_CHECKLIST_SIMPLE.md (Simple checklist)
- TESTING_INDEX.md (Navigation guide)

---

**END OF TESTING MANUAL**

**Total Test Cases: 36**
- Authentication & Authorization: 6 tests
- Admin - Student Management: 5 tests
- Admin - Schedule Management: 5 tests
- Student - Booking System: 5 tests
- Teacher - Attendance Management: 4 tests
- Admin - Attendance Reporting: 5 tests
- System Settings & Week Management: 2 tests
- Integration Testing: 4 tests

**Estimated Testing Time: 8-12 hours**

---

## 💡 TIPS UNTUK TESTER

1. **Jangan Skip Pre-conditions** - Pastikan kondisi awal benar
2. **Test di Multiple Browsers** - Chrome, Firefox, Safari, Edge
3. **Test di Mobile** - Responsive design penting
4. **Screenshot Everything** - Terutama error dan bug
5. **Catat Detail** - Semakin detail, semakin mudah fix
6. **Test Happy Path Dulu** - Baru test edge cases
7. **Verify Database** - Jangan cuma lihat UI
8. **Check Console** - Error di console = bug
9. **Test Logout/Login** - Session management penting
10. **Backup Database** - Sebelum test destructive operations

**Good luck testing! 🚀**
