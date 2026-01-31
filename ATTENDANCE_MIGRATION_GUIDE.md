# Attendance Migration Guide: Google Sheets → Supabase

## ✅ COMPLETED STEPS

### 1. Database Schema Created
- Created `database/create_attendance_table.sql` with:
  - Attendance table with proper columns (snake_case naming)
  - Indexes for performance
  - RLS policies for security

### 2. Database Helper Functions Added
- Added to `src/utils/dbHelpers.js`:
  - `submitAttendance()` - Submit single attendance record
  - `submitBatchAttendance()` - Submit multiple records at once
  - `getAttendanceRecords()` - Fetch attendance with filters
  - `getAttendanceStats()` - Get attendance statistics
  - `getStudentAttendanceSummary()` - Get student-specific summary
  - `checkAttendanceExists()` - Check for duplicate entries
  - `updateAttendance()` - Update existing record
  - `deleteAttendance()` - Delete record

### 3. Teacher Dashboard Updated
- `src/components/TeacherDashboard.jsx` now submits to Supabase
- Uses `submitBatchAttendance()` function
- Proper field mapping (snake_case)

### 4. Attendance Report Updated
- `src/components/AttendanceReport.jsx` now fetches from Supabase
- All field names updated:
  - `timestamp` → `created_at`
  - `className` → `class_name`
  - `teacherName` → `teacher_name`
  - `studentName` → `student_name`
  - `studentId` → `student_id`
  - `week` → `week_number`
  - `timeSlot` → `time_slot`
- CSV export updated
- Excel export updated
- Table rendering updated
- Charts updated

### 5. Student Attendance View Updated
- `src/BookingSystemDB.jsx` StudentAttendanceView component updated
- Now fetches from Supabase using `getAttendanceRecords()`
- Field names updated to match Supabase schema

## 🔧 NEXT STEPS (Manual Actions Required)

### Step 1: Run SQL Script in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/create_attendance_table.sql`
4. Copy the entire SQL script
5. Paste it into the SQL Editor
6. Click **Run** to execute

This will create:
- `attendance` table
- Indexes for performance
- RLS policies for security

### Step 2: Test Teacher Attendance Submission

1. Login as a teacher (use teacher credentials)
2. Navigate to the teacher dashboard
3. Select a class with students
4. Mark attendance for students (Present/Late/Absent)
5. Click "Submit Attendance"
6. Check Supabase dashboard → Table Editor → `attendance` table
7. Verify records were created with correct data

### Step 3: Test Admin Attendance Report

1. Login as admin (ID: `EYSA2601`, Password: `EasyPeasySadra!`)
2. Navigate to "Attendance Report" section
3. Select filters (week/month, class)
4. Verify attendance records are displayed
5. Test CSV export
6. Test Excel export
7. Check both "Records" and "Summary" views

### Step 4: Test Student Attendance History

1. Login as a student
2. Navigate to "My Attendance" tab
3. Verify attendance records are displayed
4. Check stats cards (Total, Present, Late, Rate)
5. Verify motivational messages appear based on attendance rate

### Step 5: Remove Google Sheets Environment Variables

Once everything is working, remove these from `.env.local`:

```env
# OLD - Remove these lines
VITE_ATTENDANCE_SHEET_URL=...
VITE_ATTENDANCE_POST_URL=...
```

## 📊 Field Name Mapping Reference

| Google Sheets (old) | Supabase (new) |
|---------------------|----------------|
| `timestamp`         | `created_at`   |
| `className`         | `class_name`   |
| `teacherName`       | `teacher_name` |
| `studentName`       | `student_name` |
| `studentId`         | `student_id`   |
| `week`              | `week_number`  |
| `timeSlot`          | `time_slot`    |

## 🗄️ Database Schema

```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES teachers(id),
    teacher_name TEXT NOT NULL,
    schedule_id UUID REFERENCES schedules(id),
    class_name TEXT NOT NULL,
    program TEXT NOT NULL,
    level TEXT NOT NULL,
    phase TEXT NOT NULL,
    day TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent'))
);
```

## 🔍 Troubleshooting

### Issue: "Failed to fetch attendance data"
- Check if SQL script was run successfully in Supabase
- Verify RLS policies are enabled
- Check browser console for detailed error messages

### Issue: "Failed to submit attendance"
- Verify teacher is logged in correctly
- Check if schedule_id exists in schedules table
- Verify all required fields are provided

### Issue: No attendance records showing
- Verify data was submitted successfully (check Supabase table)
- Check filter settings (week/month/class)
- Verify student_id matches between users and attendance tables

## ✨ Benefits of Migration

1. **Real-time Updates**: No more waiting for Google Sheets sync
2. **Better Performance**: Database queries are much faster
3. **Data Integrity**: Foreign key constraints ensure data consistency
4. **Security**: RLS policies protect sensitive data
5. **Scalability**: Can handle thousands of records efficiently
6. **Offline Support**: Can implement offline-first features later
7. **Advanced Queries**: Can do complex filtering and aggregations

## 📝 Notes

- All existing Google Sheets data will remain intact
- You can keep both systems running temporarily for comparison
- Once verified, you can export Google Sheets data and import to Supabase if needed
- The migration is backward compatible - old code won't break

## 🎉 Migration Complete!

Once all tests pass, your attendance system will be fully migrated to Supabase!
