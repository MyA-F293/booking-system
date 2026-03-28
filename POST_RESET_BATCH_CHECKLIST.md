# 📋 POST RESET BATCH & ISO→DATABASE WEEK MIGRATION CHECKLIST

## 🎯 Tujuan
Memastikan SEMUA komponen admin menampilkan database week (1-8) bukan ISO week (11-20) setelah reset batch.

---

## ✅ YANG SUDAH DI-FIX & COMMIT

### Commit 1: Fix 6 komponen utama
- ✅ `AdminStatsDashboard.jsx` - Statistics dashboard
- ✅ `BookingSystemDB.jsx` - Main booking system
- ✅ `AdminBookingDashboard.jsx` - Admin booking view
- ✅ `AttendanceReportExcel.jsx` - Excel report generator
- ✅ `BookingDashboard.jsx` - Student booking view
- ✅ `TeacherDashboard.jsx` - Teacher dashboard

### Commit 2: Fix AdminAttendanceManager
- ✅ `AdminAttendanceManager.jsx` - Weekly attendance manager
  - Week dropdown: Week 1-8 (bukan ISO week)
  - Default week: Sync dengan database
  - Button "Go to Current Week": Pakai database week

---

## 🔍 CHECKLIST TESTING - ADMIN DASHBOARD

### 1. DATABASE CHECK (Supabase SQL Editor)
**File**: `database/CHECK_CURRENT_WEEK_NOW.sql`

```sql
SELECT 
  id,
  current_week,
  updated_at,
  updated_at AT TIME ZONE 'Asia/Jakarta' as updated_at_wib
FROM settings 
WHERE id = 1;
```

**Expected Result:**
- [ ] `current_week = 1` (setelah reset batch)
- [ ] `updated_at` = waktu reset batch terakhir

**Jika current_week ≠ 1:**
- Run `database/RESET_WEEK_TO_1.sql` untuk reset manual

---

### 2. ADMIN HEADER (Semua Tab)
**Location**: Top header bar

**Check:**
- [ ] Menampilkan: "Batch 1 | Week 1" (bukan "Week 13" atau "Week 14")
- [ ] Format: "Batch [number] | Week [number]"
- [ ] Week number = database week (1-8)

**Component**: `AdminDashboard.jsx` menggunakan `useWeek()` hook

---

### 3. TAB: STATS (Statistics Dashboard)
**Location**: Admin → Stats tab

**Check:**
- [ ] Header menampilkan: "Week 1, 2026" (bukan "Week 13, 2026")
- [ ] Total Students count benar
- [ ] Total Classes count benar
- [ ] Total Teachers count benar
- [ ] Attendance Rate calculation benar

**Component**: `AdminStatsDashboard.jsx` menggunakan `useWeek()` hook

---

### 4. TAB: STUDENTS
**Location**: Admin → Students tab

**Check:**
- [ ] Student list tampil dengan benar
- [ ] Filter by program works
- [ ] Filter by batch works
- [ ] Search by name works
- [ ] Student details modal works

**Component**: Tidak ada week display di sini (OK)

---

### 5. TAB: TEACHERS
**Location**: Admin → Teachers tab

**Check:**
- [ ] Teacher list tampil dengan benar
- [ ] Teacher ID format benar
- [ ] Add/Edit teacher works
- [ ] Delete teacher works

**Component**: Tidak ada week display di sini (OK)

---

### 6. TAB: BOOKING (Manage Booking)
**Location**: Admin → Booking tab

**Check Header:**
- [ ] "Manage Booking" header
- [ ] Subtitle: "Week1" atau "Week 1" (database week)

**Check Buttons:**
- [ ] ✨ Create - Buat schedule baru
- [ ] 📋 Copy - Copy week
- [ ] W1, W2 buttons - Quick week navigation (1-8)
- [ ] 🗑️ Active, 🗄️ Archive - Filter buttons
- [ ] 🔄 Refresh

**Check Stats Cards:**
- [ ] Total Classes = 0 (setelah reset)
- [ ] Total Students = 0 (setelah reset)
- [ ] Total Teachers = jumlah teacher yang ada
- [ ] Full Classes = 0 (setelah reset)

**Check Schedule Display:**
- [ ] "No Schedules Yet" message (setelah reset)
- [ ] Message: "Schedules will be created automatically when students book"

**Component**: `AdminBookingDashboard.jsx` menggunakan `useWeek()` hook

---

### 7. TAB: FILL (Weekly Attendance)
**Location**: Admin → Fill tab

**Check Header:**
- [ ] "Weekly Attendance" title
- [ ] Subtitle: "📅 Organized by day"

**Check Week Dropdown:**
- [ ] Dropdown menampilkan: Week 1, Week 2, ..., Week 8 (bukan Week 11-20)
- [ ] Default selected: Week 1 (current week dari database)
- [ ] Bisa pilih week lain (1-8)

**Check Stats Cards:**
- [ ] 📚 Total Sessions = 0 (setelah reset)
- [ ] ⏳ Pending = 0 (setelah reset)
- [ ] ✅ Completed = 0 (setelah reset)

**Check Schedule Display:**
- [ ] "No Schedules Found" message
- [ ] Message: "There are no classes scheduled for Week 1, 2026"

**Check "Go to Current Week" Button:**
- [ ] Button text: "Go to Current Week (1)" (bukan Week 13)
- [ ] Klik button → dropdown kembali ke Week 1

**Component**: `AdminAttendanceManager.jsx` - BARU DI-FIX ✅

---

### 8. TAB: REPORT (Attendance Report)
**Location**: Admin → Report tab

**Check Week Selector:**
- [ ] Week selector menampilkan database week (1-8)
- [ ] Default selected: Week 1 (current week)

**Check Attendance Matrix:**
- [ ] Table header: WEEK 1, WEEK 2, WEEK 3, ..., WEEK 8 (total 8 columns)
- [ ] TIDAK ADA WEEK 9 atau lebih
- [ ] TIDAK ADA WEEK 2 sebagai kolom pertama (harus WEEK 1)
- [ ] Kolom: NO, NAME, LEVEL, WEEK 1-8, TOTAL

**Check Export:**
- [ ] Export Excel button works
- [ ] Excel file contains Week 1-8 data
- [ ] Report data sesuai dengan week yang dipilih

**Component**: `AttendanceReportExcel.jsx` - BARU DI-FIX ✅

---

## 🔍 CHECKLIST TESTING - STUDENT DASHBOARD

### 9. STUDENT BOOKING PAGE
**Location**: Student login → Booking page

**Check:**
- [ ] Header menampilkan: "Week 1" (database week)
- [ ] Available schedules untuk Week 1
- [ ] Book button works
- [ ] Cancel booking works

**Component**: `BookingDashboard.jsx` menggunakan `useWeek()` hook

---

## 🔍 CHECKLIST TESTING - TEACHER DASHBOARD

### 10. TEACHER DASHBOARD
**Location**: Teacher login → Dashboard

**Check:**
- [ ] Header menampilkan: "Week 1" (database week)
- [ ] My schedules untuk Week 1
- [ ] Student list per schedule
- [ ] Attendance submission works

**Component**: `TeacherDashboard.jsx` menggunakan `useWeek()` hook

---

## 🔍 ADVANCED CHECKS

### 11. WEEK NAVIGATION CONSISTENCY
**Test Flow:**
1. [ ] Admin dashboard → Pilih Week 2 di dropdown
2. [ ] Pindah ke tab lain (Stats, Booking, Fill)
3. [ ] Kembali ke tab sebelumnya
4. [ ] Week selection tetap Week 2 (tidak reset)

### 12. RESET BATCH FUNCTIONALITY
**Test Flow:**
1. [ ] Admin → Actions → Reset Batch
2. [ ] Pilih Batch 1 → Confirm
3. [ ] Check database: `current_week = 1`
4. [ ] Check semua tab: Menampilkan Week 1
5. [ ] Check stats: Total students = 0, Total classes = 0

### 13. WEEK INCREMENT (Manual)
**Test Flow:**
1. [ ] Run SQL: `UPDATE settings SET current_week = 2 WHERE id = 1;`
2. [ ] Refresh browser (Ctrl+Shift+R)
3. [ ] Check semua tab: Menampilkan Week 2
4. [ ] Week dropdown: Default selected = Week 2

### 14. WEEK INCREMENT (GitHub Actions)
**Test Flow:**
1. [ ] GitHub → Actions → "Auto Increment Week"
2. [ ] Run workflow manually
3. [ ] Check workflow log: ✅ Success (bukan ❌ Failed)
4. [ ] Check log: "Week changed from 1 to 2" (bukan 1→3)
5. [ ] Refresh browser: Semua tab menampilkan Week 2

---

## 🚨 POTENTIAL ISSUES TO CHECK

### Issue 1: Browser Cache
**Symptom**: Week masih menampilkan ISO week (13, 14) setelah refresh
**Solution**: Hard refresh (Ctrl+Shift+R atau Ctrl+F5)

### Issue 2: Database Week ≠ 1 Setelah Reset
**Symptom**: Reset batch tapi week masih 2 atau lebih
**Solution**: Run `database/RESET_WEEK_TO_1.sql`

### Issue 3: Week Dropdown Masih ISO Week
**Symptom**: Dropdown menampilkan Week 11-20
**Solution**: Sudah di-fix di commit terakhir, refresh browser

### Issue 4: Component Tidak Sync dengan Database Week
**Symptom**: Header Week 1, tapi dropdown Week 13
**Solution**: Sudah di-fix dengan `useWeek()` hook di semua komponen

---

## 📊 SQL QUERIES UNTUK TESTING

### Quick Check Current Week
```sql
-- File: database/CHECK_CURRENT_WEEK_NOW.sql
SELECT current_week FROM settings WHERE id = 1;
```

### Reset Week to 1
```sql
-- File: database/RESET_WEEK_TO_1.sql
UPDATE settings SET current_week = 1 WHERE id = 1;
```

### Increment Week Manually
```sql
-- File: database/TEST_MANUAL_INCREMENT.sql
UPDATE settings SET current_week = current_week + 1 WHERE id = 1;
SELECT current_week FROM settings WHERE id = 1;
```

### Check All Data After Reset
```sql
-- Verify reset batch worked
SELECT COUNT(*) as total_students FROM users WHERE role = 'student' AND batch = '1';
SELECT COUNT(*) as total_schedules FROM schedules WHERE batch = 1;
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as total_attendance FROM attendance;
SELECT current_week FROM settings WHERE id = 1;

-- Expected after reset batch:
-- total_students = 0
-- total_schedules = 0
-- total_bookings = 0
-- total_attendance = 0
-- current_week = 1
```

---

## ✅ FINAL VERIFICATION

Setelah semua checklist di atas PASS:

1. [ ] **Database**: `current_week = 1`
2. [ ] **Admin Header**: "Batch 1 | Week 1" (semua tab)
3. [ ] **Stats Tab**: "Week 1, 2026"
4. [ ] **Booking Tab**: "Week1" atau "Week 1"
5. [ ] **Fill Tab**: Dropdown "Week 1-8", default Week 1
6. [ ] **Report Tab**: Week selector 1-8
7. [ ] **Student Page**: "Week 1"
8. [ ] **Teacher Page**: "Week 1"
9. [ ] **Hard Refresh**: Ctrl+Shift+R (clear cache)
10. [ ] **GitHub Actions**: Manual run success (1→2, bukan 1→3)

---

## 🎯 NEXT STEPS SETELAH CHECKLIST PASS

1. ✅ Commit semua perubahan (DONE)
2. ✅ Push ke GitHub (DONE)
3. 🔄 Test manual GitHub Actions run
4. ⏰ Monitor auto-increment Senin 00:01 WIB
5. 🚀 Deploy ke production (Netlify)

---

## 📝 NOTES

- Batch system: 2 bulan = 8 minggu
- Week 1-8 relatif terhadap batch start date
- Reset batch → Week kembali ke 1
- Auto-increment: Setiap Senin 00:01 WIB
- Manual increment: Via GitHub Actions atau SQL UPDATE

---

## 🆘 TROUBLESHOOTING

Jika ada masalah, cek file-file ini:
- `FIX_WEEK_DISPLAY_INCONSISTENCY.md` - Fix week display
- `FIX_SETTINGS_EMPTY_ERROR.md` - Fix settings table
- `TEST_GITHUB_ACTIONS_MANUAL.md` - Test GitHub Actions
- `PANDUAN_TEST_LENGKAP.md` - Panduan testing lengkap
