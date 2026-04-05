# 🔍 Debug: Tombol Testing Mode Tidak Berfungsi

**Masalah**: Tombol sudah ditekan beberapa kali tapi database tidak berubah

---

## 🎯 Langkah Debug

### 1. Buka Console Browser (F12)

Ketika kamu tekan tombol, apa yang muncul di console?

**Yang HARUS muncul**:
```
🔵 About to update testing_mode to: true
🔵 Update result: { data: [...], error: null }
✅ Testing Mode updated in database: true
```

**Jika muncul ERROR**:
```
❌ Error updating testing_mode: { message: "..." }
```

---

## 🔍 Kemungkinan Masalah

### Masalah 1: Permission Denied (RLS Policy)
**Gejala**: Console menunjukkan error "permission denied" atau "new row violates row-level security"

**Solusi**: Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek RLS policies yang ada
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'settings';

-- Jika tidak ada policy untuk UPDATE, jalankan ini:
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;

CREATE POLICY "Allow authenticated users to update settings"
ON settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

### Masalah 2: Row Tidak Ada (id=1 tidak ditemukan)
**Gejala**: Console menunjukkan "no rows returned" atau update berhasil tapi tidak ada yang berubah

**Solusi**: Cek apakah row dengan id=1 ada:

```sql
-- Cek apakah row ada
SELECT * FROM settings WHERE id = 1;

-- Jika tidak ada, buat row baru:
INSERT INTO settings (id, testing_mode, force_close_booking, current_week)
VALUES (1, false, false, 1)
ON CONFLICT (id) DO NOTHING;
```

### Masalah 3: Supabase Client Tidak Terautentikasi
**Gejala**: Console menunjukkan "not authenticated" atau "anonymous access denied"

**Solusi**: Pastikan admin sudah login dengan benar. Cek di console:

```javascript
// Jalankan di browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Masalah 4: Wrong Supabase URL/Key
**Gejala**: Console menunjukkan network error atau 404

**Solusi**: Cek file `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🧪 Test Manual di Console

Buka browser console (F12) dan jalankan ini:

```javascript
// Test 1: Cek apakah supabase client berfungsi
console.log('Supabase client:', supabase);

// Test 2: Cek user saat ini
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Test 3: Coba baca settings
const { data: readData, error: readError } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
console.log('Read settings:', readData, readError);

// Test 4: Coba update settings
const { data: updateData, error: updateError } = await supabase
    .from('settings')
    .update({ testing_mode: true })
    .eq('id', 1)
    .select();
console.log('Update result:', updateData, updateError);
```

---

## 📋 Checklist Debug

Lakukan ini satu per satu:

- [ ] Buka browser console (F12)
- [ ] Tekan tombol Testing Mode
- [ ] Copy semua log yang muncul di console
- [ ] Jalankan query `SELECT * FROM settings WHERE id = 1;` di Supabase
- [ ] Cek apakah nilai `testing_mode` berubah di database
- [ ] Jalankan test manual di console (kode di atas)
- [ ] Screenshot error jika ada

---

## 🚨 Quick Fix

Jika masalahnya adalah RLS policy, jalankan ini SEKARANG:

```sql
-- Drop semua policy lama
DROP POLICY IF EXISTS "Allow public to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON settings;

-- Buat policy baru yang lebih permissive
CREATE POLICY "Allow all authenticated to read settings"
ON settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated to update settings"
ON settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'settings';
```

---

## 📞 Apa yang Harus Dilaporkan

Setelah coba langkah di atas, kasih tahu saya:

1. **Apa yang muncul di console?** (copy paste semua log)
2. **Apakah ada error?** (screenshot atau copy paste error message)
3. **Hasil query `SELECT * FROM settings WHERE id = 1;`** (apa yang muncul?)
4. **Hasil test manual di console** (apa yang muncul dari 4 test di atas?)

---

**Mulai dari langkah 1: Buka console dan tekan tombol, lalu kasih tahu apa yang muncul!**
