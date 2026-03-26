# 🛡️ Race Condition Prevention Guide

## Masalah yang Terjadi

Saat copy week 10 → week 11, terjadi **race condition**:
- Week 10 punya 10 students di Oxford Friday Evening
- Beberapa siswa **manual booking** di week 11 sebelum/saat auto-copy
- Hasil: Week 11 jadi 15 students (10 dari copy + 5 manual) → **OVERCAPACITY**

## Penyebab

1. **Manual booking** terjadi sebelum auto-copy (lihat `created_at`)
2. **Auto-copy** tidak cek apakah siswa sudah booking
3. **Tidak ada validasi** max_students saat insert booking
4. **Race condition** antara manual booking dan auto-copy

## Solusi yang Diimplementasikan

### 1. Smart Copy Week (Manual)

File: `database/SMART_COPY_WEEK_WITH_PROTECTION.sql`

**Fitur:**
- ✅ Cek apakah siswa sudah booking di target week
- ✅ Skip siswa yang sudah ada (prevent duplicate)
- ✅ Respect max_students limit (prevent overcapacity)
- ✅ Detailed logging (berapa copied, skipped, prevented)

**Cara Pakai:**
```sql
-- Edit bagian DECLARE:
source_week INT := 11;  -- Week yang mau dicopy
target_week INT := 12;  -- Week tujuan

-- Jalankan query
```

**Output:**
```
✅ Created 46 new schedules
✅ Copied 328 bookings
⚠️  Skipped 0 bookings (already exists)
🛡️  Prevented 44 overcapacity bookings
```

### 2. Database Protection (Otomatis)

File: `database/INSTALL_OVERCAPACITY_PROTECTION.sql`

**Fitur:**
- 🛡️ **Prevent Overcapacity**: Trigger otomatis block booking jika schedule penuh
- 🛡️ **Prevent Duplicate**: Trigger otomatis block duplicate booking
- 🔄 **Auto Update Counter**: current_students otomatis update saat booking insert/update/delete

**Cara Install:**
```sql
-- Jalankan sekali saja
\i database/INSTALL_OVERCAPACITY_PROTECTION.sql
```

**Triggers yang Diinstall:**
1. `prevent_overcapacity_booking` - Block booking jika penuh
2. `prevent_overcapacity_booking_update` - Block update status ke confirmed jika penuh
3. `auto_update_current_students` - Auto update counter
4. `prevent_duplicate_booking_trigger` - Block duplicate booking

## Workflow Baru

### Sebelum (Bermasalah):
```
1. Admin copy week 10 → 11
2. Siswa manual booking di week 11 (race condition)
3. Auto-copy jalan → duplicate/overcapacity
4. Result: 15 students di schedule max 10
```

### Sesudah (Aman):
```
1. Admin copy week 10 → 11 (pakai SMART_COPY)
2. Smart copy cek: siswa sudah booking? → Skip
3. Smart copy cek: schedule penuh? → Skip
4. Database trigger: booking melebihi max? → REJECT
5. Result: Max 10 students, no overcapacity
```

## Testing

### Test 1: Smart Copy
```sql
-- Copy week 11 → 12
-- Lihat output: berapa copied, skipped, prevented
```

### Test 2: Manual Overcapacity
```sql
-- Try booking ke schedule yang penuh
-- Should fail dengan error: "Schedule is full!"
```

### Test 3: Duplicate Booking
```sql
-- Try booking 2x di schedule yang sama
-- Should fail dengan error: "User already has a booking"
```

## Monitoring

### Check Overcapacity Schedules
```sql
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.current_students,
    c.max_students,
    (s.current_students - c.max_students) as over_by
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students > c.max_students
  AND s.year = 2026
ORDER BY over_by DESC;
```

### Check Duplicate Bookings
```sql
SELECT 
    u.full_name,
    c.name,
    s.day,
    s.time_slot,
    COUNT(*) as booking_count
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE b.status = 'confirmed'
  AND s.year = 2026
GROUP BY u.id, u.full_name, c.name, s.day, s.time_slot, s.id
HAVING COUNT(*) > 1;
```

## Maintenance

### Disable Protection (Emergency)
```sql
-- Jika perlu disable sementara
DROP TRIGGER IF EXISTS prevent_overcapacity_booking ON bookings;
DROP TRIGGER IF EXISTS prevent_duplicate_booking_trigger ON bookings;
```

### Re-enable Protection
```sql
-- Jalankan ulang install script
\i database/INSTALL_OVERCAPACITY_PROTECTION.sql
```

### Fix Existing Overcapacity
```sql
-- Lihat file: database/FIX_WEEK_11_DUPLICATES.sql
-- Untuk clean up data yang sudah overcapacity
```

## Best Practices

1. **Selalu pakai SMART_COPY** saat copy week
2. **Install database protection** di production
3. **Monitor overcapacity** setiap minggu
4. **Backup sebelum copy** week baru
5. **Test di staging** dulu sebelum production

## Troubleshooting

### Q: Copy week gagal dengan error "Schedule is full"
A: Ini normal! Protection bekerja. Siswa yang tidak bisa dicopy karena schedule penuh akan di-skip.

### Q: Siswa complain tidak bisa booking
A: Cek apakah schedule penuh. Jika ya, buka slot baru atau pindahkan siswa.

### Q: current_students tidak match dengan actual bookings
A: Jalankan query fix counter:
```sql
UPDATE schedules s
SET current_students = (
    SELECT COUNT(DISTINCT b.user_id)
    FROM bookings b
    WHERE b.schedule_id = s.id
      AND b.status = 'confirmed'
)
WHERE s.year = 2026;
```

## Summary

✅ **Smart Copy**: Prevent duplicate dan overcapacity saat copy week
✅ **Database Triggers**: Proteksi otomatis 24/7
✅ **Auto Counter**: current_students selalu akurat
✅ **Monitoring**: Query untuk detect masalah
✅ **Documentation**: Guide lengkap untuk maintenance

Dengan sistem ini, race condition dan overcapacity tidak akan terjadi lagi! 🎉
