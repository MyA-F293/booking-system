# URGENT: Tambah Service Role Key

## Masalah
Update student tidak tersimpan ke database karena menggunakan ANON_KEY yang tidak punya permission.

## Solusi
Tambah SERVICE_ROLE_KEY ke file `.env.local`

## Langkah-Langkah:

### 1. Dapatkan Service Role Key dari Supabase
1. Buka https://supabase.com
2. Login dan pilih project Anda
3. Klik "Settings" (icon gear di sidebar kiri bawah)
4. Klik "API"
5. Scroll ke bawah sampai ketemu "Project API keys"
6. **COPY** key yang ada di bawah "service_role" (BUKAN anon!)
   - Key-nya panjang, dimulai dengan `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Tambah ke .env.local
Buka file `booking-system/.env.local` dan tambahkan line ini:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PASTE_YOUR_KEY_HERE
```

**PENTING**: Ganti `PASTE_YOUR_KEY_HERE` dengan service_role key yang Anda copy dari Supabase!

### 3. Restart Dev Server
```bash
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

### 4. Test Update Student
1. Refresh browser (Ctrl+Shift+R)
2. Login sebagai admin
3. Edit student (contoh: Nur Wahyuni)
4. Ubah level dari "Belum Tes" ke "Starter"
5. Klik Save
6. **Harusnya**: Data berubah di database!

### 5. Verify di Supabase
Buka Supabase > Table Editor > users
Cari student yang tadi di-edit
**Harusnya**: Level sudah berubah!

## File .env.local Lengkap

Setelah ditambah, file `.env.local` Anda harusnya seperti ini:

```env
VITE_SUPABASE_URL=https://zckdzifjyoglyqnxdtaw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja2R6aWZqeW9nbHlxbnhkdGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODQzMzIsImV4cCI6MjA4MzI2MDMzMn0.N29Ajb51HV2w5hbs07f9YJqEtWnenOhD0YJO2lebtgY
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PASTE_YOUR_SERVICE_ROLE_KEY_HERE
VITE_FEEDBACK_SHEET_URL=https://script.google.com/macros/s/AKfycbxVZm9hU8mtt8eB1krvVsutGz2btSKD1g2P-F3PKLDcDzmKqUu4u9n2lqhCnDiV1S2J/exec
VITE_ATTENDANCE_SHEET_URL=https://script.google.com/macros/s/AKfycbwsN0qh662KWsYVenLUp_KryVfV_cGlWR9YvdDcjE0mYA-6oeINLvI6eQ9Ul-qNgt0twQ/exec
VITE_VAPID_PUBLIC_KEY=BC7mGzQjrEjRAcJXXMIMLhCj8j8P75wz8MTlM523n-XBRna_jnYKH3kMgcdyQNlrXMVnYQXouVkefEYjGlFMcp8
```

## Kenapa Perlu Service Role Key?

- ANON_KEY = Permission terbatas (untuk public/student)
- SERVICE_ROLE_KEY = Full access (untuk admin operations)
- Admin perlu SERVICE_ROLE_KEY untuk bypass RLS dan update data

## Security Note

⚠️ **JANGAN** commit file `.env.local` ke Git!
⚠️ **JANGAN** expose service_role key di frontend production!

File `.env.local` sudah ada di `.gitignore`, jadi aman.

## Jika Masih Belum Berhasil

Cek console browser (F12) untuk error message dan kasih tau saya.
