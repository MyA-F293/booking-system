# Teacher/Tutor Feature - Setup Guide

## 🎯 Overview

Fitur Teacher/Tutor memungkinkan teacher untuk:
- Login sekali per batch (auto-remember)
- Melihat daftar siswa di kelas mereka
- Mencatat attendance (Present, Late, Absent)
- Submit attendance ke Google Sheets

## 📋 Setup Instructions

### 1. Update Database - Add Password to Teachers Table

Jalankan SQL script di Supabase SQL Editor:

```sql
-- File: database/add_teacher_password.sql
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'teacher123';
UPDATE teachers SET password = 'teacher123' WHERE password IS NULL;
ALTER TABLE teachers ALTER COLUMN password SET NOT NULL;
```

### 2. Setup Google Sheets untuk Attendance

1. Buat Google Sheet baru untuk attendance
2. Buat Google Apps Script (Extensions → Apps Script)
3. Copy paste script berikut:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp,
      data.teacherName,
      data.className,
      data.program,
      data.level,
      data.phase,
      data.day,
      data.timeSlot,
      data.week,
      data.year,
      data.studentId,
      data.studentName,
      data.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}));
  }
}
```

4. Deploy as Web App:
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the Web App URL

5. Add header row di Sheet:
```
Timestamp | Teacher | Class | Program | Level | Phase | Day | Time | Week | Year | Student ID | Student Name | Status
```

### 3. Add Environment Variable

Tambahkan di `.env.local`:

```env
VITE_ATTENDANCE_SHEET_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. Get Teacher ID

Teacher data sudah ada di database. Untuk mendapatkan Teacher ID:

**Cara 1: Via Admin Dashboard**
1. Login sebagai Admin
2. Go to "Teachers" tab
3. Lihat list teachers yang sudah ada
4. Copy Teacher ID (UUID) dari teacher yang ingin login
5. Password default semua teacher: `teacher123`

**Cara 2: Via Supabase**
1. Buka Supabase Dashboard
2. Go to Table Editor → teachers
3. Lihat kolom `id` (UUID)
4. Copy ID teacher yang diinginkan
5. Password default: `teacher123`

**Berikan ke Teacher:**
- Teacher ID: `[UUID dari database]`
- Password: `teacher123`
- Instruksi: Login di tab "Teacher" pada halaman login

## 🔐 Teacher Login

### First Time Login:
1. Buka aplikasi
2. Klik tab "Teacher" di login page
3. Masukkan Teacher ID (UUID dari database)
4. Masukkan password (default: `teacher123`)
5. Klik "Login as Teacher"

### Auto-Login (Remember Me):
- Setelah login pertama kali, teacher tidak perlu login lagi
- Browser akan remember teacher login
- Langsung masuk ke dashboard saat buka aplikasi
- Berlaku untuk satu batch

### Logout:
- Klik tombol "Logout" di header
- Akan clear remember status
- Perlu login lagi next time

## 📱 Teacher Dashboard Features

### Header:
- Logo EYSA
- Nama kelas yang sedang diajar
- Level kelas
- Nama teacher
- Tombol logout

### Class Selection (jika teacher punya multiple classes):
- Grid cards menampilkan semua kelas teacher
- Klik card untuk pilih kelas
- Info: Class name, Program, Level, Day, Time

### Statistics Cards:
- **Present**: Jumlah siswa present (hijau)
- **Late**: Jumlah siswa late (kuning)
- **Absent**: Jumlah siswa absent (merah)
- Update real-time saat ubah attendance

### Student List:
- Nomor urut
- Nama siswa
- Student ID
- 3 tombol attendance per siswa:
  - **Present** (hijau) - Default
  - **Late** (kuning)
  - **Absent** (merah)
- Klik tombol untuk ubah status
- Active button akan highlight dengan shadow

### Submit Attendance:
- Button di bawah student list
- Klik untuk submit semua attendance ke Google Sheets
- Loading state saat submit
- Success notification setelah submit

## 📊 Attendance Data Format (Google Sheets)

```
Timestamp: 2026-01-27T10:30:00.000Z
Teacher: John Doe
Class: Harvard Class
Program: Campus & Career
Level: Starter
Phase: phase1
Day: monday
Time: afternoon
Week: 5
Year: 2026
Student ID: EYSA26010001
Student Name: Jane Smith
Status: present
```

## 🔧 Technical Details

### Files Created/Modified:

**New Files:**
- `src/components/TeacherDashboard.jsx` - Teacher dashboard component
- `database/add_teacher_password.sql` - SQL untuk add password column
- `TEACHER_SETUP.md` - Documentation

**Modified Files:**
- `src/App.jsx` - Add teacher routing & auto-login
- `src/Login.jsx` - Add teacher login tab
- `src/utils/authHelpers.js` - Add teacherLogin, isTeacherRemembered functions
- `src/utils/dbHelpers.js` - Add teacher_id filter to getSchedules

### Auto-Login Implementation:

```javascript
// On teacher login
localStorage.setItem('teacherRemember', 'true');
localStorage.setItem('user', JSON.stringify(teacherData));

// On app init
if (isTeacherRemembered()) {
  // Auto-login teacher
}

// On logout
localStorage.removeItem('teacherRemember');
localStorage.removeItem('user');
```

### Security:
- Teacher password stored in database (plain text - consider hashing in production)
- RLS policies di Supabase protect teacher data
- Only active teachers can login
- Remember status stored in localStorage (per browser)

## 🎨 UI/UX Features

- **Color Coding**:
  - Teacher tab: Orange (#F39C32)
  - Present: Green
  - Late: Yellow
  - Absent: Red

- **Responsive Design**:
  - Mobile-friendly
  - Touch-friendly buttons
  - Adaptive layout

- **User Feedback**:
  - Loading states
  - Success/error toasts
  - Visual button states
  - Real-time stats update

## 🐛 Troubleshooting

### Teacher can't login:
- Check teacher is active (`is_active = true`)
- Check password column exists
- Check Teacher ID is correct (UUID format)
- Check password is correct

### Attendance not submitting:
- Check `VITE_ATTENDANCE_SHEET_URL` in `.env.local`
- Check Google Apps Script is deployed
- Check "Who has access" is set to "Anyone"
- Check Sheet permissions

### Auto-login not working:
- Check localStorage not cleared
- Check `teacherRemember` key exists
- Check browser allows localStorage
- Try logout and login again

### No classes showing:
- Check teacher has schedules assigned
- Check schedules are for current week
- Check `teacher_id` in schedules table matches

## 📝 Notes

- Default password: `teacher123` (change in production!)
- Teacher ID adalah UUID dari database teachers table
- Remember status per browser (not per device)
- Attendance submitted to Google Sheets (no database storage)
- One teacher can have multiple classes
- Auto-select first class if only one class

## ✅ Testing Checklist

- [ ] Teacher can login with ID & password
- [ ] Auto-login works after first login
- [ ] Teacher dashboard shows correct classes
- [ ] Can select different classes (if multiple)
- [ ] Student list loads correctly
- [ ] Can change attendance status
- [ ] Statistics update real-time
- [ ] Can submit attendance
- [ ] Data appears in Google Sheets
- [ ] Logout works and clears remember
- [ ] Mobile responsive
- [ ] Error handling works

---

**Ready to use!** 🎉

Teacher feature sudah lengkap dan siap digunakan. Pastikan setup Google Sheets dan environment variable sudah benar.
