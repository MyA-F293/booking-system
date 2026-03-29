# 📄 CARA CONVERT MARKDOWN KE WORD

## 🎯 Tujuan
Convert file `TESTING_MANUAL_LENGKAP_COMBINED.md` ke Word (.docx) dengan styling otomatis yang rapi dan siap print.

---

## 📋 Persiapan

### 1. Install Python
Pastikan Python sudah terinstall di komputer Anda.

**Cek Python:**
```bash
python --version
```

Jika belum ada, download dari: https://www.python.org/downloads/

---

### 2. Install Library yang Dibutuhkan

Buka Command Prompt atau Terminal, lalu jalankan:

```bash
pip install python-docx
```

**Atau jika pakai pip3:**
```bash
pip3 install python-docx
```

---

## 🚀 Cara Menggunakan

### Metode 1: Otomatis (Recommended)

1. **Buka Command Prompt / Terminal**
2. **Masuk ke folder booking-system:**
   ```bash
   cd booking-system
   ```

3. **Jalankan script:**
   ```bash
   python convert_md_to_word.py
   ```

4. **Tunggu proses selesai** (sekitar 5-10 detik)

5. **File Word akan dibuat:** `TESTING_MANUAL_LENGKAP_COMBINED.docx`

---

### Metode 2: Manual (Jika Script Error)

Jika script error, Anda bisa convert manual menggunakan tools online:

#### Option A: Pandoc (Offline)
1. Install Pandoc: https://pandoc.org/installing.html
2. Jalankan command:
   ```bash
   pandoc TESTING_MANUAL_LENGKAP_COMBINED.md -o TESTING_MANUAL_LENGKAP_COMBINED.docx
   ```

#### Option B: Online Converter
1. Buka: https://www.markdowntoword.com/
2. Upload file `TESTING_MANUAL_LENGKAP_COMBINED.md`
3. Download file Word yang sudah diconvert

---

## ✨ Fitur Styling Otomatis

Script Python akan otomatis apply styling:

### 1. Heading Styles
- **Title (# )**: Font 24pt, Bold, Blue, Center
- **Heading 1 (## )**: Font 18pt, Bold, Blue
- **Heading 2 (### )**: Font 16pt, Bold, Light Blue
- **Heading 3 (#### )**: Font 14pt, Bold, Black

### 2. Text Formatting
- **Bold text**: `**text**` → **text**
- **Code blocks**: Background abu-abu, font Consolas
- **Checkboxes**: `[ ]` → ☐, `[x]` → ☑

### 3. Tables
- Auto-convert Markdown tables ke Word tables
- Header row bold otomatis
- Border dan grid styling

### 4. Emoji Removal
- Semua emoji dihapus otomatis
- Dokumen jadi lebih professional untuk print

### 5. Spacing
- Auto spacing antar section
- Proper indentation untuk code blocks
- Page breaks untuk section baru

---

## 📊 Output File

**File Name:** `TESTING_MANUAL_LENGKAP_COMBINED.docx`

**File Size:** ~500KB - 1MB

**Format:** Microsoft Word 2007+ (.docx)

**Compatible with:**
- Microsoft Word 2007, 2010, 2013, 2016, 2019, 365
- Google Docs
- LibreOffice Writer
- WPS Office

---

## 🖨️ Cara Print

### 1. Buka File Word
Double-click `TESTING_MANUAL_LENGKAP_COMBINED.docx`

### 2. Review Dokumen
- Scroll dan cek semua halaman
- Pastikan formatting sudah benar
- Adjust jika perlu (font size, margins, dll)

### 3. Print Settings (Recommended)
- **Paper Size:** A4
- **Orientation:** Portrait
- **Margins:** Normal (1 inch / 2.54 cm)
- **Print Quality:** High
- **Color:** Black & White (untuk hemat tinta)

### 4. Print
- File → Print
- Atau tekan `Ctrl + P`
- Pilih printer
- Klik "Print"

---

## 🎨 Customization (Optional)

Jika ingin ubah styling, edit file `convert_md_to_word.py`:

### Ubah Font
```python
font.name = 'Calibri'  # Ganti dengan 'Arial', 'Times New Roman', dll
```

### Ubah Font Size
```python
font.size = Pt(11)  # Ganti angka (8, 10, 12, 14, dll)
```

### Ubah Warna Heading
```python
h1_style.font.color.rgb = RGBColor(0, 112, 192)  # RGB color
```

### Ubah Margins
```python
from docx.shared import Inches
section = doc.sections[0]
section.top_margin = Inches(1)
section.bottom_margin = Inches(1)
section.left_margin = Inches(1)
section.right_margin = Inches(1)
```

---

## 🐛 Troubleshooting

### Error: "No module named 'docx'"
**Solusi:**
```bash
pip install python-docx
```

### Error: "python: command not found"
**Solusi:**
- Install Python dari https://www.python.org/
- Atau gunakan `python3` instead of `python`

### Error: "File not found"
**Solusi:**
- Pastikan Anda berada di folder `booking-system`
- Cek dengan command: `dir` (Windows) atau `ls` (Mac/Linux)
- File `TESTING_MANUAL_LENGKAP_COMBINED.md` harus ada

### File Word Corrupt / Tidak Bisa Dibuka
**Solusi:**
- Hapus file `.docx` yang error
- Jalankan script lagi
- Atau gunakan online converter

### Formatting Tidak Rapi
**Solusi:**
- Buka file Word
- Select All (Ctrl + A)
- Clear Formatting (Ctrl + Space)
- Apply styles manual

---

## 📝 Tips

### 1. Untuk Print yang Rapi
- Gunakan font Calibri atau Arial (lebih jelas)
- Font size 11pt untuk body text
- Font size 14-18pt untuk headings
- Line spacing 1.15 atau 1.5

### 2. Untuk Hemat Kertas
- Print 2 pages per sheet
- Print double-sided
- Gunakan draft mode

### 3. Untuk Digital Sharing
- Export ke PDF dari Word
- File → Save As → PDF
- PDF lebih universal dan tidak bisa diedit

---

## 🔄 Alternative: Export ke PDF Langsung

Jika ingin langsung ke PDF (skip Word):

### Install Library Tambahan
```bash
pip install markdown
pip install pdfkit
```

### Jalankan (jika ada script PDF)
```bash
python convert_md_to_pdf.py
```

---

## 📞 Support

Jika ada masalah:
1. Cek error message di terminal
2. Google error message tersebut
3. Atau gunakan online converter sebagai backup

---

## ✅ Checklist

Sebelum convert, pastikan:
- [ ] Python sudah terinstall
- [ ] Library `python-docx` sudah terinstall
- [ ] File `TESTING_MANUAL_LENGKAP_COMBINED.md` ada
- [ ] Berada di folder `booking-system`

Setelah convert, cek:
- [ ] File `.docx` berhasil dibuat
- [ ] File bisa dibuka di Word
- [ ] Formatting sudah rapi
- [ ] Semua content ada (36 test cases)
- [ ] Siap untuk print

---

**Created:** 28 Maret 2026  
**Version:** 1.0  
**Author:** Kiro AI

---

**SELAMAT MENCOBA! 🚀**
