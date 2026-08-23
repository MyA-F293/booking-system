# Duplicate Booking Detection - Feature Proposal

## 🎯 Problem Statement

**Issue**: Siswa bisa booking 2 kelas berbeda di phase yang sama (phase1 atau phase2) dalam 1 week, yang seharusnya tidak diperbolehkan.

**Example Conflict**:
```
Student: Ahmad
Week: 2

Booking 1: Harvard Class - Phase1 - Monday Morning ✅
Booking 2: Oxford Class - Phase1 - Tuesday Evening ❌ CONFLICT!
                         ↑ Same phase!
```

**Why This is Bad**:
- Siswa tidak bisa hadir di 2 kelas sekaligus
- Data attendance jadi tidak valid
- Kapasitas kelas terbuang
- Confusing untuk admin & teacher

---

## 💡 Solution: Duplicate Phase Detection

### Detection Points:
1. **During Booking** (Frontend + Backend)
2. **During Copy Week** (RPC function)
3. **Admin Dashboard** (Visual warning)

---

## 🏗️ Implementation Strategy

### Level 1: Database Constraint (Strongest) ⭐ RECOMMENDED
**Pro:**
- ✅ Guaranteed prevention at database level
- ✅ Works for all entry points (UI, API, SQL)
- ✅ Cannot be bypassed
- ✅ Automatic enforcement

**Con:**
- ⚠️ Requires migration
- ⚠️ Harder to customize error message

**Implementation**:
```sql
-- Create unique constraint
ALTER TABLE bookings
ADD CONSTRAINT bookings_unique_student_week_phase
UNIQUE (user_id, week_number, phase, year);
```

**When to Use**: Best for longterm, production-ready solution.

---

### Level 2: RPC Function Check (Smart Copy Week)
**Pro:**
- ✅ Prevents during automated copy
- ✅ Custom logic possible
- ✅ Can skip or warn instead of error

**Con:**
- ⚠️ Only works during RPC call
- ⚠️ Manual booking bypasses this

**Implementation**:
```sql
-- In smart_copy_week RPC
-- Before copying booking, check if student already has booking in same phase
IF EXISTS (
    SELECT 1 FROM bookings b
    JOIN schedules s ON s.id = b.schedule_id
    WHERE b.user_id = booking.user_id
      AND s.week_number = target_week_param
      AND s.phase = source_schedule.phase
      AND b.status = 'confirmed'
) THEN
    -- Skip this booking
    bookings_skipped := bookings_skipped + 1;
    CONTINUE;
END IF;
```

**When to Use**: Quick fix for copy week operation.

---

### Level 3: Frontend Validation (User-Friendly)
**Pro:**
- ✅ Immediate feedback to user
- ✅ Custom error message
- ✅ Better UX (no failed booking)
- ✅ Can suggest alternative

**Con:**
- ⚠️ Can be bypassed (API direct call)
- ⚠️ Doesn't protect from race condition
- ⚠️ More code to maintain

**Implementation** (in BookingDashboard.jsx):
```javascript
const checkDuplicatePhase = async (studentId, scheduleId, weekNumber) => {
    // Get phase of current schedule
    const { data: currentSchedule } = await supabase
        .from('schedules')
        .select('phase')
        .eq('id', scheduleId)
        .single();

    // Check if student already has booking in same phase
    const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id, schedule:schedules(phase, class_name)')
        .eq('user_id', studentId)
        .eq('status', 'confirmed')
        .eq('schedule.week_number', weekNumber)
        .eq('schedule.phase', currentSchedule.phase);

    if (existingBookings && existingBookings.length > 0) {
        return {
            isDuplicate: true,
            existingClass: existingBookings[0].schedule.class_name,
            phase: currentSchedule.phase
        };
    }

    return { isDuplicate: false };
};

// Before createBooking
const duplicateCheck = await checkDuplicatePhase(studentId, scheduleId, weekNumber);
if (duplicateCheck.isDuplicate) {
    toast.error(
        `Student already booked ${duplicateCheck.existingClass} in ${duplicateCheck.phase}!`
    );
    return;
}
```

**When to Use**: Best for user experience, combine with backend.

---

### Level 4: Admin Dashboard Warning (Detection Only)
**Pro:**
- ✅ Easy to implement
- ✅ Helps admin identify existing issues
- ✅ No breaking changes
- ✅ Can run as report

**Con:**
- ⚠️ Doesn't prevent, only detects
- ⚠️ Manual fix needed

**Implementation**:
```javascript
// In AdminBookingDashboard, add warning badge
const detectDuplicatePhase = (schedules, weekNumber) => {
    const studentPhaseMap = {};
    const duplicates = [];

    schedules
        .filter(s => s.week_number === weekNumber)
        .forEach(schedule => {
            schedule.students.forEach(student => {
                const key = `${student.id}_${schedule.phase}`;
                if (studentPhaseMap[key]) {
                    duplicates.push({
                        student: student.name,
                        phase: schedule.phase,
                        classes: [studentPhaseMap[key], schedule.class_name]
                    });
                } else {
                    studentPhaseMap[key] = schedule.class_name;
                }
            });
        });

    return duplicates;
};

// Display warning
{duplicates.length > 0 && (
    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
        <p className="text-red-800 font-semibold">
            ⚠️ {duplicates.length} Duplicate Phase Booking(s) Found!
        </p>
        {duplicates.map((dup, i) => (
            <p key={i} className="text-sm text-red-600">
                • {dup.student}: {dup.classes.join(' & ')} (both {dup.phase})
            </p>
        ))}
    </div>
)}
```

**When to Use**: Quick audit, identify existing problems.

---

## 📊 Recommended Implementation Plan

### Phase 1: Quick Fix (1 day)
1. ✅ **Frontend validation** in BookingDashboard
2. ✅ **RPC update** in smart_copy_week
3. ✅ **Admin warning** to detect existing issues

**Pros**: Fast, immediate protection
**Cons**: Not bulletproof, can be bypassed

---

### Phase 2: Production Ready (2-3 days)
1. ✅ **Database constraint** (unique constraint)
2. ✅ **Error handling** for constraint violation
3. ✅ **Migration** to fix existing duplicates first
4. ✅ **Testing** all booking flows

**Pros**: Bulletproof, guaranteed
**Cons**: Takes longer, needs migration

---

## 🚨 Critical Considerations

### 1. Existing Duplicates
**Check first**:
```sql
-- Find existing duplicate phase bookings
SELECT 
    s.student_name,
    s.week_number,
    s.phase,
    COUNT(*) as booking_count,
    STRING_AGG(c.class_name, ' & ' ORDER BY c.class_name) as classes
FROM bookings b
JOIN schedules s ON s.id = b.schedule_id
JOIN classes c ON c.id = s.class_id
WHERE b.status = 'confirmed'
GROUP BY s.student_name, s.week_number, s.phase, b.user_id
HAVING COUNT(*) > 1
ORDER BY s.week_number, s.student_name;
```

**Action**: Fix these first before adding constraint!

---

### 2. Legitimate Multi-Booking
**Question**: Apakah ada scenario valid untuk 2 kelas di phase yang sama?

**Example Valid Cases**:
- Makeup class (siswa ganti kelas karena absent)
- Trial class (siswa coba 2 kelas, pilih nanti)
- Teacher training (teacher hadir di 2 kelas)

**If YES**: Don't use strict constraint, use warning instead.
**If NO**: Use database constraint (safest).

---

### 3. Phase Definition
**Clarify**:
- Phase1 = Morning/Afternoon sessions?
- Phase2 = Evening sessions?
- Do they overlap in time?

**Important**: If phases don't overlap, maybe duplicate is OK?

**Example**:
```
Phase1: 08:00-10:00 (Morning)
Phase1: 14:00-16:00 (Afternoon)
→ Same phase, but different time = OK or NOT OK?
```

---

### 4. Week Boundary
**Current check**: Same week, same phase
**Question**: What about cross-week?

**Example**:
```
Week 1 Phase1: Monday - Class A ✅
Week 2 Phase1: Monday - Class B ✅ (Different week, OK)
Week 2 Phase1: Tuesday - Class C ❌ (Same week, CONFLICT)
```

---

## 🧪 Testing Checklist

Before deploying, test:

### Positive Cases (Should Work):
- [ ] Book phase1, then book phase2 (different phase) ✅
- [ ] Book week 1, then book week 2 same phase (different week) ✅
- [ ] Book same class again after canceling ✅
- [ ] Admin force-add for makeup class ✅

### Negative Cases (Should Block):
- [ ] Book phase1 Class A, then book phase1 Class B (same week) ❌
- [ ] Book phase2 Class A, then book phase2 Class B (same week) ❌
- [ ] Copy week with existing duplicate ❌

### Edge Cases:
- [ ] Concurrent booking (race condition)
- [ ] Booking during phase transition
- [ ] Booking for future weeks
- [ ] Admin override scenario

---

## 💰 Cost-Benefit Analysis

### Option A: Full Implementation (Constraint + Frontend + RPC)
**Time**: 2-3 days
**Cost**: Medium (development + testing)
**Benefit**: High (bulletproof, longterm)
**Risk**: Low (well-tested)

### Option B: Frontend Only
**Time**: 4-6 hours
**Cost**: Low
**Benefit**: Medium (user-friendly, not bulletproof)
**Risk**: Medium (can be bypassed)

### Option C: RPC Only
**Time**: 2-3 hours
**Cost**: Low
**Benefit**: Medium (protects copy week)
**Risk**: Medium (manual booking unprotected)

---

## 🎯 My Recommendation

### Short Term (This Week):
1. **Frontend validation** - Immediate user feedback
2. **Admin warning** - Audit existing data
3. **RPC update** - Protect copy week

### Long Term (Next Sprint):
1. **Database constraint** - Bulletproof enforcement
2. **Fix existing duplicates** - Clean up data
3. **Error handling** - Better user messages

---

## 📝 Next Steps

**Before Implementation**:
1. ✅ **Clarify requirements** (see Critical Considerations)
2. ✅ **Check existing duplicates** (run query)
3. ✅ **Decide approach** (constraint vs validation)
4. ✅ **Plan migration** (if using constraint)

**Implementation Order**:
1. Frontend validation (quick win)
2. Admin warning (visibility)
3. RPC update (automation)
4. Database constraint (longterm)

---

## Status

🟡 **Proposal Ready - Awaiting Decision**

**Questions to Answer**:
1. Are there legitimate cases for duplicate phase booking?
2. Should we allow admin override?
3. What to do with existing duplicates?
4. Timeline: Quick fix or production-ready?
