# 🧪 Admin Room Conflict Warning - Testing Guide

## 📋 QUICK TEST SCENARIOS

### ✅ Test 1: Room Conflict Detection (SHOULD SHOW WARNING)

**Setup**:
1. Create schedule: Oxford Class, Sunday, Evening, Phase 1, Campus & Career, Starter, Week 2

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Oxford Class
   - Day: Sunday
   - Time: Evening
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Upper Starter (DIFFERENT from existing)
   - Week: 2
   - Year: 2026

**Expected Result**:
- ⚠️ Orange warning box appears
- Warning shows:
  - "Room Conflict Detected!"
  - Program: Campus & Career
  - Level: Starter
  - Students: X enrolled
- Create button disabled
- Button text: "⚠️ Room Conflict - Cannot Create"

**Pass Criteria**: ✅ Warning appears, button disabled

---

### ✅ Test 2: Different Room (SHOULD BE AVAILABLE)

**Setup**:
1. Same as Test 1 (Oxford Class occupied)

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Tsinghua Class (DIFFERENT room)
   - Day: Sunday
   - Time: Evening
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Upper Starter
   - Week: 2
   - Year: 2026

**Expected Result**:
- ✅ No warning appears
- Create button enabled
- Button text: "Create Schedule"
- Can create schedule successfully

**Pass Criteria**: ✅ No warning, button enabled, schedule created

---

### ✅ Test 3: Different Time (SHOULD BE AVAILABLE)

**Setup**:
1. Same as Test 1 (Oxford Class, Sunday Evening occupied)

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Oxford Class (SAME room)
   - Day: Sunday
   - Time: Afternoon (DIFFERENT time)
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Upper Starter
   - Week: 2
   - Year: 2026

**Expected Result**:
- ✅ No warning appears
- Create button enabled
- Button text: "Create Schedule"
- Can create schedule successfully

**Pass Criteria**: ✅ No warning, button enabled, schedule created

---

### ✅ Test 4: Different Day (SHOULD BE AVAILABLE)

**Setup**:
1. Same as Test 1 (Oxford Class, Sunday Evening occupied)

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Oxford Class (SAME room)
   - Day: Monday (DIFFERENT day)
   - Time: Evening
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Upper Starter
   - Week: 2
   - Year: 2026

**Expected Result**:
- ✅ No warning appears
- Create button enabled
- Button text: "Create Schedule"
- Can create schedule successfully

**Pass Criteria**: ✅ No warning, button enabled, schedule created

---

### ✅ Test 5: Same Program & Level (SHOULD BE AVAILABLE)

**Setup**:
1. Create schedule: Oxford Class, Sunday, Evening, Phase 1, Campus & Career, Starter, Week 2 (5 students)

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Oxford Class
   - Day: Sunday
   - Time: Evening
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Starter (SAME as existing)
   - Week: 2
   - Year: 2026

**Expected Result**:
- ✅ No room conflict warning (same program/level = not a conflict)
- ⚠️ But duplicate warning should appear (different check)
- Cannot create (duplicate schedule)

**Pass Criteria**: ✅ No room conflict warning, duplicate warning appears instead

---

### ✅ Test 6: Real-time Detection (SHOULD UPDATE DYNAMICALLY)

**Test**:
1. Open "Create New Schedule" modal
2. Select:
   - Class: Oxford Class
   - Day: Sunday
   - Time: Evening
   - Phase: Phase 1
   - Program: Campus & Career
   - Level: Upper Starter
   - Week: 2
   - Year: 2026
3. **Expected**: Warning appears (room conflict)
4. Change Time to: Afternoon
5. **Expected**: Warning disappears (no conflict)
6. Change Time back to: Evening
7. **Expected**: Warning appears again (room conflict)

**Pass Criteria**: ✅ Warning appears/disappears dynamically as fields change

---

### ✅ Test 7: Edit Mode (SHOULD NOT CHECK CONFLICT)

**Test**:
1. Click "Edit" on existing schedule
2. Change fields (class, day, time, etc.)
3. **Expected**: No room conflict check
4. **Expected**: Can update schedule normally

**Pass Criteria**: ✅ No room conflict warning in edit mode

---

### ✅ Test 8: Incomplete Form (SHOULD NOT CHECK)

**Test**:
1. Open "Create New Schedule" modal
2. Fill only some fields (e.g., Class and Day only)
3. Leave other fields empty
4. **Expected**: No warning (form incomplete)
5. Fill all required fields
6. **Expected**: Warning appears if conflict exists

**Pass Criteria**: ✅ No warning until all fields filled

---

## 🎨 VISUAL CHECKLIST

### Warning Box Should Have:
- [ ] Orange background (bg-orange-50)
- [ ] Orange border (border-orange-300)
- [ ] Animated pulse effect
- [ ] ⚠️ Warning emoji
- [ ] Bold title: "Room Conflict Detected!"
- [ ] White info box with:
  - [ ] Program name
  - [ ] Level name
  - [ ] Student count
  - [ ] Batch (if exists)
- [ ] 💡 Suggestion message
- [ ] Clear explanation

### Button Should:
- [ ] Be disabled when conflict
- [ ] Show "⚠️ Room Conflict - Cannot Create" text
- [ ] Have tooltip on hover
- [ ] Be enabled when no conflict
- [ ] Show "Create Schedule" text when enabled

---

## 🐛 COMMON ISSUES TO CHECK

### Issue 1: Warning Not Appearing
**Possible Causes**:
- checkRoomConflict not imported
- adminRoomConflict state not defined
- useEffect not triggering
- Database query failing

**Debug**:
- Check browser console for errors
- Check network tab for API calls
- Verify all form fields are filled

### Issue 2: Button Not Disabled
**Possible Causes**:
- disabled prop not set correctly
- adminRoomConflict is null when should have value

**Debug**:
- Check React DevTools for adminRoomConflict state
- Verify disabled={loading || adminRoomConflict}

### Issue 3: Warning Not Disappearing
**Possible Causes**:
- useEffect dependencies not correct
- State not resetting

**Debug**:
- Check useEffect dependency array
- Verify setAdminRoomConflict(null) is called

---

## 📊 TEST RESULTS TEMPLATE

```
Test Date: _______________
Tester: _______________

Test 1 - Room Conflict Detection:     [ ] PASS  [ ] FAIL
Test 2 - Different Room:               [ ] PASS  [ ] FAIL
Test 3 - Different Time:               [ ] PASS  [ ] FAIL
Test 4 - Different Day:                [ ] PASS  [ ] FAIL
Test 5 - Same Program & Level:         [ ] PASS  [ ] FAIL
Test 6 - Real-time Detection:          [ ] PASS  [ ] FAIL
Test 7 - Edit Mode:                    [ ] PASS  [ ] FAIL
Test 8 - Incomplete Form:              [ ] PASS  [ ] FAIL

Visual Checklist:                      [ ] PASS  [ ] FAIL
Button Behavior:                       [ ] PASS  [ ] FAIL

Overall Status:                        [ ] PASS  [ ] FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All 8 test scenarios pass
- [ ] Visual elements display correctly
- [ ] Button behavior works as expected
- [ ] No console errors
- [ ] No network errors
- [ ] Works on different browsers (Chrome, Firefox, Safari)
- [ ] Works on mobile devices
- [ ] Performance is acceptable (no lag)
- [ ] Documentation is complete
- [ ] Team is informed about new feature

---

## 📞 SUPPORT

If you encounter issues during testing:

1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify database has schedules to test with
4. Review implementation files:
   - `AdminBookingDashboard.jsx`
   - `dbHelpers.js` (checkRoomConflict function)
5. Check related documentation:
   - `ADMIN_ROOM_CONFLICT_WARNING_COMPLETE.md`
   - `UX_ROOM_CONFLICT_WARNING_IMPLEMENTED.md`

---

**Happy Testing!** 🧪✨
