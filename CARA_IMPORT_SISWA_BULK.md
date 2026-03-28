# 📚 CARA IMPORT SISWA BULK DARI CSV

## 🎯 OVERVIEW

Kamu punya data siswa di CSV/Google Sheets dengan kolom:
- Name
- Batch
- Programs
- Level

Kita akan import semuanya sekaligus ke Supabase dengan auto-generate Student ID.

---

## 📋 STEP-BY-STEP GUIDE

### STEP 1: Persiapkan Data CSV

Dari Google Sheets kamu, pastikan format seperti ini:

```
Name                          | Batch | Programs                  | Level
------------------------------|-------|---------------------------|-------------
Rizky Ramadani                | 2     | English Campus & Career   | Belum Tes
Esl Suanda Sapira             | 2     | English Campus & Career   | Starter
Najwa Khalilah Nursafirah     | 2     | English Campus & Career   | Starter
```

---

### STEP 2: Cek Student ID Terakhir

Buka Supabase SQL Editor, run query ini:

```sql
SELECT student_id, name 
FROM users 
WHERE role = 'student' 
ORDER BY student_id DESC 
LIMIT 5;
```

**Hasil contoh:**
```
EYSA2615 | Faradilla
EYSA2614 | Ahmad
EYSA2613 | Budi
```

**Student ID terakhir**: EYSA2615
**Student ID baru dimulai dari**: EYSA2616

---

### STEP 3: Generate SQL INSERT

Saya sudah buatkan template di `database/BULK_IMPORT_STUDENTS_SIMPLE.sql`.

Copy data dari CSV kamu, lalu paste ke format VALUES seperti ini:

```sql
VALUES
    ('Rizky Ramadani', 'English Campus & Career', 'Belum Tes', 2),
    ('Esl Suanda Sapira', 'English Campus & Career', 'Starter', 2),
    ('Najwa Khalilah Nursafirah', 'English Campus & Career', 'Starter', 2),
    -- dst...
```

---

### STEP 4: Run SQL di Supabase

1. Buka Supabase Dashboard
2. Klik **SQL Editor**
3. Copy-paste SQL dari `database/BULK_IMPORT_STUDENTS_SIMPLE.sql`
4. **PENTING**: Ubah starting number di script:
   ```sql
   'EYSA' || lpad((2615 + row_number() OVER ())::text, 4, '0')
   ```
   Ganti `2615` dengan Student ID terakhir yang kamu dapat dari STEP 2

5. Klik **Run**

---

### STEP 5: Verify Import

Run query ini untuk cek hasil import:

```sql
SELECT 
    student_id,
    name,
    program,
    level,
    batch,
    created_at
FROM users
WHERE role = 'student'
AND batch = 2
ORDER BY student_id DESC;
```

**Expected Result:**
```
EYSA2630 | Naurah Aathifah Nursaidi | English Campus & Career | Upper Starter | 2
EYSA2629 | Nurul Fathiyah S.A       | English Campus & Career | Upper Starter | 2
EYSA2628 | Siti Hajar Jumadil       | English for Teens       | Upper Starter | 2
...
EYSA2616 | Rizky Ramadani           | English Campus & Career | Belum Tes     | 2
```

---

## 🔑 TENTANG STUDENT ID

### Format:
```
EYSA + 4 digit angka
Contoh: EYSA2616, EYSA2617, EYSA2618
```

### Auto-Generate:
Script akan otomatis generate Student ID berurutan:
- Siswa 1: EYSA2616
- Siswa 2: EYSA2617
- Siswa 3: EYSA2618
- dst.

### Password Default:
Semua siswa baru akan punya password default: **EYSA2026**

Siswa bisa ganti password nanti lewat menu "Change Password" di dashboard.

---

## 📊 CONTOH LENGKAP

Misalnya kamu punya 15 siswa baru, dan Student ID terakhir adalah EYSA2615.

**SQL yang kamu run:**

```sql
-- Starting dari EYSA2616
INSERT INTO auth.users (...)
SELECT
    'student' || row_number() OVER () || '@eysa.local' as email,
    crypt('EYSA2026', gen_salt('bf')) as encrypted_password,
    now() as email_confirmed_at,
    '{"provider":"email","providers":["email"]}' as raw_app_meta_data,
    json_build_object(
        'student_id', 'EYSA' || lpad((2615 + row_number() OVER ())::text, 4, '0'),
        'name', name,
        'program', program,
        'level', level,
        'batch', batch
    ) as raw_user_meta_data,
    now() as created_at,
    now() as updated_at,
    'authenticated' as role
FROM (
    VALUES
        ('Rizky Ramadani', 'English Campus & Career', 'Belum Tes', 2),
        ('Esl Suanda Sapira', 'English Campus & Career', 'Starter', 2),
        ('Najwa Khalilah Nursafirah', 'English Campus & Career', 'Starter', 2),
        ('Deviyanti Pratiwi', 'English Campus & Career', 'Upper Starter', 2),
        ('Muh Fikri Syahputra', 'English Campus & Career', 'Starter', 2),
        ('Siti Aisyah Syafni', 'English Campus & Career', 'Starter', 2),
        ('Muzakki Zakaria', 'English Campus & Career', 'Upper Starter', 2),
        ('Farel Dy Stankovic', 'English Campus & Career', 'Upper Starter', 2),
        ('Nur Kasih Aulia', 'English Campus & Career', 'Upper Starter', 2),
        ('Andi Nurul Amriana', 'English Campus & Career', 'Starter', 2),
        ('Amanda Putri', 'English Campus & Career', 'Upper Starter', 2),
        ('Eqha Adarri Destasari Indar', 'English Campus & Career', 'Upper Starter', 2),
        ('Siti Hajar Jumadil', 'English for Teens', 'Upper Starter', 2),
        ('Nurul Fathiyah S.A', 'English Campus & Career', 'Upper Starter', 2),
        ('Naurah Aathifah Nursaidi', 'English Campus & Career', 'Upper Starter', 2)
) AS students(name, program, level, batch);

-- Insert ke public.users
INSERT INTO public.users (id, student_id, name, program, level, batch, role, created_at)
SELECT
    au.id,
    (au.raw_user_meta_data->>'student_id')::text,
    (au.raw_user_meta_data->>'name')::text,
    (au.raw_user_meta_data->>'program')::text,
    (au.raw_user_meta_data->>'level')::text,
    (au.raw_user_meta_data->>'batch')::integer,
    'student',
    au.created_at
FROM auth.users au
WHERE au.email LIKE 'student%@eysa.local'
AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
```

**Hasil:**
- 15 siswa baru ter-import
- Student ID: EYSA2616 sampai EYSA2630
- Password semua: EYSA2026
- Batch: 2

---

## ⚠️ TROUBLESHOOTING

### Error: "duplicate key value violates unique constraint"

**Penyebab**: Student ID sudah ada di database

**Solusi**: 
1. Cek Student ID terakhir lagi
2. Ubah starting number di script
3. Run ulang

### Error: "permission denied for table auth.users"

**Penyebab**: Tidak punya akses ke auth.users

**Solusi**: 
1. Pastikan kamu login sebagai admin/owner di Supabase
2. Atau gunakan Service Role Key (jangan share ke publik!)

### Siswa tidak muncul di Admin Dashboard

**Penyebab**: Belum insert ke public.users

**Solusi**: Run STEP 3 di SQL script (INSERT INTO public.users)

---

## 🎉 SELESAI!

Sekarang semua siswa baru sudah bisa login dengan:
- **Student ID**: EYSA2616, EYSA2617, dst.
- **Password**: EYSA2026

Mereka bisa langsung booking kelas! 🚀

---

## 📁 FILES REFERENCE

- `database/BULK_IMPORT_STUDENTS.sql` - SQL script lengkap
- `database/BULK_IMPORT_STUDENTS_SIMPLE.sql` - SQL script simple (coming next)
- `CARA_IMPORT_SISWA_BULK.md` - Panduan ini
