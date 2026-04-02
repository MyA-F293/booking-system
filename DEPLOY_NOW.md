# 🚀 Deploy Now - Quick Guide

## ✅ Git Push: DONE

**Commits:**
- `68468db` - Fix: Attendance phase validation & booking ReferenceError
- `e68a8a7` - Add deployment summary for April 1, 2026

**Status:** ✅ Pushed to GitHub

---

## 🔨 Step 1: Rebuild Application

```bash
cd booking-system

# Clear cache
rmdir /s /q node_modules\.vite
rmdir /s /q dist

# Rebuild
npm run build
```

**Expected Output:**
```
✓ built in 5-10 seconds
✓ dist folder created
```

---

## 🌐 Step 2: Deploy to Netlify

### Option A: Automatic (Recommended)
Netlify akan auto-deploy dari GitHub:

1. Check Netlify dashboard
2. Wait 2-3 minutes for build
3. Status: "Published" ✅
4. Open: https://portal.eysalanguagecenter.com

### Option B: Manual Deploy
```bash
# After build
netlify deploy --prod
```

Or:
1. Login to Netlify dashboard
2. Drag & drop `dist` folder
3. Wait for deployment
4. Check site

---

## 🧪 Step 3: Test After Deploy

### Test 1: Booking Flow (Critical)
1. Open https://portal.eysalanguagecenter.com
2. Login as student
3. Go to "Booking" tab
4. Select a class
5. Click "Book Class"
6. **Expected:** Success modal appears ✅
7. **Not Expected:** Error page ❌

### Test 2: Attendance Phase Badge
1. Login as admin
2. Go to "Attendance" tab
3. Check schedule cards
4. **Expected:** Phase badge visible (📘 Phase 1 / 📗 Phase 2) ✅

### Test 3: Phase Validation
1. Login as admin
2. Go to "Attendance" tab
3. Try to submit Monday attendance
4. **Expected:** Works normally (Monday = Phase 1) ✅
5. If schedule has wrong phase, should show error ✅

---

## 🔍 Verification Checklist

After deployment:

- [ ] Site loads without errors
- [ ] Booking flow works (no error page)
- [ ] Success modal appears after booking
- [ ] Phase badge visible in attendance
- [ ] No ReferenceError in console
- [ ] Harvard Class disabled for non-Teens
- [ ] Version updated (check version.json)

---

## 🐛 If Issues Occur

### Issue: Still Shows Error Page
**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard reload (Ctrl + F5)
3. Check if new version deployed
4. Check console for errors

### Issue: Phase Badge Not Showing
**Solution:**
1. Check if build included latest code
2. Clear cache and reload
3. Check browser console for errors

### Issue: Booking Still Broken
**Solution:**
1. Check console for ReferenceError
2. Verify `isHarvardRestricted` is defined
3. Check if correct version deployed
4. Contact support with console logs

---

## 📊 Deployment Timeline

**Code Changes:** ✅ Done (April 1, 2026)
**Git Commit:** ✅ Done (68468db, e68a8a7)
**Git Push:** ✅ Done (origin/main)
**Rebuild:** ⏳ Pending (run `npm run build`)
**Deploy:** ⏳ Pending (Netlify auto-deploy or manual)
**Testing:** ⏳ Pending (after deploy)

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ No console errors
- ✅ Booking shows success modal
- ✅ Phase badges visible
- ✅ Validation works correctly
- ✅ Harvard restriction works
- ✅ Users can book classes normally

---

## 📞 Quick Commands

```bash
# Rebuild
cd booking-system && rmdir /s /q node_modules\.vite dist && npm run build

# Deploy (if manual)
netlify deploy --prod

# Check status
git status
git log --oneline -5
```

---

**Status:** ✅ READY TO DEPLOY
**Priority:** High (fixes critical booking error)
**Estimated Time:** 5-10 minutes
**Risk:** Low (tested locally)

