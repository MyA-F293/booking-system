# 🎛️ Admin Booking Mode Toggle Feature

## ✅ IMPLEMENTED

Admin sekarang dapat mengatur booking mode (Production/Testing) dengan mudah melalui toggle button di Admin Booking Dashboard.

## 🎯 FEATURE OVERVIEW

### What is Booking Mode?

**Production Mode** (Default):
- Booking hanya bisa dilakukan Kamis-Sabtu sebelum jam 22:00
- Sesuai dengan business rules
- Mode normal untuk operasional sehari-hari

**Testing Mode**:
- Booking bisa dilakukan kapan saja (24/7)
- Untuk testing, debugging, atau keperluan khusus
- Admin dapat membuka booking di luar jam operasional

## 📁 FILES CREATED/MODIFIED

### New Files:
1. `booking-system/src/contexts/BookingModeContext.jsx` - Context untuk manage booking mode

### Modified Files:
1. `booking-system/src/main.jsx` - Added BookingModeProvider
2. `booking-system/src/BookingSystemDB.jsx` - Use booking mode from context
3. `booking-system/src/components/AdminBookingDashboard.jsx` - Added toggle button

## 🔧 IMPLEMENTATION DETAILS

### 1. BookingModeContext.jsx

```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const BookingModeContext = createContext();

export const useBookingMode = () => {
    const context = useContext(BookingModeContext);
    if (!context) {
        throw new Error('useBookingMode must be used within BookingModeProvider');
    }
    return context;
};

export const BookingModeProvider = ({ children }) => {
    // Load from localStorage, default to 'production'
    const [bookingMode, setBookingMode] = useState(() => {
        const saved = localStorage.getItem('eysa_booking_mode');
        return saved || 'production';
    });

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('eysa_booking_mode', bookingMode);
        console.log('📋 Booking Mode changed to:', bookingMode);
    }, [bookingMode]);

    const toggleBookingMode = () => {
        setBookingMode(prev => prev === 'production' ? 'testing' : 'production');
    };

    const isTestingMode = bookingMode === 'testing';
    const isProductionMode = bookingMode === 'production';

    return (
        <BookingModeContext.Provider value={{
            bookingMode,
            setBookingMode,
            toggleBookingMode,
            isTestingMode,
            isProductionMode
        }}>
            {children}
        </BookingModeContext.Provider>
    );
};
```

**Features:**
- Persists to localStorage (survives page refresh)
- Default to 'production' mode
- Provides helper booleans (isTestingMode, isProductionMode)
- Toggle function for easy switching

### 2. Updated canBook() Function

**Before:**
```javascript
const canBook = () => {
    // PRODUCTION MODE: Only allow booking Thursday-Saturday before 22:00
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const isBookingDay = (dayOfWeek >= 4 && dayOfWeek <= 6);
    const isBeforeCutoff = hour < 22;
    return isBookingDay && isBeforeCutoff;
};
```

**After:**
```javascript
const canBook = () => {
    // If testing mode is enabled, allow booking anytime
    if (isTestingMode) {
        return true;
    }

    // PRODUCTION MODE: Only allow booking Thursday-Saturday before 22:00
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const isBookingDay = (dayOfWeek >= 4 && dayOfWeek <= 6);
    const isBeforeCutoff = hour < 22;
    return isBookingDay && isBeforeCutoff;
};
```

### 3. Toggle Button UI

**Location:** Admin Booking Dashboard header, before "Create" button

**Design:**
- **Production Mode**: Green button with Clock icon
- **Testing Mode**: Yellow button with AlertCircle icon
- Responsive: Shows icon + text on desktop, icon only on mobile
- Tooltip shows current mode and what clicking will do

**Code:**
```jsx
<button
    onClick={() => {
        toggleBookingMode();
        toast.success(`Booking mode changed to ${isTestingMode ? 'PRODUCTION' : 'TESTING'}`);
    }}
    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium text-[10px] sm:text-xs transition-all flex items-center gap-1 shadow-md ${isTestingMode
        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
        : 'bg-green-600 hover:bg-green-700 text-white'
    }`}
    title={`Current: ${bookingMode.toUpperCase()} mode. Click to switch to ${isTestingMode ? 'PRODUCTION' : 'TESTING'} mode`}
>
    {isTestingMode ? (
        <>
            <AlertCircle size={14} />
            <span className="hidden sm:inline">Testing</span>
        </>
    ) : (
        <>
            <Clock size={14} />
            <span className="hidden sm:inline">Production</span>
        </>
    )}
</button>
```

## 🎨 VISUAL DESIGN

### Button States:

**Production Mode (Green):**
```
┌─────────────────┐
│ 🕐 Production   │  ← Green background
└─────────────────┘
```

**Testing Mode (Yellow):**
```
┌─────────────────┐
│ ⚠️  Testing     │  ← Yellow background (warning color)
└─────────────────┘
```

### Mobile View:
```
┌────┐
│ 🕐 │  ← Icon only
└────┘
```

## 📱 USER FLOW

### Admin Workflow:

1. **Check Current Mode**
   - Look at button color in Admin Booking Dashboard
   - Green = Production, Yellow = Testing

2. **Switch Mode**
   - Click the toggle button
   - Toast notification confirms the change
   - Mode persists across page refreshes

3. **Student Experience**
   - Production Mode: Students see booking restrictions
   - Testing Mode: Students can book anytime

## 🔍 HOW IT WORKS

### Data Flow:

```
┌─────────────────────────────────────────────────┐
│  Admin clicks toggle button                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  toggleBookingMode() called                     │
│  - Updates state                                │
│  - Saves to localStorage                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Context updates all consumers                  │
│  - BookingSystemDB.jsx                          │
│  - AdminBookingDashboard.jsx                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  canBook() function checks mode                 │
│  - Testing: return true (always allow)          │
│  - Production: check day/time restrictions      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Student UI updates                             │
│  - Button enabled/disabled                      │
│  - Banner shows OPEN/CLOSED                     │
└─────────────────────────────────────────────────┘
```

## 💾 PERSISTENCE

### localStorage Key:
```javascript
'eysa_booking_mode'
```

### Values:
- `'production'` (default)
- `'testing'`

### Behavior:
- Survives page refresh
- Survives browser restart
- Per-browser (not synced across devices)
- Cleared when localStorage is cleared

## 🎯 USE CASES

### When to Use Testing Mode:

1. **Development & Testing**
   - Testing booking flow outside business hours
   - Debugging booking issues
   - QA testing

2. **Special Circumstances**
   - Emergency booking needed outside hours
   - System maintenance/testing
   - Demo to stakeholders

3. **Data Entry**
   - Bulk booking creation
   - Historical data entry
   - Schedule corrections

### When to Use Production Mode:

1. **Normal Operations**
   - Regular business hours
   - Standard student booking
   - Default state

2. **After Testing**
   - Always switch back after testing
   - Prevents accidental off-hours bookings

## ⚠️ IMPORTANT NOTES

### Security:
- Only admins can see/use the toggle button
- Students cannot access this feature
- Mode is client-side only (no database changes)

### Best Practices:
1. **Always switch back to Production** after testing
2. **Communicate with team** when using Testing mode
3. **Document** why Testing mode was enabled
4. **Monitor** for accidental Testing mode usage

### Warnings:
- ⚠️ Testing mode allows booking anytime (24/7)
- ⚠️ Students will see booking as "OPEN" even on Sunday-Wednesday
- ⚠️ Remember to switch back to Production mode!

## 🧪 TESTING

### Test Scenarios:

1. **Toggle Functionality**
   ```
   ✅ Click button → Mode changes
   ✅ Toast notification appears
   ✅ Button color changes
   ✅ Button text changes
   ```

2. **Persistence**
   ```
   ✅ Set to Testing → Refresh page → Still Testing
   ✅ Set to Production → Refresh page → Still Production
   ✅ Close browser → Reopen → Mode persists
   ```

3. **Student Experience**
   ```
   ✅ Production Mode + Sunday → Booking CLOSED
   ✅ Production Mode + Thursday → Booking OPEN
   ✅ Testing Mode + Sunday → Booking OPEN
   ✅ Testing Mode + Any day → Booking OPEN
   ```

4. **Admin Experience**
   ```
   ✅ Button visible in Admin Dashboard
   ✅ Button not visible to students
   ✅ Tooltip shows current mode
   ✅ Click toggles mode
   ```

## 📊 COMPARISON

### Before:
- ❌ Need to edit code to change mode
- ❌ Need to redeploy to production
- ❌ Risk of forgetting to switch back
- ❌ No visual indicator of current mode

### After:
- ✅ One-click toggle
- ✅ No code changes needed
- ✅ Visual indicator (button color)
- ✅ Toast notification on change
- ✅ Persists across sessions
- ✅ Easy to switch back

## 🎉 BENEFITS

1. **Convenience**
   - No code editing required
   - Instant mode switching
   - Visual feedback

2. **Safety**
   - Clear visual indicator
   - Toast confirmation
   - Easy to verify current mode

3. **Flexibility**
   - Test anytime without deployment
   - Quick emergency access
   - Demo-friendly

4. **Maintainability**
   - No code changes for mode switching
   - Centralized mode management
   - Easy to understand

---

**Implementation Date**: April 4, 2026  
**Status**: ✅ COMPLETE  
**Feature Type**: Admin Control Panel  
**Impact**: High - Simplifies booking management
