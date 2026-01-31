# Fix Error: Cannot read properties of null

## ❌ Error yang Muncul:
```
TypeError: Cannot read properties of null (reading 'getLastRow')
convertAttendanceByColor @ Kode.gs:126
```

## 🔍 Penyebab:
Script tidak bisa menemukan sheet karena nama sheet berbeda dari yang diharapkan.

## ✅ Solusi (Sudah Diperbaiki):

Script sudah saya update untuk **auto-detect sheet yang sedang aktif**.

### Cara Pakai (Update):

1. **Buka sheet yang berisi data attendance** (Sheet3 atau apapun namanya)
2. **Pastikan sheet tersebut sedang aktif** (tab sheet di-klik)
3. **Buka Apps Script** (Extensions → Apps Script)
4. **Copy script terbaru** dari `tools/google-apps-script-color.js`
5. **Paste** (replace semua code yang lama)
6. **Save** (Ctrl+S)
7. **Kembali ke Google Sheets**
8. **Pastikan sheet data masih aktif**
9. **Run script** dari menu: **📊 Import Tools** → **🔄 Convert Attendance (By Color)**

## 🎯 Alternatif: Spesifik Nama Sheet

Jika ingin spesifik nama sheet, edit baris ini di script:

```javascript
// Uncomment dan ganti 'Sheet3' dengan nama sheet Anda
const sourceSheet = ss.getSheetByName('Sheet3');
```

Ganti `'Sheet3'` dengan nama sheet yang sesuai (lihat di tab bawah Google Sheets).

## 📝 Langkah Detail:

### 1. Cek Nama Sheet
Di Google Sheets, lihat tab di bawah. Nama sheet mungkin:
- Sheet1
- Sheet2
- Sheet3
- Atau nama custom lainnya

### 2. Update Script (Jika Perlu)
Jika nama sheet bukan yang standar, edit script:

```javascript
function convertAttendanceByColor() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // GANTI 'Sheet3' dengan nama sheet Anda
    const sourceSheet = ss.getSheetByName('Sheet3');
    
    // ... rest of code
}
```

### 3. Atau Gunakan Auto-Detect (Recommended)
Script terbaru sudah auto-detect sheet aktif:

```javascript
function convertAttendanceByColor() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auto-detect sheet yang sedang aktif
    const sourceSheet = ss.getActiveSheet();
    
    // ... rest of code
}
```

**Cara ini lebih mudah:** Tinggal buka sheet yang mau di-convert, lalu run script!

## ✅ Checklist Sebelum Run:

- [ ] Sheet data attendance sudah dibuka (tab aktif)
- [ ] Script sudah di-update dengan versi terbaru
- [ ] Script sudah di-save (Ctrl+S)
- [ ] Kembali ke Google Sheets (jangan di Apps Script)
- [ ] Run dari menu: 📊 Import Tools → 🔄 Convert Attendance

## 🆘 Masih Error?

### Error: "Cannot find function convertAttendanceByColor"
**Solusi:** Refresh Google Sheets (F5), tunggu beberapa detik, coba lagi.

### Error: "Script function not found: onOpen"
**Solusi:** Ignore, ini normal. Refresh Google Sheets untuk muncul menu.

### Error: "Exception: Service Spreadsheets failed"
**Solusi:** 
1. Check internet connection
2. Refresh Google Sheets
3. Try again

### Menu "Import Tools" tidak muncul
**Solusi:**
1. Refresh Google Sheets (F5)
2. Tunggu 5-10 detik
3. Menu akan muncul otomatis
4. Atau run manual dari Apps Script: pilih function `convertAttendanceByColor` dan klik Run

## 📞 Butuh Bantuan?

Jika masih error, screenshot error message dan tanya saya!
