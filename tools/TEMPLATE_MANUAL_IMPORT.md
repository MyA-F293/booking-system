# Template Manual Import (Via Excel/Google Sheets)

## 🎯 Cara Paling Mudah - Tanpa Coding!

### Langkah 1: Buat Sheet Baru

Di Google Sheets yang sama, buat sheet baru bernama "Import Format"

### Langkah 2: Copy Header Ini

```
teacher_name | class_name | program | level | phase | day | time_slot | week_number | year | student_id | student_name | status
```

### Langkah 3: Isi Data Manual

Untuk setiap siswa, setiap week, setiap phase (L1, L2, RC), buat 1 baris.

**Contoh:**

```
Unknown Teacher | Unknown Class | Campus & Career | Starter | phase1 | monday | afternoon | 1 | 2024 | IMPORT_001 | Rosavani (Batch 2) | present
Unknown Teacher | Unknown Class | Campus & Career | Starter | phase2 | monday | afternoon | 1 | 2024 | IMPORT_001 | Rosavani (Batch 2) | present
Unknown Teacher | Unknown Class | Campus & Career | Starter | recap | monday | afternoon | 1 | 2024 | IMPORT_001 | Rosavani (Batch 2) | absent
```

### Langkah 4: Gunakan Formula (Lebih Cepat)

Di sheet "Import Format", gunakan formula ini:

**Cell A2 (teacher_name):**
```
="Unknown Teacher"
```

**Cell B2 (class_name):**
```
="Unknown Class"
```

**Cell C2 (program):**
```
="Campus & Career"
```

**Cell D2 (level):**
```
=Sheet1!C2
```
(Ambil dari kolom LEVEL di sheet asli)

**Cell E2 (phase):**
```
=IF(MOD(ROW()-2,3)=0,"phase1",IF(MOD(ROW()-2,3)=1,"phase2","recap"))
```
(Auto-rotate: phase1, phase2, recap)

**Cell F2 (day):**
```
="monday"
```

**Cell G2 (time_slot):**
```
="afternoon"
```

**Cell H2 (week_number):**
```
=INT((ROW()-2)/3/COUNTA(Sheet1!$B:$B))+1
```
(Auto-increment week)

**Cell I2 (year):**
```
=2024
```

**Cell J2 (student_id):**
```
="IMPORT_"&TEXT(MATCH(Sheet1!B2,Sheet1!$B:$B,0),"000")
```
(Auto-generate dari nomor urut)

**Cell K2 (student_name):**
```
=Sheet1!B2
```
(Ambil dari kolom NAME)

**Cell L2 (status):**
```
=IF(Sheet1!D2="✓","present",IF(Sheet1!D2="✗","absent",IF(Sheet1!D2="late","late","")))
```
(Konversi simbol ke status)

### Langkah 5: Drag Formula ke Bawah

Pilih row 2, drag ke bawah sampai semua data terisi.

### Langkah 6: Export ke CSV

1. File → Download → CSV
2. Simpan sebagai `attendance-import.csv`

### Langkah 7: Import ke Supabase

1. Supabase Dashboard → Table Editor → attendance
2. Insert → Import CSV
3. Upload file
4. Done!

---

## 📝 Cara Manual Tanpa Formula

Jika formula terlalu ribet, bisa manual:

1. Copy semua nama siswa
2. Untuk setiap siswa, buat 3 baris (phase1, phase2, recap)
3. Untuk setiap week (1-8), repeat
4. Total: 30 siswa × 3 phase × 8 week = 720 baris

**Tips:** Gunakan Excel/Google Sheets auto-fill untuk mempercepat!

---

## 🎨 Template Siap Pakai

Saya sudah buatkan template Google Sheets yang bisa Anda copy:

[Link akan dibuat jika diperlukan]

Atau download template Excel di folder `tools/`
