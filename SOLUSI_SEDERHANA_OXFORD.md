# Solusi Sederhana: Oxford Booking Error

## 🎯 MASALAH UTAMA

**Bukan di code, tapi di DATABASE!**

Ada empty duplicate schedules di database yang menyebabkan trigger block booking baru.

---

## ✅ SOLUSI SEDERHANA - 1 QUERY SAJA

### Jalankan di Supabase:

```sql
-- Delete SEMUA empty schedules (0 students) untuk Week 2
DELETE FROM schedules
WHERE week_number = 2
  AND year = 2026
  AND current_students = 0;
```

**Result:** 
- Semua jadwal kosong dihapus
- Student bisa booking normal
- System akan create schedule baru otomatis saat ada yang booking

---

## 🧪 VERIFICATION

### Check setelah delete:
```sql
SELECT 
    c.name as class_name,
    s.program,
    s.level,
    s.batch,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.week_number = 2
  AND s.year = 2026
  AND s.current_students = 0;
```

Expected: **No rows** (tidak ada jadwal kosong)

### Test booking:
1. Login sebagai student
2. Pilih Saturday → Evening → Oxford
3. Click book
4. Should work!

---

## 📝 KENAPA INI TERJADI?

1. **Batch 1 students dihapus** → Empty Batch 1 schedules tertinggal
2. **smart_copy_week** → Copy empty schedules ke week baru
3. **Trigger terlalu strict** → Block semua booking baru
4. **Result:** User tidak bisa booking

---

## 🚀 NEXT STEPS (SETELAH FIX)

1. **Fix smart_copy_week** → Jangan copy empty schedules
2. **Update trigger** → Check program/level/batch juga
3. **Auto-delete empty schedules** → Cleanup otomatis

**Tapi untuk sekarang:** Delete empty schedules dulu, baru fix yang lain.

---

**Created:** April 3, 2026
**Status:** Simple solution, 1 query only
**Priority:** HIGH - Run immediately
