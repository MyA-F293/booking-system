# 📊 Cara Ambil Data untuk Analisis Name Matching

## 🎯 Tujuan
Mengumpulkan data untuk menganalisis kenapa nama di CSV tidak cocok dengan database.

---

## 📋 Step 1: Ambil Data Student dari Database

### Cara 1: Via Supabase Dashboard (Paling Mudah)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project EYSA

2. **Buka Table Editor**
   - Klik "Table Editor" di sidebar kiri
   - Pilih table `users`

3. **Filter Student**
   - Klik icon filter (funnel)
   - Pilih kolom `role`
   - Pilih operator `equals`
   - Isi value: `student`
   - Apply filter

4. **Export Data**
   - Klik tombol "..." (3 titik) di kanan atas table
   - Pilih "Download as CSV"
   - Save file sebagai `students_database.csv`

5. **Kirim File**
   - Kirim file `students_database.csv` ke chat ini

---

### Cara 2: Via SQL Editor (Lebih Detail)

1. **Buka SQL Editor**
   - Di Supabase Dashboard
   - Klik "SQL Editor" di sidebar

2. **Jalankan Query Ini**

```sql
-- Query 1: List semua student aktif
SELECT 
    student_id,
    full_name,
    email,
    is_active,
    created_at
FROM users
WHERE role = 'student'
ORDER BY full_name;
```

3. **Copy Hasil**
   - Klik "Results" tab
   - Klik "Download CSV"
   - Save sebagai `students_database.csv`

4. **Jalankan Query Tambahan**

```sql
-- Query 2: List nama yang tidak cocok (sudah ter-import dengan IMPORT_ prefix)
SELECT 
    student_name,
    COUNT(*) as jumlah_record,
    MIN(day) as tanggal_pertama,
    MAX(day) as tanggal_terakhir
FROM attendance
WHERE student_id LIKE 'IMPORT_%'
GROUP BY student_name
ORDER BY student_name;
```

5. **Copy Hasil**
   - Download CSV
   - Save sebagai `unmatched_names.csv`

---

## 📄 Step 2: Ambil Sample CSV yang Diimport

### Yang Dibutuhkan:
File CSV yang tadi diimport (yang menyebabkan masalah)

### Format yang Diharapkan:
```csv
name,date,teacher,class,status
Valentino,2024-01-15,Ms. Sarah,Harvard 1,Present
Ade Sherlina,2024-01-15,Ms. Sarah,Harvard 1,Present
...
```

### Cara:
1. Cari file CSV yang tadi diimport
2. Buka dengan Notepad atau Excel
3. Copy 10-20 baris pertama (termasuk header)
4. Paste ke chat ini, atau
5. Kirim file CSV lengkapnya

---

## 🖼️ Step 3: Screenshot Console Log (Opsional)

Jika masih ada di browser:

1. **Buka Developer Console**
   - Tekan `F12` atau `Ctrl+Shift+I`
   - Pilih tab "Console"

2. **Cari Log Import**
   - Scroll ke atas untuk cari log saat import
   - Cari yang ada tulisan:
     - "✅ Matched:"
     - "❌ Unmatched record:"
     - "⚠️ attendance records couldn't be matched"

3. **Screenshot**
   - Screenshot bagian yang menunjukkan unmatched records
   - Kirim ke chat ini

---

## 📤 Apa yang Harus Dikirim ke Chat

**CARA MUDAH: Copy-Paste Langsung ke Chat**

Karena tidak bisa upload file, cukup copy-paste data langsung:

### Minimal (Wajib):

**1. Data Student dari Database**
```
Copy hasil query 1 dan paste ke chat seperti ini:

student_id | full_name | email | is_active
EYSA2601001 | Ahmad Rizki | ahmad@example.com | true
EYSA2601002 | Siti Nurhaliza | siti@example.com | true
...
```

**2. Sample CSV yang Diimport**
```
Copy 10-20 baris dari CSV dan paste ke chat seperti ini:

name,date,teacher,class,status
Valentino,2024-01-15,Ms. Sarah,Harvard 1,Present
Ade Sherlina,2024-01-15,Ms. Sarah,Harvard 1,Present
...
```

### Opsional (Sangat Membantu):

**3. Unmatched Names**
```
Copy hasil query 2 dan paste ke chat
```

**4. Console Log**
```
Copy text dari console yang menunjukkan unmatched records
```

---

## 🔍 Apa yang Akan Saya Analisis

Setelah menerima data, saya akan:

### 1. **Identifikasi Perbedaan Nama**
   - Bandingkan nama di CSV vs database
   - Cari pattern perbedaan (huruf besar/kecil, spasi, karakter khusus)

### 2. **Hitung Fuzzy Match Score**
   - Test setiap nama dengan algoritma yang sama
   - Lihat score yang didapat (threshold sekarang 0.85)

### 3. **Buat Mapping Manual**
   - Jika nama berbeda tapi jelas orangnya sama
   - Contoh: "Valentino" → "M. Valentino Wijaya"

### 4. **Identifikasi Missing Students**
   - Nama di CSV yang tidak ada di database sama sekali
   - Perlu ditambahkan sebagai user baru

### 5. **Rekomendasi Solusi**
   - Opsi A: Update nama di database
   - Opsi B: Buat custom mapping di code
   - Opsi C: Tambah student baru
   - Opsi D: Turunkan threshold fuzzy matching
   - Atau kombinasi dari beberapa opsi

---

## 💡 Tips

### Jika File Terlalu Besar:
- Untuk CSV database: Cukup kirim 50-100 baris pertama
- Untuk CSV import: Cukup kirim yang bermasalah (yang ada di unmatched_names.csv)

### Jika Tidak Bisa Export CSV:
- Screenshot table juga bisa
- Atau copy-paste data langsung ke chat

### Jika Sudah Hapus Data IMPORT_:
- Tidak masalah, kirim saja:
  - Database student names
  - CSV yang diimport
- Saya bisa simulasi matching-nya

---

## 🚀 Setelah Analisis

Saya akan berikan:

1. **Laporan Detail**
   - Nama mana yang tidak cocok
   - Kenapa tidak cocok
   - Score fuzzy matching untuk setiap nama

2. **SQL Script**
   - Untuk fix data yang sudah ter-import
   - Untuk update nama di database (jika perlu)
   - Untuk tambah student baru (jika perlu)

3. **Custom Mapping Code**
   - Jika perlu mapping manual
   - Siap copy-paste ke `BulkOperations.jsx`

4. **Rekomendasi**
   - Solusi terbaik untuk kasus ini
   - Langkah-langkah implementasi

---

## ❓ Pertanyaan?

Jika ada yang tidak jelas atau butuh bantuan mengambil data, tanya saja!

**Ready untuk analisis setelah data dikirim! 🎯**
