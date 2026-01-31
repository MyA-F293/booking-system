# Import Data dengan Warna Cell (Styling)

## 🎨 Untuk Spreadsheet yang Pakai Warna

Jika spreadsheet Anda menggunakan **warna cell** untuk menandakan status:
- 🟢 **Hijau** = Present (Hadir)
- 🟡 **Kuning** = Late (Terlambat)
- 🔴 **Merah** = Absent (Tidak Hadir)

Gunakan cara ini:

---

## ✅ Cara Termudah: Google Apps Script (Baca Warna)

### Langkah 1: Buka Apps Script

1. Buka **Google Sheets** Anda
2. Klik **Extensions** → **Apps Script**
3. Akan terbuka tab baru dengan editor code

### Langkah 2: Copy Script

1. **Hapus** semua code yang ada di editor (biasanya ada function myFunction() kosong)
2. **Copy** semua code dari file `tools/google-apps-script-color.js`
3. **Paste** ke editor Apps Script
4. Klik **Save** (ikon disket) atau Ctrl+S

### Langkah 3: Edit Konfigurasi

Cari bagian `CONFIG` di script (sekitar baris 30-40):

```javascript
const CONFIG = {
    teacherName: 'Unknown Teacher',
    className: 'Unknown Class',
    program: 'Campus & Career',
    day: 'monday',
    timeSlot: 'afternoon',
    year: 2024,      // 🔴 GANTI INI! (2024 atau 2025?)
    startWeek: 1,    // 🔴 Week 1 di sheet = week berapa di sistem?
    
    columns: {
      no: 1,         // Kolom A = NO
      name: 2,       // Kolom B = NAME
      level: 3,      // Kolom C = LEVEL
      firstWeek: 4   // Kolom D = WEEK 1 L1
    }
};
```

**Yang WAJIB diganti:**
- `year`: Tahun data (2024 atau 2025?)
- `startWeek`: Week 1 di spreadsheet = week berapa di sistem Anda?

**Opsional (jika struktur kolom berbeda):**
- `columns.no`: Kolom nomor urut
- `columns.name`: Kolom nama siswa
- `columns.level`: Kolom level/program
- `columns.firstWeek`: Kolom pertama untuk WEEK 1 L1

### Langkah 4: Jalankan Script

1. Pilih function **`convertAttendanceByColor`** di dropdown (atas)
2. Klik **Run** (tombol play ▶️)
3. **Pertama kali** akan minta permission:
   - Klik **Review permissions**
   - Pilih akun Google Anda
   - Klik **Advanced** → **Go to [Project Name] (unsafe)**
   - Klik **Allow**
4. Tunggu beberapa detik
5. Akan muncul popup **"✅ Konversi selesai!"** dengan summary

### Langkah 5: Cek Hasil

1. Kembali ke Google Sheets
2. Akan ada **sheet baru** bernama **"Import Format"**
3. Review data:
   - Cek apakah nama siswa benar
   - Cek apakah status (present/late/absent) sesuai dengan warna
   - Cek apakah jumlah records masuk akal

### Langkah 6: Download CSV

1. Klik sheet **"Import Format"**
2. **File** → **Download** → **Comma Separated Values (.csv)**
3. Simpan sebagai `attendance-import.csv`

### Langkah 7: Import ke Supabase

1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. **Table Editor** → **attendance**
4. Klik **Insert** → **Import data from CSV**
5. Upload file `attendance-import.csv`
6. Klik **Import**
7. Tunggu sampai selesai

### Langkah 8: Verifikasi

1. Login ke sistem sebagai **Admin**
2. Buka **Attendance Report**
3. Filter by week dan class
4. Pastikan data muncul dengan benar

---

## 🎨 Deteksi Warna

Script akan mendeteksi warna-warna ini:

### Hijau (Present):
- `#00ff00`, `#00ff01`
- `#34a853` (Google green)
- `#93c47d` (Light green)
- `#6aa84f` (Dark green)

### Kuning (Late):
- `#ffff00`, `#ffff01`
- `#fbbc04` (Google yellow)
- `#ffd966` (Light yellow)
- `#f1c232` (Dark yellow)

### Merah (Absent):
- `#ff0000`, `#ff0001`
- `#ea4335` (Google red)
- `#e06666` (Light red)
- `#cc0000` (Dark red)

**Jika warna Anda berbeda**, edit bagian `parseStatusByColor` di script.

---

## 🧪 Test Warna Cell

Jika tidak yakin apakah warna terdeteksi:

1. Di Google Sheets, **pilih cell** yang ingin di-test
2. Kembali ke **Apps Script**
3. Pilih function **`testColorDetection`**
4. Klik **Run**
5. Akan muncul popup dengan info warna cell tersebut

Contoh output:
```
Cell Info:

Value: ✓
Background: #00ff00

Pilih cell yang ingin di-test, lalu run function ini.
```

---

## 📊 Summary Output

Setelah konversi selesai, Anda akan melihat summary:

```
✅ Konversi selesai!

📊 Summary:
- Total students: 30
- Total records: 720
- Present: 450
- Late: 120
- Absent: 150
- Skipped cells: 0

📥 Sheet "Import Format" sudah dibuat.
Download sebagai CSV dan import ke Supabase.
```

**Perhatikan:**
- `Skipped cells`: Jumlah cell yang tidak terdeteksi (warna tidak jelas atau kosong)
- Jika skipped cells banyak, cek warna di spreadsheet atau edit script

---

## ⚠️ Troubleshooting

### Warna tidak terdeteksi

**Solusi 1:** Cek kode warna
1. Pilih cell dengan warna yang tidak terdeteksi
2. Run function `testColorDetection`
3. Catat kode warna (misal: `#abc123`)
4. Tambahkan ke script di bagian `parseStatusByColor`:
   ```javascript
   if (bgLower === '#abc123') {
     return 'present'; // atau 'late' / 'absent'
   }
   ```

**Solusi 2:** Standardisasi warna
1. Di Google Sheets, pilih semua cell hijau
2. Format → Fill color → Pilih warna hijau standar (#00ff00)
3. Ulangi untuk kuning dan merah
4. Run script lagi

### Script error: "Cannot read property..."

Kemungkinan struktur kolom berbeda. Edit `CONFIG.columns`:
```javascript
columns: {
  no: 1,         // Kolom A
  name: 2,       // Kolom B
  level: 3,      // Kolom C
  firstWeek: 4   // Kolom D (WEEK 1 L1)
}
```

### Data tidak muncul di report

- Cek `year` di CONFIG (harus sesuai dengan filter di report)
- Cek `startWeek` (week 1 di sheet = week berapa di sistem?)
- Cek status (present/late/absent harus lowercase)

---

## 🎯 Tips

1. **Backup spreadsheet** sebelum run script
2. **Test dengan sample kecil** dulu (5-10 siswa)
3. **Review output** sebelum import ke Supabase
4. **Standardisasi warna** untuk hasil lebih akurat
5. **Catat konfigurasi** (year, startWeek) untuk referensi

---

## 📞 Butuh Bantuan?

Jika ada masalah:
1. Run function `testColorDetection` untuk cek warna
2. Cek log di Apps Script (View → Logs)
3. Screenshot error dan tanya saya

Good luck! 🚀
