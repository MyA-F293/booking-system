# 🔧 Cara Cancel Booking Student

## 📋 Problem

**Student:** EYSA26020009 (Nur Kasih Aulia)
**Issue:** 
- Punya 2 bookings di Week 1
- Tidak ada tombol cancel di UI
- Booking tidak muncul di admin dashboard (kemungkinan di Batch 1 schedule yang hidden)

---

## 🔍 Root Cause

### 1. UI Tidak Ada Cancel Button

**Current Design:**
- Student booking card hanya show info (class, teacher, time)
- Tidak ada cancel button
- Student tidak bisa cancel booking sendiri

**Code Location:** `src/BookingSystemDB.jsx` line 1062-1160

**Booking Card Structure:**
```jsx
<div className="booking-card">
    {/* Phase Header */}
    {/* Program & Level */}
    {/* Class Name */}
    {/* Teacher */}
    {/* Time */}
    {/* Footer: "Confirmed" status */}
    {/* ❌ NO CANCEL BUTTON */}
</div>
```

### 2. Booking Mungkin di Batch 1 Schedule (Hidden)

**Kemungkinan:**
- Booking ada di schedule Batch 1
- Admin dashboard filter: `schedules.filter(s => s.current_students > 0)`
- Jika schedule Batch 1 kosong (0 students) → Hidden dari admin
- Admin tidak bisa lihat booking ini

---

## ✅ Solusi

### Solusi 1: Cancel via SQL (QUICK FIX - 2 menit)

**Jalankan file ini di Supabase:**
```
database/CANCEL_BOOKING_EYSA26020009.sql
```

**Ini akan:**
1. Find student info (EYSA26020009)
2. Find all bookings (2 bookings)
3. Delete bookings
4. Verify counter updated
5. Check if bookings were in Batch 1 schedules

**Kemudian:**
- Hard refresh browser (Ctrl + Shift + R)
- Bookings should be gone
- Student can book new classes

### Solusi 2: Add Cancel Button di UI (LONG-TERM - 30 menit)

**Problem:** Student tidak bisa cancel booking sendiri

**Solution:** Add cancel button di booking card

**Code Change in `BookingSystemDB.jsx`:**

**BEFORE (line 1150-1160):**
```jsx
{/* Footer Status */}
<div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-center gap-2">
    <Check size={14} className="text-emerald-600" />
    <span className="text-xs font-semibold text-emerald-700">Confirmed</span>
</div>
```

**AFTER:**
```jsx
{/* Footer with Cancel Button */}
<div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
        <Check size={14} className="text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Confirmed</span>
    </div>
    <button
        onClick={() => handleCancelBooking(booking.id)}
        className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
    >
        Cancel
    </button>
</div>
```

**Add Cancel Function:**
```jsx
// Add after line 280
const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) throw error;

        toast.success('✅ Booking canceled successfully!');
        
        // Reload bookings
        loadUserBookings();
    } catch (error) {
        console.error('Error canceling booking:', error);
        toast.error('Failed to cancel booking');
    }
};
```

**Impact:**
- ✅ Student can cancel booking sendiri
- ✅ No need admin intervention
- ✅ Better UX

### Solusi 3: Add "Show Empty Schedules" Toggle di Admin (PREVENTION - 20 menit)

**Problem:** Admin tidak bisa lihat booking di Batch 1 schedule (hidden)

**Solution:** Add toggle to show empty schedules

**Code Change in `AdminBookingDashboard.jsx`:**
```jsx
// Add state
const [hideEmpty, setHideEmpty] = useState(true);

// Filter schedules
const visibleSchedules = hideEmpty
    ? schedules.filter(s => s.current_students > 0)
    : schedules;  // Show all including empty

// Add toggle button
<button 
    onClick={() => setHideEmpty(!hideEmpty)}
    className="btn btn-secondary"
>
    {hideEmpty ? '👁️ Show Empty' : '🙈 Hide Empty'}
</button>
```

**Impact:**
- ✅ Admin can see hidden schedules
- ✅ Admin can see bookings in Batch 1 schedules
- ✅ Admin can delete students from hidden schedules

---

## 🚀 Recommended Action

### Immediate (2 menit):

1. **Jalankan** `CANCEL_BOOKING_EYSA26020009.sql` di Supabase
2. **Hard refresh** browser
3. **Verify** bookings gone

### Short-term (30 menit):

1. **Add cancel button** di student UI
2. **Test** cancel functionality
3. **Deploy** update

### Long-term (20 menit):

1. **Add "Show Empty" toggle** di admin UI
2. **Test** visibility of hidden schedules
3. **Deploy** update

---

## 📝 Quick SQL Command

**Jika mau cancel langsung tanpa file:**

```sql
-- Cancel all bookings for EYSA26020009
DELETE FROM bookings
WHERE user_id IN (
    SELECT id FROM users WHERE student_id = 'EYSA26020009'
);
```

**Kemudian:**
- Hard refresh browser
- Done! ✅

---

## 🎯 Summary

**Problem:** Student tidak bisa cancel booking (no cancel button)

**Root Cause:**
1. UI tidak ada cancel button (design issue)
2. Booking mungkin di Batch 1 schedule (hidden dari admin)

**Solution:**
1. Cancel via SQL (immediate)
2. Add cancel button di UI (long-term)
3. Add "Show Empty" toggle di admin (prevention)

**Result:**
- ✅ Booking canceled
- ✅ Student can book new classes
- ✅ Better UX for future

---

## 📝 Files Created

- `database/CANCEL_BOOKING_EYSA26020009.sql` - Cancel booking via SQL
- `CARA_CANCEL_BOOKING_STUDENT.md` - This document
