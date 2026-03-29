# Debug: ID Tidak Berlanjut

## Problem
Generate ID menghasilkan `EYSA26020001` padahal harusnya berlanjut dari ID terakhir.

## Step-by-Step Debug

### Step 1: Cek Data di Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek semua student di batch 2
SELECT 
    student_id,
    full_name,
    batch,
    role,
    created_at
FROM users
WHERE student_id LIKE 'EYSA2602%'
ORDER BY student_id DESC
LIMIT 10;
```

**Yang perlu dicek:**
- ✅ Apakah ada student dengan ID EYSA2602xxxx?
- ✅ Apakah kolom `role` berisi `'student'`?
- ✅ Apakah kolom `batch` berisi `'2'` atau `2`?

### Step 2: Cek Console Browser

1. Buka Admin Dashboard
2. Tekan F12 untuk buka Developer Tools
3. Pilih tab "Console"
4. Klik "Create Student"
5. Klik "Generate ID"
6. **Lihat log yang muncul**

**Log yang diharapkan:**
```
🔍 Getting latest batch number...
✅ Latest batch found: 2
🆔 Generating student ID for batch: 2
🔍 Searching for students with prefix: EYSA2602
📊 All matching records: [...]
📊 Total records found: X
👥 Filtered students only: [...]
👥 Total students found: X
📌 Last student ID found: EYSA26020XXX
🔢 Last sequence number: XXX
➕ New sequence number: XXX
✅ Generated student ID: EYSA26020XXX
```

### Step 3: Identifikasi Masalah

#### Scenario A: Total records found = 0
**Masalah**: Tidak ada student dengan prefix EYSA2602
**Solusi**: 
- Cek apakah student ID di database benar formatnya
- Mungkin ada typo atau format berbeda

#### Scenario B: Total records found > 0, tapi Filtered students = 0
**Masalah**: Ada data tapi role bukan 'student'
**Solusi**:
```sql
-- Cek role yang sebenarnya
SELECT DISTINCT role FROM users WHERE student_id LIKE 'EYSA2602%';

-- Fix role jika salah
UPDATE users 
SET role = 'student' 
WHERE student_id LIKE 'EYSA2602%' 
AND role != 'student';
```

#### Scenario C: Batch number salah
**Masalah**: Batch di form tidak sesuai dengan batch di database
**Solusi**: Pastikan batch number di form = 2

### Step 4: Test dengan Query Manual

Di Supabase SQL Editor, test query yang sama dengan function:

```sql
-- Test 1: Cek dengan LIKE
SELECT student_id, role
FROM users
WHERE student_id LIKE 'EYSA2602%'
ORDER BY student_id DESC;

-- Test 2: Cek dengan role filter
SELECT student_id, role
FROM users
WHERE role = 'student'
AND student_id LIKE 'EYSA2602%'
ORDER BY student_id DESC
LIMIT 1;

-- Test 3: Cek data type
SELECT 
    student_id,
    role,
    pg_typeof(role) as role_type,
    pg_typeof(student_id) as id_type
FROM users
WHERE student_id LIKE 'EYSA2602%'
LIMIT 1;
```

### Step 5: Kemungkinan Penyebab

1. **Role bukan 'student'**
   - Cek: `SELECT DISTINCT role FROM users;`
   - Fix: Update role ke 'student'

2. **Student ID format berbeda**
   - Cek: Apakah ada spasi atau karakter aneh?
   - Fix: Standardize format

3. **Batch number salah**
   - Cek: Batch di form vs batch di database
   - Fix: Ubah batch number di form

4. **RLS Policy blocking**
   - Cek: Apakah RLS policy menghalangi query?
   - Fix: Disable RLS sementara untuk test

### Step 6: Quick Fix

Jika masih tidak work, coba ini:

```sql
-- 1. Cek ID terakhir manual
SELECT MAX(student_id) as last_id
FROM users
WHERE student_id LIKE 'EYSA2602%';

-- 2. Ambil sequence number
-- Contoh: EYSA26020045 -> sequence = 45
-- ID baru harusnya: EYSA26020046
```

Lalu di form, **manual input** ID yang benar sementara.

### Step 7: Verifikasi Fix

Setelah fix, test lagi:

1. Refresh halaman (Ctrl+F5)
2. Clear browser cache
3. Klik "Create Student"
4. Cek batch number (harusnya 2)
5. Klik "Generate ID"
6. Cek console log
7. Verify ID yang muncul

## Common Issues & Solutions

### Issue 1: "No existing students found"
**Penyebab**: Query tidak menemukan student
**Debug**:
```sql
SELECT COUNT(*) FROM users WHERE student_id LIKE 'EYSA2602%';
```
**Fix**: Pastikan ada data di database

### Issue 2: ID selalu 0001
**Penyebab**: Filter role tidak match
**Debug**:
```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```
**Fix**: Update role ke 'student'

### Issue 3: Batch number tidak auto-load
**Penyebab**: Function getLatestBatch error
**Debug**: Cek console untuk error
**Fix**: Pastikan ada student di database

## Emergency Workaround

Jika masih tidak bisa, gunakan cara manual:

1. Cek ID terakhir di database
2. Hitung sequence berikutnya
3. Manual input ID di form (jangan klik Generate)
4. Create student

Contoh:
- ID terakhir: EYSA26020045
- ID baru: EYSA26020046 (manual input)

## Next Steps

Setelah debug:
1. Screenshot console log
2. Screenshot hasil query database
3. Share ke saya untuk analisis lebih lanjut

## Files to Check

- `src/utils/authHelpers.js` - Function generateStudentId
- `src/AdminDashboard.jsx` - Form dan button
- Database table `users` - Data students
