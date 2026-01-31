# 🚀 Quick Reference - Teacher Feature

## ⚡ 1-Minute Setup

### Step 1: Run SQL (Supabase)
```sql
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'teacher123';
UPDATE teachers SET password = 'teacher123' WHERE password IS NULL;
ALTER TABLE teachers ALTER COLUMN password SET NOT NULL;
```

### Step 2: Get Teacher ID
- Login as Admin → Teachers tab → Click "View ID" → Copy UUID

### Step 3: Test Login
- Teacher tab → Enter UUID → Password: `teacher123` → Login

---

## 📋 Quick Commands

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### Check Diagnostics
```bash
npm run lint
```

---

## 🔑 Default Credentials

### Admin:
- ID: `EYSA2601`
- Password: `EasyPeasySadra!`

### Teacher:
- ID: `[UUID from database]`
- Password: `teacher123`

### Student:
- ID: `EYSA26010001` (example)
- Password: `student123`

---

## 📂 Key Files

### Teacher Feature:
- `src/components/TeacherDashboard.jsx` - Main dashboard
- `src/Login.jsx` - Login page (teacher tab)
- `src/utils/authHelpers.js` - Teacher auth functions
- `database/add_teacher_password.sql` - SQL script

### Documentation:
- `TEACHER_SETUP.md` - Complete setup guide
- `TEACHER_LOGIN_GUIDE.md` - User guide for teachers
- `TODO_NEXT_STEPS.md` - What to do next
- `SYSTEM_ARCHITECTURE.md` - System overview

---

## 🎯 Feature Checklist

- [x] Teacher login with UUID + password
- [x] Auto-login (remember me)
- [x] Teacher dashboard
- [x] Class selection
- [x] Student list
- [x] Attendance marking (Present/Late/Absent)
- [x] Real-time statistics
- [x] Submit to Google Sheets
- [x] Logout functionality
- [x] Mobile responsive
- [x] Build successful
- [ ] SQL script executed (TODO)
- [ ] Testing completed (TODO)

---

## 🔗 Important URLs

### Supabase:
- Dashboard: https://supabase.com/dashboard
- Project: `zckdzifjyoglyqnxdtaw`

### Google Sheets:
- Feedback: Already configured
- Attendance: Already configured

### Environment:
- `.env.local` - All URLs configured

---

## 🎨 Color Codes

- **Teacher Theme**: `#F39C32` (Orange)
- **Present**: `#10B981` (Green)
- **Late**: `#F59E0B` (Yellow)
- **Absent**: `#EF4444` (Red)
- **Primary**: `#1F4E8C` (Blue)

---

## 📊 Database Tables

### teachers
- `id` (UUID) - Teacher ID for login
- `name` (TEXT) - Teacher name
- `password` (TEXT) - Login password
- `is_active` (BOOL) - Active status

### schedules
- `teacher_id` (UUID) - Links to teacher
- `class_id` (UUID) - Links to class
- `week_number` (INT) - Current week
- `year` (INT) - Current year

### schedule_students
- `schedule_id` (UUID) - Links to schedule
- `user_id` (UUID) - Links to student

---

## 🐛 Quick Troubleshooting

### Can't login?
→ Check SQL script was run
→ Check password column exists
→ Check Teacher ID is correct

### No classes?
→ Check teacher has schedules
→ Check current week/year
→ Check teacher_id in schedules

### Auto-login not working?
→ Check localStorage
→ Check teacherRemember key
→ Try login again

### Attendance not submitting?
→ Check VITE_ATTENDANCE_SHEET_URL
→ Check Google Apps Script
→ Check internet connection

---

## ✅ Testing Flow

1. Run SQL script
2. Get teacher UUID from admin
3. Login as teacher
4. Select class
5. Mark attendance
6. Submit
7. Check Google Sheets
8. Logout
9. Refresh page (should auto-login)
10. Done! ✨

---

## 📞 Support

### Check Logs:
- Browser Console (F12)
- Supabase Logs
- Google Apps Script Logs

### Verify:
- SQL script executed
- Environment variables set
- Teacher is active
- Schedules exist

---

## 🎉 Status

**Implementation:** ✅ COMPLETE
**Build:** ✅ SUCCESS
**Documentation:** ✅ COMPLETE
**Testing:** ⏳ PENDING

**Next:** Run SQL script → Test → Deploy! 🚀

---

**Total Time to Complete:** ~15 minutes
**Difficulty:** Easy
**Status:** Ready to use!
