# Kenapa Booking EYSA26020009 Tidak Muncul di Student UI?

## 🔍 ROOT CAUSE DITEMUKAN

### Problem:
- Student EYSA26020009 (Nur Kasih Aulia) memiliki 2 bookings di database
- Bookings terlihat di Admin Dashboard
- Bookings TIDAK terlihat di Student Booking Page
- Tidak ada tombol cancel

### Root Cause:
**Student UI hanya menampilkan booking untuk 2 minggu:**
- Current Week (Week 2)
- Next Week (Week 3)

**Booking EYSA26020009 ada di Week 1** (minggu lalu) → **FILTERED OUT!**

---

## 📍 Lokasi Kode

### File: `booking-system/src/BookingSystemDB.jsx`

**Line 322-323:** Load bookings hanya untuk current + next week
```javascript
const bookingsCurrentWeek = await getUserBookings(userId, currentWeek, currentYear, userBatch);
const bookingsNextWeek = await getUserBookings(userId, bookingWeek, currentYear, userBatch);
```

**Line 1039:** Display bookings hanya untuk current + next week
```javascript
{[currentWeek, getBookingWeek()].map((weekNum) => {
    const weekBookings = userBookings.filter(b => b.schedule.week_number === weekNum);
    if (weekBookings.length === 0) return null;
```

### Variables:
- `currentWeek` = 2 (dari WeekContext)
- `getBookingWeek()` = currentWeek + 1 = 3
- EYSA26020009 bookings = Week 1

**Result:** Week 1 bookings tidak di-load dan tidak ditampilkan!

---

## 🎯 SOLUSI

### Option 1: Cancel via SQL (Quick Fix)
Gunakan file: `booking-system/database/CANCEL_BOOKING_EYSA26020009.sql`

```sql
-- Cancel bookings for EYSA26020009
UPDATE bookings
SET status = 'cancelled'
WHERE user_id = (SELECT id FROM users WHERE student_id = 'EYSA26020009')
  AND status = 'confirmed';
```

### Option 2: Show Past Week Bookings (Long-term Fix)
Modify `loadUserBookings()` untuk include previous week:

```javascript
// Load bookings for: previous week, current week, next week
const bookingsPreviousWeek = await getUserBookings(userId, currentWeek - 1, currentYear, userBatch);
const bookingsCurrentWeek = await getUserBookings(userId, currentWeek, currentYear, userBatch);
const bookingsNextWeek = await getUserBookings(userId, bookingWeek, currentYear, userBatch);

const allBookings = [...bookingsPreviousWeek, ...bookingsCurrentWeek, ...bookingsNextWeek];
```

### Option 3: Add Cancel Button in Student UI
Tambahkan tombol cancel di booking card (line 1140-1160)

---

## 🧪 VERIFICATION

### Check Current Week:
```sql
SELECT current_week, current_year FROM settings LIMIT 1;
```
Expected: Week 2, Year 2026

### Check EYSA26020009 Bookings:
```sql
SELECT 
    b.id,
    b.status,
    s.week_number,
    s.day,
    s.time_slot,
    s.phase,
    c.name as class_name
FROM bookings b
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE b.user_id = (SELECT id FROM users WHERE student_id = 'EYSA26020009')
ORDER BY s.week_number, s.day;
```

Expected: 2 bookings in Week 1

---

## 📊 TIMELINE

1. **Week 1:** Student booked 2 classes (Friday afternoon, Wednesday evening)
2. **Week 2:** System auto-incremented to Week 2 (current week)
3. **Student UI:** Only shows Week 2 + Week 3 bookings
4. **Result:** Week 1 bookings hidden from student view

---

## ✅ RECOMMENDED ACTION

**Immediate:** Run `CANCEL_BOOKING_EYSA26020009.sql` to cancel the bookings

**Long-term:** 
1. Add "Show Past Bookings" toggle in student UI
2. Add cancel button for confirmed bookings
3. Auto-hide bookings older than 2 weeks

---

**Created:** April 3, 2026
**Status:** Root cause identified, SQL fix ready
