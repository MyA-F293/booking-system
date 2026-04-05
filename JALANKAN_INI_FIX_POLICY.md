# 🔧 Jalankan Ini - Fix Policy Error

**Error**: Policy 'settings_select_all' already exists

**Solusi**: Drop semua policy lama dulu, baru buat yang baru

---

## Copy Paste Query Ini ke Supabase SQL Editor:

```sql
-- Drop SEMUA policy lama
DROP POLICY IF EXISTS "Allow public to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON settings;
DROP POLICY IF EXISTS "Allow all authenticated to read settings" ON settings;
DROP POLICY IF EXISTS "Allow all authenticated to update settings" ON settings;
DROP POLICY IF EXISTS "settings_select_policy" ON settings;
DROP POLICY IF EXISTS "settings_update_policy" ON settings;
DROP POLICY IF EXISTS "settings_select_all" ON settings;
DROP POLICY IF EXISTS "settings_update_all" ON settings;

-- Buat policy baru dengan nama unik
CREATE POLICY "settings_read_v2"
ON settings FOR SELECT USING (true);

CREATE POLICY "settings_write_v2"
ON settings FOR UPDATE USING (true) WITH CHECK (true);

-- Test
UPDATE settings SET testing_mode = NOT testing_mode WHERE id = 1 RETURNING *;
```

---

## Setelah Jalankan:

1. Refresh halaman admin
2. Tekan tombol Testing Mode
3. Lihat console - harus muncul `data: Array(1)` (bukan Array(0))
4. Cek database - nilai `testing_mode` harus berubah

---

**Jalankan query di atas sekarang!**
