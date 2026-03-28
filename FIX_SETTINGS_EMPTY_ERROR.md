# Fix: Settings Table RLS Policy Error

## 🔴 Error Yang Muncul:
```
Error getting current week: PGRST116 - The result contains 0 rows
```

## 🎯 Penyebab:
Data sudah ada di tabel `settings`, tapi **RLS Policy** tidak allow anonymous/authenticated users untuk read data.

## ✅ Solusi (1 Menit):

### Step 1: Buka Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### Step 2: Run SQL Fix
Copy paste SQL ini:

```sql
-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow anonymous to read settings" ON public.settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;

-- Create NEW policy - Allow EVERYONE to read
CREATE POLICY "Enable read access for all users"
ON public.settings FOR SELECT
USING (true);

-- Allow authenticated to update
CREATE POLICY "Allow authenticated users to update settings"
ON public.settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT * FROM settings;
```

**Atau buka file:** `database/FIX_SETTINGS_RLS_POLICY.sql`

### Step 3: Refresh App
1. Reload aplikasi booking system
2. Error hilang ✅
3. Week system berfungsi normal

## 🎉 Selesai!

Setelah ini, lanjut setup GitHub Actions:
1. Run SQL dari `database/CREATE_API_INCREMENT_WEEK.sql`
2. Setup GitHub Secrets (lihat `STEP_2_GITHUB_SECRETS_GUIDE.md`)
3. Push ke GitHub
4. Test manual run

---

## 📚 Files Terkait:
- `database/FIX_SETTINGS_TABLE_EMPTY.sql` - SQL fix
- `database/CREATE_SETTINGS_TABLE_AND_RESET_BATCH.sql` - Original setup
- `STEP_2_GITHUB_SECRETS_GUIDE.md` - Next step
- `SESSION_SUMMARY_2026-03-27.md` - Full summary
