# Panduan Debug Attendance Import - Step by Step

## Status
✅ Debug logging sudah ditambahkan dan di-deploy
✅ SQL diagnostic queries sudah siap
⏳ Menunggu Anda test dan kirim hasil console log

---

## Langkah 1: Buka Browser Console

1. Buka aplikasi booking system di browser
2. Tekan **F12** atau **Ctrl+Shift+I** untuk buka Developer Tools
3. Klik tab **Console**
4. Clear console (klik icon 🚫 atau ketik `clear()`)

---

## Langkah 2: Import Attendance

1. Login sebagai Admin
2. Buka **Bulk Operations**
3. Tab **Import Attendance**
4. Upload file CSV Anda
5. Klik **Import**

---

## Langkah 3: Lihat Console Log

Setelah import, Anda akan melihat log seperti ini:

```
🔍 DEBUG: Fetched data
📊 Total existing attendance records: 150
👥 Total students in database: 25
📋 Sample student from DB: {id: 1, student_id: "EYSA2601001", full_name: "John Doe", ...}

🗺️ DEBUG: Student ID Map built
📊 Total entries in studentIdMap: 25
📋 Sample mapping: [["john doe", "EYSA2601001"], ["jane smith", "EYSA2601002"], ...]

🔍 Processing student: "Mutiara Azzahra"
   Normalized: "mutiara azzahra"
   ⚠️ Not in existing attendance, trying fuzzy match...
   📊 Best match score: 0.95
   ✅ Fuzzy match found: "Mutiara Azzahra"
   📝 Final student_id: EYSA2601009

📦 Final record: {
    student_name: "Mutiara Azzahra",
    student_id: "EYSA2601009",
    class_name: "Oxford",
    week_number: 6,
    status: "present"
}

📊 SUMMARY:
   Total processed: 100
   With real student_id: 50
   With dummy IMPORT_ id: 50

💾 Sending to database...

✅ Database result:
   Success: 100
   Failed: 0
```

---

## Langkah 4: Analisis Console Log

### ✅ BAGUS - Jika Anda lihat:
```
✅ Fuzzy match found: "..."
📝 Final student_id: EYSA2601xxx
With real student_id: 100 (semua)
```
→ Matching berhasil! Lanjut ke Langkah 5.

### ❌ MASALAH - Jika Anda lihat:
```
❌ No match found anywhere!
📝 Will use dummy ID: IMPORT_0001
With dummy IMPORT_ id: 100 (banyak)
```
→ Matching gagal! Kirim screenshot console ke saya.

---

## Langkah 5: Cek Attendance Report

1. Buka **Attendance Report**
2. Klik **Refresh**
3. Lihat apakah data muncul

Jika data TIDAK muncul, lanjut ke Langkah 6.

---

## Langkah 6: Cek Console Log di Report

Saat buka Attendance Report, Anda akan lihat log:

```
🏗️ Building attendance matrix...
📊 Total attendance records: 250
👥 Total students: 25
👥 Filtered students: 25
📋 Sample student: {id: 1, student_id: "EYSA2601001", full_name: "John Doe", ...}

🔍 Matching attendance records to students...

📊 Matching results:
   ✅ Matched: 200
   ❌ Unmatched: 50

⚠️ 50 attendance records couldn't be matched to students!
   Possible reasons:
   1. student_id in attendance doesn't match student_id in users table
   2. Student is not active (is_active = false)
   3. Student_id has IMPORT_ prefix (dummy ID)
```

### Jika ada Unmatched records:
Lihat detail di console:
```
❌ Unmatched record: {
    student_id: "IMPORT_0001",
    student_name: "Mutiara Azzahra",
    week: 6,
    phase: "phase1"
}
```

---

## Langkah 7: Run SQL Diagnostic (Jika Masih Bermasalah)

1. Buka **Supabase Dashboard**
2. Klik **SQL Editor**
3. Copy paste query dari `database/DEBUG_ATTENDANCE_IMPORT.sql`
4. Run **STEP 1** sampai **STEP 10** satu per satu
5. Screenshot hasilnya
6. Kirim ke saya

---

## Yang Perlu Anda Kirim ke Saya

Untuk saya bisa bantu fix, kirim:

1. **Screenshot Console Log** saat import (Langkah 3)
   - Fokus ke bagian "Processing student" dan "SUMMARY"

2. **Screenshot Console Log** saat buka report (Langkah 6)
   - Fokus ke bagian "Matching results"

3. **Screenshot SQL Query Results** (Langkah 7)
   - Minimal STEP 1, STEP 3, dan STEP 7

4. **Screenshot Attendance Report** yang kosong

---

## Kemungkinan Masalah & Solusi

### Masalah 1: getAllStudents() return empty
**Gejala:**
```
👥 Total students in database: 0
```

**Penyebab:** Tidak ada student dengan `is_active = true`

**Solusi:**
```sql
UPDATE users SET is_active = true WHERE role = 'student';
```

---

### Masalah 2: Nama tidak cocok
**Gejala:**
```
❌ No match found anywhere!
📊 Best match score: 0.65 (< 0.85)
```

**Penyebab:** Nama di CSV berbeda dengan nama di database

**Solusi:** 
- Cek nama di database vs CSV
- Pastikan ejaan sama
- Atau turunkan threshold dari 0.85 ke 0.75

---

### Masalah 3: student_id sudah IMPORT_ di database
**Gejala:**
```
✅ Matched: 0
❌ Unmatched: 100
student_id: "IMPORT_0001"
```

**Penyebab:** Data lama masih punya dummy ID

**Solusi:**
```sql
DELETE FROM attendance WHERE student_id LIKE 'IMPORT_%';
```
Lalu import ulang.

---

### Masalah 4: Cache browser
**Gejala:** Kode baru tidak jalan, masih pakai kode lama

**Solusi:**
1. Hard refresh: **Ctrl+Shift+R** atau **Ctrl+F5**
2. Clear cache: **Ctrl+Shift+Delete**
3. Atau buka Incognito/Private window

---

## Kesimpulan

Dengan debug logging ini, kita bisa tahu PERSIS di mana masalahnya:
- ✅ Apakah student data ter-fetch?
- ✅ Apakah mapping berhasil?
- ✅ Apakah student_id benar?
- ✅ Apakah data masuk database?
- ✅ Apakah report bisa match data?

**Silakan test dan kirim hasil console log ke saya!** 🚀
