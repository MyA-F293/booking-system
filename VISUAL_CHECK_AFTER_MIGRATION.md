# 👁️ VISUAL CHECK AFTER ISO→DATABASE WEEK MIGRATION

## 🎯 Tujuan
Checklist visual untuk memastikan TIDAK ADA komponen yang masih menampilkan ISO week (11-20).

---

## 📱 BROWSER TESTING CHECKLIST

### PERSIAPAN
1. [ ] Hard refresh browser: **Ctrl+Shift+R** atau **Ctrl+F5**
2. [ ] Clear browser cache jika perlu
3. [ ] Pastikan database `current_week = 1` (run `CHECK_CURRENT_WEEK_NOW.sql`)

---

## 🔐 ADMIN DASHBOARD

### Login Admin
- URL: `http://localhost:5173`
- Username: `EYSA2601`
- Password: (admin password)

---

### ✅ TAB 1: STATS (Statistics Dashboard)

**Header Check:**
```
Expected: "Batch 1 | Week 1"
NOT: "Batch 1 | Week 13" atau "Week 14"
```
- [ ] Header menampilkan "Week 1"

**Main Content:**
```
Expected: "Week 1, 2026"
NOT: "Week 13, 2026" atau "Week 14, 2026"
```
- [ ] Title menampilkan "Week 1, 2026"
- [ ] Stats cards (Total Students, Classes, Teachers, Attendance Rate)
- [ ] Tidak ada error di console browser (F12)

**Screenshot Location**: Top of page, main title

---

### ✅ TAB 2: STUDENTS

**Header Check:**
```
Expected: "Batch 1 | Week 1"
```
- [ ] Header menampilkan "Week 1"

**Main Content:**
- [ ] Student list (should be empty after reset)
- [ ] "No students found" message
- [ ] Add student button works
- [ ] Tidak ada week display di content (OK)

---

### ✅ TAB 3: TEACHERS

**Header Check:**
```
Expected: "Batch 1 | Week 1"
```
- [ ] Header menampilkan "Week 1"

**Main Content:**
- [ ] Teacher list tampil
- [ ] Teacher cards dengan ID dan nama
- [ ] Add/Edit teacher works
- [ ] Tidak ada week display di content (OK)

---

### ✅ TAB 4: BOOKING (Manage Booking)

**Header Check:**
```
Expected: "Batch 1 | Week 1"
```
- [ ] Header menampilkan "Week 1"

**Orange Card Header:**
```
Expected: "Manage Booking - Week1" atau "Week 1"
NOT: "Week 13" atau "Week 14"
```
- [ ] Subtitle menampilkan "Week1" atau "Week 1"

**Week Navigation Buttons:**
```
Expected: W1, W2, W3, W4, W5, W6, W7, W8
NOT: W11, W12, W13, W14, dst.
```
- [ ] Button W1 ada dan aktif (highlighted)
- [ ] Button W2-W8 ada
- [ ] TIDAK ADA button W9, W10, W11, dst.

**Stats Cards:**
- [ ] Total Classes = 0 (after reset)
- [ ] Total Students = 0 (after reset)
- [ ] Total Teachers = (jumlah teacher)
- [ ] Full Classes = 0 (after reset)

**Schedule Display:**
- [ ] "No Schedules Yet" message
- [ ] Message: "Schedules will be created automatically when students book"

---

### ✅ TAB 5: FILL (Weekly Attendance)

**Header Check:**
```
Expected: "Batch 1 | Week 1"
```
- [ ] Header menampilkan "Week 1"

**Orange Card Header:**
```
Expected: "Weekly Attendance"
```
- [ ] Title: "Weekly Attendance"
- [ ] Subtitle: "📅 Organized by day"

**Week Dropdown (CRITICAL CHECK):**
```
Expected: Week 1, Week 2, Week 3, ..., Week 8
NOT: Week 11, Week 12, Week 13, ..., Week 20
```
- [ ] Dropdown menampilkan **Week 1** sampai **Week 8** (total 8 options)
- [ ] Default selected: **Week 1**
- [ ] TIDAK ADA Week 9, 10, 11, dst.
- [ ] Klik dropdown → lihat semua options (1-8)

**Stats Cards:**
- [ ] 📚 Total Sessions = 0
- [ ] ⏳ Pending = 0
- [ ] ✅ Completed = 0

**Schedule Display:**
- [ ] "No Schedules Found" message
- [ ] Message: "There are no classes scheduled for Week 1, 2026"

**"Go to Current Week" Button:**
```
Expected: "Go to Current Week (1)"
NOT: "Go to Current Week (13)"
```
- [ ] Button text menampilkan "(1)"
- [ ] Klik button → dropdown kembali ke Week 1

---

### ✅ TAB 6: REPORT (Attendance Report)

**Header Check:**
```
Expected: "Batch 1 | Week 1"
```
- [ ] Header menampilkan "Week 1"

**Week Selector:**
```
Expected: Week 1-8
NOT: Week 11-20
```
- [ ] Week selector menampilkan Week 1-8
- [ ] Default selected: Week 1
- [ ] Export Excel button works

**Attendance Matrix:**
```
Expected: WEEK 1, WEEK 2, WEEK 3, ..., WEEK 8
NOT: WEEK 2, WEEK 3, ..., WEEK 9
```
- [ ] Table header menampilkan WEEK 1 sampai WEEK 8 (total 8 columns)
- [ ] TIDAK ADA WEEK 9 atau lebih
- [ ] TIDAK ADA WEEK 2 sebagai kolom pertama (harus WEEK 1)

---

## 👨‍🎓 STUDENT DASHBOARD

### Login Student
- URL: `http://localhost:5173`
- Username: (student ID)
- Password: (student password)

**Header Check:**
```
Expected: "Week 1"
NOT: "Week 13" atau "Week 14"
```
- [ ] Header menampilkan "Week 1"

**Booking Page:**
- [ ] Available schedules untuk Week 1
- [ ] "No schedules available" (after reset)
- [ ] Book button (jika ada schedule)

---

## 👨‍🏫 TEACHER DASHBOARD

### Login Teacher
- URL: `http://localhost:5173`
- Username: (teacher ID)
- Password: (teacher password)

**Header Check:**
```
Expected: "Week 1"
NOT: "Week 13" atau "Week 14"
```
- [ ] Header menampilkan "Week 1"

**My Schedules:**
- [ ] Schedule list untuk Week 1
- [ ] "No schedules" (after reset)
- [ ] Student list per schedule
- [ ] Attendance submission works

---

## 🔍 BROWSER CONSOLE CHECK

**Open Browser Console**: Press **F12** → Console tab

**Check for Errors:**
- [ ] TIDAK ADA error merah
- [ ] TIDAK ADA warning tentang week
- [ ] TIDAK ADA "getCurrentWeek is not defined"
- [ ] TIDAK ADA "useWeek is not defined"

**Expected Console Logs:**
```
✅ WeekContext: Current week from DB: 1
✅ AdminDashboard: Loading schedules for week 1
✅ No errors or warnings
```

---

## 🧪 INTERACTION TESTING

### Test 1: Week Dropdown Interaction (Fill Tab)
1. [ ] Buka tab "Fill"
2. [ ] Klik week dropdown
3. [ ] Verify: Hanya ada Week 1-8 (total 8 options)
4. [ ] Pilih Week 2
5. [ ] Content update untuk Week 2
6. [ ] Klik "Go to Current Week (1)"
7. [ ] Dropdown kembali ke Week 1

### Test 2: Week Navigation Buttons (Booking Tab)
1. [ ] Buka tab "Booking"
2. [ ] Verify: Button W1-W8 ada
3. [ ] Verify: TIDAK ADA button W9, W10, W11, dst.
4. [ ] Klik W2 → Content update untuk Week 2
5. [ ] Klik W1 → Content kembali ke Week 1

### Test 3: Tab Switching
1. [ ] Stats tab → Check "Week 1, 2026"
2. [ ] Booking tab → Check "Week1"
3. [ ] Fill tab → Check dropdown "Week 1"
4. [ ] Report tab → Check selector "Week 1"
5. [ ] Semua tab konsisten menampilkan Week 1

### Test 4: Refresh Persistence
1. [ ] Pilih Week 2 di Fill tab
2. [ ] Refresh browser (F5)
3. [ ] Week kembali ke Week 1 (current week dari database)

---

## 🚨 RED FLAGS (HARUS DIPERBAIKI)

Jika menemukan salah satu dari ini, ada masalah:

### ❌ Red Flag 1: ISO Week Masih Muncul
**Symptom**: Melihat "Week 11", "Week 12", "Week 13", "Week 14", dst.
**Location**: Stats tab, Fill tab dropdown, atau Booking tab
**Action**: Component belum di-fix, perlu update untuk pakai `useWeek()` hook

### ❌ Red Flag 2: Week Tidak Konsisten
**Symptom**: Header "Week 1" tapi dropdown "Week 13"
**Location**: Berbeda antar tab
**Action**: Ada component yang belum pakai `useWeek()` hook

### ❌ Red Flag 3: Week Dropdown > 8 Options
**Symptom**: Dropdown menampilkan Week 1-10 atau Week 11-20
**Location**: Fill tab atau Report tab
**Action**: Dropdown logic belum di-update untuk batch system (1-8)

### ❌ Red Flag 4: Database Week ≠ 1
**Symptom**: Database menampilkan `current_week = 2` atau lebih
**Location**: Supabase settings table
**Action**: Run `RESET_WEEK_TO_1.sql`

### ❌ Red Flag 5: Browser Console Error
**Symptom**: Error "getCurrentWeek is not defined" atau "useWeek is not defined"
**Location**: Browser console (F12)
**Action**: Import statement salah atau missing

---

## ✅ SUCCESS CRITERIA

Semua checklist di atas PASS jika:

1. ✅ Database `current_week = 1`
2. ✅ Semua header menampilkan "Week 1"
3. ✅ Stats tab: "Week 1, 2026"
4. ✅ Booking tab: "Week1", buttons W1-W8
5. ✅ Fill tab: Dropdown Week 1-8, default Week 1
6. ✅ Report tab: Selector Week 1-8
7. ✅ Student page: "Week 1"
8. ✅ Teacher page: "Week 1"
9. ✅ TIDAK ADA ISO week (11-20) di mana pun
10. ✅ TIDAK ADA error di browser console

---

## 📋 QUICK VISUAL CHECKLIST

Print atau screenshot checklist ini, centang satu per satu:

```
ADMIN DASHBOARD:
□ Header: "Batch 1 | Week 1" ✓
□ Stats tab: "Week 1, 2026" ✓
□ Booking tab: "Week1", W1-W8 buttons ✓
□ Fill tab: Dropdown Week 1-8 ✓
□ Fill tab: Default Week 1 ✓
□ Fill tab: Button "Go to Current Week (1)" ✓
□ Report tab: Selector Week 1-8 ✓

STUDENT DASHBOARD:
□ Header: "Week 1" ✓

TEACHER DASHBOARD:
□ Header: "Week 1" ✓

DATABASE:
□ current_week = 1 ✓
□ Students = 0 ✓
□ Schedules = 0 ✓
□ Bookings = 0 ✓
□ Attendance = 0 ✓
□ Teachers > 0 ✓

BROWSER CONSOLE:
□ No errors ✓
□ No warnings ✓
```

---

## 🎯 NEXT STEPS AFTER ALL CHECKS PASS

1. ✅ Semua visual checks PASS
2. 🧪 Test GitHub Actions manual run
3. ⏰ Monitor auto-increment Senin 00:01 WIB
4. 🚀 Deploy ke Netlify production
5. 📊 Monitor production untuk 1 minggu

---

## 📞 JIKA ADA MASALAH

Jika ada checklist yang TIDAK PASS:
1. Screenshot masalahnya
2. Catat di tab mana (Stats, Booking, Fill, dst.)
3. Catat week number yang muncul
4. Check browser console (F12) untuk error
5. Run `VERIFY_SYSTEM_AFTER_RESET.sql` untuk check database

File troubleshooting:
- `POST_RESET_BATCH_CHECKLIST.md` - Checklist lengkap
- `FIX_WEEK_DISPLAY_INCONSISTENCY.md` - Fix week display
- `PANDUAN_TEST_LENGKAP.md` - Panduan testing
