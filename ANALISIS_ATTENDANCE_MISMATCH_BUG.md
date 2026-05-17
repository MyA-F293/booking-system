# Analisis Bug: Attendance Mismatch antara Teacher Dashboard dan Report

## Masalah
Teacher sudah mark attendance sebagai **PRESENT** di dashboard, tapi di Attendance Report muncul **ABSENT**.

## Root Cause Analysis

### 1. **Kemungkinan Duplicate Attendance Records**

Dari kode `TeacherDashboard.jsx` line 242-246:
```javascript
// Check existing attendance to determine INSERT vs UPDATE
const { data: existingAttendance, error: checkError } = await supabase
    .from('attendance')
    .select('id, student_id, status')
    .eq('schedule_id', selectedSchedule.id);
```

**Masalah:** Query ini hanya filter berdasarkan `schedule_id`, tidak ada filter untuk `student_id` yang spesifik.

Jika ada **duplicate attendance records** untuk student yang sama di schedule yang sama:
- Record 1: status = 'present' (yang baru diupdate teacher)
- Record 2: status = 'absent' (record lama/duplicate)

Maka saat report menampilkan data, bisa jadi yang muncul adalah record yang salah.

### 2. **Update Logic Bermasalah**

Dari kode line 325-330:
```javascript
// UPDATE existing records
for (const record of recordsToUpdate) {
    const { error: updateError } = await supabase
        .from('attendance')
        .update({ status: record.status })
        .eq('id', record.id);
```

**Masalah:** Update berdasarkan `id`, tapi jika ada duplicate records dengan `student_id` yang sama, hanya 1 record yang diupdate. Record duplicate lainnya tetap `absent`.

### 3. **Mapping student_id Tidak Konsisten**

Line 248-268:
```javascript
// Create map of existing records by student_id
const existingMap = {};
if (existingAttendance) {
    existingAttendance.forEach(record => {
        existingMap[record.student_id] = record;
    });
}
```

**Masalah:** Jika ada duplicate records untuk `student_id` yang sama, `existingMap` hanya menyimpan **record terakhir** yang di-loop. Record duplicate lainnya tidak ter-track.

### 4. **Report Menampilkan Semua Records**

Dari `AttendanceReport.jsx`:
```javascript
const data = await getAttendanceRecords();
```

Report mengambil **SEMUA** attendance records tanpa deduplikasi. Jika ada duplicate, semua akan ditampilkan.

## Skenario Bug

### Skenario 1: Duplicate Records
1. Teacher pertama kali submit attendance → INSERT record (status: present)
2. Ada bug/error → INSERT duplicate record (status: absent)
3. Teacher edit attendance → UPDATE record pertama (status: present)
4. Record duplicate tetap (status: absent)
5. Report menampilkan kedua records → Muncul absent

### Skenario 2: Race Condition
1. Teacher klik submit 2x dengan cepat (double click)
2. Request pertama: INSERT (status: present)
3. Request kedua: INSERT lagi (status: absent karena default)
4. Kedua records tersimpan
5. Report menampilkan yang terakhir → Muncul absent

### Skenario 3: Schedule ID Mismatch
1. Ada 2 schedule dengan data yang sama tapi ID berbeda (duplicate schedule)
2. Teacher mark attendance di schedule A (status: present)
3. Student booking di schedule B
4. Report menampilkan attendance dari schedule B (status: absent atau tidak ada)

## Bukti dari Database

Dari query yang sudah kita jalankan:
- **Fathir (EYSA26020052)**: Week 5, Tuesday evening - Status: **ABSENT**
- **Rinaldy (EYSA26020116)**: Week 6, Friday afternoon - Status: **ABSENT**

Kemungkinan ada duplicate records atau record yang tidak terupdate.

## Solusi

### Solusi Jangka Pendek (Quick Fix)

#### 1. Cek Duplicate Records
```sql
-- Cari duplicate attendance records
SELECT 
  student_id,
  schedule_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as record_ids,
  STRING_AGG(status, ', ') as statuses
FROM attendance
GROUP BY student_id, schedule_id
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

#### 2. Hapus Duplicate (Keep Latest)
```sql
-- Hapus duplicate, keep yang paling baru
DELETE FROM attendance a
USING (
  SELECT 
    student_id,
    schedule_id,
    MAX(created_at) as latest_created_at
  FROM attendance
  GROUP BY student_id, schedule_id
  HAVING COUNT(*) > 1
) b
WHERE a.student_id = b.student_id
  AND a.schedule_id = b.schedule_id
  AND a.created_at < b.latest_created_at;
```

#### 3. Add Unique Constraint
```sql
-- Prevent future duplicates
ALTER TABLE attendance
ADD CONSTRAINT unique_student_schedule 
UNIQUE (student_id, schedule_id);
```

### Solusi Jangka Panjang (Code Fix)

#### 1. Fix Update Logic di TeacherDashboard.jsx

**BEFORE:**
```javascript
const existingMap = {};
existingAttendance.forEach(record => {
    existingMap[record.student_id] = record; // ❌ Overwrite if duplicate
});
```

**AFTER:**
```javascript
const existingMap = {};
existingAttendance.forEach(record => {
    // Keep the latest record if duplicate exists
    if (!existingMap[record.student_id] || 
        new Date(record.created_at) > new Date(existingMap[record.student_id].created_at)) {
        existingMap[record.student_id] = record;
    }
});
```

#### 2. Add Duplicate Prevention

**Add before INSERT:**
```javascript
// Check for existing records for this specific student
const { data: existingForStudent } = await supabase
    .from('attendance')
    .select('id')
    .eq('schedule_id', selectedSchedule.id)
    .eq('student_id', studentId);

if (existingForStudent && existingForStudent.length > 0) {
    // UPDATE instead of INSERT
    recordsToUpdate.push({
        id: existingForStudent[0].id,
        status: status
    });
} else {
    // INSERT new record
    recordsToInsert.push({...});
}
```

#### 3. Add Double-Click Prevention

**Already exists but can be improved:**
```javascript
if (submitting) {
    console.log('⚠️ Already submitting, ignoring duplicate click');
    return;
}
```

Add visual feedback:
```javascript
if (submitting) {
    toast.warning('Please wait, submitting attendance...');
    return;
}
```

#### 4. Fix Report Query (Deduplicate)

**In AttendanceReport.jsx:**
```javascript
const data = await getAttendanceRecords();

// Deduplicate by keeping latest record per student per schedule
const deduplicatedData = Object.values(
    data.reduce((acc, record) => {
        const key = `${record.student_id}_${record.schedule_id}`;
        if (!acc[key] || new Date(record.created_at) > new Date(acc[key].created_at)) {
            acc[key] = record;
        }
        return acc;
    }, {})
);

setAttendanceData(deduplicatedData);
```

## Action Plan

### Immediate (Sekarang)
1. ✅ Jalankan query untuk cek duplicate records
2. ⏳ Jika ada duplicate, hapus dengan query di atas
3. ⏳ Add unique constraint untuk prevent future duplicates
4. ⏳ Update status Fathir dan Rinaldy yang salah

### Short Term (Minggu Ini)
1. ⏳ Implement code fix untuk update logic
2. ⏳ Add duplicate prevention di submit attendance
3. ⏳ Add deduplikasi di report query
4. ⏳ Test thoroughly

### Long Term (Bulan Ini)
1. ⏳ Add audit trail (track semua perubahan attendance)
2. ⏳ Add confirmation modal sebelum submit
3. ⏳ Add real-time sync notification
4. ⏳ Implement optimistic locking untuk prevent race condition

## Testing Checklist

- [ ] Cek apakah ada duplicate records di database
- [ ] Test submit attendance 2x dengan cepat (double click)
- [ ] Test edit attendance yang sudah ada
- [ ] Test submit attendance untuk student baru
- [ ] Verify report menampilkan data yang benar setelah submit
- [ ] Test dengan multiple teachers submit bersamaan
- [ ] Test dengan slow network connection

## Monitoring

Add logging untuk track:
- Setiap INSERT attendance
- Setiap UPDATE attendance
- Setiap duplicate detection
- Setiap error saat submit

Format log:
```javascript
console.log('📝 ATTENDANCE_ACTION', {
    action: 'INSERT' | 'UPDATE' | 'DUPLICATE_DETECTED',
    student_id: studentId,
    schedule_id: scheduleId,
    status: status,
    teacher_id: teacherId,
    timestamp: new Date().toISOString()
});
```
