# Testing Mode - Database Sync Implementation

## Problem
Testing mode sebelumnya disimpan di `localStorage` (per browser), jadi kalau admin nyalakan testing mode, student TIDAK menerima perubahan.

## Solution
Pindahkan testing mode ke database, sama seperti `force_close_booking`.

## Changes Made

### 1. Database Changes
**File**: `booking-system/database/ADD_TESTING_MODE_COLUMN.sql`

Menambahkan kolom `testing_mode` ke table `settings`:
```sql
ALTER TABLE settings 
ADD COLUMN testing_mode BOOLEAN DEFAULT false;
```

### 2. Context Changes
**File**: `booking-system/src/contexts/BookingModeContext.jsx`

**Before** (localStorage):
```javascript
const [bookingMode, setBookingMode] = useState(() => {
    const saved = localStorage.getItem('eysa_booking_mode');
    return saved || 'production';
});
```

**After** (database):
```javascript
const [testingMode, setTestingMode] = useState(false);
const [forceClose, setForceClose] = useState(false);

// Load from database
useEffect(() => {
    const { data } = await supabase
        .from('settings')
        .select('force_close_booking, testing_mode')
        .single();
    
    setForceClose(data?.force_close_booking || false);
    setTestingMode(data?.testing_mode || false);
}, []);
```

**Toggle Function** (update database):
```javascript
const toggleBookingMode = async () => {
    const newValue = !testingMode;
    
    await supabase
        .from('settings')
        .update({ testing_mode: newValue })
        .eq('id', 1);
    
    setTestingMode(newValue);
};
```

## How It Works Now

### Admin Side:
1. Admin login
2. Go to Settings
3. Toggle "Testing Mode" ON/OFF
4. Update goes to database immediately
5. All users (admin + students) will see the change after refresh

### Student Side:
1. Student opens booking page
2. `BookingModeContext` loads `testing_mode` from database
3. If `testing_mode = true` → Booking OPEN (bypass day rules)
4. If `testing_mode = false` → Production mode (Thu-Sat only)
5. Student refresh → gets latest value from database

## Priority Logic (Updated)

```
1. Force Close = true → CLOSED (highest priority)
2. Testing Mode = true (from DB) → OPEN (bypass day rules)
3. Production Mode → Check day (Thu-Sat only)
```

## Benefits

✅ **Centralized Control**: Admin controls testing mode for ALL users
✅ **Real-time Sync**: All users get same testing mode after refresh
✅ **No Manual Setup**: Students don't need to manually enable testing mode
✅ **Consistent Behavior**: Same logic as force_close_booking
✅ **Database Backup**: Testing mode state is backed up with database

## Migration Steps

### Step 1: Run SQL
```bash
# In Supabase SQL Editor
# Run: booking-system/database/ADD_TESTING_MODE_COLUMN.sql
```

### Step 2: Verify Column
```sql
SELECT 
    id,
    current_week,
    force_close_booking,
    testing_mode,
    week_1_start_date
FROM settings
WHERE id = 1;
```

Expected result:
```
id | current_week | force_close_booking | testing_mode | week_1_start_date
---|--------------|---------------------|--------------|------------------
1  | 1            | false               | false        | 2026-03-30
```

### Step 3: Deploy Code
```bash
cd booking-system
npm run build
# Deploy to Netlify
```

### Step 4: Test
1. Admin: Toggle testing mode ON
2. Check database: `testing_mode` should be `true`
3. Student: Refresh page
4. Student console should show: `✅ Loaded testing_mode from database: true`
5. Booking should be OPEN (even on Sunday)

## Testing Checklist

- [ ] Run SQL to add `testing_mode` column
- [ ] Verify column exists in database
- [ ] Deploy updated code
- [ ] Admin: Toggle testing mode ON
- [ ] Check database value updated
- [ ] Student: Refresh page
- [ ] Student console shows correct value
- [ ] Booking opens (bypass day rules)
- [ ] Admin: Toggle testing mode OFF
- [ ] Student: Refresh page
- [ ] Booking follows production rules (Thu-Sat only)

## Backward Compatibility

Context still exports `bookingMode` for legacy code:
```javascript
const bookingMode = testingMode ? 'testing' : 'production';
```

So existing code using `bookingMode` will still work.

## Files Modified
1. `booking-system/database/ADD_TESTING_MODE_COLUMN.sql` (new)
2. `booking-system/src/contexts/BookingModeContext.jsx` (updated)

## Related Files
- `booking-system/database/ADD_FORCE_CLOSE_ONLY.sql` (similar pattern)
- `booking-system/src/BookingSystemDB.jsx` (uses context)
- `booking-system/SOLUSI_BOOKING_CLOSED_SUNDAY.md` (explanation)
