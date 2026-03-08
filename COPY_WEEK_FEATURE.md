# Copy Previous Week Feature

## Overview
Added a "Copy Previous Week" button in the Admin Booking Dashboard that allows admins to quickly copy all bookings from the previous week to the current week.

## Location
The button is located in the header section of the Manage Booking dashboard, between the "Create" button and the week toggle (W11/W12).

## How It Works

### 1. Button Click
- Admin clicks the green "Copy" button
- A confirmation modal appears showing:
  - Source week (previous week)
  - Target week (current week)
  - Warning about automatic skipping of duplicate bookings

### 2. Confirmation Modal
The modal displays:
- **From Week**: The source week number
- **To Week**: The target week number
- **Note**: Students who already have bookings will be skipped
- **Actions**: "Yes, Copy Now" or "Cancel"

### 3. Copy Process
When confirmed, the system:
1. Fetches all confirmed bookings from the previous week
2. For each booking:
   - Finds or creates the matching schedule in the target week
   - Checks if student already booked the same phase in target week
   - Checks if class is full (max 10 students)
   - Creates new booking if all checks pass
3. Shows result summary with:
   - Number of bookings copied
   - Number of bookings skipped (duplicates or full classes)
   - Number of errors (if any)

### 4. Smart Duplicate Prevention
The system automatically skips bookings if:
- Student already has a booking for the same phase in the target week
- The target class is full (10/10 students)

## Technical Details

### New State Variables
```javascript
const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
const [isCopying, setIsCopying] = useState(false);
```

### Main Function
`handleCopyPreviousWeek()` - Handles the entire copy process:
- Determines source and target weeks based on selected tab
- Fetches source bookings
- Creates/finds target schedules
- Validates and creates new bookings
- Shows success/error messages

### UI Components
1. **Copy Button**: Green button with arrow icon
2. **Confirmation Modal**: Shows week numbers and confirmation options
3. **Loading State**: Button shows spinner while copying

## User Experience

### Success Messages
- `✅ Successfully copied X booking(s) to Week Y`
- `⏭️ Skipped X (already booked or class full)`
- `❌ Failed X` (if any errors)

### Edge Cases Handled
- No bookings in source week: Shows warning
- All students already booked: Shows "skipped" count
- Class full: Automatically skips
- Duplicate phase bookings: Automatically skips

## Testing Checklist
- [ ] Button appears in header
- [ ] Modal opens on button click
- [ ] Modal shows correct week numbers
- [ ] Cancel button closes modal
- [ ] Copy process works correctly
- [ ] Duplicate bookings are skipped
- [ ] Full classes are handled
- [ ] Success message shows correct counts
- [ ] Schedules refresh after copy
- [ ] Loading state works (button disabled during copy)

## Files Modified
- `booking-system/src/components/AdminBookingDashboard.jsx`
  - Added state variables
  - Added Copy button in header
  - Added confirmation modal
  - Added `handleCopyPreviousWeek()` function
  - Updated `useModalScrollLock` to include new modal

## Related Features
- Auto Copy Bookings (automatic weekly copy)
- Create Schedule (manual schedule creation)
- Add Student (manual booking creation)

## Future Enhancements
- Option to select specific classes to copy
- Option to copy to any week (not just next week)
- Batch copy multiple weeks at once
- Preview of what will be copied before confirming
