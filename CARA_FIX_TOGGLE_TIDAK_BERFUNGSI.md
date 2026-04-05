# 🔧 Cara Fix: Tombol Testing Mode Tidak Berfungsi

**Masalah**: Sudah tekan tombol beberapa kali tapi database tidak berubah

---

## 🚀 Quick Fix (Jalankan Ini Dulu!)

### Langkah 1: Buka Supabase SQL Editor
1. Login ke Supabase Dashboard
2. Klik "SQL Editor" di sidebar kiri
3. Klik "New Query"

### Langkah 2: Jalankan Query Ini

Copy paste query ini ke SQL Editor dan klik "Run":

```sql
-- Fix lengkap: buat table, row, dan policy
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    testing_mode BOOLEAN DEFAULT false,
    force_close_booking BOOLEAN DEFAULT false,
    current_week INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT settings_single_row CHECK (id = 1)
);

INSERT INTO settings (id, testing_mode, force_close_booking, current_week)
VALUES (1, false, false, 1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON settings;

CREATE POLICY "Allow all authenticated to read settings"
ON settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated to update settings"
ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Test
UPDATE settings SET testing_mode = NOT testing_mode WHERE id = 1 RETURNING *;
```

### Langkah 3: Cek Hasil

Setelah jalankan query di atas, kamu harus lihat:
- ✅ "Success. No rows returned" atau
- ✅ Tabel dengan 1 row yang menunjukkan settings

### Langkah 4: Test Tombol Lagi

1. Refresh halaman admin dashboard
2. Tekan tombol "Testing Mode"
3. Buka console browser (F12)
4. Lihat apakah ada log: `✅ Testing Mode updated in database`

---

## 🔍 Jika Masih Tidak Berfungsi

### Debug Step 1: Cek Console Browser

1. Buka halaman admin
2. Tekan F12 (buka Developer Tools)
3. Klik tab "Console"
4. Tekan tombol Testing Mode
5. **Screenshot semua yang muncul di console**

### Debug Step 2: Cek Database

Jalankan query ini di Supabase SQL Editor:

```sql
SELECT * FROM settings WHERE id = 1;
```

**Screenshot hasilnya** dan kasih tahu saya.

### Debug Step 3: Test Manual di Console

1. Buka console browser (F12)
2. Copy paste kode ini dan tekan Enter:

```javascript
// Test update manual
const { data, error } = await supabase
    .from('settings')
    .update({ testing_mode: true })
    .eq('id', 1)
    .select();
console.log('Manual update result:', data, error);
```

**Screenshot hasilnya** dan kasih tahu saya.

---

## 📋 Kemungkinan Masalah

### Masalah 1: Permission Denied
**Gejala**: Console menunjukkan "permission denied" atau "row-level security"

**Solusi**: Jalankan file `database/FIX_SETTINGS_RLS_PERMISSIVE.sql`

### Masalah 2: Row Tidak Ada
**Gejala**: Console menunjukkan "no rows returned" atau update berhasil tapi tidak ada perubahan

**Solusi**: Query Quick Fix di atas sudah handle ini

### Masalah 3: User Tidak Login
**Gejala**: Console menunjukkan "not authenticated"

**Solusi**: 
1. Logout dari admin
2. Login lagi
3. Coba tekan tombol lagi

### Masalah 4: Supabase Client Error
**Gejala**: Console menunjukkan "supabase is not defined" atau network error

**Solusi**: 
1. Cek file `.env.local` ada dan benar
2. Restart development server: `npm run dev`

---

## 🎯 Checklist

Lakukan ini berurutan:

1. [ ] Jalankan Quick Fix query di Supabase SQL Editor
2. [ ] Refresh halaman admin
3. [ ] Buka console browser (F12)
4. [ ] Tekan tombol Testing Mode
5. [ ] Lihat apa yang muncul di console
6. [ ] Cek database: `SELECT * FROM settings WHERE id = 1;`
7. [ ] Jika masih error, screenshot console dan database result

---

## 📞 Apa yang Harus Dilaporkan

Jika masih tidak berfungsi setelah Quick Fix, kasih tahu saya:

1. **Screenshot console browser** (setelah tekan tombol)
2. **Screenshot hasil query** `SELECT * FROM settings WHERE id = 1;`
3. **Screenshot hasil test manual** di console
4. **Apakah ada error message?** (copy paste lengkap)

---

## 🚨 Emergency Fix

Jika semua cara di atas tidak berhasil, coba ini:

### Disable RLS Sementara (HANYA UNTUK TESTING!)

```sql
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

Lalu test tombol lagi. Jika berhasil, berarti masalahnya di RLS policy.

**PENTING**: Setelah testing, enable kembali RLS:

```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

---

**Mulai dari Quick Fix di atas, lalu kasih tahu hasilnya!** 🚀
