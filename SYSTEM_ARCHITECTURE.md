# 🏗️ System Architecture - Teacher Feature

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Student    │  │   Teacher    │  │    Admin     │         │
│  │   (Blue)     │  │   (Orange)   │  │    (Blue)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        ┌───────────────────┐   ┌───────────────────┐
        │  Student Login    │   │  Teacher Login    │
        │  (student_id +    │   │  (UUID +          │
        │   password)       │   │   password)       │
        └───────────────────┘   └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐   ┌───────────────────┐
        │  Check users      │   │  Check teachers   │
        │  table            │   │  table            │
        └───────────────────┘   └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐   ┌───────────────────┐
        │  Store in         │   │  Store in         │
        │  localStorage     │   │  localStorage +   │
        │                   │   │  teacherRemember  │
        └───────────────────┘   └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐   ┌───────────────────┐
        │  Booking System   │   │  Teacher          │
        │  Dashboard        │   │  Dashboard        │
        └───────────────────┘   └───────────────────┘
```

## 🔄 Teacher Dashboard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEACHER DASHBOARD                             │
├─────────────────────────────────────────────────────────────────┤
│  Header:                                                         │
│  [EYSA Logo] [Class Name • Level]        [Teacher] [Logout]     │
├─────────────────────────────────────────────────────────────────┤
│  Load Schedules:                                                 │
│  getSchedules({ teacher_id, week_number, year })                │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  If Multiple Classes: Show Class Selection Cards         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Class 1  │  │ Class 2  │  │ Class 3  │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  Select Class → Load Students:                                  │
│  getScheduleStudents(schedule_id)                               │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Statistics Cards:                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Present  │  │   Late   │  │  Absent  │              │  │
│  │  │    15    │  │     2    │  │     1    │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Student List:                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ 1  Jane Smith (EYSA26010001)                       │  │  │
│  │  │    [Present] [Late] [Absent]                       │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │ 2  John Doe (EYSA26010002)                         │  │  │
│  │  │    [Present] [Late] [Absent]                       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  Click Button → Update State:                                   │
│  setAttendance({ [userId]: 'present'|'late'|'absent' })        │
│                          ↓                                       │
│  Statistics Auto-Update (Real-time)                             │
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              [Submit Attendance]                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  Prepare Data → Send to Google Sheets                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         TEACHERS TABLE                           │
├─────────────────────────────────────────────────────────────────┤
│  id (UUID)          - Primary Key, Teacher ID for login         │
│  name (TEXT)        - Teacher full name                         │
│  email (TEXT)       - Teacher email (optional)                  │
│  phone (TEXT)       - Teacher phone (optional)                  │
│  password (TEXT)    - Login password (default: 'teacher123')    │
│  is_active (BOOL)   - Active status                             │
│  created_at         - Timestamp                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (teacher_id)
┌─────────────────────────────────────────────────────────────────┐
│                        SCHEDULES TABLE                           │
├─────────────────────────────────────────────────────────────────┤
│  id (UUID)          - Primary Key                               │
│  teacher_id (UUID)  - Foreign Key → teachers.id                 │
│  class_id (UUID)    - Foreign Key → classes.id                  │
│  program (TEXT)     - Campus & Career / English for Teens       │
│  level (TEXT)       - Starter / Upper Starter / etc.            │
│  phase (TEXT)       - phase1 / phase2 / phase3                  │
│  day (TEXT)         - monday / tuesday / etc.                   │
│  time_slot (TEXT)   - morning / afternoon / evening             │
│  week_number (INT)  - Week number (1-52)                        │
│  year (INT)         - Year (2026)                               │
│  batch (INT)        - Batch number                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (schedule_id)
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULE_STUDENTS TABLE                       │
├─────────────────────────────────────────────────────────────────┤
│  id (UUID)          - Primary Key                               │
│  schedule_id (UUID) - Foreign Key → schedules.id                │
│  user_id (UUID)     - Foreign Key → users.id                    │
│  created_at         - Timestamp                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (user_id)
┌─────────────────────────────────────────────────────────────────┐
│                          USERS TABLE                             │
├─────────────────────────────────────────────────────────────────┤
│  id (UUID)          - Primary Key                               │
│  student_id (TEXT)  - Student ID (EYSA26010001)                 │
│  full_name (TEXT)   - Student full name                         │
│  program (TEXT)     - Campus & Career / English for Teens       │
│  level (TEXT)       - Starter / Upper Starter / etc.            │
│  batch_number (INT) - Batch number                              │
│  password (TEXT)    - Login password                            │
│  role (TEXT)        - student / admin                           │
│  is_active (BOOL)   - Active status                             │
└─────────────────────────────────────────────────────────────────┘
```

## 📡 API Flow

### Teacher Login:
```javascript
teacherLogin(teacherId, password)
    ↓
Query: SELECT * FROM teachers 
       WHERE id = teacherId 
       AND password = password 
       AND is_active = true
    ↓
Store: localStorage.setItem('user', JSON.stringify(teacherData))
       localStorage.setItem('teacherRemember', 'true')
    ↓
Return: { id, name, email, phone, role: 'teacher', ... }
```

### Load Schedules:
```javascript
getSchedules({ teacher_id, week_number, year })
    ↓
Query: SELECT schedules.*, 
              classes.*, 
              teachers.*
       FROM schedules
       LEFT JOIN classes ON schedules.class_id = classes.id
       LEFT JOIN teachers ON schedules.teacher_id = teachers.id
       WHERE teacher_id = teacher_id
       AND week_number = week_number
       AND year = year
    ↓
Return: [{ id, class, teacher, program, level, ... }]
```

### Load Students:
```javascript
getScheduleStudents(schedule_id)
    ↓
Query: SELECT schedule_students.*, 
              users.*
       FROM schedule_students
       LEFT JOIN users ON schedule_students.user_id = users.id
       WHERE schedule_id = schedule_id
    ↓
Return: [{ user_id, user: { full_name, student_id, ... } }]
```

### Submit Attendance:
```javascript
handleSubmitAttendance()
    ↓
Prepare: attendanceData = students.map(student => ({
    timestamp, teacherName, className, program, level,
    phase, day, timeSlot, week, year,
    studentId, studentName, status
}))
    ↓
Send: fetch(VITE_ATTENDANCE_SHEET_URL, {
    method: 'POST',
    body: JSON.stringify(record)
})
    ↓
Google Sheets: Append row to sheet
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP INITIALIZATION                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Check localStorage for 'user'                               │
│     ↓                                                            │
│  2. If no user, check 'teacherRemember'                         │
│     ↓                                                            │
│  3. If teacherRemember = 'true', auto-login teacher             │
│     ↓                                                            │
│  4. Route based on user.role:                                   │
│     - role = 'teacher' → TeacherDashboard                       │
│     - role = 'admin'   → AdminDashboard                         │
│     - role = 'student' → BookingSystemDB                        │
│     - no user          → Login                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TEACHER AUTO-LOGIN                          │
├─────────────────────────────────────────────────────────────────┤
│  On First Login:                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ localStorage.setItem('user', JSON.stringify(teacher))    │  │
│  │ localStorage.setItem('teacherRemember', 'true')          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  On Next Visit:                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ if (isTeacherRemembered()) {                             │  │
│  │   const user = JSON.parse(localStorage.getItem('user')) │  │
│  │   if (user.role === 'teacher') {                         │  │
│  │     setUser(user) // Auto-login                          │  │
│  │   }                                                       │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  On Logout:                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ localStorage.removeItem('user')                          │  │
│  │ localStorage.removeItem('teacherRemember')               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Component Structure

```
App.jsx
├── Login.jsx
│   ├── Student Tab
│   ├── Teacher Tab (Orange)
│   └── Admin Tab
│
├── TeacherDashboard.jsx
│   ├── Header
│   │   ├── EYSA Logo
│   │   ├── Class Info
│   │   └── Logout Button
│   │
│   ├── Class Selection (if multiple)
│   │   └── Class Cards
│   │
│   ├── Statistics Cards
│   │   ├── Present Card (Green)
│   │   ├── Late Card (Yellow)
│   │   └── Absent Card (Red)
│   │
│   ├── Student List
│   │   └── Student Row
│   │       ├── Number
│   │       ├── Name & ID
│   │       └── Attendance Buttons
│   │           ├── Present (Green)
│   │           ├── Late (Yellow)
│   │           └── Absent (Red)
│   │
│   └── Submit Button
│
├── BookingSystemDB.jsx (Student)
└── AdminDashboard.jsx (Admin)
```

## 🎨 State Management

```javascript
// TeacherDashboard State
const [schedules, setSchedules] = useState([])
    // All schedules for this teacher in current week

const [selectedSchedule, setSelectedSchedule] = useState(null)
    // Currently selected schedule/class

const [students, setStudents] = useState([])
    // Students in selected schedule

const [attendance, setAttendance] = useState({})
    // { [userId]: 'present'|'late'|'absent' }
    // Default: all 'present'

const [loading, setLoading] = useState(false)
    // Loading state for data fetching

const [submitting, setSubmitting] = useState(false)
    // Loading state for attendance submission
```

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   Teacher   │
│   Logs In   │
└──────┬──────┘
       ↓
┌─────────────────────────────────────────┐
│  Load Schedules (teacher_id filter)    │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Display Class Selection (if multiple)  │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Teacher Selects Class                  │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Load Students (schedule_id)            │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Initialize Attendance (all 'present')  │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Display Student List + Buttons         │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Teacher Clicks Attendance Button       │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Update State: attendance[userId]       │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Re-calculate Statistics (real-time)    │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Teacher Clicks Submit                  │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Prepare Attendance Data                │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Send to Google Sheets (POST)           │
└──────┬──────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│  Show Success Toast                     │
└─────────────────────────────────────────┘
```

## 🌐 Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://zckdzifjyoglyqnxdtaw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets Integration
VITE_FEEDBACK_SHEET_URL=https://script.google.com/macros/s/.../exec
VITE_ATTENDANCE_SHEET_URL=https://script.google.com/macros/s/.../exec
```

## 📁 File Structure

```
src/
├── App.jsx                          # Main app with routing
├── Login.jsx                        # Login page (3 tabs)
├── BookingSystemDB.jsx              # Student dashboard
├── AdminDashboard.jsx               # Admin dashboard
│
├── components/
│   ├── TeacherDashboard.jsx         # Teacher dashboard ⭐ NEW
│   ├── AdminBookingDashboard.jsx
│   ├── AdminStatsDashboard.jsx
│   ├── BookingDashboard.jsx
│   ├── FeedbackButton.jsx
│   ├── ThemeToggle.jsx
│   └── Toast.jsx
│
├── utils/
│   ├── authHelpers.js               # Auth functions (+ teacher) ⭐ UPDATED
│   ├── dbHelpers.js                 # DB functions (+ teacher_id filter) ⭐ UPDATED
│   └── useDebounce.js
│
├── contexts/
│   ├── LanguageContext.jsx
│   ├── SettingsContext.jsx
│   └── ThemeContext.jsx
│
└── supabaseClient.js

database/
└── add_teacher_password.sql         # SQL script ⭐ NEW

Documentation:
├── TEACHER_SETUP.md                 # Setup guide ⭐ NEW
├── TEACHER_LOGIN_GUIDE.md           # User guide ⭐ NEW
├── IMPLEMENTATION_STATUS.md         # Status ⭐ NEW
├── TODO_NEXT_STEPS.md               # Next steps ⭐ NEW
└── SYSTEM_ARCHITECTURE.md           # This file ⭐ NEW
```

## 🎯 Key Features Summary

### 1. One-Time Login
- Teacher logs in once per batch
- Auto-login on subsequent visits
- Remember status stored in localStorage

### 2. Class Management
- View all assigned classes
- Select class to mark attendance
- Switch between classes easily

### 3. Attendance Marking
- Three status options: Present, Late, Absent
- Default: All students Present
- Visual feedback with color-coded buttons
- Real-time statistics update

### 4. Data Submission
- Batch submit all attendance
- Send to Google Sheets
- Include comprehensive metadata
- Success/error feedback

### 5. Responsive Design
- Mobile-friendly interface
- Touch-friendly buttons
- Adaptive layout
- Optimized for all screen sizes

---

**System is complete and ready to use!** 🚀

Just run the SQL script and start testing! 🎉
