# Cara Input Manual Student via SQL

## ✅ Sistem Sudah Aman untuk Input Manual!

Fungsi `generateStudentId` **SELALU membaca database terlebih dahulu** sebelum generate ID baru, jadi urutan tetap konsisten meskipun ada input manual.

## Cara Kerja Generate ID

```javascript
// 1. Query database untuk ID tertinggi di batch yang sama
const { data } = await supabase
    .from('users')
    .select('student_id')
    .like('student_id', `EYSA${year}${batchPadded}%`)  // Cari pattern EYSA2601%
    .order('student_id', { ascending: false })          // Urutkan descending
    .limit(1)                                           // Ambil yang tertinggi

// 2. Extract sequence number dari ID tertinggi
const lastSeq = parseInt(lastId.slice(-4));  // Ambil 4 digit terakhir

// 3. Increment sequence
sequence = lastSeq + 1;

// 4. Generate ID baru
const studentId = `EYSA${year}${batchPadded}${seqPadded}`;
```

## Skenario Input Manual

### Skenario 1: Input Manual di Tengah
```sql
-- Database saat ini:
-- EYSA26010001
-- EYSA26010002

-- Input manual:
INSERT INTO users (student_id, full_name, batch, program, level, password, role, is_active)
VALUES ('EYSA26010005', 'John Doe', '1', 'Campus & Career', 'Starter', 'student123', 'student', true);

-- Generate via form berikutnya:
-- Sistem baca DB → Dapat EYSA26010005 (tertinggi)
-- Generate: EYSA26010006 ✅ URUT!
```

### Skenario 2: Input Manual Batch Berbeda
```sql
-- Database Batch 1: EYSA26010001, EYSA26010002
-- Database Batch 2: EYSA26020001

-- Input manual Batch 2:
INSERT INTO users (student_id, full_name, batch, program, level, password, role, is_active)
VALUES ('EYSA26020010', 'Jane Doe', '2', 'English for Teens', 'Starter', 'student123', 'student', true);

-- Generate via form Batch 2:
-- Query: EYSA2602% → Dapat EYSA26020010
-- Generate: EYSA26020011 ✅ URUT per batch!
```

### Skenario 3: Ada Gap (Tidak Masalah)
```sql
-- Database:
-- EYSA26010001
-- EYSA26010003 (gap, 0002 dihapus)
-- EYSA26010007 (manual)

-- Generate via form:
-- Sistem baca DB → Dapat EYSA26010007 (tertinggi, ignore gap)
-- Generate: EYSA26010008 ✅ URUT dari yang tertinggi!
```

## Template SQL untuk Input Manual

```sql
-- Format: EYSA-YY-BA-SEQ
-- YY = 2 digit tahun (26 untuk 2026)
-- BA = 2 digit batch (01, 02, 03, dst)
-- SEQ = 4 digit urut (0001, 0002, dst)

-- Contoh Batch 1:
INSERT INTO users (
    student_id, 
    full_name, 
    batch, 
    program, 
    level, 
    password, 
    role, 
    is_active
)
VALUES (
    'EYSA26010050',           -- ID: EYSA + 26 (tahun) + 01 (batch) + 0050 (urut)
    'Nama Lengkap Siswa',     -- Nama
    '1',                      -- Batch (plain number: "1", "2", "3")
    'Campus & Career',        -- Program: "Campus & Career" atau "English for Teens"
    'Starter',                -- Level: "Starter", "Upper Starter", "Pre-Intermediate", "Intermediate"
    'student123',             -- Password default
    'student',                -- Role: selalu "student"
    true                      -- is_active: true
);

-- Contoh Batch 2:
INSERT INTO users (student_id, full_name, batch, program, level, password, role, is_active)
VALUES ('EYSA26020025', 'Nama Siswa Batch 2', '2', 'English for Teens', 'Intermediate', 'student123', 'student', true);
```

## Cek ID Tertinggi Sebelum Input Manual

Untuk memastikan tidak bentrok, cek dulu ID tertinggi:

```sql
-- Cek ID tertinggi Batch 1 tahun 2026:
SELECT student_id 
FROM users 
WHERE student_id LIKE 'EYSA2601%' 
ORDER BY student_id DESC 
LIMIT 1;

-- Cek ID tertinggi Batch 2 tahun 2026:
SELECT student_id 
FROM users 
WHERE student_id LIKE 'EYSA2602%' 
ORDER BY student_id DESC 
LIMIT 1;

-- Cek semua ID per batch:
SELECT batch, student_id 
FROM users 
WHERE student_id LIKE 'EYSA26%' 
ORDER BY batch, student_id;
```

## ⚠️ Hal yang Perlu Diperhatikan

### ✅ AMAN:
- Input manual dengan ID lebih tinggi dari yang ada
- Ada gap di sequence number (sistem ambil yang tertinggi)
- Input manual di batch berbeda (sequence independent per batch)

### ⚠️ HATI-HATI:
- **Jangan input manual dengan ID yang sudah ada** (akan error duplicate key)
- **Pastikan format benar**: EYSA + YY (2 digit) + BA (2 digit) + SEQ (4 digit)
- **Batch harus plain number**: "1", "2", "3" (bukan "Batch 1")

### ❌ JANGAN:
```sql
-- ❌ SALAH: Format ID tidak sesuai
INSERT INTO users (...) VALUES ('EYSA2601001', ...);  -- Kurang 1 digit

-- ❌ SALAH: Batch dengan prefix
INSERT INTO users (...) VALUES ('EYSA26010001', ..., 'Batch 1', ...);  -- Harus "1"

-- ❌ SALAH: ID sudah ada
INSERT INTO users (...) VALUES ('EYSA26010001', ...);  -- Jika sudah ada
```

## Kesimpulan

✅ **Sistem sudah aman!** Anda bisa input manual via SQL kapan saja, dan generate via form akan tetap urut karena:

1. Sistem **selalu query database** sebelum generate
2. Sistem **ambil ID tertinggi** di batch yang sama
3. Sistem **increment dari ID tertinggi** tersebut
4. Sequence **independent per batch** (Batch 1 dan Batch 2 punya urutan sendiri)

Tidak perlu khawatir tentang ketidakselarasan urutan! 🎉
