# 🔧 Cara Fix Booking Error dan Level Validation

## 📋 Masalah yang Ditemukan

### Masalah 1: Booking Error "Duplicate schedule detected!"
- User mencoba booking Monday Evening classes
- Muncul error: "Failed to book: Duplicate schedule detected!"
- Semua kelas menunjukkan "0/10 WAITING"
- Tidak bisa booking sama sekali

### Masalah 2: Level Validation
- Siswa level "Starter" bisa pilih kelas "Upper Starter"
- Siswa level "Upper Starter" bisa pilih kelas "Starter"
- Ini menyebabkan siswa masuk kelas yang salah

## 🔍 Root Cause

### Masalah 1: Duplicate Schedules
Ada jadwal duplikat di database untuk Monday Evening Week 2:
- Jadwal-jadwal ini kosong (0 siswa)
- UI tidak menampilkan karena filter `hideEmpty`
- Tapi database masih punya jadwal tersebut
- Trigger `prevent_duplicate_schedule` mendeteksi duplikat dan block booking

### Masalah 2: Level Selection
Di `BookingSystemDB.jsx`, level dipilih oleh user dari dropdown, bukan auto-set dari profile:
```javascript
const [selectedLevel, setSelectedLevel] = useState('');  // ❌ Empty, user can choose
```

Seharusnya:
```javascript
const [selectedLevel, setSelectedLevel] = useState(user?.level || '');  // ✅ Auto-set from profile
```

## ✅ Solusi

### STEP 1: Fix Booking Error (Database)

#### 1.1 Check Duplicate Schedules
Buka Supabase SQL Editor dan jalankan:
```sql
-- File: booking-system/database/CHECK_MONDAY_EVENING_DUPLICATES.sql
```

Copy-paste query dari file tersebut untuk melihat jadwal duplikat.

Expected result:
- Akan muncul list jadwal Monday Evening Week 2
- Semua atau sebagian besar punya 0 students
- Ada beberapa kelas yang duplikat (same class/day/time/phase/week)

#### 1.2 Delete Duplicate Schedules
Jalankan query ini di Supabase:
```sql
-- File: booking-system/database/DELETE_MONDAY_EVENING_DUPLICATES.sql
-- OPTION 1 (RECOMMENDED)

DELETE FROM schedules
WHERE id IN (
    SELECT s.id 
    FROM schedules s
    WHERE s.day = 'monday'
      AND s.time_slot = 'evening'
      AND s.week_number = 2
      AND s.current_students = 0
);
```

Expected result:
```
DELETE X  -- X = jumlah jadwal yang dihapus
```

#### 1.3 Verify Deletion
Jalankan query verification:
```sql
-- Check remaining schedules
SELECT 
    c.name as class_name,
    s.time_slot,
    s.phase,
    s.week_number,
    s.current_students,
    COUNT(b.id) as actual_bookings
FROM schedules s
JOIN classes c ON s.class_id = c.id
LEFT JOIN bookings b ON s.id = b.schedule_id
WHERE s.day = 'monday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2
GROUP BY c.name, s.time_slot, s.phase, s.week_number, s.current_students
ORDER BY c.name;
```

Expected result:
- Hanya jadwal dengan siswa yang tersisa (jika ada)
- Atau 0 rows (semua terhapus) ✅

#### 1.4 Hard Refresh Browser
1. Tekan **Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac)
2. Tunggu 2-3 detik
3. Browser akan reload dengan data fresh

#### 1.5 Test Booking
1. Login sebagai student
2. Klik "Book a Class" atau pilih level
3. Pilih Monday, Evening
4. Pilih kelas (Fahd, Harvard, Oxford, Tokyo, Tsinghua)
5. Klik "Book This Class"
6. Seharusnya berhasil tanpa error! ✅

---

### STEP 2: Fix Level Validation (Code)

#### 2.1 Update BookingSystemDB.jsx

**File:** `booking-system/src/BookingSystemDB.jsx`

**Change 1: Auto-set level from profile (line 100)**
```javascript
// BEFORE:
const [selectedLevel, setSelectedLevel] = useState('');

// AFTER:
const [selectedLevel, setSelectedLevel] = useState(user?.level || '');
```

**Change 2: Replace level selection UI with level display (around line 945)**

Cari section ini:
```javascript
{/* Level Selection - Clean */}
{selectedProgram && (
    <div className="mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-[#F39C32]">2.</span> {t('booking.selectLevel')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {levels.map((level) => {
                // ... level buttons
            })}
        </div>
    </div>
)}
```

Replace dengan:
```javascript
{/* Level Display - Show assigned level (not selectable) */}
{selectedProgram && currentUser?.level && (
    <div className="mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-[#F39C32]">2.</span> Your Level
        </h2>
        <div className="bg-gradient-to-r from-[#F39C32] to-[#e88a1f] text-white p-4 rounded-xl border-2 border-[#F39C32] shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-orange-100 text-xs mb-1">Assigned Level</p>
                    <p className="text-lg font-bold">
                        {currentUser.level}
                    </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
)}

{/* Warning if no level assigned */}
{selectedProgram && !currentUser?.level && (
    <div className="mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-[#F39C32]">2.</span> Your Level
        </h2>
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl">
            <p className="font-semibold">⚠️ No level assigned</p>
            <p className="text-sm mt-1">Please contact admin to assign your level.</p>
        </div>
    </div>
)}
```

**Change 3: Add "Book Class" button (before user bookings section)**

Tambahkan sebelum section "User Bookings":
```javascript
{/* Quick Book Button - Opens modal directly */}
{selectedProgram && currentUser?.level && (
    <div className="mb-6">
        <button
            onClick={() => {
                if (!canBook()) {
                    toast.warning(t('booking.bookingDayRestriction'));
                    return;
                }
                setShowBookingModal(true);
                setSelectedPhase('');
                setSelectedDay('');
                setSelectedTime('');
            }}
            disabled={!canBook()}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                canBook()
                    ? 'bg-gradient-to-r from-[#F39C32] to-[#e88a1f] text-white hover:shadow-xl active:scale-[0.98]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
            {canBook() ? '📚 Book a Class' : '🔒 Booking Closed'}
        </button>
    </div>
)}
```

**Change 4: Add level validation in handleClassSelect (around line 420)**

Cari function `handleClassSelect`, tambahkan validation setelah program validation:
```javascript
// Validation 2: Ensure selected program matches user's assigned program
if (selectedProgram !== currentUser.program) {
    // ... existing code
}

// Validation 3: Ensure selected level matches user's assigned level
if (selectedLevel !== currentUser.level) {
    console.error('❌ Level mismatch!', {
        selectedLevel,
        userLevel: currentUser.level
    });
    toast.error(`You can only book classes for your assigned level: ${currentUser.level}`);
    // Reset to user's level
    setSelectedLevel(currentUser.level);
    return;
}
```

**Change 5: Remove handleLevelSelect function (around line 365)**

Cari function ini:
```javascript
const handleLevelSelect = (level) => {
    if (level.comingSoon) return;
    console.log('📊 Level selected:', level.name);
    if (!canBook()) {
        toast.warning(t('booking.bookingDayRestriction'));
        return;
    }
    setSelectedLevel(level.name);
    setShowBookingModal(true);
    setSelectedPhase('');
    setSelectedDay('');
    setSelectedTime('');
};
```

Hapus atau comment out function tersebut (tidak dipakai lagi).

#### 2.2 Build and Deploy

```bash
cd booking-system
npm run build
```

Upload `dist` folder ke Netlify atau hosting.

---

## 📊 Hasil Setelah Fix

### Masalah 1: Booking Error ✅
- ✅ Duplicate schedules terhapus dari database
- ✅ Booking Monday Evening berhasil tanpa error
- ✅ Sistem akan create schedule baru saat siswa booking
- ✅ Tidak ada duplikat lagi (trigger aktif)

### Masalah 2: Level Validation ✅
- ✅ Level auto-set dari student profile
- ✅ Siswa tidak bisa pilih level lain
- ✅ Level ditampilkan seperti program (locked)
- ✅ Validation mencegah booking kelas level salah
- ✅ UI lebih simple (1 step lebih sedikit)

## 🎯 User Experience Baru

### Old Flow:
1. Login
2. Lihat program (locked) ✅
3. **Pilih level** (bisa salah) ❌
4. Pilih phase/day/time
5. Book class

### New Flow:
1. Login
2. Lihat program (locked) ✅
3. Lihat level (locked) ✅
4. **Klik "Book a Class"** button
5. Pilih phase/day/time
6. Book class

**Lebih simple dan aman!**

## 🧪 Testing

### Test 1: Booking Monday Evening
1. Login sebagai student
2. Klik "Book a Class"
3. Pilih Monday, Evening
4. Pilih kelas (contoh: Oxford Class)
5. Klik "Book This Class"
6. Expected: ✅ Booking berhasil, muncul success modal

### Test 2: Level Starter Student
1. Login sebagai student dengan level "Starter"
2. Expected: Muncul "Your Level: Starter" (locked, tidak bisa diubah)
3. Klik "Book a Class"
4. Pilih phase/day/time
5. Expected: Hanya muncul kelas level "Starter"
6. Book class berhasil

### Test 3: Level Upper Starter Student
1. Login sebagai student dengan level "Upper Starter"
2. Expected: Muncul "Your Level: Upper Starter" (locked)
3. Klik "Book a Class"
4. Pilih phase/day/time
5. Expected: Hanya muncul kelas level "Upper Starter"
6. Book class berhasil

## 📝 Summary

**Masalah 1:** Booking error karena duplicate schedules
**Solusi 1:** Delete duplicate schedules dari database

**Masalah 2:** Siswa bisa pilih level salah
**Solusi 2:** Auto-set level dari profile, remove level selection UI

**Status:** 
- Database fix: Ready to run (SQL queries provided)
- Code fix: Ready to implement (code changes provided)

**Next Steps:**
1. Run SQL queries di Supabase (STEP 1)
2. Update BookingSystemDB.jsx (STEP 2)
3. Build and deploy
4. Test booking dan level validation

</content>
