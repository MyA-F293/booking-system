# 🧪 Test: Reset Batch & Week System

## 🎯 Quick Test (5 menit)

### Test 1: Check Current Week
```
1. Buka AdminDashboard
2. Lihat header (kanan atas)
3. Harus tampil: "Batch X | Week Y"
```

**Expected**: Week number dari database (bukan ISO week)

---

### Test 2: Manual Increment Week
```
1. Di AdminDashboard header
2. Klik button "▶" (Next Week)
3. Lihat toast notification
4. Week number harus naik +1
```

**Expected**: 
- Toast: "Week incremented to X"
- Header update: "Week Y" → "Week Y+1"
- Stats cards update: "WY bookings" → "WY+1 bookings"

---

### Test 3: Reset Batch
```
1. Klik "Actions" menu (kanan atas)
2. Pilih "Reset Batch"
3. Pilih batch number
4. Klik "Reset Batch"
5. Confirm dialog
```

**Expected**:
- Toast: "✅ Batch reset successfully..."
- Week kembali ke 1
- Header: "Batch X | Week 1"
- Stats: "W1 bookings: 0"

---

### Test 4: Check Database
```sql
-- Run di Supabase SQL Editor
SELECT * FROM settings WHERE id = 1;
```

**Expected**:
```
id | current_week | updated_at
---+--------------+------------
1  | 1            | 2026-03-27...
```

---

## 🔍 Troubleshooting

### Week tidak berubah:
```
1. Refresh browser (Ctrl+R)
2. Check console untuk error (F12)
3. Check database query di atas
```

### Error di console:
```
1. Screenshot error
2. Check file: FIX_SETTINGS_EMPTY_ERROR.md
3. Atau tanya Kiro
```

---

## ✅ Success Criteria

Sistem berfungsi dengan baik jika:
- ✅ Header menampilkan week dari database
- ✅ Button ▶ increment week
- ✅ Reset batch → Week = 1
- ✅ Tidak ada error di console
- ✅ Stats cards update sesuai week

---

**Status**: Ready to Test ✅
