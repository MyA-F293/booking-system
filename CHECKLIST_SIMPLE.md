# ✅ CHECKLIST SIMPLE - Week Migration

## 🚀 3 LANGKAH CEPAT

### 1️⃣ Check Database (1 menit)
Run di Supabase: `database/QUICK_CHECK_ALL_WEEKS.sql`

**Expected:**
- ✅ Current Week = 1
- ✅ Total Schedules = 0
- ✅ Total Bookings = 0
- ✅ Total Attendance = 0

**Jika current_week ≠ 1:**
→ Run `database/RESET_WEEK_TO_1.sql`

---

### 2️⃣ Check Browser (3 menit)
1. Hard refresh: **Ctrl+Shift+R**
2. Login admin: EYSA2601
3. Check setiap tab:

| Tab | Check | Expected |
|-----|-------|----------|
| Stats | Main title | "Week 1, 2026" |
| Booking | Buttons | W1, W2, W3, W4, W5, W6, W7, W8 (8 buttons) |
| Fill | Dropdown | Week 1-8 (8 options) |
| Report | Matrix | WEEK 1-8 (8 columns) |

**Red Flag:**
- ❌ Jika lihat Week 11, 12, 13, 14 → Ada masalah
- ❌ Jika dropdown > 8 options → Ada masalah
- ❌ Jika matrix mulai dari WEEK 2 → Ada masalah

---

### 3️⃣ Test GitHub Actions (2 menit)
1. Buka: https://github.com/MyA-F293/booking-system/actions
2. Klik "Auto Increment Week" → "Run workflow"
3. Tunggu selesai (hijau ✅)
4. Check log: "Week changed from 1 to 2"
5. Refresh browser → Semua tab Week 2

---

## ✅ PASS CRITERIA

Jika SEMUA ini benar:
- ✅ Database: current_week = 1
- ✅ Stats: "Week 1, 2026"
- ✅ Booking: W1-W8 (8 buttons)
- ✅ Fill: Week 1-8 (8 options)
- ✅ Report: WEEK 1-8 (8 columns)
- ✅ GitHub Actions: Success (1→2)

→ **MIGRATION COMPLETE** 🎉

---

## 📁 Files Reference

**Checklist:**
- `CHECKLIST_SIMPLE.md` - This file (quick check)
- `MASTER_CHECKLIST_WEEK_MIGRATION.md` - Detailed checklist
- `FINAL_WEEK_MIGRATION_CHECKLIST.md` - Complete summary

**SQL:**
- `database/QUICK_CHECK_ALL_WEEKS.sql` - Quick database check
- `database/VERIFY_SYSTEM_AFTER_RESET.sql` - Comprehensive check
- `database/RESET_WEEK_TO_1.sql` - Reset week to 1

**Troubleshooting:**
- `FIX_WEEK_DISPLAY_INCONSISTENCY.md` - Fix guide
- `TEST_GITHUB_ACTIONS_MANUAL.md` - GitHub Actions guide
