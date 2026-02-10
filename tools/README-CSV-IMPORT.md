# 🚀 Quick Start: Import CSV Attendance

## 3 Langkah Mudah

### 1️⃣ Simpan CSV
Simpan file CSV Anda sebagai **`attendance-to-import.csv`** di folder `tools/`

### 2️⃣ Jalankan Tool (v2 - Smart Matching)
```bash
node tools/validate-and-import-csv-v2.js
```

**Atau versi lama (tanpa smart matching):**
```bash
node tools/validate-and-import-csv.js
```

### 3️⃣ Review & Approve
Tool akan tampilkan:
- ✅ Data yang sudah ada di database
- 🔗 Data yang auto-matched (85%+ mirip)
- 🆕 Data baru yang akan ditambahkan
- 📝 Sample 3 records

Ketik `yes` untuk import, `no` untuk batalkan.

---

## 🎯 Fitur Smart Matching (v2)

Tool v2 akan otomatis mencocokkan nama yang mirip:

**Contoh Auto-Match:**
- `sir brian` → `Sir Brian` ✅
- `mrs feby` → `Mrs Feby` ✅
- `oxford` → `Oxford` ✅
- `Madina Azzahara` → `Madina Azzahra` ✅ (typo)
- `Savira  Juliawardani` → `Savira Juliawardani` ✅ (extra space)

**Tidak perlu khawatir** tentang perbedaan huruf besar/kecil, spasi, atau typo kecil!

---

## 🔍 Tool Akan Cek

✅ **Nama Siswa** - Apakah sudah ada di database? (smart matching 85%+)  
✅ **Nama Teacher** - Apakah sudah ada di database? (smart matching 85%+)  
✅ **Nama Class** - Apakah sudah ada di database? (smart matching 85%+)  
✅ **Format Tanggal** - Apakah valid?  
✅ **Status** - Apakah valid (present/late/absent)?  

**Smart Matching:** Tool akan otomatis cocokkan nama yang mirip (typo, spasi, huruf besar/kecil)

---

## 📊 Output

Tool akan membuat file **`import-summary.json`** dengan detail:
- Total rows processed
- Records imported
- Records failed
- List of new students/teachers/classes

---

## ⚠️ Jika Ada "New Students"

**Ini Normal Jika:**
- Data CSV memang data baru yang belum pernah diimport

**Perlu Dicek Jika:**
- Nama siswa seharusnya sudah ada
- Kemungkinan: Perbedaan penulisan (typo, spasi, huruf besar/kecil)

**Solusi:**
1. Edit CSV untuk samakan penulisan dengan database
2. Atau biarkan tool create new entry (nanti bisa di-merge manual)

---

## 📖 Dokumentasi Lengkap

Lihat **`CARA_IMPORT_CSV_AMAN.md`** untuk:
- Troubleshooting
- Format CSV yang diharapkan
- Cara cek duplikasi
- Tips & best practices

---

## 🆘 Error?

**"CSV file not found"**
→ Pastikan file ada di `tools/attendance-to-import.csv`

**"VITE_SUPABASE_URL not found"**
→ Pastikan file `.env.local` ada dan berisi credentials

**"Invalid date format"**
→ Pastikan format tanggal: `Friday,Feb 6th 2026`

---

## ✅ Setelah Import

1. Login sebagai admin
2. Buka **Attendance Report**
3. Filter by week yang diimport
4. Cek apakah data muncul ✅

Good luck! 🎉
