# Harvard Class Restriction - Teens Only

## 🎯 Feature: Harvard Class Exclusive for English for Teens

Harvard Class sekarang dibatasi hanya untuk siswa program "English for Teens". Siswa program "Campus & Career" tidak bisa booking Harvard Class.

## ✨ Implementation

### 1. Validation Logic

**BookingDashboard.jsx:**
```javascript
// Validation 1: Harvard Class is only for English for Teens
if (schedule.class?.name === 'Harvard Class' && user?.program !== 'English for Teens') {
    toast.error('Harvard Class is exclusively for English for Teens program students!');
    return;
}
```

**BookingSystemDB.jsx:**
```javascript
// Validation: Harvard Class is only for English for Teens
if (classItem.name === 'Harvard Class' && currentUser?.program !== 'English for Teens') {
    toast.error('Harvard Class is exclusively for English for Teens program students!');
    return;
}
```

### 2. Visual Indicators

**Badge on Schedule Card:**
- Red badge "🎓 Teens Only" appears next to Harvard Class name
- Visible in both BookingDashboard and BookingSystemDB
- Clear visual indication of restriction

**Button Disabled State:**
- Book button disabled for non-Teens students
- Tooltip shows: "Harvard Class is only for English for Teens students"
- Opacity reduced to show disabled state

### 3. User Experience Flow

**For English for Teens Students:**
1. See Harvard Class with "🎓 Teens Only" badge
2. Can click and book Harvard Class normally
3. No restrictions

**For Campus & Career Students:**
1. See Harvard Class with "🎓 Teens Only" badge
2. Book button is disabled (grayed out)
3. Hover shows tooltip explaining restriction
4. If somehow clicked, error toast appears
5. Cannot proceed with booking

## 📝 Changes Made

### File: `booking-system/src/components/BookingDashboard.jsx`

**1. Added validation in `handleBookClass` function:**
- Check if class is Harvard and user program is not Teens
- Show error toast if restriction violated
- Return early to prevent booking

**2. Added visual badge:**
- "🎓 Teens Only" badge next to Harvard Class name
- Red background with border
- Responsive sizing

**3. Disabled Book button:**
- Added condition to disable prop
- Added tooltip with explanation
- Visual feedback with opacity

### File: `booking-system/src/BookingSystemDB.jsx`

**1. Added validation in `handleClassSelect` function:**
- Check if class is Harvard and user program is not Teens
- Show error toast if restriction violated
- Return early to prevent booking

**2. Added visual badge:**
- "🎓 Teens Only" badge inline with class name
- Red background with border
- Responsive sizing

**3. Disabled class selection button:**
- Added `isHarvardRestricted` check
- Combined with existing disabled logic
- Added tooltip with explanation

## 🎨 Visual Design

### Badge Style:
```css
bg-red-50 text-red-600 px-2 py-0.5 rounded-full 
text-[9px] font-semibold border border-red-200
```

### Features:
- 🎓 Graduation cap emoji
- "Teens Only" text
- Red color scheme (matches Harvard Class theme)
- Small, non-intrusive size
- Responsive (smaller on mobile)

## 🔒 Security

### Multi-Layer Protection:

1. **Frontend Validation** (BookingDashboard)
   - Immediate feedback
   - Button disabled
   - Visual indicators

2. **Frontend Validation** (BookingSystemDB)
   - Before API call
   - Error toast
   - Prevents unnecessary requests

3. **Backend Validation** (Recommended)
   - Add database trigger or constraint
   - Final layer of protection
   - Prevents direct API manipulation

## 🧪 Testing Checklist

- [x] Teens student can see and book Harvard Class
- [x] Campus & Career student sees "Teens Only" badge
- [x] Campus & Career student cannot click Book button
- [x] Tooltip shows on hover for disabled button
- [x] Error toast appears if validation bypassed
- [x] Badge visible on both interfaces
- [x] Responsive on mobile and desktop
- [x] No syntax errors
- [x] Build successful

## 📊 User Programs

### English for Teens:
- ✅ Can book Harvard Class
- ✅ Can book all other classes
- Full access

### Campus & Career:
- ❌ Cannot book Harvard Class
- ✅ Can book all other classes
- Restricted access to Harvard only

## 🎯 Business Logic

**Why Harvard Class for Teens Only?**
- Harvard Class designed specifically for teenage students
- Age-appropriate content and teaching methods
- Peer group consistency
- Better learning outcomes

## 📖 Related Files

- `booking-system/src/components/BookingDashboard.jsx` - Student booking interface
- `booking-system/src/BookingSystemDB.jsx` - Main booking system
- `booking-system/src/utils/dbHelpers.js` - Database helpers

## 🚀 Future Enhancements

### Recommended:
1. Add database-level constraint
2. Add admin override capability
3. Add configuration for class restrictions
4. Add audit log for restriction violations

### Database Trigger Example:
```sql
CREATE OR REPLACE FUNCTION check_harvard_class_restriction()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT class_name FROM classes WHERE id = NEW.schedule_id) = 'Harvard Class' THEN
        IF (SELECT program FROM users WHERE id = NEW.user_id) != 'English for Teens' THEN
            RAISE EXCEPTION 'Harvard Class is only for English for Teens students';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER harvard_class_restriction_trigger
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_harvard_class_restriction();
```

## 🎉 Result

Harvard Class sekarang eksklusif untuk English for Teens students dengan:
- ✅ Clear visual indicators
- ✅ Disabled buttons for non-eligible students
- ✅ Error messages if restriction violated
- ✅ Consistent across all booking interfaces
- ✅ Responsive design
- ✅ User-friendly experience

Restriction implemented successfully! 🎊
