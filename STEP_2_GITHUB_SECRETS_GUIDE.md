# Step 2: Setup GitHub Secrets - Panduan Lengkap

## 🎯 Tujuan
Menambahkan 3 secrets ke GitHub repo agar GitHub Actions bisa akses Supabase.

## 📋 Yang Perlu Disiapkan:
1. ✅ API key yang sudah Anda buat di Step 1
2. ✅ Akses ke Supabase Dashboard
3. ✅ Akses ke GitHub repo

---

## 🔐 CARA DAPAT 3 SECRETS:

### Secret #1: SUPABASE_URL

**Cara Dapat:**
1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda (booking-system)
3. Klik **Settings** (icon gear di sidebar kiri bawah)
4. Klik **API** di menu Settings
5. Lihat bagian **Project URL**
6. Copy URL-nya, contoh: `https://abcdefghijk.supabase.co`

**Format:**
```
https://your-project-id.supabase.co
```

**PENTING:** 
- Tanpa trailing slash (/)
- Harus HTTPS
- Jangan ada spasi

---

### Secret #2: SUPABASE_ANON_KEY

**Cara Dapat:**
1. Masih di halaman yang sama (Settings > API)
2. Scroll ke bawah ke bagian **Project API keys**
3. Cari yang namanya **anon** **public**
4. Klik icon **Copy** di sebelah kanan
5. Key ini panjang, dimulai dengan `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**PENTING:**
- Ini adalah **anon public** key (bukan service_role!)
- Panjangnya sekitar 200+ karakter
- Copy semua, jangan sampai terpotong

---

### Secret #3: SUPABASE_API_KEY

**Cara Dapat:**
Ini adalah **API key yang Anda buat sendiri di Step 1!**

Contoh yang Anda buat:
```
eysa-booking-secret-2026-abc123
```

**PENTING:**
- Ini BUKAN dari Supabase
- Ini yang Anda tulis di SQL function
- Harus sama persis dengan yang di database

---

## 🚀 CARA TAMBAH SECRETS KE GITHUB:

### Langkah 1: Buka GitHub Repo
1. Go to: https://github.com/your-username/your-repo
2. Pastikan Anda di repo **booking-system**

### Langkah 2: Masuk ke Settings
1. Klik tab **Settings** (di bagian atas, sebelah kanan)
2. Jika tidak ada tab Settings, berarti Anda bukan owner/admin repo

### Langkah 3: Buka Secrets Menu
1. Di sidebar kiri, cari **Secrets and variables**
2. Klik **Secrets and variables**
3. Klik **Actions**

### Langkah 4: Tambah Secret #1
1. Klik tombol **New repository secret** (hijau, di kanan atas)
2. Isi form:
   - **Name**: `SUPABASE_URL` (huruf besar semua, tanpa spasi)
   - **Secret**: Paste URL dari Supabase (contoh: `https://abcdefghijk.supabase.co`)
3. Klik **Add secret**

### Langkah 5: Tambah Secret #2
1. Klik **New repository secret** lagi
2. Isi form:
   - **Name**: `SUPABASE_ANON_KEY`
   - **Secret**: Paste anon key dari Supabase (yang panjang)
3. Klik **Add secret**

### Langkah 6: Tambah Secret #3
1. Klik **New repository secret** lagi
2. Isi form:
   - **Name**: `SUPABASE_API_KEY`
   - **Secret**: Paste API key yang Anda buat (contoh: `eysa-booking-secret-2026-abc123`)
3. Klik **Add secret**

---

## ✅ VERIFIKASI

Setelah selesai, Anda harus lihat **3 secrets** di list:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_API_KEY

**CATATAN:** Value secrets tidak bisa dilihat lagi setelah disimpan (untuk keamanan).

---

## 🎯 SELESAI!

Step 2 selesai! Lanjut ke Step 3: Push ke GitHub.

---

## ❓ Troubleshooting

### "Saya tidak bisa lihat tab Settings"
- Anda bukan owner/admin repo
- Minta akses admin dari owner repo

### "Secret sudah ada tapi salah"
- Klik secret yang salah
- Klik **Update secret**
- Paste value yang benar
- Klik **Update secret**

### "Lupa API key yang saya buat"
- Buka Supabase SQL Editor
- Run: `SELECT prosrc FROM pg_proc WHERE proname = 'api_increment_week';`
- Cari baris `expected_key TEXT :=`
- Copy API key dari situ

---

**Next:** Lanjut ke `STEP_3_PUSH_GITHUB.md`
