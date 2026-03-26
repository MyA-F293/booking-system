# Quick Fix: Copy Week Function Error

## Masalah
```
❌ Could not find the function public.smart_copy_week(source_week_param, target_week_param, year_param)
```

## Penyebab
Fungsi `smart_copy_week` belum diinstall di database (atau sudah terhapus).

## Solusi Cepat

### Opsi 1: Install Fungsi (RECOMMENDED)

1. Buka file: `database/CREATE_RPC_SMART_COPY.sql`
2. Copy SEMUA isinya
3. Buka Supabase Dashboard → SQL Editor
4. Paste dan klik **RUN**
5. Tunggu sampai selesai (Success. No rows returned)
6. Coba copy week lagi di UI

### Opsi 2: Cek Apakah Fungsi Sudah Ada

Jalankan query ini di SQL Editor:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%copy%week%';
```

Jika muncul `copy_week_optimized` tapi tidak ada `smart_copy_week`, berarti nama fungsinya beda.

## Verifikasi Setelah Install

Test di SQL Editor:

```sql
-- Test copy week 11 ke 13 (contoh)
SELECT smart_copy_week(11, 13, 2026);
```

Expected result:
```json
{
  "success": true,
  "schedules_created": 45,
  "bookings_copied": 180,
  "bookings_skipped": 0,
  "overcapacity_prevented": 0
}
```

## Jika Masih Error

Kemungkinan:
1. Permission issue → Run: `GRANT EXECUTE ON FUNCTION smart_copy_week(INT, INT, INT) TO authenticated;`
2. Schema cache → Refresh browser (Ctrl+F5)
3. Fungsi corrupt → Drop dan recreate

Drop function (jika perlu):
```sql
DROP FUNCTION IF EXISTS smart_copy_week(INT, INT, INT);
```

Lalu install ulang dari `CREATE_RPC_SMART_COPY.sql`.
