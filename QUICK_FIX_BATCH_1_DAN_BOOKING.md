# Quick Fix: Batch 1 & Booking EYSA26020009

## 🎯 3 SQL QUERIES - JALANKAN SEKARANG

### 1️⃣ Cancel Booking EYSA26020009
**File:** `database/CANCEL_BOOKING_EYSA26020009.sql`

```sql
UPDATE bookings
SET status = 'cancelled'
WHERE user_id = (SELECT id FROM users WHERE student_id = 'EYSA26020009')
  AND status = 'confirmed';
```

**Result:** 2 bookings akan di-cancel (Friday afternoon, Wednesday evening)

---

### 2️⃣ Delete 9 Empty Batch 1 Schedules
**File:** `database/INVESTIGATE_BATCH_1_CREATION.sql`

```sql
DELETE FROM schedules 
WHERE batch = 1 
  AND current_students = 0;
```

**Result:** 9 jadwal kosong Batch 1 akan dihapus

---

### 3️⃣ Fix smart_copy_week Function
**File:** `database/FIX_SMART_COPY_WEEK_BATCH.sql`

```sql
CREATE OR REPLACE FUNCTION smart_copy_week(source_week INT, target_week INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO schedules (
        class_id, day, time_slot, phase, week_number, year,
        program, level, batch, current_students, max_students, teacher_id
    )
    SELECT 
        s.class_id,
        s.day,
        s.time_slot,
        s.phase,
        target_week,
        s.year,
        s.program,
        s.level,
        NULL as batch,  -- ✅ FIX: Set NULL instead of copying old batch
        0 as current_students,
        s.max_students,
        s.teacher_id
    FROM schedules s
    WHERE s.week_number = source_week
      AND s.year = (SELECT current_year FROM settings LIMIT 1)
      AND s.current_students > 0;  -- Only copy active schedules
    
    RETURN 'Week copied successfully';
END;
$$;
```

**Result:** Copy week tidak akan copy Batch 1 lagi

---

## ✅ VERIFICATION

### Check Batch 1 Deleted:
```sql
SELECT batch, COUNT(*) as total
FROM schedules
WHERE batch = 1
GROUP BY batch;
```
Expected: No rows (Batch 1 sudah tidak ada)

### Check Booking Cancelled:
```sql
SELECT status, COUNT(*) as total
FROM bookings
WHERE user_id = (SELECT id FROM users WHERE student_id = 'EYSA26020009')
GROUP BY status;
```
Expected: 2 cancelled, 0 confirmed

---

## 📝 NOTES

### Kenapa Booking Tidak Muncul?
Student UI hanya load booking untuk:
- Week 2 (current week)
- Week 3 (next week)

Booking EYSA26020009 ada di Week 1 → tidak di-load → tidak muncul

### Kenapa Batch 1 Muncul Lagi?
Function `smart_copy_week` copy batch dari source week:
- Week 1 punya Batch 1 schedule → Week 2 dapat Batch 1
- Week 2 punya Batch 1 schedule → Week 3 dapat Batch 1
- Loop terus sampai di-fix

---

**Created:** April 3, 2026
**Status:** Ready to execute
**Order:** Run 1 → 2 → 3
