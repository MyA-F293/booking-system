# Fix: Week System Error (React Error #418)

## 🔴 Error Yang Muncul:
```
Minified React error #418
Error Boundary caught: Errors: Minified React error #418
```

Dan di console banyak error dari `index-CbJI7nAC.js`

## 🎯 Penyebab:
WeekContext mencoba fetch data dari tabel `settings`, tapi RLS policy tidak allow access. Ini menyebabkan React component crash saat render.

## ✅ Solusi (2 Menit):

### Step 1: Buka Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### Step 2: Run Complete Fix
Copy paste SQL ini (fix semua masalah sekaligus):

```sql
-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_week INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Insert default data
INSERT INTO public.settings (id, current_week)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow anonymous to read settings" ON public.settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;

-- Create NEW policies
CREATE POLICY "Enable read access for all users"
ON public.settings FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to update settings"
ON public.settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT * FROM settings;
```

**Atau buka file:** `database/FIX_SETTINGS_COMPLETE.sql`

### Step 3: Clear Browser Cache & Reload
1. Tekan `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Atau clear browser cache manual
3. Reload aplikasi

### Step 4: Verify Fix
Aplikasi harus load normal tanpa error. Check console:
- ✅ Tidak ada error "Minified React error #418"
- ✅ Tidak ada error "Error Boundary caught"
- ✅ Console log: "📅 Current week from database: [number]"

## 🎉 Selesai!

Setelah ini, week system berfungsi normal dan bisa lanjut setup GitHub Actions.

---

## 🔧 Troubleshooting

### Masih error setelah run SQL?
1. Clear browser cache completely
2. Try private/incognito window
3. Check console untuk error message baru

### Error "permission denied for table settings"?
Run SQL ini untuk grant permissions:
```sql
GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.settings TO authenticated;
GRANT UPDATE ON public.settings TO authenticated;
```

### Data tidak muncul?
Check apakah data ada:
```sql
SELECT * FROM settings;
```

Jika kosong, insert manual:
```sql
INSERT INTO public.settings (id, current_week)
VALUES (1, 2)
ON CONFLICT (id) DO UPDATE SET current_week = 2;
```

---

## 📚 Files Terkait:
- `database/FIX_SETTINGS_COMPLETE.sql` - Complete fix (RECOMMENDED)
- `database/FIX_SETTINGS_RLS_POLICY.sql` - RLS policy only
- `database/FIX_SETTINGS_TABLE_EMPTY.sql` - Insert data only
- `FIX_SETTINGS_EMPTY_ERROR.md` - Previous guide
- `SESSION_SUMMARY_2026-03-27.md` - Full summary
