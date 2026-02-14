# 🚨 Error Handling Guide - Database Triggers

## Bagaimana Error dari Database Ditampilkan ke User

### Flow Error Handling:

```
Database Trigger → Supabase Error → Frontend Catch → Toast Message
```

---

## 📋 Error Messages dari Database

### 1. Capacity Error (Max 10 Students)
**Trigger:** `check_schedule_capacity`

**Database Error:**
```
ERROR: Schedule is at full capacity (10 students). Maximum allowed is 10.
```

**Frontend Detection:**
```javascript
if (errorMessage.includes('full capacity') || errorMessage.includes('capacity')) {
    toast.error('❌ Kelas sudah penuh! Maksimal 10 siswa per kelas.');
}
```

**User Sees:**
```
❌ Kelas sudah penuh! Maksimal 10 siswa per kelas.
```

---

### 2. Duplicate Booking Error
**Constraint:** `unique_booking_per_student`

**Database Error:**
```
ERROR: duplicate key value violates unique constraint "unique_booking_per_student"
```

**Frontend Detection:**
```javascript
if (errorMessage.includes('unique_booking_per_student') || errorMessage.includes('duplicate key')) {
    toast.error('⚠️ Siswa sudah terdaftar di kelas ini!');
}
```

**User Sees:**
```
⚠️ Siswa sudah terdaftar di kelas ini!
```

---

### 3. Duplicate Schedule Error
**Constraint:** `unique_schedule_combination`

**Database Error:**
```
ERROR: duplicate key value violates unique constraint "unique_schedule_combination"
```

**Frontend Detection:**
```javascript
if (errorMessage.includes('unique_schedule_combination')) {
    toast.error('⚠️ Schedule dengan kombinasi ini sudah ada!');
}
```

**User Sees:**
```
⚠️ Schedule dengan kombinasi ini sudah ada!
```

---

### 4. Invalid Data Error
**Trigger:** `validate_schedule_data`

**Database Error:**
```
ERROR: Invalid day: xyz
ERROR: Invalid phase: xyz
ERROR: Invalid time_slot: xyz
```

**Frontend Detection:**
```javascript
if (errorMessage.includes('Invalid day') || errorMessage.includes('Invalid phase')) {
    toast.error('❌ Data tidak valid! Periksa kembali input Anda.');
}
```

**User Sees:**
```
❌ Data tidak valid! Periksa kembali input Anda.
```

---

## 🛠️ Implementation di Frontend

### Helper Function (AdminBookingDashboard.jsx)

```javascript
// Helper function to parse database errors into user-friendly messages
const parseDbError = (error) => {
    const errorMessage = error?.message || '';
    
    // Capacity error from trigger
    if (errorMessage.includes('full capacity') || errorMessage.includes('capacity')) {
        return '❌ Kelas sudah penuh! Maksimal 10 siswa per kelas.';
    }
    // Duplicate booking error from constraint
    if (errorMessage.includes('unique_booking_per_student') || errorMessage.includes('duplicate key')) {
        return '⚠️ Siswa sudah terdaftar di kelas ini!';
    }
    // Duplicate schedule error from constraint
    if (errorMessage.includes('unique_schedule_combination')) {
        return '⚠️ Schedule dengan kombinasi ini sudah ada!';
    }
    // Invalid data error from validation trigger
    if (errorMessage.includes('Invalid day') || errorMessage.includes('Invalid phase') || errorMessage.includes('Invalid time_slot')) {
        return '❌ Data tidak valid! Periksa kembali input Anda.';
    }
    // Generic error
    return errorMessage;
};
```

### Usage in Functions

```javascript
const handleAddStudent = async (studentId) => {
    try {
        // ... validation code
        await createBooking({ schedule_id: selectedSchedule.id, user_id: studentId, status: 'confirmed' });
        toast.success('✅ Siswa berhasil ditambahkan!');
    } catch (err) {
        console.error('Error adding student:', err);
        toast.error(parseDbError(err)); // ← Parse error here
    }
};

const handleMoveStudent = async () => {
    try {
        // ... move logic
        toast.success('✅ Siswa berhasil dipindahkan!');
    } catch (err) {
        console.error('Error moving student:', err);
        toast.error(parseDbError(err)); // ← Parse error here
    }
};
```

---

## 🎯 2-Layer Protection

### Layer 1: Frontend Validation (Fast Feedback)
```javascript
// Check before sending to database
if (selectedSchedule.current_students >= 10) {
    toast.error('❌ Kelas sudah penuh! Maksimal 10 siswa per kelas.');
    return; // Stop here, don't call database
}
```

**Benefit:**
- ✅ Instant feedback (no network delay)
- ✅ Saves network request
- ✅ Better UX

### Layer 2: Database Trigger (Bulletproof)
```sql
-- Runs in database before INSERT
IF current_count >= max_capacity THEN
    RAISE EXCEPTION 'Schedule is at full capacity';
END IF;
```

**Benefit:**
- ✅ Cannot be bypassed
- ✅ Protects from all sources (API, direct DB access, etc.)
- ✅ Data integrity guaranteed

---

## 📊 Error Flow Examples

### Example 1: Add Student to Full Class

**User Action:** Click "Add Student" button

**Frontend Check:**
```javascript
if (selectedSchedule.current_students >= 10) {
    toast.error('❌ Kelas sudah penuh!');
    return; // Stopped here
}
```

**Result:** User sees error immediately, no database call

---

### Example 2: Race Condition (2 Users Add at Same Time)

**User A:** Adds student #10 → Frontend check passes (9 students)
**User B:** Adds student #10 → Frontend check passes (9 students)

**Database Trigger:**
```
User A: INSERT → Success (now 10 students)
User B: INSERT → ERROR: full capacity
```

**User B Sees:**
```
❌ Kelas sudah penuh! Maksimal 10 siswa per kelas.
```

**Result:** Database trigger catches race condition

---

### Example 3: Add Same Student Twice

**User Action:** Click "Add Student" twice (double-click)

**Frontend Check:**
```javascript
const alreadyBooked = scheduleStudents.some(b => b.user.id === studentId);
if (alreadyBooked) {
    toast.warning('⚠️ Siswa sudah terdaftar!');
    return;
}
```

**If Frontend Missed (race condition):**
```
Database Constraint: unique_booking_per_student
ERROR: duplicate key value
```

**User Sees:**
```
⚠️ Siswa sudah terdaftar di kelas ini!
```

**Result:** Both layers protect against duplicates

---

## 🧪 Testing Error Messages

### Test 1: Capacity Error
```javascript
// In browser console:
// 1. Find a schedule with 10 students
// 2. Try to add 11th student
// Expected: "❌ Kelas sudah penuh! Maksimal 10 siswa per kelas."
```

### Test 2: Duplicate Booking
```javascript
// In browser console:
// 1. Add a student to a schedule
// 2. Try to add same student again
// Expected: "⚠️ Siswa sudah terdaftar di kelas ini!"
```

### Test 3: Database Direct Test
```sql
-- In Supabase SQL Editor:
-- Try to insert 11th student directly
INSERT INTO bookings (schedule_id, user_id, status)
VALUES ('schedule-with-10-students', 'new-user-id', 'confirmed');

-- Expected: ERROR: Schedule is at full capacity
```

---

## 📝 Customizing Error Messages

### To Change Error Messages:

**1. Update Database Trigger:**
```sql
-- In SAFE_PROTECTION_ONLY.sql
RAISE EXCEPTION 'Your custom message here';
```

**2. Update Frontend Parser:**
```javascript
// In AdminBookingDashboard.jsx
const parseDbError = (error) => {
    if (errorMessage.includes('your custom message')) {
        return 'Your user-friendly message';
    }
};
```

---

## ✅ Summary

**Error Handling Flow:**
1. Frontend validation (fast feedback)
2. Database trigger (bulletproof protection)
3. Error caught in frontend
4. Parsed to user-friendly message
5. Displayed in toast notification

**Benefits:**
- ✅ User-friendly error messages
- ✅ 2-layer protection
- ✅ Cannot bypass database rules
- ✅ Consistent error handling
- ✅ Good UX

**Files Modified:**
- `AdminBookingDashboard.jsx` - Added `parseDbError()` helper function
- Error handling in `handleAddStudent()`, `handleMoveStudent()`, etc.
