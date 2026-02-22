# Fix Student Booking Display Issue

## Problem
Student M. Irfan hanya melihat 1 booking (Phase 1 Monday) padahal di admin terlihat dia punya 2 bookings:
- Phase 1 Monday
- Phase 2 Friday Afternoon (Oxford Class)

## Root Cause
Fungsi `getUserBookings()` di `dbHelpers.js` memfilter bookings berdasarkan `schedule.batch`:

```javascript
// OLD CODE - TOO STRICT
if (batch) {
    const batchNumber = batch.toString().replace(/[^0-9]/g, '');
    query = query.eq('schedule.batch', batchNumber)  // ❌ Hides bookings if schedule.batch is NULL or different
}
```

Masalahnya:
1. User M. Irfan punya `batch = "1"` atau `"Batch 1"`
2. Schedule Oxford Class mungkin punya `batch = NULL` atau berbeda
3. Filter `eq('schedule.batch', batchNumber)` akan menyembunyikan booking jika batch tidak exact match
4. Siswa tidak bisa melihat booking mereka sendiri yang sudah confirmed

## Solution
Hapus batch filter dari `getUserBookings()` karena:
- Siswa harus melihat SEMUA booking mereka yang sudah confirmed
- Tidak peduli schedule batch-nya apa
- Booking sudah dibuat = siswa sudah terdaftar = harus ditampilkan

```javascript
// NEW CODE - SHOW ALL BOOKINGS
export const getUserBookings = async (userId, weekNumber, year, batch = null) => {
    let query = supabase
        .from('bookings')
        .select(...)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .eq('schedule.week_number', weekNumber)
        .eq('schedule.year', year)
    
    // ❌ REMOVED: Batch filter - too strict
    // Students should see ALL their confirmed bookings
    
    const { data, error } = await query
    return data || []
}
```

## Impact
✅ Siswa sekarang bisa melihat SEMUA booking mereka yang confirmed
✅ Tidak ada booking yang tersembunyi karena batch mismatch
✅ Display di student view akan match dengan admin view

## Testing
1. Login sebagai M. Irfan (EYSA26010808)
2. Buka tab "My Bookings This Week"
3. Seharusnya melihat 2 bookings:
   - Phase 1 Monday
   - Phase 2 Friday Afternoon (Oxford Class)

## Files Changed
- `src/utils/dbHelpers.js` - Removed batch filter from `getUserBookings()`

## Verification Query
Run this to check M. Irfan's bookings:
```sql
SELECT 
    b.id as booking_id,
    u.full_name,
    u.batch as user_batch,
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.batch as schedule_batch
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE u.full_name LIKE '%Irfan%'
    AND b.status = 'confirmed'
    AND s.week_number = 9
ORDER BY s.phase, s.day;
```

Both bookings should be returned regardless of schedule.batch value.
