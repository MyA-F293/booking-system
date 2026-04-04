# Teacher Display Issue - Continuation

## Status: IN PROGRESS ⏳

## Problem
Teacher display in booking modal shows "TBA" instead of actual teacher name for some occupied rooms.

## Root Causes Identified

### ✅ FIXED: Root Cause 1 - Hardcoded Teacher Array
**Problem**: System was using hardcoded teacher array based on class index instead of actual schedule teacher.

**Solution**: Updated teacher display logic in `BookingSystemDB.jsx` (line ~1515) to use `schedule?.teacher` instead of hardcoded array.

### ✅ FIXED: Root Cause 2 - Missing Teacher Data in Query
**Problem**: `getOccupiedClassesByOtherPrograms` function wasn't fetching teacher data from database.

**Solution**: Updated `dbHelpers.js` to include `teacher:teachers(*)` in select query and return teacher object.

### 🔄 IN PROGRESS: Root Cause 3 - Missing teacher_id in Database
**Problem**: Some schedules in database don't have `teacher_id` assigned, causing "TBA" to display even after code fixes.

**Next Steps**:
1. Run `CHECK_TEACHER_ASSIGNMENTS.sql` to identify which schedules are missing teacher_id
2. Determine which teachers should be assigned to which schedules
3. Create `FIX_TEACHER_ASSIGNMENTS.sql` to update schedules with correct teacher_id
4. Verify teacher display works correctly after database update

## Files Modified

### ✅ booking-system/src/utils/dbHelpers.js
```javascript
// Line ~587-625: getOccupiedClassesByOtherPrograms function
export const getOccupiedClassesByOtherPrograms = async (params) => {
    // ... existing code ...
    
    let query = supabase
        .from('schedules')
        .select(`
            class_id, 
            program, 
            level,
            current_students,
            teacher:teachers(*)  // ✅ ADDED: Fetch teacher data
        `)
        // ... rest of query ...
    
    // Extract unique class_ids that are occupied with teacher info
    const occupiedClasses = data?.map(s => ({
        class_id: s.class_id,
        program: s.program,
        level: s.level,           // ✅ ADDED
        teacher: s.teacher        // ✅ ADDED
    })) || [];
    
    return occupiedClasses;
}
```

### ✅ booking-system/src/BookingSystemDB.jsx
```javascript
// Line ~1515: Teacher display logic
// Get teacher - if room is occupied/conflict, show the occupying schedule's teacher
let teacher = schedule?.teacher || { name: 'TBA' };

// If room is occupied by another program, get that program's teacher
if (isOccupied || hasRoomConflict) {
    const occupiedSchedule = occupiedClasses.find(oc => oc.class_id === classItem.id);
    if (occupiedSchedule?.teacher) {
        teacher = occupiedSchedule.teacher;  // ✅ Use actual teacher from occupied schedule
    }
}

// Display teacher name
<div className="flex items-center gap-1 text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">
    <User size={10} className="sm:w-3 sm:h-3" />
    <span className="truncate">{teacher?.name || 'TBA'}</span>
</div>
```

## Database Investigation Required

### Run this query first:
```sql
-- Check which schedules are missing teacher_id
SELECT 
    program,
    COUNT(*) as schedules_without_teacher,
    SUM(current_students) as total_students_affected
FROM schedules
WHERE teacher_id IS NULL
  AND current_students > 0
GROUP BY program;
```

### Expected Results:
- Will show how many schedules per program don't have teacher assigned
- Will show how many students are affected

### Next Action:
Once we know which schedules are missing teacher_id, we need to:
1. Identify the correct teacher for each schedule (based on program, level, day, time)
2. Create UPDATE statements to assign teacher_id
3. Verify all schedules have teacher_id assigned

## Related Issues

### Program Name Inconsistency (READY TO FIX)
**File**: `booking-system/database/FIX_PROGRAM_NAME_SAFE.sql`

**Problem**: 21 students have program "Campus & Career" while 152 have "English Campus & Career". This causes room conflict check to fail.

**Solution**: Run the SQL file to standardize all to "English Campus & Career".

**Status**: ✅ SAFE TO RUN - User confirmed bookings won't be affected.

## Testing After Fix

1. ✅ Run `FIX_PROGRAM_NAME_SAFE.sql` first
2. 🔄 Run `CHECK_TEACHER_ASSIGNMENTS.sql` to identify missing teachers
3. 🔄 Create and run `FIX_TEACHER_ASSIGNMENTS.sql`
4. 🔄 Test booking modal - verify teacher names display correctly
5. 🔄 Test occupied rooms - verify correct teacher shows for occupied rooms

## User Feedback
- User reported: "itu tutor yang sedang menggunakan kelas tersebut tidak sesuai dengan apa yang di tampilkan"
- User asked: "kok TBA, yang tutor yang pakai kelas ruangan itu"
- User still seeing: "ni kok masih ada yang TBA ya"

This indicates database-level issue where schedules don't have teacher_id assigned.
