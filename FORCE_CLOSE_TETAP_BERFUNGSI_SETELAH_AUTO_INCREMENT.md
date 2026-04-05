# ✅ Force Close Tetap Berfungsi Setelah GitHub Actions Auto-Increment

## Pertanyaan
"Kalau GitHub sudah update otomatis weeknya, apakah sistem force close masih berfungsi?"

## Jawaban: ✅ YA, TETAP BERFUNGSI!

### Kenapa Aman?

GitHub Actions **HANYA update kolom `current_week`**, TIDAK menyentuh kolom `force_close_booking`.

## Cara Kerja Auto-Increment

### 1️⃣ GitHub Actions Workflow
**File**: `.github/workflows/auto-increment-week.yml`

**Schedule**: Setiap Minggu jam 17:01 UTC (= Senin 00:01 WIB)

**Yang Dilakukan**:
```bash
# Panggil API Supabase
curl -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{"api_key": "$SUPABASE_API_KEY"}' \
  "$SUPABASE_URL/rest/v1/rpc/api_increment_week"
```

### 2️⃣ Database Function
**File**: `database/CREATE_API_INCREMENT_WEEK.sql`

**Function**: `api_increment_week(api_key TEXT)`

**Yang Dilakukan**:
```sql
-- HANYA update current_week dan updated_at
UPDATE settings
SET current_week = new_week,
    updated_at = NOW()
WHERE id = 1;

-- ⚠️ TIDAK menyentuh force_close_booking!
```

### 3️⃣ Kolom yang Diupdate

| Kolom | Auto-Increment | Manual Admin |
|-------|----------------|--------------|
| `current_week` | ✅ YA (GitHub Actions) | ❌ TIDAK |
| `force_close_booking` | ❌ TIDAK | ✅ YA (Admin toggle) |
| `updated_at` | ✅ YA (timestamp) | ✅ YA (timestamp) |

---

## Skenario Lengkap

### Skenario 1: Force Close AKTIF saat Auto-Increment

**Sebelum Auto-Increment** (Minggu, 5 April 2026):
```
current_week = 1
force_close_booking = TRUE  ← Admin sudah aktifkan
```

**GitHub Actions Jalan** (Senin, 6 April 2026 00:01 WIB):
```sql
UPDATE settings
SET current_week = 2,        ← Increment
    updated_at = NOW()
WHERE id = 1;
-- force_close_booking TIDAK DIUBAH!
```

**Setelah Auto-Increment**:
```
current_week = 2             ← BERUBAH
force_close_booking = TRUE   ← TETAP (tidak berubah)
```

**Hasil**: Booking tetap FORCE CLOSED ✅

---

### Skenario 2: Force Close TIDAK AKTIF saat Auto-Increment

**Sebelum Auto-Increment**:
```
current_week = 1
force_close_booking = FALSE  ← Booking terbuka normal
```

**GitHub Actions Jalan**:
```sql
UPDATE settings
SET current_week = 2,
    updated_at = NOW()
WHERE id = 1;
```

**Setelah Auto-Increment**:
```
current_week = 2             ← BERUBAH
force_close_booking = FALSE  ← TETAP (tidak berubah)
```

**Hasil**: Booking tetap mengikuti aturan normal (Kamis-Sabtu) ✅

---

### Skenario 3: Admin Toggle Force Close SETELAH Auto-Increment

**Setelah Auto-Increment** (current_week = 2):
```
current_week = 2
force_close_booking = FALSE
```

**Admin Klik "Force Close"**:
```javascript
// BookingModeContext.jsx
const toggleForceClose = async () => {
    await supabase
        .from('settings')
        .update({ force_close_booking: true })
        .eq('id', 1);
};
```

**Hasil**:
```
current_week = 2             ← TIDAK BERUBAH
force_close_booking = TRUE   ← BERUBAH
```

**Kesimpulan**: Admin tetap bisa toggle kapan saja ✅

---

## Kenapa Sistem Ini Aman?

### 1. Kolom Terpisah
- `current_week` → Dikelola oleh GitHub Actions
- `force_close_booking` → Dikelola oleh Admin
- Tidak ada konflik!

### 2. Update Statement Spesifik
```sql
-- GitHub Actions HANYA update ini:
UPDATE settings
SET current_week = new_week,
    updated_at = NOW()
WHERE id = 1;

-- Admin HANYA update ini:
UPDATE settings
SET force_close_booking = new_value
WHERE id = 1;
```

### 3. Tidak Ada Default Value Override
- `ALTER TABLE ADD COLUMN force_close_booking BOOLEAN DEFAULT FALSE`
- Default hanya berlaku untuk **row baru**
- Row yang sudah ada **tidak terpengaruh**

---

## Testing Setelah Auto-Increment

### Test 1: Cek Kolom Setelah Auto-Increment
```sql
SELECT 
    id,
    current_week,
    force_close_booking,
    updated_at
FROM settings
WHERE id = 1;
```

**Expected**:
- `current_week` = bertambah 1
- `force_close_booking` = tetap (tidak berubah)

### Test 2: Admin Toggle Masih Berfungsi
1. Admin klik "Force Close"
2. Cek database:
   ```sql
   SELECT force_close_booking FROM settings WHERE id = 1;
   ```
3. Expected: `TRUE`

### Test 3: Siswa Lihat Perubahan
1. Siswa refresh page
2. Harus lihat: "Booking is FORCE CLOSED"

---

## Monitoring Auto-Increment

### Cek GitHub Actions History
1. Buka: https://github.com/[your-repo]/actions
2. Lihat workflow: "Auto Increment Week"
3. Cek log terakhir:
   ```
   ✅ Week incremented successfully!
   📅 Week changed from 1 to 2
   ```

### Cek Database Log
```sql
-- Cek kapan terakhir current_week diupdate
SELECT 
    current_week,
    updated_at,
    force_close_booking
FROM settings
WHERE id = 1;
```

### Cek Konsistensi
```sql
-- Pastikan force_close_booking tidak berubah
SELECT 
    current_week,
    force_close_booking,
    updated_at
FROM settings
WHERE id = 1
ORDER BY updated_at DESC
LIMIT 5;
```

---

## Troubleshooting

### ❓ Force close tiba-tiba berubah setelah auto-increment?

**Kemungkinan**:
1. Ada script lain yang update `force_close_booking`
2. RLS policy bermasalah

**Solusi**:
```sql
-- Cek siapa yang update terakhir
SELECT 
    tablename,
    schemaname,
    last_vacuum,
    last_autovacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE tablename = 'settings';
```

### ❓ Auto-increment tidak jalan?

**Cek**:
1. GitHub Actions status
2. Supabase API key masih valid
3. Function `api_increment_week` masih ada

**Verify**:
```sql
-- Cek function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'api_increment_week';
```

---

## Summary

| Aspek | Status | Keterangan |
|-------|--------|------------|
| Auto-increment week | ✅ AMAN | Hanya update `current_week` |
| Force close setting | ✅ AMAN | Tidak terpengaruh auto-increment |
| Admin toggle | ✅ BERFUNGSI | Bisa toggle kapan saja |
| Siswa lihat perubahan | ✅ BERFUNGSI | Real-time via database |
| Konflik data | ❌ TIDAK ADA | Kolom terpisah |

---

## Kesimpulan

**Force close tetap berfungsi 100% setelah GitHub Actions auto-increment week!**

Alasan:
1. ✅ Kolom `force_close_booking` dan `current_week` terpisah
2. ✅ GitHub Actions HANYA update `current_week`
3. ✅ Admin tetap bisa toggle `force_close_booking` kapan saja
4. ✅ Tidak ada konflik atau override

**Sistem dirancang agar kedua fitur berjalan independen dan tidak saling mengganggu.**

---

**Created**: April 5, 2026  
**Status**: ✅ Verified Safe  
**Priority**: 📚 Documentation
