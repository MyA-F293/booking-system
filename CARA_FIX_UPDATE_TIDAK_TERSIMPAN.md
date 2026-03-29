# Cara Fix: Update Tidak Tersimpan ke Database

## Problem
- Update student berhasil (toast success muncul)
- Tapi data di database tidak berubah
- Level masih "Belum Tes" padahal sudah update ke "Starter"

## Root Cause
**RLS (Row Level Security) Policy** di Supabase menghalangi UPDATE operation.

## Quick Fix

### Step 1: Test Update Manual di Supabase

Buka Supabase SQL Editor dan jalankan:

```sql
-- Test update manual
UPDATE users
SET 
    level = 'Starter',
    updated_at = NOW()
WHERE student_id = 'EYSA26010080'
RETURNING *;
```

**Jika berhasil**: Masalahnya di RLS Policy
**Jika gagal**: Ada masalah lain (permission, connection, dll)

### Step 2: Fix RLS Policy

Jalankan ini di Supabase SQL Editor:

```sql
-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;

-- Create new permissive UPDATE policy
CREATE POLICY "Anyone can update users"
ON users
FOR UPDATE
USING (true)
WITH CHECK (true);
```

### Step 3: Verify Fix

```sql
-- Cek policy yang aktif
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';

-- Test update lagi
UPDATE users
SET level = 'Starter'
WHERE student_id = 'EYSA26010080'
RETURNING student_id, full_name, level;
```

### Step 4: Test di Admin Dashboard

1. Refresh browser (Ctrl + F5)
2. Edit student
3. Ubah level ke "Starter"
4. Save
5. Cek di database apakah berubah

## Alternative: Disable RLS Sementara

**HATI-HATI**: Hanya untuk testing!

```sql
-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test update di Admin Dashboard

-- Enable kembali setelah test
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Permanent Solution

Buat RLS policies yang proper:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- Create new policies
-- 1. SELECT: Everyone can read
CREATE POLICY "Anyone can read users"
ON users FOR SELECT
USING (true);

-- 2. INSERT: Authenticated can insert
CREATE POLICY "Authenticated can insert users"
ON users FOR INSERT
WITH CHECK (true);

-- 3. UPDATE: Anyone can update
CREATE POLICY "Anyone can update users"
ON users FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. DELETE: Anyone can delete
CREATE POLICY "Anyone can delete users"
ON users FOR DELETE
USING (true);
```

## Verify

Setelah fix, verify dengan:

```sql
-- 1. Cek RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- 2. Cek policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users';

-- 3. Test update
UPDATE users
SET level = 'Elementary'
WHERE student_id = 'EYSA26010080'
RETURNING student_id, full_name, level, updated_at;
```

## Troubleshooting

### Issue: "permission denied for table users"
**Solution**: RLS policy terlalu restrictive
```sql
-- Buat policy yang lebih permissive
CREATE POLICY "Allow all operations"
ON users
USING (true)
WITH CHECK (true);
```

### Issue: "new row violates row-level security policy"
**Solution**: WITH CHECK clause terlalu strict
```sql
-- Update policy dengan WITH CHECK (true)
DROP POLICY IF EXISTS "problematic_policy" ON users;
CREATE POLICY "new_policy"
ON users FOR UPDATE
USING (true)
WITH CHECK (true);
```

### Issue: Update berhasil tapi tidak kelihatan
**Solution**: Cache issue
- Hard refresh browser (Ctrl + Shift + R)
- Clear browser cache
- Logout dan login lagi

## Testing Checklist

- [ ] Manual UPDATE di SQL Editor berhasil
- [ ] RLS policies sudah di-fix
- [ ] Update via Admin Dashboard berhasil
- [ ] Data di database berubah
- [ ] Refresh browser menampilkan data baru
- [ ] Console tidak ada error

## Files

- `database/FIX_UPDATE_STUDENT_RLS.sql` - Complete fix script
- `src/utils/authHelpers.js` - Update function (sudah benar)
- `src/AdminDashboard.jsx` - UI (sudah benar)

## Summary

Masalahnya bukan di code, tapi di **RLS Policy** Supabase yang terlalu restrictive. Fix dengan membuat policy yang lebih permissive untuk UPDATE operation.
