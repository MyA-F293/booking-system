# 📋 COMPREHENSIVE QA TESTING GUIDE
## EYSA Booking System - Quality Assurance & Control

**Tanggal:** 28 Maret 2026  
**Versi:** 1.0  
**Status:** Ready for Testing

---

## 🎯 TUJUAN TESTING

Dokumen ini adalah panduan lengkap untuk Quality Tester dalam melakukan pengujian menyeluruh terhadap EYSA Booking System. Testing mencakup:
- Alur program (User Flow)
- Fungsi setiap fitur
- Integrasi antar modul
- Validasi data
- Error handling
- Performance & Security

---

## 👥 ROLE & AKSES TESTING

### 1. Admin
- **Username:** admin
- **Password:** admin123
- **Akses:** Full access ke semua fitur

### 2. Student (Test Account)
- **Student ID:** EYSA26010001
- **Password:** student123
- **Akses:** Student dashboard, booking, attendance view

### 3. Teacher (Test Account)
- **Teacher ID:** TCHR0001
- **Password:** teacher123
- **Akses:** Attendance management

---

## 📊 FASE 1: TESTING ALUR PROGRAM (USER FLOW)

### 🔐 A. ALUR LOGIN & AUTHENTICATION

#### Test Case 1.1: Login Admin
**Langkah:**
1. Buka aplikasi
2. Pilih "Admin Login"
3. Masukkan username: `admin`
4. Masukkan password: `admin123`
5. Klik "Login"

**Expected Result:**
- ✅ Redirect ke Admin Dashboard
- ✅ Menampilkan nama admin di header
- ✅ Menampilkan menu admin (Dashboard, Students, Teachers, Classes, Schedules, Attendance, Bulk Operations)

**Test Data:**
| Username | Password | Expected |
|----------|----------|----------|
| admin | admin123 | Success |
| admin | wrong | Failed - Invalid credentials |
| wrong | admin123 | Failed - Invalid credentials |
| (empty) | admin123 | Failed - Required field |
| admin | (empty) | Failed - Required field |

---

#### Test Case 1.2: Login Student
**Langkah:**
1. Buka aplikasi
2. Pilih "Student Login"
3. Masukkan Student ID: `EYSA26010001`
4. Masukkan password: `student123`
5. Klik "Login"

**Expected Result:**
- ✅ Redirect ke Student Dashboard
- ✅ Menampilkan nama student
- ✅ Menampilkan program & level student
- ✅ Menampilkan menu student (Dashboard, New Booking, My Bookings)

**Test Data:**
| Student ID | Password | Expected |
|------------|----------|----------|
| EYSA26010001 | student123 | Success |
| EYSA26010001 | wrong | Failed |
| INVALID123 | student123 | Failed |

---

#### Test Case 1.3: Login Teacher
**Langkah:**
1. Buka aplikasi
2. Pilih "Teacher Login"
3. Masukkan Teacher ID: `TCHR0001`
4. Masukkan password: `teacher123`
5. Klik "Login"

**Expected Result:**
- ✅ Redirect ke Teacher Dashboard
- ✅ Menampilkan nama teacher
- ✅ Menampilkan menu teacher (Attendance Management)

---

### 📚 B. ALUR STUDENT BOOKING (CRITICAL PATH)

#### Test Case 2.1: Student Booking - Happy Path
**Prerequisite:** Login sebagai student

**Langkah:**
1. Klik menu "New" atau "New Booking"
2. Pilih Program (English Campus & Career)
3. Pilih Level (Starter)
4. Sistem menampilkan available schedules
5. Pilih Day (Monday)
6. Pilih Time Slot (Afternoon/Evening)
7. Pilih Class (Oxford/Cambridge/Harvard/Tsinghua)
8. Klik "Book Now"
9. Konfirmasi booking

**Expected Result:**
- ✅ Booking berhasil dibuat
- ✅ Muncul notifikasi success
- ✅ Booking muncul di "My Bookings"
- ✅ Counter `current_students` di schedule bertambah 1
- ✅ Status booking: "Confirmed"

**Validation Points:**
- [ ] Tidak bisa book 2x di phase yang sama
- [ ] Tidak bisa book jika class sudah full (capacity)
- [ ] Tidak bisa book class yang sudah dipakai program lain
- [ ] Week number sesuai dengan current week

---

#### Test Case 2.2: Student Booking - Validasi Phase Rule
**Rule:** Student hanya bisa book 1 schedule per phase per week

**Langkah:**
1. Login sebagai student
2. Book schedule Phase 1 - Monday Afternoon
3. Coba book lagi Phase 1 - Tuesday Evening

**Expected Result:**
- ✅ Booking kedua DITOLAK
- ✅ Muncul error: "You have already booked a schedule for this phase"
- ✅ Hanya 1 booking yang tersimpan

---

#### Test Case 2.3: Student Booking - Validasi Capacity
**Rule:** Class tidak boleh melebihi max capacity

**Langkah:**
1. Cek capacity class (misal: Oxford max 15)
2. Book schedule sampai full (15 students)
3. Coba book dengan student ke-16

**Expected Result:**
- ✅ Booking ke-16 DITOLAK
- ✅ Muncul error: "Class is full"
- ✅ Button "Book Now" disabled atau tidak muncul

---

#### Test Case 2.4: Student Booking - Validasi Room Exclusivity
**Rule:** 1 ruangan hanya bisa dipakai 1 program di waktu yang sama

**Langkah:**
1. Program A book Oxford - Monday Afternoon
2. Program B coba book Oxford - Monday Afternoon (waktu sama)

**Expected Result:**
- ✅ Oxford tidak muncul di available classes untuk Program B
- ✅ Atau muncul label "Occupied by [Program Name]"

---

#### Test Case 2.5: Student Cancel Booking
**Langkah:**
1. Login sebagai student
2. Buka "My Bookings"
3. Pilih booking yang aktif
4. Klik "Cancel"
5. Konfirmasi cancel

**Expected Result:**
- ✅ Booking status berubah jadi "Cancelled"
- ✅ Counter `current_students` berkurang 1
- ✅ Slot tersedia kembali untuk student lain
- ✅ Muncul notifikasi success

---

### 👨‍💼 C. ALUR ADMIN - STUDENT MANAGEMENT

#### Test Case 3.1: Admin Create Student (Manual)
**Langkah:**
1. Login sebagai admin
2. Klik menu "Students"
3. Klik "Create New Student"
4. Isi form:
   - Student ID: (auto-generate atau manual)
   - Full Name: "Test Student"
   - Batch: 2
   - Program: "English Campus & Career"
   - Level: "Starter"
   - Password: "student123"
5. Klik "Save"

**Expected Result:**
- ✅ Student berhasil dibuat
- ✅ Muncul di student list
- ✅ Student bisa login dengan credentials tersebut
- ✅ Student ID format: EYSA26010XXX

**Validation:**
- [ ] Student ID harus unique
- [ ] Full Name required
- [ ] Batch, Program, Level required
- [ ] Password default: student123

---

#### Test Case 3.2: Admin Bulk Import Students
**Langkah:**
1. Login sebagai admin
2. Klik "Bulk Operations"
3. Tab "Import Students"
4. Download template Excel
5. Isi template dengan data:
   ```
   student_id | full_name | batch | program | level
   EYSA26010050 | Student A | 2 | English Campus & Career | Starter
   EYSA26010051 | Student B | 2 | English Campus & Career | Upper Starter
   ```
6. Upload file Excel
7. Preview data (5 rows pertama)
8. Klik "Import X+ Students"

**Expected Result:**
- ✅ Semua students berhasil diimport
- ✅ Muncul summary: X success, Y failed
- ✅ Students muncul di student list
- ✅ Password default: student123
- ✅ Semua students bisa login

**Error Scenarios:**
| Scenario | Expected |
|----------|----------|
| Duplicate Student ID | Failed - "Student ID already exists" |
| Missing required column | Failed - "Missing required columns: ..." |
| Invalid program name | Failed - "Invalid program" |
| Invalid level name | Failed - "Invalid level" |

---

#### Test Case 3.3: Admin Edit Student
**Langkah:**
1. Login sebagai admin
2. Klik menu "Students"
3. Pilih student
4. Klik "Edit"
5. Ubah data (misal: Level dari Starter ke Upper Starter)
6. Klik "Save"

**Expected Result:**
- ✅ Data student berhasil diupdate
- ✅ Perubahan langsung terlihat di student list
- ✅ Student bisa login dengan data baru

---

#### Test Case 3.4: Admin Delete Student (Soft Delete)
**Langkah:**
1. Login sebagai admin
2. Klik menu "Students"
3. Pilih student
4. Klik "Delete"
5. Konfirmasi delete

**Expected Result:**
- ✅ Student di-deactivate (is_active = false)
- ✅ Student tidak muncul di active student list
- ✅ Student TIDAK BISA login
- ✅ Data student masih ada di database (soft delete)

---

### 👨‍🏫 D. ALUR ADMIN - TEACHER MANAGEMENT

#### Test Case 4.1: Admin Create Teacher
**Langkah:**
1. Login sebagai admin
2. Klik menu "Teachers"
3. Klik "Create New Teacher"
4. Isi form:
   - Teacher ID: (auto-generate TCHR0XXX)
   - Name: "Sir Brian"
   - Password: "teacher123"
5. Klik "Save"

**Expected Result:**
- ✅ Teacher berhasil dibuat
- ✅ Teacher ID format: TCHR0001, TCHR0002, dst
- ✅ Teacher muncul di teacher list
- ✅ Teacher bisa login

---

#### Test Case 4.2: Admin Assign Teacher to Schedule
**Langkah:**
1. Login sebagai admin
2. Klik menu "Schedules"
3. Pilih schedule yang belum ada teachernya
4. Klik "Assign Teacher"
5. Pilih teacher dari dropdown
6. Klik "Save"

**Expected Result:**
- ✅ Teacher berhasil di-assign
- ✅ Nama teacher muncul di schedule
- ✅ Teacher bisa lihat schedule tersebut di dashboard

---

### 📅 E. ALUR ADMIN - SCHEDULE MANAGEMENT

#### Test Case 5.1: Admin Create Schedule
**Langkah:**
1. Login sebagai admin
2. Klik menu "Schedules"
3. Klik "Create Schedule"
4. Isi form:
   - Program: "English Campus & Career"
   - Level: "Starter"
   - Phase: "Phase 1"
   - Day: "Monday"
   - Time Slot: "Afternoon"
   - Class: "Oxford"
   - Week Number: (current week)
   - Year: 2026
   - Batch: 2
   - Teacher: "Sir Brian"
5. Klik "Save"

**Expected Result:**
- ✅ Schedule berhasil dibuat
- ✅ Muncul di schedule list
- ✅ Available untuk student booking
- ✅ current_students = 0
- ✅ max_capacity sesuai class capacity

**Validation:**
- [ ] Tidak boleh duplicate (same class, day, time, week)
- [ ] Week number harus valid
- [ ] Batch harus valid

---

#### Test Case 5.2: Admin View Schedule Details
**Langkah:**
1. Login sebagai admin
2. Klik menu "Schedules"
3. Pilih schedule
4. Klik "View Details"

**Expected Result:**
- ✅ Menampilkan detail schedule
- ✅ Menampilkan list students yang book
- ✅ Menampilkan current_students / max_capacity
- ✅ Menampilkan teacher name

---

### ✅ F. ALUR TEACHER - ATTENDANCE MANAGEMENT

#### Test Case 6.1: Teacher Submit Attendance
**Langkah:**
1. Login sebagai teacher
2. Pilih schedule dari list
3. Sistem menampilkan student list
4. Tandai attendance untuk setiap student:
   - Present / Late / Absent
5. Klik "Submit Attendance"

**Expected Result:**
- ✅ Attendance berhasil disimpan
- ✅ Muncul notifikasi success
- ✅ Data attendance tersimpan di database
- ✅ Admin bisa lihat attendance report

**Validation:**
- [ ] Semua students harus ditandai
- [ ] Tidak bisa submit jika ada yang belum ditandai
- [ ] Week number sesuai dengan current week

---

#### Test Case 6.2: Teacher Edit Attendance
**Langkah:**
1. Login sebagai teacher
2. Pilih schedule yang sudah ada attendance
3. Ubah status student (misal: dari Absent ke Late)
4. Klik "Update Attendance"

**Expected Result:**
- ✅ Attendance berhasil diupdate
- ✅ Perubahan tersimpan di database
- ✅ History perubahan tercatat (optional)

---

### 📊 G. ALUR ADMIN - ATTENDANCE REPORTING

#### Test Case 7.1: Admin View Attendance Report
**Langkah:**
1. Login sebagai admin
2. Klik menu "Attendance"
3. Filter by:
   - Week: Week 11
   - Program: English Campus & Career
   - Level: Starter
4. Klik "View Report"

**Expected Result:**
- ✅ Menampilkan attendance data sesuai filter
- ✅ Menampilkan summary: Total Present, Late, Absent
- ✅ Menampilkan per student
- ✅ Menampilkan per class

---

#### Test Case 7.2: Admin Export Attendance to Excel
**Langkah:**
1. Login sebagai admin
2. Klik menu "Attendance"
3. Pilih filter
4. Klik "Export to Excel"

**Expected Result:**
- ✅ File Excel ter-download
- ✅ Format Excel sesuai (columns: Student ID, Name, Class, Date, Status)
- ✅ Data lengkap dan akurat

---

### 🔄 H. ALUR ADMIN - BULK OPERATIONS

#### Test Case 8.1: Bulk Import Attendance
**Langkah:**
1. Login sebagai admin
2. Klik "Bulk Operations"
3. Tab "Import Attendance"
4. Download template
5. Isi template dengan data attendance
6. Upload file
7. Preview data
8. Klik "Import"

**Expected Result:**
- ✅ Attendance berhasil diimport
- ✅ Smart matching untuk student names (fuzzy matching)
- ✅ Summary: X success, Y failed
- ✅ Data tersimpan di database

---

#### Test Case 8.2: Bulk Assign Students to Class
**Langkah:**
1. Login sebagai admin
2. Klik "Bulk Operations"
3. Tab "Assign to Class"
4. Download template
5. Isi template:
   ```
   student_id | class_name | program | level
   EYSA26010001 | Oxford | English Campus & Career | Starter
   ```
6. Upload file
7. Klik "Assign"

**Expected Result:**
- ✅ Students berhasil di-assign
- ✅ Summary: X success, Y failed

---

### ⚙️ I. ALUR ADMIN - SYSTEM SETTINGS

#### Test Case 9.1: Admin Increment Week
**Langkah:**
1. Login sebagai admin
2. Klik menu "Settings" atau "Week Management"
3. Current week: 11
4. Klik "Increment Week"
5. Konfirmasi

**Expected Result:**
- ✅ Week berubah dari 11 ke 12
- ✅ Semua students lihat week 12
- ✅ Booking rules reset untuk week baru
- ✅ Students bisa book lagi untuk week 12

---

#### Test Case 9.2: Admin Reset Batch
**Langkah:**
1. Login sebagai admin
2. Klik "Reset Batch"
3. Konfirmasi (WARNING: This will delete all data)
4. Sistem reset:
   - Week ke 1
   - Delete all bookings
   - Delete all schedules
   - Delete all attendance
   - Keep students, teachers, classes

**Expected Result:**
- ✅ Week = 1
- ✅ Bookings table kosong
- ✅ Schedules table kosong
- ✅ Attendance table kosong
- ✅ Students, teachers, classes tetap ada

---

## 📋 FASE 2: TESTING FUNGSI DETAIL

### A. Validation Testing
- [ ] Required field validation
- [ ] Format validation (Student ID, Teacher ID)
- [ ] Range validation (Week number, Batch)
- [ ] Unique constraint (Student ID, Teacher ID)
- [ ] Foreign key constraint

### B. Business Logic Testing
- [ ] Phase booking rule
- [ ] Capacity rule
- [ ] Room exclusivity rule
- [ ] Week increment logic
- [ ] Batch reset logic

### C. Integration Testing
- [ ] Login → Dashboard
- [ ] Booking → Schedule update
- [ ] Attendance → Report
- [ ] Bulk import → Database

### D. Error Handling Testing
- [ ] Network error
- [ ] Database error
- [ ] Invalid input
- [ ] Unauthorized access
- [ ] Session timeout

---

## 🎯 CRITICAL TEST SCENARIOS

### Scenario 1: Full Student Journey
1. Admin create student
2. Student login
3. Student book schedule
4. Teacher submit attendance
5. Admin view report
6. Admin export Excel

### Scenario 2: Capacity & Exclusivity
1. Fill class to capacity
2. Verify no more bookings allowed
3. Book same room different program
4. Verify room exclusivity works

### Scenario 3: Week Transition
1. Current week 11
2. Students book for week 11
3. Admin increment to week 12
4. Verify students can book again
5. Verify week 11 bookings still exist

---

## ✅ CHECKLIST TESTING

### Pre-Testing
- [ ] Database backup dibuat
- [ ] Test accounts ready
- [ ] Test data prepared
- [ ] Testing environment ready

### During Testing
- [ ] Catat semua bugs
- [ ] Screenshot error messages
- [ ] Note steps to reproduce
- [ ] Check console for errors

### Post-Testing
- [ ] Bug report dibuat
- [ ] Test results documented
- [ ] Regression testing done
- [ ] Sign-off dari stakeholder

---

## 🐛 BUG REPORT TEMPLATE

```
BUG ID: BUG-001
Severity: Critical / High / Medium / Low
Module: [Student Booking / Admin / Teacher / etc]
Title: [Short description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshot: [Attach if available]
Console Error: [Copy error message]

Environment:
- Browser: Chrome 120
- OS: Windows 11
- User Role: Student/Admin/Teacher
```

---

## 📊 TEST METRICS

Track these metrics:
- Total test cases: 
- Passed: 
- Failed: 
- Blocked: 
- Pass rate: %
- Critical bugs: 
- High bugs: 
- Medium bugs: 
- Low bugs: 

---

**Prepared by:** QA Team  
**Approved by:** Project Manager  
**Date:** 28 Maret 2026
