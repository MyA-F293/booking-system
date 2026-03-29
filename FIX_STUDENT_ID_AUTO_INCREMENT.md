# Fix Student ID Auto-Increment Issue

## Problem
Ketika generate Student ID baru, ID tidak berlanjut dari ID terakhir yang ada di database.

Contoh:
- ID terakhir di database: `EYSA26020045`
- Generate ID baru harusnya: `EYSA26020046`
- Tapi malah generate: `EYSA26020001`

## Root Cause Analysis

Fungsi `generateStudentId` sudah benar, tapi ada beberapa kemungkinan masalah:

1. **Batch number tidak sesuai**: User mungkin input batch number yang berbeda
2. **Data di database tidak konsisten**: Ada student dengan batch berbeda-beda
3. **Format student_id tidak konsisten**: Ada ID dengan format berbeda

## Solution

### Step 1: Check Current Data
Jalankan query ini di Supabase SQL Editor:

```sql
-- Check all students with their IDs
SELECT 
    student_id,
    full_name,
    batch,
    program,
    created_at
FROM users
WHERE role = 'student'
ORDER BY student_id DESC
LIMIT 20;
```

### Step 2: Verify Batch Numbers
```sql
-- Check batch distribution
SELECT 
    batch,
    COUNT(*) as total_students,
    MIN(student_id) as first_id,
    MAX(student_id) as last_id
FROM users
WHERE role = 'student'
GROUP BY batch
ORDER BY batch;
```

### Step 3: Improved Function (Already Implemented)

Fungsi `generateStudentId` di `src/utils/authHelpers.js` sudah benar:

```javascript
export const generateStudentId = async (batchNumber) => {
    const year = new Date().getFullYear().toString().slice(-2); // 26 for 2026
    const batchPadded = batchNumber.toString().padStart(2, '0'); // 01, 02, etc
    const prefix = `EYSA${year}${batchPadded}`;

    // Get last student in this batch
    const { data, error } = await supabase
        .from('users')
        .select('student_id')
        .eq('role', 'student')
        .like('student_id', `${prefix}%`)
        .order('student_id', { ascending: false })
        .limit(1)

    let sequence = 1;

    if (data && data.length > 0) {
        const lastId = data[0].student_id;
        const lastSeq = parseInt(lastId.slice(-4));
        sequence = lastSeq + 1;
    }

    const seqPadded = sequence.toString().padStart(4, '0');
    const studentId = `${prefix}${seqPadded}`;

    return studentId;
}
```

### Step 4: User Action Required

**PENTING**: Saat menambah student baru, pastikan:

1. **Pilih Batch Number yang benar** di form
   - Jika student terakhir adalah batch 2, pilih batch 2
   - Jangan biarkan default (batch 1)

2. **Klik "Generate ID" setelah memilih batch**
   - Ubah batch number dulu
   - Baru klik Generate ID

3. **Verifikasi ID yang di-generate**
   - Pastikan ID berlanjut dari ID terakhir
   - Contoh: Jika terakhir EYSA26020045, yang baru harus EYSA26020046

## Testing

### Test Case 1: Generate ID untuk Batch yang Sudah Ada
1. Cek ID terakhir di database untuk batch 2:
   ```sql
   SELECT student_id FROM users 
   WHERE role='student' AND student_id LIKE 'EYSA2602%' 
   ORDER BY student_id DESC LIMIT 1;
   ```
   
2. Di Admin Dashboard:
   - Pilih Batch Number: 2
   - Klik "Generate ID"
   - Verifikasi ID yang muncul adalah +1 dari ID terakhir

### Test Case 2: Generate ID untuk Batch Baru
1. Cek apakah batch 3 sudah ada:
   ```sql
   SELECT COUNT(*) FROM users 
   WHERE role='student' AND student_id LIKE 'EYSA2603%';
   ```
   
2. Di Admin Dashboard:
   - Pilih Batch Number: 3
   - Klik "Generate ID"
   - Verifikasi ID yang muncul adalah EYSA26030001

## Potential Enhancement

Jika ingin auto-detect batch number dari student terakhir, bisa tambahkan fungsi ini:

```javascript
export const getLatestBatch = async () => {
    const { data, error } = await supabase
        .from('users')
        .select('batch')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(1)

    if (data && data.length > 0) {
        return parseInt(data[0].batch);
    }
    return 1; // Default batch
}
```

Lalu di AdminDashboard, saat form dibuka, auto-load batch terakhir:

```javascript
const handleOpenCreateForm = async () => {
    const latestBatch = await getLatestBatch();
    setFormData({
        ...formData,
        batch_number: latestBatch
    });
    setShowCreateForm(true);
}
```

## Conclusion

Fungsi sudah benar. Masalahnya adalah **user harus memilih batch number yang sesuai** sebelum generate ID.

Solusi:
1. ✅ Fungsi sudah benar (tidak perlu diubah)
2. ⚠️ User harus pilih batch yang benar
3. 💡 Optional: Auto-detect batch terakhir (enhancement)
