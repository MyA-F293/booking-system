# Fix Week 5 Extra Schedules

## Masalah
- **Week 4**: 71 schedules ✅
- **Week 5**: 73 schedules ❌ (2 lebih banyak)

Setelah copy week dari Week 4 ke Week 5, ternyata ada 2 schedule tambahan yang tidak seharusnya ada.

---

## Langkah-Langkah

### 1️⃣ Identifikasi Schedule yang Berlebih

Jalankan query: **`database/find_week5_extra_schedules.sql`**

Query ini akan:
- **Step 1**: Confirm count (Week 4 = 71, Week 5 = 73)
- **Step 2**: Tampilkan 2 schedule di Week 5 yang TIDAK ada pasangannya di Week 4
- **Step 3**: Query untuk lihat nama class (jalankan manual setelah dapat class_id)

### 2️⃣ Analisis Hasil

Setelah dapat hasil Step 2, cek:
- Apakah ini schedule baru yang sengaja ditambah? → **JANGAN HAPUS**
- Apakah ini duplikat/error dari copy week? → **HAPUS**

Indikator schedule error:
- ✅ Created_at = **2026-06-26 04:58:11** (waktu copy week)
- ✅ Kombinasi class_id + phase + day + time_slot sudah ada di Week 4
- ✅ Tidak ada alasan bisnis untuk schedule tambahan

### 3️⃣ Hapus Schedule yang Berlebih

**Jika confirmed perlu dihapus:**

```sql
-- Ganti dengan ID schedule yang berlebih dari Step 2
DELETE FROM schedules 
WHERE id IN (
  'SCHEDULE_ID_1',
  'SCHEDULE_ID_2'
);

-- Verify setelah delete
SELECT week_number, COUNT(*) as total
FROM schedules
WHERE week_number IN (4, 5)
GROUP BY week_number;
-- Expected: Week 4 = 71, Week 5 = 71
```

### 4️⃣ Check Booking & Attendance

**Sebelum delete, pastikan tidak ada booking/attendance:**

```sql
-- Check bookings
SELECT COUNT(*) FROM bookings
WHERE schedule_id IN ('SCHEDULE_ID_1', 'SCHEDULE_ID_2');
-- Expected: 0

-- Check attendance
SELECT COUNT(*) FROM attendance
WHERE schedule_id IN ('SCHEDULE_ID_1', 'SCHEDULE_ID_2');
-- Expected: 0
```

**Jika ada booking/attendance:**
- Jangan delete schedule
- Atau, pindahkan booking/attendance ke schedule yang benar dulu

---

## Root Cause Analysis

Kemungkinan penyebab:
1. **Bug di RPC `smart_copy_week`** - Copy 2x untuk class tertentu
2. **Manual add** - Admin tambah schedule baru di Week 5
3. **Race condition** - Simultaneous copy operation

Perlu dicek:
- Apakah class yang duplikat ini punya karakteristik khusus?
- Apakah ada pattern (misal: Upper Starter, phase1, dll)?

---

## Prevention

Untuk mencegah di masa depan:

### Option 1: Unique Constraint
```sql
-- Tambah constraint di database
ALTER TABLE schedules
ADD CONSTRAINT schedules_unique_slot
UNIQUE (week_number, class_id, phase, day, time_slot);
```

### Option 2: Update RPC smart_copy_week
Tambah check di RPC sebelum insert:
```sql
-- Di dalam smart_copy_week RPC
-- Before INSERT, check if combination exists
IF EXISTS (
  SELECT 1 FROM schedules 
  WHERE week_number = target_week 
  AND class_id = NEW.class_id
  AND phase = NEW.phase
  AND day = NEW.day
  AND time_slot = NEW.time_slot
) THEN
  RAISE NOTICE 'Schedule already exists, skipping...';
  CONTINUE;
END IF;
```

---

## Status

🔍 **Menunggu hasil Step 2** untuk identifikasi 2 schedule yang berlebih

Jalankan: `database/find_week5_extra_schedules.sql` Step 2
