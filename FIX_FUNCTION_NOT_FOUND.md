# 🔧 Fix: Function increment_current_week() Not Found

## ❌ Error
```
ERROR: 42883: function increment_current_week() does not exist
HINT: No function matches the given name and argument types.
```

## 🎯 Penyebab
Function `increment_current_week()` belum dibuat di database.

## ✅ Solusi

### Quick Fix (1 menit):
```
1. Buka Supabase > SQL Editor
2. Copy-paste: database/CREATE_INCREMENT_FUNCTION.sql
3. Run
4. Done!
```

### Atau Install Semua Functions (2 menit):
```
1. Buka Supabase > SQL Editor
2. Copy-paste: database/INSTALL_ALL_FUNCTIONS.sql
3. GANTI API key di api_increment_week function
4. Run
5. Done!
```

---

## 📋 Functions yang Dibutuhkan

### 1. increment_current_week()
- **Untuk**: Manual increment dari UI (button ▶)
- **Dipanggil**: WeekContext.incrementWeek()
- **Return**: JSON dengan old_week, new_week

### 2. api_increment_week(api_key)
- **Untuk**: Auto-increment dari GitHub Actions
- **Dipanggil**: GitHub Actions workflow
- **Security**: API key validation
- **Return**: JSON dengan success, old_week, new_week

### 3. reset_batch(batch_number)
- **Untuk**: Reset batch (delete data + reset week)
- **Dipanggil**: AdminDashboard reset batch button
- **Return**: JSON dengan deleted counts

---

## 🚀 Install Sekarang

### Option 1: Install increment_current_week saja
```sql
-- Copy-paste dari: database/CREATE_INCREMENT_FUNCTION.sql
-- Atau copy ini:

CREATE OR REPLACE FUNCTION public.increment_current_week()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_week INTEGER;
    new_week INTEGER;
BEGIN
    SELECT current_week INTO old_week FROM settings WHERE id = 1;
    new_week := old_week + 1;
    UPDATE settings SET current_week = new_week, updated_at = NOW() WHERE id = 1;
    RETURN json_build_object('success', true, 'old_week', old_week, 'new_week', new_week);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_current_week() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_current_week() TO anon;
```

### Option 2: Install semua functions
```sql
-- Copy-paste dari: database/INSTALL_ALL_FUNCTIONS.sql
-- Install 3 functions sekaligus:
-- 1. increment_current_week()
-- 2. api_increment_week()
-- 3. Verify reset_batch()
```

---

## 🧪 Test Setelah Install

### Test di SQL:
```sql
-- Test increment
SELECT increment_current_week();

-- Expected:
-- {"success": true, "old_week": 1, "new_week": 2, ...}
```

### Test di UI:
```
1. Buka AdminDashboard
2. Klik button ▶ (Next Week)
3. Verify week naik +1
4. Check toast: "Week incremented to X"
```

---

## 📁 Files

**Install:**
- `database/CREATE_INCREMENT_FUNCTION.sql` - Install increment_current_week saja
- `database/INSTALL_ALL_FUNCTIONS.sql` - Install semua functions

**Testing:**
- `database/TEST_SEKARANG.sql` - Updated (tidak pakai function)
- `database/QUICK_TEST_WEEK.sql` - Quick test

**Documentation:**
- `FIX_FUNCTION_NOT_FOUND.md` - This file

---

## ✅ After Fix

Setelah install function:
- ✅ Button ▶ di UI akan berfungsi
- ✅ WeekContext.incrementWeek() works
- ✅ TEST_SEKARANG.sql bisa pakai function
- ✅ GitHub Actions ready (jika sudah setup)

---

**Status**: Fix Ready ✅  
**Action**: Run `database/INSTALL_ALL_FUNCTIONS.sql`  
**Time**: 2 menit
