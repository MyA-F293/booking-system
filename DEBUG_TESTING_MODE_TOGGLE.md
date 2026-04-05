# Debug Testing Mode Toggle - Not Updating Database

## Problem
Console shows: `✅ Testing Mode updated in database: true`
But database query shows: `testing_mode: false`

## Possible Causes

### 1. RLS Policy Issue
Admin might not have permission to UPDATE settings table.

**Check**:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'settings';
```

**Expected**: Should have policy allowing authenticated users to UPDATE

### 2. Timing/Cache Issue
Query runs before database commit completes, or Supabase dashboard cache.

**Solution**: Wait 2-3 seconds, then refresh query

### 3. Wrong Row ID
Code updates `id = 1` but settings table might have different ID.

**Check**:
```sql
SELECT * FROM settings;
```

**Expected**: Should have row with `id = 1`

### 4. Transaction Rollback
Update succeeds but gets rolled back due to error.

**Check Console**: Look for error after success message

## Debug Steps

### Step 1: Check Console for Errors
1. Open browser console (F12)
2. Click "Testing" button
3. Look for logs:
   ```
   ✅ Testing Mode updated in database: true  ← Success
   ```
4. Check if there's any RED error after this

### Step 2: Manual Database Update
Run this in Supabase SQL Editor:
```sql
UPDATE settings 
SET testing_mode = true 
WHERE id = 1
RETURNING *;
```

**If this works**: RLS policy is OK, problem is in code
**If this fails**: RLS policy issue

### Step 3: Check Current Value
```sql
SELECT 
    id,
    testing_mode,
    updated_at
FROM settings
WHERE id = 1;
```

Check `updated_at` timestamp - does it change when you click button?

### Step 4: Add More Logging
Update `BookingModeContext.jsx` toggleBookingMode:

```javascript
const toggleBookingMode = async () => {
    const newValue = !testingMode;
    console.log('🔵 About to update testing_mode to:', newValue);

    try {
        const { data, error } = await supabase
            .from('settings')
            .update({ testing_mode: newValue })
            .eq('id', 1)
            .select(); // ← Add .select() to return updated row

        console.log('🔵 Update result:', { data, error });

        if (error) {
            console.error('❌ Error updating testing_mode:', error);
            throw error;
        }

        setTestingMode(newValue);
        console.log('✅ Testing Mode updated in database:', newValue);
        console.log('✅ Returned data:', data);
    } catch (err) {
        console.error('❌ Failed to toggle testing mode:', err);
        throw err;
    }
};
```

### Step 5: Check Supabase Dashboard Cache
1. Go to Supabase Dashboard
2. Table Editor → settings
3. Click refresh icon
4. Check if value changed

## Quick Test

Run this in browser console (while on admin page):
```javascript
// Test direct Supabase update
const { createClient } = window.supabase;
const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_ANON_KEY'
);

const testUpdate = async () => {
    const { data, error } = await supabase
        .from('settings')
        .update({ testing_mode: true })
        .eq('id', 1)
        .select();
    
    console.log('Test update result:', { data, error });
};

testUpdate();
```

## Files to Check
1. `src/contexts/BookingModeContext.jsx` - toggleBookingMode function
2. `database/CHECK_SETTINGS_PERMISSIONS.sql` - RLS policies
3. Browser console - errors

## Next Steps Based on Results

### If manual SQL UPDATE works:
→ Problem is in JavaScript code
→ Check if `.eq('id', 1)` is correct
→ Add `.select()` to see returned data

### If manual SQL UPDATE fails:
→ RLS policy issue
→ Need to add/fix UPDATE policy for authenticated users

### If updated_at doesn't change:
→ Update not reaching database
→ Check network tab for failed requests
→ Check Supabase connection

### If updated_at changes but value stays false:
→ Something is overwriting the value
→ Check for other code that updates settings
→ Check for database triggers
