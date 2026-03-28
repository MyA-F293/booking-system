# EYSA Booking System - Requirements Specification

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Active Development  
**Project:** EYSA Language Center Booking & Attendance System

---

## 📋 Project Overview

EYSA Booking System adalah aplikasi web untuk mengelola booking kelas, attendance, dan administrasi siswa di EYSA Language Center. Sistem mendukung multiple programs, levels, dan batch management dengan automated week tracking.

---

## 👥 User Roles & Permissions

### 1. Admin
- Full access ke semua fitur
- Student management (CRUD)
- Teacher management (CRUD)
- Schedule management (CRUD)
- Attendance reporting & export
- Bulk operations (import students, attendance)
- System settings (week increment, batch reset)

### 2. Student
- View available schedules
- Book classes (dengan validasi phase, capacity, room exclusivity)
- View & cancel own bookings
- View own attendance records

### 3. Teacher
- View assigned schedules
- Submit & edit attendance untuk students
- View class roster

---

## 🎯 Core Features & User Stories

### Feature 1: Authentication & Authorization

#### US-1.1: Admin Login
**As an** admin  
**I want to** login dengan username dan password  
**So that** saya bisa mengakses admin dashboard

**Acceptance Criteria:**
- Admin bisa login dengan username: `admin` dan password: `admin123`
- Setelah login, redirect ke Admin Dashboard
- Menampilkan nama admin di header
- Menampilkan menu admin (Dashboard, Students, Teachers, Classes, Schedules, Attendance, Bulk Operations)
- Invalid credentials menampilkan error message
- Required field validation untuk username dan password

#### US-1.2: Student Login
**As a** student  
**I want to** login dengan Student ID dan password  
**So that** saya bisa booking kelas dan lihat attendance

**Acceptance Criteria:**
- Student bisa login dengan Student ID format: `EYSA26010XXX`
- Default password: `student123`
- Setelah login, redirect ke Student Dashboard
- Menampilkan nama, program, dan level student
- Menampilkan menu student (Dashboard, New Booking, My Bookings)
- Invalid credentials menampilkan error message

#### US-1.3: Teacher Login
**As a** teacher  
**I want to** login dengan Teacher ID dan password  
**So that** saya bisa submit attendance

**Acceptance Criteria:**
- Teacher bisa login dengan Teacher ID format: `TCHR0XXX`
- Default password: `teacher123`
- Setelah login, redirect ke Teacher Dashboard
- Menampilkan nama teacher
- Menampilkan menu teacher (Attendance Management)

---

### Feature 2: Student Booking System

#### US-2.1: Book Class Schedule
**As a** student  
**I want to** book kelas yang available  
**So that** saya bisa attend kelas sesuai jadwal

**Acceptance Criteria:**
- Student bisa pilih Program, Level, Day, Time Slot, dan Class
- Sistem menampilkan hanya schedules yang available
- Booking berhasil menampilkan notifikasi success
- Booking muncul di "My Bookings"
- Counter `current_students` di schedule bertambah 1
- Status booking: "Confirmed"

**Business Rules:**
- Student hanya bisa book 1 schedule per phase per week
- Class tidak boleh melebihi max capacity
- 1 ruangan hanya bisa dipakai 1 program di waktu yang sama
- Week number harus sesuai dengan current week

#### US-2.2: Phase Booking Validation
**As a** student  
**I want to** sistem mencegah double booking di phase yang sama  
**So that** saya tidak book 2x untuk phase yang sama

**Acceptance Criteria:**
- Jika student sudah book Phase 1, tidak bisa book Phase 1 lagi di week yang sama
- Menampilkan error: "You have already booked a schedule for this phase"
- Hanya 1 booking per phase yang tersimpan

#### US-2.3: Capacity Validation
**As a** student  
**I want to** sistem mencegah booking jika class sudah full  
**So that** tidak terjadi overcapacity

**Acceptance Criteria:**
- Jika class sudah mencapai max capacity, button "Book Now" disabled
- Menampilkan label "Full" atau "No slots available"
- Booking ditolak dengan error: "Class is full"

#### US-2.4: Room Exclusivity Validation
**As a** student  
**I want to** sistem mencegah booking room yang sudah dipakai program lain  
**So that** tidak ada konflik ruangan

**Acceptance Criteria:**
- Jika Oxford sudah dipakai Program A di Monday Afternoon, Program B tidak bisa book Oxford di waktu yang sama
- Room yang occupied tidak muncul di available classes
- Atau menampilkan label "Occupied by [Program Name]"

#### US-2.5: Cancel Booking
**As a** student  
**I want to** cancel booking saya  
**So that** slot tersedia untuk student lain

**Acceptance Criteria:**
- Student bisa cancel booking dari "My Bookings"
- Booking status berubah jadi "Cancelled"
- Counter `current_students` berkurang 1
- Slot tersedia kembali untuk student lain
- Menampilkan notifikasi success

---

### Feature 3: Admin - Student Management

#### US-3.1: Create Student (Manual)
**As an** admin  
**I want to** create student secara manual  
**So that** student bisa login dan booking kelas

**Acceptance Criteria:**
- Admin bisa create student dengan form:
  - Student ID (auto-generate atau manual)
  - Full Name (required)
  - Batch (required)
  - Program (required)
  - Level (required)
  - Password (default: student123)
- Student ID format: `EYSA26010XXX`
- Student ID harus unique
- Student berhasil dibuat muncul di student list
- Student bisa login dengan credentials tersebut

#### US-3.2: Bulk Import Students
**As an** admin  
**I want to** import multiple students dari Excel  
**So that** saya tidak perlu input satu-satu

**Acceptance Criteria:**
- Admin bisa download template Excel
- Template memiliki columns: student_id, full_name, batch, program, level
- Admin bisa upload file Excel
- Sistem menampilkan preview data (5 rows pertama)
- Admin bisa klik "Import X+ Students"
- Sistem menampilkan summary: X success, Y failed
- Semua students berhasil diimport muncul di student list
- Password default: student123
- Semua students bisa login

**Error Handling:**
- Duplicate Student ID: "Student ID already exists"
- Missing required column: "Missing required columns: ..."
- Invalid program name: "Invalid program"
- Invalid level name: "Invalid level"

#### US-3.3: Edit Student
**As an** admin  
**I want to** edit data student  
**So that** data student selalu up-to-date

**Acceptance Criteria:**
- Admin bisa edit student dari student list
- Perubahan langsung terlihat di student list
- Student bisa login dengan data baru

#### US-3.4: Delete Student (Soft Delete)
**As an** admin  
**I want to** deactivate student  
**So that** student tidak bisa login tapi data tetap tersimpan

**Acceptance Criteria:**
- Admin bisa delete student dari student list
- Student di-deactivate (is_active = false)
- Student tidak muncul di active student list
- Student TIDAK BISA login
- Data student masih ada di database (soft delete)

---

### Feature 4: Admin - Teacher Management

#### US-4.1: Create Teacher
**As an** admin  
**I want to** create teacher  
**So that** teacher bisa submit attendance

**Acceptance Criteria:**
- Admin bisa create teacher dengan form:
  - Teacher ID (auto-generate TCHR0XXX)
  - Name (required)
  - Password (default: teacher123)
- Teacher ID format: TCHR0001, TCHR0002, dst
- Teacher muncul di teacher list
- Teacher bisa login

#### US-4.2: Assign Teacher to Schedule
**As an** admin  
**I want to** assign teacher ke schedule  
**So that** teacher bisa submit attendance untuk schedule tersebut

**Acceptance Criteria:**
- Admin bisa assign teacher dari schedule list
- Pilih teacher dari dropdown
- Nama teacher muncul di schedule
- Teacher bisa lihat schedule tersebut di dashboard

---

### Feature 5: Admin - Schedule Management

#### US-5.1: Create Schedule
**As an** admin  
**I want to** create schedule untuk kelas  
**So that** student bisa booking

**Acceptance Criteria:**
- Admin bisa create schedule dengan form:
  - Program (required)
  - Level (required)
  - Phase (required)
  - Day (required)
  - Time Slot (required)
  - Class (required)
  - Week Number (current week)
  - Year (2026)
  - Batch (required)
  - Teacher (optional)
- Schedule berhasil dibuat muncul di schedule list
- Available untuk student booking
- current_students = 0
- max_capacity sesuai class capacity

**Validation:**
- Tidak boleh duplicate (same class, day, time, week)
- Week number harus valid
- Batch harus valid

#### US-5.2: View Schedule Details
**As an** admin  
**I want to** lihat detail schedule  
**So that** saya bisa monitor booking dan attendance

**Acceptance Criteria:**
- Admin bisa view detail schedule
- Menampilkan detail schedule (program, level, phase, day, time, class, week, batch, teacher)
- Menampilkan list students yang book
- Menampilkan current_students / max_capacity
- Menampilkan teacher name

---

### Feature 6: Teacher - Attendance Management

#### US-6.1: Submit Attendance
**As a** teacher  
**I want to** submit attendance untuk students  
**So that** admin bisa track kehadiran

**Acceptance Criteria:**
- Teacher bisa pilih schedule dari list
- Sistem menampilkan student list
- Teacher bisa tandai attendance untuk setiap student: Present / Late / Absent
- Teacher bisa klik "Submit Attendance"
- Attendance berhasil disimpan
- Menampilkan notifikasi success
- Data attendance tersimpan di database
- Admin bisa lihat attendance report

**Validation:**
- Semua students harus ditandai
- Tidak bisa submit jika ada yang belum ditandai
- Week number sesuai dengan current week

#### US-6.2: Edit Attendance
**As a** teacher  
**I want to** edit attendance yang sudah disubmit  
**So that** saya bisa koreksi jika ada kesalahan

**Acceptance Criteria:**
- Teacher bisa edit attendance dari schedule list
- Ubah status student (misal: dari Absent ke Late)
- Klik "Update Attendance"
- Attendance berhasil diupdate
- Perubahan tersimpan di database

---

### Feature 7: Admin - Attendance Reporting

#### US-7.1: View Attendance Report
**As an** admin  
**I want to** lihat attendance report  
**So that** saya bisa monitor kehadiran students

**Acceptance Criteria:**
- Admin bisa view attendance report
- Filter by: Week, Program, Level
- Menampilkan attendance data sesuai filter
- Menampilkan summary: Total Present, Late, Absent
- Menampilkan per student
- Menampilkan per class

#### US-7.2: Export Attendance to Excel
**As an** admin  
**I want to** export attendance ke Excel  
**So that** saya bisa share report dengan stakeholder

**Acceptance Criteria:**
- Admin bisa export attendance ke Excel
- File Excel ter-download
- Format Excel sesuai (columns: Student ID, Name, Program, Level, Class, Date, Status)
- Data lengkap dan akurat
- Tidak ada kolom yang tidak perlu (email, phone, dll)

---

### Feature 8: Admin - Bulk Operations

#### US-8.1: Bulk Import Attendance
**As an** admin  
**I want to** import attendance dari Excel  
**So that** saya tidak perlu input satu-satu

**Acceptance Criteria:**
- Admin bisa download template
- Isi template dengan data attendance
- Upload file
- Preview data
- Klik "Import"
- Attendance berhasil diimport
- Smart matching untuk student names (fuzzy matching)
- Summary: X success, Y failed
- Data tersimpan di database

#### US-8.2: Bulk Assign Students to Class
**As an** admin  
**I want to** assign multiple students ke class  
**So that** saya tidak perlu assign satu-satu

**Acceptance Criteria:**
- Admin bisa download template
- Isi template: student_id, class_name, program, level
- Upload file
- Klik "Assign"
- Students berhasil di-assign
- Summary: X success, Y failed

---

### Feature 9: Admin - System Settings

#### US-9.1: Increment Week (Manual)
**As an** admin  
**I want to** increment week secara manual  
**So that** sistem berpindah ke week berikutnya

**Acceptance Criteria:**
- Admin bisa klik button "Next Week" (▶) di header
- Week increment dari database
- UI auto-refresh
- Semua students lihat week baru
- Booking rules reset untuk week baru
- Students bisa book lagi untuk week baru

#### US-9.2: Auto-Increment Week (GitHub Actions)
**As an** admin  
**I want to** sistem otomatis increment week setiap Senin  
**So that** saya tidak perlu manual increment

**Acceptance Criteria:**
- Sistem otomatis increment week setiap Senin 00:01 WIB
- Menggunakan GitHub Actions
- API function `api_increment_week()` di Supabase
- Security: API key verification
- Logs tersimpan di GitHub Actions

**Setup Requirements:**
- Run SQL untuk create API function
- Setup 3 GitHub Secrets (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_API_KEY)
- Push workflow file ke GitHub
- Test manual run di GitHub Actions

#### US-9.3: Reset Batch
**As an** admin  
**I want to** reset batch untuk semester baru  
**So that** sistem kembali ke Week 1 dan data batch lama terhapus

**Acceptance Criteria:**
- Admin bisa klik "Reset Batch"
- Konfirmasi (WARNING: This will delete all data)
- Sistem reset:
  - Week ke 1
  - Delete all bookings
  - Delete all schedules
  - Delete all attendance
  - Keep students, teachers, classes
- Week = 1
- Bookings table kosong
- Schedules table kosong
- Attendance table kosong
- Students, teachers, classes tetap ada

---

## 🔧 Technical Requirements

### Database
- PostgreSQL (Supabase)
- Tables: users, students, teachers, classes, schedules, bookings, attendance, settings
- RLS (Row Level Security) enabled
- Indexes untuk performance

### Frontend
- React 18
- Vite
- TailwindCSS
- Context API untuk state management
- React Router untuk routing

### Backend
- Supabase (BaaS)
- RPC functions untuk complex operations
- API functions untuk GitHub Actions

### Authentication
- Supabase Auth
- Role-based access control (Admin, Student, Teacher)

### Deployment
- Netlify (Frontend)
- Supabase (Backend)
- GitHub Actions (Auto-increment week)

---

## 📊 Data Models

### Users Table
- id (uuid, primary key)
- username (text, unique)
- password (text, hashed)
- role (text: admin/student/teacher)
- full_name (text)
- is_active (boolean, default: true)
- created_at (timestamp)

### Students Table
- id (uuid, primary key)
- student_id (text, unique, format: EYSA26010XXX)
- full_name (text)
- batch (integer)
- program (text)
- level (text)
- password (text, default: student123)
- is_active (boolean, default: true)
- created_at (timestamp)

### Teachers Table
- id (uuid, primary key)
- teacher_id (text, unique, format: TCHR0XXX)
- name (text)
- password (text, default: teacher123)
- is_active (boolean, default: true)
- created_at (timestamp)

### Classes Table
- id (uuid, primary key)
- class_name (text, unique)
- max_capacity (integer)
- created_at (timestamp)

### Schedules Table
- id (uuid, primary key)
- program (text)
- level (text)
- phase (text)
- day (text)
- time_slot (text)
- class_name (text, foreign key)
- week_number (integer)
- year (integer)
- batch (integer)
- teacher_id (text, foreign key, nullable)
- current_students (integer, default: 0)
- max_capacity (integer)
- created_at (timestamp)
- UNIQUE constraint: (class_name, day, time_slot, week_number, year)

### Bookings Table
- id (uuid, primary key)
- student_id (text, foreign key)
- schedule_id (uuid, foreign key)
- status (text: confirmed/cancelled)
- booked_at (timestamp)
- cancelled_at (timestamp, nullable)

### Attendance Table
- id (uuid, primary key)
- student_id (text, foreign key)
- schedule_id (uuid, foreign key)
- status (text: present/late/absent)
- week_number (integer)
- submitted_at (timestamp)
- submitted_by (text, teacher_id)

### Settings Table
- id (integer, primary key, default: 1)
- current_week (integer, default: 1)
- updated_at (timestamp)

---

## ✅ Acceptance Criteria (System-wide)

### Performance
- Page load time < 2 seconds
- API response time < 500ms
- Excel export < 5 seconds untuk 1000 rows

### Security
- Password hashing (bcrypt)
- API key verification untuk GitHub Actions
- RLS enabled untuk semua tables
- Input validation & sanitization

### Usability
- Responsive design (mobile, tablet, desktop)
- Clear error messages
- Loading indicators
- Success/error notifications (toast)
- Intuitive navigation

### Reliability
- 99.9% uptime
- Automatic backup (Supabase)
- Error logging & monitoring
- Graceful error handling

### Maintainability
- Clean code structure
- Component reusability
- Documentation (README, guides)
- Version control (Git)

---

## 🧪 Testing Requirements

### Unit Testing
- Test individual functions
- Test validation logic
- Test business rules

### Integration Testing
- Test API calls
- Test database operations
- Test authentication flow

### End-to-End Testing
- Test complete user journeys
- Test critical paths (booking, attendance)
- Test error scenarios

### User Acceptance Testing
- Test with real users (admin, student, teacher)
- Collect feedback
- Iterate based on feedback

**Reference:** `QA_TESTING_COMPREHENSIVE_GUIDE.md`

---

## 📚 Documentation Requirements

### User Documentation
- Admin guide
- Student guide
- Teacher guide
- FAQ

### Technical Documentation
- System architecture
- Database schema
- API documentation
- Deployment guide

### Process Documentation
- Setup guides
- Troubleshooting guides
- Migration guides
- Session summaries

---

## 🚀 Deployment Requirements

### Pre-Deployment Checklist
- [ ] All tests passed
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] GitHub Secrets configured
- [ ] Documentation updated

### Deployment Steps
1. Build frontend (npm run build)
2. Deploy to Netlify
3. Run database migrations
4. Setup GitHub Actions
5. Test production environment

### Post-Deployment Checklist
- [ ] Verify all features working
- [ ] Test auto-increment week
- [ ] Monitor error logs
- [ ] Collect user feedback

---

## 📝 Notes

### Current Status (March 28, 2026)
- ✅ Database week system implemented
- ✅ Auto-increment week (GitHub Actions) ready to deploy
- ✅ Manual increment week working
- ✅ Reset batch working
- ✅ Bulk import students working
- ⏳ Excel export needs column fix (remove email, phone, etc)
- ⏳ GitHub Actions needs setup (5-10 minutes)

### Known Issues
- Excel export includes unnecessary columns (email, phone)
- Need to remove these columns from export

### Next Steps
1. Fix Excel export columns
2. Setup GitHub Actions for auto-increment
3. Comprehensive QA testing
4. User acceptance testing
5. Production deployment

---

**Document Owner:** Development Team  
**Last Updated:** March 28, 2026  
**Status:** Living Document (will be updated as requirements evolve)
