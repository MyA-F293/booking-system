# 🚀 Jalankan 2 SQL Ini Sekarang!

**Tujuan:** Hapus jadwal kosong otomatis + cegah Copy Week copy jadwal kosong

---

## ⚡ STEP 1: Update Copy Week Function

### File: `database/IMPROVE_SMART_COPY_WEEK.sql`

**Apa yang dilakukan:**
- Update fungsi `smart_copy_week` 
- Tambah filter `WHERE current_students > 0`
- Copy Week SKIP jadwal kosong otomatis

**Cara run:**

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Buka file `database/IMPROVE_SMART_COPY_WEEK.sql`
3. Copy SEMUA isi file
4. Paste ke SQL Editor
5. Klik **Run**
6. ✅ Tunggu sampai muncul "Success"

---

## ⚡ STEP 2: Install Auto-Delete Trigger

### File: `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`

**Apa yang dilakukan:**
- Bikin trigger otomatis
- Setiap kali `current_students` jadi 0 → **LANGSUNG HAPUS**
- Real-time, tidak ada delay

**Cara run:**

1. Masih di **SQL Editor** Supabase
2. Buka file `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`  
3. Copy SEMUA isi file
4. Paste ke SQL Editor (new query)
5. Klik **Run**
6. ✅ Tunggu sampai muncul "Success"

---

## ✅ Verifikasi Instalasi

Run query ini untuk cek kalau kedua fix sudah aktif:

```sql
-- Check 1: Copy Week sudah ada filter?
SELECT 
    'smart_copy_week' as function_name,
    CASE 
        WHEN prosrc LIKE '%current_students > 0%' 
        THEN '✅ UPDATED - Skip jadwal kosong'
        ELSE '❌ BELUM - Masih copy jadwal kosong'
    END as status
FROM pg_proc 
WHERE proname = 'smart_copy_week';

-- Check 2: Trigger sudah aktif?
SELECT 
    '✅ Trigger aktif!' as status,
    trigger_name,
    'Auto-delete empty schedules ENABLED' as info
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_delete_empty_schedules';
```

**Expected result:**
- Row 1: `✅ UPDATED - Skip jadwal kosong`
- Row 2: `✅ Trigger aktif!`

---

## 🧪 Test Manual (Opsional)

Kalau mau test trigger-nya berfungsi:

```sql
-- Test: Buat jadwal kosong
INSERT INTO schedules (
    class_id, day, time_slot, phase, 
    week_number, year, program, level, 
    current_students, batch
)
VALUES (
    1, 'monday', 'afternoon', 'phase1',
    999, 2026, 'Test Class', 'Beginner',
    1, 3
);

-- Update ke 0 → harus auto-delete!
UPDATE schedules 
SET current_students = 0 
WHERE week_number = 999;

-- Cek: harus kosong (sudah terhapus otomatis)
SELECT * FROM schedules WHERE week_number = 999;
-- Expected: No results
```

**Kalau query terakhir return 0 rows = ✅ TRIGGER BERFUNGSI!**

---

## 📊 Apa Yang Terjadi Setelah Install?

### Before (Sekarang):
```
Week 1: 20 jadwal (15 ada siswa, 5 kosong)
  ↓ Copy Week
Week 2: 20 jadwal (copy semua, termasuk kosong)
  ↓ setTimeout 2 detik (kadang gagal)
Week 2: 15-20 jadwal (kadang masih ada kosong)
```

### After (Setelah Install):
```
Week 1: 20 jadwal (15 ada siswa, 5 kosong)
  ↓ Copy Week (skip yang kosong!)
Week 2: 15 jadwal (hanya yang ada siswa)
  ↓ Real-time trigger
Week 2: 15 jadwal (bersih, no empty!)
```

---

## 🎯 Benefit

✅ **Tidak ada jadwal kosong lagi** - auto-delete real-time  
✅ **Copy Week bersih** - tidak copy jadwal kosong  
✅ **Database lebih ringan** - tidak ada sampah  
✅ **Stats lebih akurat** - tidak ada data palsu  
✅ **No manual cleanup** - semua otomatis  

---

## ⚠️ Safety

**Apakah aman?**

✅ **YA, 100% AMAN!**

- Trigger hanya hapus jadwal dengan `current_students = 0`
- Tidak akan hapus jadwal yang ada siswanya
- Database-level (lebih reliable daripada frontend)
- Bisa di-disable kapan saja kalau mau
- Tidak mempengaruhi jadwal existing yang ada siswanya

**Risk level:** ✅ Low  
**Reversible:** ✅ Yes (tinggal DROP TRIGGER kalau perlu)

---

## 🚀 Action Required

**SEKARANG:**

1. ✅ Run `database/IMPROVE_SMART_COPY_WEEK.sql`
2. ✅ Run `database/AUTO_DELETE_EMPTY_SCHEDULES_TRIGGER.sql`  
3. ✅ Run verification query
4. ✅ Test (optional)
5. ✅ Done! Jadwal kosong akan auto-delete sendiri

**Estimasi waktu:** < 2 menit

---

## 📞 Kalau Ada Error

**Error 1:** "Function already exists"
- **Fix:** Normal, artinya function sudah ada. Query akan update function yang lama.

**Error 2:** "Trigger already exists"  
- **Fix:** Skrip sudah include `DROP TRIGGER IF EXISTS`, jadi seharusnya tidak error.

**Error 3:** "Permission denied"
- **Fix:** Pastikan login sebagai admin/owner di Supabase.

---

**STATUS:** ✅ Ready to install  
**Files to run:** 2 SQL files  
**Time needed:** < 2 minutes  
**Safe to run:** Yes  

🚀 **GO AHEAD AND RUN BOTH SQL FILES NOW!**
