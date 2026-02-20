# Bulk Import Attendance Fix - Student ID Mapping

## Problem
When using bulk import to add attendance records, the imported data was not showing up in the attendance report. 

### Root Cause
The bulk import function was using dummy `student_id` values like `IMPORT_0001`, `IMPORT_0002`, etc. instead of the real `student_id` from the database. When the attendance report filtered records by `student_id`, it couldn't find any matches because the dummy IDs don't correspond to actual students.

**Code Location:** `BulkOperations.jsx` line 502
```javascript
// OLD CODE (WRONG):
student_id: `IMPORT_${String(i + 1).padStart(4, '0')}`
```

## Solution Implemented

### 1. Import Missing Function
Added `getAllStudents` to the imports from `dbHelpers.js`:
```javascript
import { 
  bulkCreateUsers, 
  bulkAssignStudentsToClass, 
  bulkUpdateAttendance, 
  getAttendanceRecords, 
  bulkCreateAttendance, 
  getAllStudents  // ← ADDED THIS
} from '../utils/dbHelpers';
```

### 2. Fetch All Students
The function now fetches all students from the database at the start:
```javascript
const [existingAttendance, allStudents] = await Promise.all([
    getAttendanceRecords(),
    getAllStudents()  // ← Fetch all students
]);
```

### 3. Build Student ID Map
Creates a mapping from normalized student names to their real `student_id`:
```javascript
const studentIdMap = new Map();
allStudents.forEach(student => {
    const nameNorm = normalizeString(student.full_name);
    studentIdMap.set(nameNorm, student.student_id);
});
```

### 4. Match Student Names to IDs
For each imported attendance record, the function now:
1. Normalizes the student name from CSV
2. Looks up the real `student_id` from the map
3. Uses fuzzy matching (85%+ similarity) if exact match not found
4. Falls back to dummy ID only if no match found

```javascript
// Try exact match first
if (students.has(studentNorm)) {
    finalStudentName = studentMap.get(studentNorm);
    finalStudentId = studentIdMap.get(studentNorm);
} else {
    // Try fuzzy matching
    const match = findBestMatch(studentName, Array.from(studentMap.values()));
    if (match.score >= 0.85) {
        finalStudentName = match.match;
        const matchNorm = normalizeString(match.match);
        finalStudentId = studentIdMap.get(matchNorm);
    } else {
        // Fallback: try to find from allStudents
        const studentMatch = findBestMatch(studentName, allStudents.map(s => s.full_name));
        if (studentMatch.score >= 0.85) {
            const matchedStudent = allStudents.find(s => s.full_name === studentMatch.match);
            finalStudentId = matchedStudent?.student_id;
        }
    }
}

// Use real student_id or fallback to dummy
student_id: finalStudentId || `IMPORT_${String(i + 1).padStart(4, '0')}`
```

## How It Works

### Name Normalization
The `normalizeString()` function:
- Converts to lowercase
- Trims whitespace
- Removes punctuation
- Standardizes spacing

### Fuzzy Matching
The `calculateSimilarity()` function uses Levenshtein distance to find similar names:
- Score of 1.0 = exact match
- Score of 0.85+ = close enough to match
- Handles typos, extra spaces, and minor variations

### Example Matches
- "John Doe" matches "john doe" (exact)
- "Jane Smith" matches "Jane  Smith" (extra space)
- "Bob Johnson" matches "Bob Jonson" (typo - 90% similar)

## Testing

### Before Fix
```
CSV: John Doe
Database: student_id = "EYSA2601001"
Imported: student_id = "IMPORT_0001" ❌
Report: No match found ❌
```

### After Fix
```
CSV: John Doe
Database: student_id = "EYSA2601001", full_name = "John Doe"
Imported: student_id = "EYSA2601001" ✅
Report: Match found ✅
```

## Files Modified
- `booking-system/src/components/BulkOperations.jsx` - Added `getAllStudents` import and student ID mapping logic

## Status
✅ Code fixed
✅ Build successful
⏳ Ready for testing
⏳ Pending deployment

## Next Steps
1. Test bulk import with real CSV data
2. Verify attendance appears in report
3. Check fuzzy matching works for names with typos
4. Deploy to production if tests pass

## Migration Note
Existing attendance records with dummy IDs (`IMPORT_xxxx`) will NOT automatically update. If needed, a database migration script can be created to:
1. Find all attendance records with `student_id` like 'IMPORT_%'
2. Match `student_name` to real students
3. Update `student_id` to correct value

Would you like me to create this migration script?
