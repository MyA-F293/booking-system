# 🔧 Fix: Force Close Booking Tidak Berfungsi

## Masalah
Admin sudah nyalakan "Force Close Booking" di dashboard, tapi siswa masih lihat booking tertutup dengan jadwal normal (Kamis-Sabtu).

## Penyebab
`forceClose` setting disimpan di `localStorage` browser admin saja, tidak tersinkronisasi ke database. Jadi siswa tidak bisa lihat perubahan ini karena mereka baca dari `localStorage` mereka sendiri.

## Solusi

### 1️⃣ Update Database (WAJIB!)

**Buka Supabase SQL Editor** dan jalankan:

```sql
-- Add force_close_booking column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS force_close_booking BOOLEAN DEFAULT FALSE;

-- Set initial value (booking open)
UPDATE settings
SET force_close_booking = FALSE
WHERE id = 1;

-- Verify
SELECT id, current_week, force_close_booking
FROM settings
WHERE id = 1;
```

**Expected Result**: `force_close_booking = FALSE`

### 2️⃣ Deploy Code Changes

Code sudah diperbaiki untuk:
- ✅ Baca `force_close_booking` dari database (bukan localStorage)
- ✅ Update database saat admin toggle setting
- ✅ Semua user (admin + siswa) lihat setting yang sama

**Deploy**:
```bash
cd booking-system
git add .
git commit -m "Fix: Force close booking now syncs via database"
git push
```

Netlify akan auto-deploy (~2-3 menit).

### 3️⃣ Test Setelah Deploy

#### Test sebagai Admin:
1. Login sebagai admin
2. Buka Admin Dashboard
3. Klik tombol "Force Close" (merah)
4. Cek console log: "✅ Force Close Booking updated in database: true"
5. Refresh page
6. Setting harus tetap (tidak reset)

#### Test sebagai Siswa:
1. Login sebagai siswa
2. Buka tab Booking
3. Harus lihat: "Booking is FORCE CLOSED" (merah)
4. Tidak bisa book jadwal
5. Refresh page
6. Masih tetap force closed

#### Test Toggle:
1. Admin klik "Force Close" lagi (buka booking)
2. Siswa refresh page
3. Harus lihat: "Booking is OPEN" atau jadwal normal
4. Bisa book jadwal

---

## Perubahan yang Dibuat

### File: `booking-system/src/contexts/BookingModeContext.jsx`

**BEFORE** (localStorage only):
```javascript
const [forceClose, setForceClose] = useState(() => {
    const saved = localStorage.getItem('eysa_force_close_booking');
    return saved === 'true';
});

const toggleForceClose = () => {
    setForceClose(prev => !prev);
};
```

**AFTER** (database sync):
```javascript
const [forceClose, setForceClose] = useState(false);

// Load from database on mount
useEffect(() => {
    const loadForceClose = async () => {
        const { data } = await supabase
            .from('settings')
            .select('force_close_booking')
            .single();
        
        setForceClose(data?.force_close_booking || false);
    };
    loadForceClose();
}, []);

// Update database when toggled
const toggleForceClose = async () => {
    const newValue = !forceClose;
    
    await supabase
        .from('settings')
        .update({ force_close_booking: newValue })
        .eq('id', 1);
    
    setForceClose(newValue);
};
```

### File: `booking-system/database/ADD_FORCE_CLOSE_COLUMN.sql`
- SQL script untuk tambah kolom `force_close_booking` ke table `settings`

---

## Cara Kerja Setelah Fix

### Flow Normal:
1. **Admin toggle Force Close** → Update database `settings.force_close_booking = TRUE`
2. **Siswa buka app** → Load `force_close_booking` dari database
3. **Siswa lihat** → "Booking is FORCE CLOSED"
4. **Admin toggle lagi** → Update database `force_close_booking = FALSE`
5. **Siswa refresh** → Load dari database → Booking terbuka

### Keuntungan:
- ✅ Setting tersinkronisasi untuk semua user
- ✅ Tidak perlu clear cache/localStorage
- ✅ Real-time (siswa cukup refresh)
- ✅ Persistent (tidak hilang saat logout)

---

## Troubleshooting

### Siswa masih lihat booking tertutup setelah admin buka:
1. **Cek database**:
   ```sql
   SELECT force_close_booking FROM settings WHERE id = 1;
   ```
   - Harus `FALSE` jika admin sudah buka booking

2. **Siswa refresh page** (Ctrl+F5 atau Cmd+Shift+R)
   - Force reload untuk load data terbaru dari database

3. **Cek console log siswa**:
   - Buka Developer Tools (F12)
   - Lihat console
   - Harus ada: "✅ Loaded force_close_booking from database: false"

### Admin toggle tidak update database:
1. **Cek console log admin**:
   - Harus ada: "✅ Force Close Booking updated in database: true/false"
   - Jika ada error, screenshot dan share

2. **Cek RLS policy**:
   ```sql
   -- Check if admin can update settings
   SELECT * FROM settings WHERE id = 1;
   ```

---

## Quick Reference

### Status Force Close:
- `force_close_booking = TRUE` → 🔴 Booking FORCE CLOSED (tidak bisa book)
- `force_close_booking = FALSE` → 🟢 Booking mengikuti aturan normal (Kamis-Sabtu)

### Lokasi Setting:
- **BEFORE**: `localStorage` (per browser, tidak sync)
- **AFTER**: Database `settings` table (shared, sync untuk semua)

### Cara Toggle:
- Admin Dashboard → Klik tombol "Force Close" (merah/abu-abu)
- Otomatis update database
- Semua user lihat perubahan setelah refresh

---

**Created**: April 5, 2026  
**Status**: ✅ Fixed  
**Priority**: 🔥 HIGH  
**Estimated Time**: 10 minutes (database + deploy + test)
