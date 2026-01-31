# Cara Alternatif Import Data Lama

Ada 4 cara untuk import data lama, pilih yang paling cocok untuk Anda:

---

## 🥇 OPSI A: Manual via Excel/Google Sheets (PALING MUDAH)

**Kelebihan:**
- ✅ Tidak perlu coding
- ✅ Tidak perlu install apa-apa
- ✅ Bisa edit langsung di Excel/Sheets
- ✅ Visual, bisa lihat hasilnya

**Langkah:**

1. **Buat sheet baru** di Google Sheets yang sama
2. **Copy header** ini ke row 1:
   ```
   teacher_name | class_name | program | level | phase | day | time_slot | week_number | year | student_id | student_name | status
   ```

3. **Isi data manual** atau pakai formula:
   - Untuk setiap siswa
   - Untuk setiap week (1-8)
   - Untuk setiap phase (L1→phase1, L2→phase2, RC→recap)
   - Copy status dari sheet asli (✓→present, ✗→absent)

4. **Download sebagai CSV**
5. **Import ke Supabase** via Dashboard

**Estimasi waktu:** 30-60 menit (tergantung jumlah siswa)

📖 **Panduan lengkap:** `tools/TEMPLATE_MANUAL_IMPORT.md`

---

## 🥈 OPSI B: Google Apps Script (OTOMATIS DI GOOGLE SHEETS) ⭐⭐⭐

**Kelebihan:**
- ✅ Otomatis, tinggal klik
- ✅ Langsung di Google Sheets
- ✅ Tidak perlu install Node.js
- ✅ Hasil langsung bisa di-review
- ✅ **BISA BACA WARNA CELL!** 🎨

**Cocok untuk:**
- Spreadsheet dengan styling/warna (hijau=present, kuning=late, merah=absent)
- Data banyak (30+ siswa)
- Ingin otomatis dan cepat

**Langkah:**

1. **Buka Google Sheets** Anda
2. **Extensions** → **Apps Script**
3. **Copy-paste** script dari `tools/google-apps-script-color.js`
4. **Edit konfigurasi** (year, startWeek)
5. **Klik Run** → pilih `convertAttendanceByColor`
6. **Sheet baru** "Import Format" akan dibuat otomatis
7. **Download** sheet tersebut sebagai CSV
8. **Import** ke Supabase

**Estimasi waktu:** 10 menit

📖 **Panduan lengkap:** `IMPORT_DENGAN_WARNA.md`
📖 **Script:** `tools/google-apps-script-color.js`

---

## 🥉 OPSI C: Node.js Script (YANG SUDAH SAYA BUATKAN)

**Kelebihan:**
- ✅ Paling cepat untuk data besar
- ✅ Bisa di-customize
- ✅ Bisa di-automate

**Kekurangan:**
- ❌ Perlu install Node.js & dependencies
- ❌ Perlu edit code sedikit

**Langkah:**

1. Export Google Sheets ke CSV
2. `npm install csv-parse csv-stringify`
3. Edit `tools/convert-spreadsheet-to-csv.js`
4. `node tools/convert-spreadsheet-to-csv.js`
5. Import hasil ke Supabase

**Estimasi waktu:** 5 menit (setelah setup)

📖 **Panduan:** `QUICK_START_IMPORT.md`

---

## 🏆 OPSI D: Langsung Input Manual di Supabase (UNTUK DATA KECIL)

**Kelebihan:**
- ✅ Paling simple
- ✅ Tidak perlu export/import
- ✅ Langsung di database

**Kekurangan:**
- ❌ Lambat untuk data banyak
- ❌ Rawan typo

**Langkah:**

1. Buka **Supabase Dashboard**
2. **Table Editor** → **attendance**
3. Klik **Insert** → **Insert row**
4. Isi data manual satu per satu
5. Repeat untuk semua data

**Estimasi waktu:** 2-3 jam (untuk 30 siswa × 8 week × 3 phase = 720 records)

⚠️ **Tidak recommended** untuk data banyak!

---

## 📊 Perbandingan

| Opsi | Mudah | Cepat | Akurat | Recommended |
|------|-------|-------|--------|-------------|
| A. Manual Excel | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Ya |
| B. Apps Script | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Ya |
| C. Node.js | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Jika familiar |
| D. Manual Input | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ❌ Tidak |

---

## 🎯 Rekomendasi Saya

### Jika Anda familiar dengan Google Sheets:
→ **OPSI B: Google Apps Script** (paling efisien!)

### Jika Anda tidak familiar dengan coding:
→ **OPSI A: Manual via Excel** (paling aman)

### Jika Anda familiar dengan Node.js:
→ **OPSI C: Node.js Script** (paling cepat)

---

## 🆘 Butuh Bantuan?

Pilih opsi yang paling cocok, lalu:
- **Opsi A:** Baca `tools/TEMPLATE_MANUAL_IMPORT.md`
- **Opsi B:** Copy script dari `tools/google-apps-script.js`
- **Opsi C:** Baca `QUICK_START_IMPORT.md`

Atau tanya saya jika ada yang kurang jelas! 😊
