# 📚 Panduan Lengkap: Menambah Kelas Baru ke Sistem

## 🎯 Overview

Panduan ini menjelaskan langkah-langkah lengkap untuk menambah kelas baru ke sistem booking EYSA Language Center, dari database sampai UI.

**Contoh Kasus:** Menambah **Stanford Class** dengan kapasitas 6 siswa

---

## 📋 Table of Contents

1. [Persiapan](#1-persiapan)
2. [Database Setup](#2-database-setup)
3. [Frontend - UI Badge & Display](#3-frontend-ui-badge--display)
4. [Logic - Capacity & Validation](#4-logic-capacity--validation)
5. [Testing](#5-testing)
6. [Deployment](#6-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Persiapan

### ✅ Informasi yang Dibutuhkan:

- **Nama Kelas:** Stanford Class
- **Kapasitas Min:** 4 siswa
- **Kapasitas Max:** 6 siswa
- **Badge/Icon:** 🌲 (Tree emoji)
- **Warna Badge:** Hijau (green)
- **Status:** Active

### 📁 Files yang Akan Diubah:

```
├── database/
│   └── add_stanford_class.sql          # SQL untuk tambah kelas
│
├── src/
│   ├── BookingSystemDB.jsx             # Booking siswa
│   ├── components/
│   │   ├── AdminBookingDashboard.jsx   # Admin dashboard
│   │   ├── AdminAttendanceManager.jsx  # Admin attendance
│   │   └── BookingDashboard.jsx        # Siswa dashboard
│   └── utils/
│       └── dbHelpers.js                # Database helpers
```

---

## 2. Database Setup

### Step 2.1: Buat SQL File

**File:** `database/add_stanford_class.sql`

```sql
-- ============================================
-- ADD STANFORD CLASS TO DATABASE
-- Run this in Supabase SQL Editor
-- ============================================

-- Insert Stanford Class with capacity of 6 students
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('Stanford Class', 4, 6, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Verify the insert
SELECT * FROM classes WHERE name = 'Stanford Class';

-- Show all classes for reference
SELECT 
    id,
    name,
    min_students,
    max_students,
    is_active,
    created_at
FROM classes
ORDER BY name;
```

### Step 2.2: Jalankan di Supabase

1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Klik **SQL Editor**
4. Copy-paste query di atas
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Verify hasilnya muncul di tabel hasil

**Expected Output:**
```
id | name           | min_students | max_students | is_active
---|----------------|--------------|--------------|----------
6  | Stanford Class | 4            | 6            | true
```

---

## 3. Frontend - UI Badge & Display

### Step 3.1: Tambah Badge Definition

**File:** `src/components/AdminBookingDashboard.jsx`

**Location:** Line ~70-80 (setelah class badge definitions)

```javascript
// Class badges - unique icons/emojis for each class
const classBadges = {
    'Fahd Class': { emoji: '🏛️', color: 'bg-amber-100 text-amber-700' },
    'Harvard Class': { emoji: '🎓', color: 'bg-red-100 text-red-700' },
    'Oxford Class': { emoji: '📚', color: 'bg-blue-100 text-blue-700' },
    'Tokyo Class': { emoji: '🗼', color: 'bg-pink-100 text-pink-700' },
    'Tsinghua Class': { emoji: '🏯', color: 'bg-purple-100 text-purple-700' },
    'Stanford Class': { emoji: '🌲', color: 'bg-green-100 text-green-700' }, // ⭐ NEW
};
```

### Step 3.2: Ulangi untuk Semua Components

Copy badge definition yang sama ke:

1. **`src/components/BookingDashboard.jsx`** (Student view)
2. **`src/components/AdminAttendanceManager.jsx`** (Attendance view)
3. **`src/BookingSystemDB.jsx`** (Booking system)

**Cara cepat:** Search `classBadges` di setiap file dan tambahkan line Stanford Class

---

## 4. Logic - Capacity & Validation

### Step 4.1: Update Capacity Checks

**Problem:** Hardcoded capacity check `>= 10` tidak cocok untuk Stanford (max 6)

**Solution:** Gunakan dynamic capacity dari database

**File:** `src/components/AdminBookingDashboard.jsx`

**BEFORE:**
```javascript
if (selectedSchedule.current_students >= 10) {
    toast.error('Class is full!');
    return;
}
```

**AFTER:**
```javascript
// Use dynamic max from class
const maxCapacity = selectedSchedule.class?.max_students || 10;
if (selectedSchedule.current_students >= maxCapacity) {
    toast.error('Class is full!');
    return;
}
```

### Step 4.2: Update Display

**File:** `src/components/AdminBookingDashboard.jsx`

**BEFORE:**
```javascript
<p className="text-sm text-gray-600">
    {schedule.current_students}/10 students
</p>
```

**AFTER:**
```javascript
<p className="text-sm text-gray-600">
    {schedule.current_students}/{schedule.class?.max_students || 10} students
</p>
```

### Step 4.3: Ulangi untuk Semua Views

Update capacity display di:
- Admin Dashboard
- Student Dashboard  
- Attendance Manager
- Booking Modal

---

## 5. Testing

### ✅ Test Checklist

#### 5.1 Database Test

```sql
-- Verify class exists
SELECT * FROM classes WHERE name = 'Stanford Class';

-- Should return:
-- id: 6, name: Stanford Class, max_students: 6
```

#### 5.2 UI Test - Admin Dashboard

- [ ] Stanford Class 🌲 muncul di dropdown "Create Schedule"
- [ ] Badge berwarna hijau
- [ ] Emoji 🌲 tampil dengan benar

#### 5.3 Capacity Test

- [ ] Saat 0/6 siswa: Bisa add student
- [ ] Saat 5/6 siswa: Bisa add student
- [ ] Saat 6/6 siswa: **TIDAK bisa** add student (full)
- [ ] Error message: "Class is full! Maximum 6 students per class."

#### 5.4 Student Booking Test

- [ ] Stanford Class muncul di list available classes
- [ ] Kapasitas display: "X/6 students"
- [ ] Bisa book saat ada slot kosong
- [ ] Tidak bisa book saat penuh (6/6)

#### 5.5 Attendance Test

- [ ] Stanford Class muncul di attendance manager
- [ ] Badge dan emoji tampil benar
- [ ] Bisa record attendance untuk Stanford students

---

## 6. Deployment

### Step 6.1: Local Testing

```bash
# 1. Test build
npm run build

# 2. Check for errors
# Should see: ✓ built in XXs

# 3. Test local
npm run dev
```

### Step 6.2: Git Commit & Push

```bash
# 1. Add all changes
git add -A

# 2. Commit with clear message
git commit -m "Add Stanford Class with 6 student capacity"

# 3. Push to GitHub
git push origin main
```

### Step 6.3: Run SQL in Production

**IMPORTANT:** Jangan lupa jalankan SQL di production database!

1. Login ke **Supabase Production**
2. Buka **SQL Editor**
3. Jalankan `database/add_stanford_class.sql`
4. Verify hasil

### Step 6.4: Verify Deployment

1. Tunggu GitHub Actions selesai (±2-3 menit)
2. Check status: https://github.com/YOUR-REPO/actions
3. Pastikan status: ✅ **Success**
4. Buka production URL
5. Test semua fitur

---

## 7. Troubleshooting

### ❌ Problem 1: Stanford Class tidak muncul di UI

**Diagnose:**
```sql
-- Check if class exists in database
SELECT * FROM classes WHERE name = 'Stanford Class';
```

**Solution:**
- Jika NULL: Run `database/add_stanford_class.sql`
- Jika ada: Clear cache browser (Ctrl+Shift+R)

---

### ❌ Problem 2: Capacity masih 10 bukan 6

**Diagnose:**
```javascript
// Check in code
console.log(schedule.class?.max_students); // Should be 6
```

**Solution:**
- Pastikan pakai `schedule.class?.max_students`
- Bukan hardcode `>= 10`
- Refresh data dari database

---

### ❌ Problem 3: Badge tidak tampil / warna salah

**Diagnose:**
```javascript
// Check badge definition
console.log(classBadges['Stanford Class']);
// Should show: { emoji: '🌲', color: 'bg-green-100 text-green-700' }
```

**Solution:**
- Pastikan `classBadges` sudah di-update di semua files
- Check typo di nama class (case-sensitive!)
- Clear cache browser

---

### ❌ Problem 4: Room conflict saat create schedule

**Diagnose:**
```sql
-- Check existing schedules at that time
SELECT 
    c.name,
    s.day,
    s.time_slot,
    s.phase,
    s.current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.day = 'friday'
  AND s.week_number = 2
  AND s.year = 2026;
```

**Solution:**
- Pilih slot yang kosong (beda time/phase)
- Atau hapus jadwal kosong dengan tombol "Clean"
- Gunakan `CEK_SLOT_KOSONG_FRIDAY.sql` untuk cek slot available

---

## 📊 Summary Flow

```
1. CREATE SQL
   └─> database/add_stanford_class.sql

2. RUN SQL in Supabase
   └─> Stanford Class added to DB

3. UPDATE UI CODE
   ├─> AdminBookingDashboard.jsx (badge)
   ├─> BookingDashboard.jsx (badge)
   ├─> AdminAttendanceManager.jsx (badge)
   └─> BookingSystemDB.jsx (badge)

4. UPDATE LOGIC
   ├─> Replace hardcoded 10 with dynamic max_students
   └─> Update capacity display X/6 not X/10

5. TEST LOCALLY
   ├─> npm run build
   ├─> npm run dev
   └─> Manual testing

6. DEPLOY
   ├─> git add & commit & push
   ├─> Run SQL in production Supabase
   └─> Wait for GitHub Actions

7. VERIFY
   └─> Test in production URL
```

---

## 🎓 Best Practices

### ✅ DO:
- Selalu test di local dulu sebelum deploy
- Jalankan SQL di production setelah code deploy
- Gunakan dynamic capacity dari database
- Tambahkan badge ke SEMUA components
- Test semua scenarios (0 student, half full, full)

### ❌ DON'T:
- Hardcode capacity (bad: `>= 10`)
- Lupa update badge di semua files
- Deploy tanpa test build
- Lupa run SQL di production
- Skip testing

---

## 📁 Template untuk Kelas Baru

### SQL Template:
```sql
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('[NEW CLASS NAME]', [MIN], [MAX], TRUE)
ON CONFLICT (name) DO NOTHING;
```

### Badge Template:
```javascript
'[NEW CLASS NAME]': { 
    emoji: '[EMOJI]', 
    color: 'bg-[COLOR]-100 text-[COLOR]-700' 
}
```

### Colors Available:
- `amber` (orange/yellow)
- `red` (red)
- `blue` (blue)
- `pink` (pink)
- `purple` (purple)
- `green` (green)
- `indigo` (dark blue)
- `teal` (cyan)

---

## 🔗 Related Documentation

- `ADD_STANFORD_CLASS_GUIDE.md` - Stanford-specific guide
- `database/add_stanford_class.sql` - SQL untuk Stanford
- `FITUR_CLEAN_JADWAL_KOSONG.md` - Clean empty schedules
- `CEK_SLOT_KOSONG_FRIDAY.sql` - Check available slots

---

## ✅ Completion Checklist

### Phase 1: Database
- [ ] Buat SQL file
- [ ] Test di local Supabase (optional)
- [ ] Run di production Supabase

### Phase 2: Code
- [ ] Update badge definitions (4 files)
- [ ] Update capacity logic (dynamic)
- [ ] Update capacity display
- [ ] Test build (`npm run build`)

### Phase 3: Deployment
- [ ] Git commit & push
- [ ] Wait for GitHub Actions
- [ ] Verify deployment success

### Phase 4: Testing
- [ ] Class muncul di UI
- [ ] Badge tampil benar
- [ ] Capacity 6 bukan 10
- [ ] Bisa create schedule
- [ ] Bisa book class
- [ ] Capacity check works

### Phase 5: Documentation
- [ ] Update README (optional)
- [ ] Create guide file
- [ ] Share with team

---

**Selesai! Kelas baru sudah siap dipakai! 🎉**

**Questions?** Check troubleshooting section atau hubungi dev team.

---

**Last Updated:** June 5, 2026  
**Author:** AI Assistant  
**Version:** 1.0
