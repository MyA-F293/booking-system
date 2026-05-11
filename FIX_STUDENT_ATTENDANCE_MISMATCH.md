# Fix: Student View Menampilkan Status Berbeda dari Admin

## Masalah
- Admin tandai siswa "Present" di Supabase database
- Student view menampilkan "Absent" karena masih baca dari Google Sheets lama

## Root Cause
**Dual Data Source Problem:**
- `AdminAttendanceManager.jsx` → Menggunakan **Supabase** (database baru)
- `StudentAttendanceHistory.jsx` → Menggunakan **Google Sheets** (sistem lama)

Ketika admin submit attendance ke Supabase, data tidak sync ke Google Sheets, sehingga student view tidak update.

## Solusi
Update `StudentAttendanceHistory.jsx` untuk menggunakan Supabase sebagai single source of truth.

### Changes Made

**Before:**
```javascript
// Fetch dari Google Sheets
const SHEET_URL = import.meta.env.VITE_ATTENDANCE_SHEET_URL;
const response = await fetch(SHEET_URL);
const data = await response.json();
const myData = data.filter(record => record.studentId === user.student_id);
```

**After:**
```javascript
// Fetch dari Supabase database
const { data: attendanceRecords, error } = await supabase
    .from('attendance')
    .select(`
        *,
        schedules (
            class_name,
            day,
            teacher_name
        )
    `)
    .eq('student_id', user.student_id)
    .order('date', { ascending: false });
```

## Testing

### 1. Test Student View
1. Login sebagai student
2. Buka "My Attendance History"
3. Verify data sesuai dengan yang di admin

### 2. Test Real-time Update
1. Admin submit attendance untuk student
2. Student refresh page
3. Status harus langsung update

### 3. Test Data Consistency
```sql
-- Cek attendance di database
SELECT 
  a.date,
  s.student_name,
  sch.class_name,
  a.status
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN schedules sch ON a.schedule_id = sch.id
WHERE s.student_id = 'STUDENT_ID_HERE'
ORDER BY a.date DESC
LIMIT 10;
```

## Benefits
✅ Single source of truth (Supabase)
✅ Real-time consistency antara admin dan student view
✅ Tidak perlu maintain Google Sheets lagi
✅ Lebih cepat dan reliable

## Migration Notes
- Google Sheets URL (`VITE_ATTENDANCE_SHEET_URL`) tidak digunakan lagi
- Bisa dihapus dari `.env.local` setelah verify semua berfungsi
- Old attendance data di Google Sheets bisa di-archive

## Rollback Plan
Jika ada masalah, revert ke Google Sheets:
```javascript
// Restore old code
const SHEET_URL = import.meta.env.VITE_ATTENDANCE_SHEET_URL;
const response = await fetch(SHEET_URL);
```

## Related Files
- ✅ `src/components/StudentAttendanceHistory.jsx` - Updated
- ✅ `src/components/AdminAttendanceManager.jsx` - Already using Supabase
- 📝 `.env.local` - Can remove `VITE_ATTENDANCE_SHEET_URL` after testing
