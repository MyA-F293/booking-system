# 🔧 Fix Booking Error - ReferenceError

## 🔍 Error yang Terjadi

**Error Message:**
```
ReferenceError: ReferenceError is not defined
at index-DKyAbdeu.js:161
```

**Symptoms:**
- Error saat user coba booking class
- "Oops! Something went wrong" page
- Multiple errors di console

---

## 🎯 Root Cause

### Kemungkinan Penyebab:

#### 1. Build/Bundle Cache Issue ⭐ (Most Likely)
- Vite build cache outdated
- Browser cache outdated
- Service worker cache outdated

#### 2. Undefined Variable/Function
- Function atau variable yang tidak ter-import
- Typo di function name
- Missing dependency

#### 3. Code Error After Recent Changes
- Phase badge implementation
- Validation logic
- Import statement missing

---

## ✅ Solution 1: Clear Cache & Rebuild (Quick Fix)

### Step 1: Clear Vite Cache
```bash
cd booking-system
npm run clean
```

Or manually:
```bash
# Delete cache folders
rmdir /s /q node_modules\.vite
rmdir /s /q dist
```

### Step 2: Rebuild
```bash
npm run build
```

### Step 3: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click Reload button
3. Select "Empty Cache and Hard Reload"

Or:
- Chrome: Ctrl + Shift + Delete → Clear cache
- Firefox: Ctrl + Shift + Delete → Clear cache

### Step 4: Clear Service Worker
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers"
4. Click "Unregister" for all service workers
5. Reload page

---

## ✅ Solution 2: Check for Code Errors

### Check Recent Changes

Look for undefined variables in recent changes:

```bash
# Check for undefined references
grep -r "getUnphasedBooking" src/
grep -r "ReferenceError" src/
```

### Check Import Statements

Make sure all imports are correct:

```javascript
// BookingDashboard.jsx
import { 
    getSchedules, 
    getScheduleStudents, 
    getCurrentYear, 
    getUserBookings, 
    autoCopyBookingsToNextWeek, 
    createBooking, 
    hasUserBookedPhase, 
    getDateForDayInWeek, 
    formatDateShort 
} from '../utils/dbHelpers';
```

Verify all these functions exist in `dbHelpers.js`.

---

## ✅ Solution 3: Rollback Recent Changes (If Needed)

If error started after phase badge implementation:

### Check AdminAttendanceManager.jsx
```javascript
// Make sure phase badge code is correct
<span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
    schedule.phase === 'phase1' ? 'bg-blue-100 text-blue-700' :
    schedule.phase === 'phase2' ? 'bg-purple-100 text-purple-700' :
    'bg-green-100 text-green-700'
}`}>
    {schedule.phase === 'phase1' ? '📘 Phase 1' :
     schedule.phase === 'phase2' ? '📗 Phase 2' :
     '📙 Recap'}
</span>
```

### Check TeacherDashboard.jsx
Same phase badge code should be correct.

---

## 🚀 Quick Fix (Try This First)

### Option A: Clear Everything
```bash
cd booking-system

# Clear node_modules cache
rmdir /s /q node_modules\.vite

# Clear dist
rmdir /s /q dist

# Rebuild
npm run build

# If using dev server
npm run dev
```

### Option B: Force Clean Install
```bash
cd booking-system

# Delete everything
rmdir /s /q node_modules
rmdir /s /q dist
del package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

---

## 🔍 Debug Steps

### 1. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for full error stack trace
4. Screenshot and share

### 2. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for failed requests (red)
5. Check if JS files are loading correctly

### 3. Check Application Tab
1. Open DevTools (F12)
2. Go to Application tab
3. Check Service Workers
4. Check Cache Storage
5. Clear all if needed

---

## 📊 Verification

After fix:

- [ ] Clear all caches
- [ ] Rebuild application
- [ ] Clear browser cache
- [ ] Unregister service workers
- [ ] Test booking flow
- [ ] Check console for errors
- [ ] Verify booking works correctly

---

## 🎯 Prevention

### For Development:
1. Always clear cache after major changes
2. Use `npm run clean` before build
3. Test in incognito mode
4. Check console for errors

### For Production:
1. Implement cache busting (already done with versionCheck.js)
2. Service worker update mechanism (already done)
3. Monitor error logs
4. Quick rollback plan

---

## 📞 If Still Not Working

### Provide More Info:
1. Full error message from console
2. When does error occur? (on load? on click?)
3. Which user role? (student? admin? teacher?)
4. Which page? (booking? attendance? admin?)

### Emergency Rollback:
If error is critical, rollback to last working version:
```bash
git log --oneline -10
git checkout <last-working-commit>
npm install
npm run build
```

---

**Status:** Ready to Fix
**Priority:** High (blocks booking functionality)
**Estimated Time:** 5-10 minutes
**Risk:** Low (cache clearing is safe)

