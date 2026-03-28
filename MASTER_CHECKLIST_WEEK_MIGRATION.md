# ✅ MASTER CHECKLIST: Week Migration (ISO → Database)

## 🚀 QUICK START

### Step 1: Database Check (2 menit)
Run di Supabase SQL Editor: `database/VERIFY_SYSTEM_AFTER_RESET.sql`

**Expected Results:**
- ✅ Current Week = 1
- ✅ Students = 0
- ✅ Schedules = 0
- ✅ Bookings = 0
- ✅ Attendance = 0
- ✅ Teachers > 0
- ✅ All functions exist

**Jika current_week ≠ 1:**
→ Run `database/RESET_WEEK_TO_1.sql`

---

### Step 2: Browser Visual Check (5 menit)

**Persiapan:**
1. Hard refresh: **Ctrl+Shift+R**
2. Open browser console: **F12**
3. Check for errors (should be none)

**Admin Dashboard Check:**

| Tab | Location | Expected | Status |
|-----|----------|----------|--------|
| **Header** | Top bar (all tabs) | "Batch 1 \| Week 1" | □ |
| **Stats** | Main title | "Week 1, 2026" | □ |
| **Booking** | Orange card | "Week1" + W1-W8 buttons | □ |
| **Fill** | Week dropdown | Week 1-8 options, default Week 1 | □ |
| **Fill** | Button | "Go to Current Week (1)" | □ |
| **Report** | Week selector | Week 1-8 options | □ |
| **Report** | Attendance Matrix | WEEK 1-8 columns (not WEEK 2-9) | □ |

**Student Dashboard Check:**
| Location | Expected | Status |
|----------|----------|--------|
| Header | "Week 1" | □ |
| Week Buttons | W1 (current), W2 (next) | □ |

**Teacher Dashboard Check:**
| Location | Expected | Status |
|----------|----------|--------|
| Header | "Week 1" | □ |

---

### Step 3: Interaction Test (3 menit)

**Test Fill Tab Dropdown:**
1. [ ] Buka tab "Fill"
2. [ ] Klik week dropdown
3. [ ] Verify: Week 1, 2, 3, 4, 5, 6, 7, 8 (total 8 options)
4. [ ] Pilih Week 2 → Content update
5. [ ] Klik "Go to Current Week (1)" → Kembali ke Week 1

**Test Booking Tab Navigation:**
1. [ ] Buka tab "Booking"
2. [ ] Verify: Button W1, W2, W3, W4, W5, W6, W7, W8
3. [ ] Klik W2 → Content update untuk Week 2
4. [ ] Klik W1 → Kembali ke Week 1

---

### Step 4: GitHub Actions Test (2 menit)

**Manual Run:**
1. [ ] Buka: https://github.com/MyA-F293/booking-system/actions
2. [ ] Klik workflow "Auto Increment Week"
3. [ ] Klik "Run workflow" → "Run workflow"
4. [ ] Tunggu selesai (should be ✅ green, not ❌ red)
5. [ ] Check log: "Week changed from 1 to 2"
6. [ ] Refresh browser → All tabs show Week 2

**Jika workflow FAILED (❌ red):**
→ Check workflow log untuk error message
→ Verify GitHub Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_API_KEY

---

## 🚨 CRITICAL CHECKS (MUST PASS)

### ❌ FAIL if you see:
- Week 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 (ISO week)
- Week dropdown dengan > 8 options
- Header "Week 1" tapi dropdown "Week 13"
- Error di browser console
- GitHub Actions workflow failed

### ✅ PASS if you see:
- Week 1-8 di semua tempat
- Week dropdown dengan 8 options (1-8)
- Semua tab konsisten menampilkan Week 1
- No errors di browser console
- GitHub Actions workflow success

---

## 📊 SUMMARY TABLE

| Component | File | Week Display | Status |
|-----------|------|--------------|--------|
| Admin Header | `AdminDashboard.jsx` | "Batch 1 \| Week 1" | ✅ Fixed |
| Stats Tab | `AdminStatsDashboard.jsx` | "Week 1, 2026" | ✅ Fixed |
| Booking Tab | `AdminBookingDashboard.jsx` | "Week1" + W1-W8 | ✅ Fixed |
| Fill Tab | `AdminAttendanceManager.jsx` | Dropdown 1-8 | ✅ Fixed |
| Report Tab | `AttendanceReportExcel.jsx` | Selector 1-8 + Matrix 1-8 | ✅ Fixed |
| Student Page | `BookingDashboard.jsx` | "Week 1" | ✅ Fixed |
| Teacher Page | `TeacherDashboard.jsx` | "Week 1" | ✅ Fixed |
| Main System | `BookingSystemDB.jsx` | Week 1 | ✅ Fixed |

**Total Components Fixed**: 8 files
**Commits**: 3 commits pushed to GitHub

---

## 🎯 FINAL VERIFICATION

Setelah SEMUA checklist PASS:

1. [ ] **Database**: `current_week = 1` ✓
2. [ ] **Visual**: Semua tab menampilkan Week 1 ✓
3. [ ] **Dropdown**: Week 1-8 (bukan 11-20) ✓
4. [ ] **Console**: No errors ✓
5. [ ] **GitHub Actions**: Manual run success ✓

**Jika SEMUA PASS** → ✅ **MIGRATION COMPLETE**

**Jika ADA FAIL** → 🔧 **PERLU FIX**

---

## 📁 FILES REFERENCE

**Checklist Files:**
- `POST_RESET_BATCH_CHECKLIST.md` - Detailed checklist
- `VISUAL_CHECK_AFTER_MIGRATION.md` - Visual testing guide
- `MASTER_CHECKLIST_WEEK_MIGRATION.md` - This file (quick reference)

**SQL Files:**
- `database/VERIFY_SYSTEM_AFTER_RESET.sql` - Comprehensive database check
- `database/CHECK_CURRENT_WEEK_NOW.sql` - Quick week check
- `database/RESET_WEEK_TO_1.sql` - Reset week to 1

**Fix Documentation:**
- `FIX_WEEK_DISPLAY_INCONSISTENCY.md` - Week display fix
- `TEST_GITHUB_ACTIONS_MANUAL.md` - GitHub Actions testing
- `PANDUAN_TEST_LENGKAP.md` - Complete testing guide

---

## ⏱️ ESTIMATED TIME

- Database check: **2 minutes**
- Visual check: **5 minutes**
- Interaction test: **3 minutes**
- GitHub Actions test: **2 minutes**

**Total**: ~12 minutes untuk complete verification

---

## 🎉 SUCCESS MESSAGE

Jika semua checklist PASS, sistem sudah siap:
- ✅ Week system: Database-based (1-8)
- ✅ Reset batch: Works correctly
- ✅ Auto-increment: Ready (Senin 00:01 WIB)
- ✅ All components: Consistent week display
- ✅ No ISO week (11-20) anywhere

**Next**: Monitor auto-increment pada Senin 31 Maret 2026 jam 00:01 WIB
