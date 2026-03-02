## 🔧 FIX WRONG WEEK ATTENDANCE

### MASALAH
Attendance untuk minggu lalu tiba-tiba masuk ke minggu depan.

### ROOT CAUSE
Bug di code: Menggunakan `selectedWeek` state (dari dropdown) saat submit, bukan `schedule.week_number`.

**Scenario Bug**:
1. User pilih Week 8, buka form attendance
2. User ganti dropdown ke Week 9 (form masih terbuka)
3. User submit
4. Result: Attendance masuk ke Week 9, padahal harusnya Week 8!

### ✅ FIX APPLIED
Code sudah di-fix untuk menggunakan `schedule.week_number` dan `schedule.year` dari schedule object, bukan dari state.

```javascript
// BEFORE (BUG)
week_number: selectedWeek,  // ❌ Bisa berubah kalau user ganti dropdown
year: currentYear,

// AFTER (FIXED)
week_number: selectedSchedule.week_number,  // ✅ Dari schedule object
year: selectedSchedule.year,  // ✅ Dari schedule object
```

---

## LANGKAH PERBAIKAN

### 1️⃣ Cek Attendance yang Salah Week

Jalankan di Supabase SQL Editor:
```
database/CHECK_WRONG_WEEK_ATTENDANCE.sql
```

Ini akan menunjukkan:
- Attendance yang masuk ke week yang salah
- Attendance untuk future weeks (seharusnya tidak ada)
- Summary berapa banyak yang salah

### 2️⃣ Fix Attendance yang Salah

Kalau ada attendance yang masuk ke week yang salah, bisa fix dengan SQL:

```sql
-- Example: Pindahkan attendance dari Week 10 ke Week 9
UPDATE attendance
SET week_number = 9
WHERE week_number = 10
    AND year = 2026
    AND created_at < '2026-03-03'  -- Sebelum Week 10 dimulai
    AND class_name = 'Tsinghua Class';  -- Sesuaikan class name

-- Verify
SELECT week_number, class_name, COUNT(*) 
FROM attendance 
WHERE class_name = 'Tsinghua Class' 
    AND year = 2026
GROUP BY week_number, class_name
ORDER BY week_number;
```

### 3️⃣ Prevent Future Issues

Code sudah di-fix, tapi untuk extra safety:

**Option A: Disable Week Selector Saat Form Terbuka**
Tambahkan `disabled` attribute ke dropdown saat `selectedSchedule !== null`.

**Option B: Reset Form Saat Ganti Week**
Tambahkan logic untuk auto-close form kalau user ganti week selector.

**Option C: Show Warning**
Tampilkan warning kalau user coba ganti week saat form terbuka.

---

## TESTING

### Test 1: Normal Submit
1. Pilih Week 9
2. Buka attendance form untuk Tsinghua
3. Mark attendance
4. Submit
5. ✅ Check database: `week_number` harus 9

### Test 2: Change Week While Form Open (Bug Scenario)
1. Pilih Week 8
2. Buka attendance form untuk Tsinghua
3. **Ganti dropdown ke Week 9** (form masih terbuka)
4. Mark attendance
5. Submit
6. ✅ Check database: `week_number` harus tetap 8 (bukan 9)

### SQL untuk Test
```sql
-- Check attendance yang baru di-submit
SELECT 
    week_number,
    class_name,
    student_name,
    status,
    created_at
FROM attendance
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

---

## PREVENTION

### Tambahan Safety (Optional)

Bisa tambahkan validation di frontend:

```javascript
// Di handleSubmitAttendance, sebelum submit
if (selectedSchedule.week_number !== selectedWeek) {
    toast.warning(
        `Week mismatch detected! Schedule is for Week ${selectedSchedule.week_number}, ` +
        `but selector shows Week ${selectedWeek}. Using Week ${selectedSchedule.week_number}.`
    );
}
```

Atau disable week selector saat form terbuka:

```javascript
<select
    value={selectedWeek}
    onChange={(e) => setSelectedWeek(Number(e.target.value))}
    disabled={selectedSchedule !== null}  // ✅ Disable saat form terbuka
    className="..."
>
```

---

## SUMMARY

✅ **Bug Fixed**: Code sekarang menggunakan `schedule.week_number` bukan `selectedWeek`

✅ **Diagnostic Tool**: `CHECK_WRONG_WEEK_ATTENDANCE.sql` untuk cek data yang salah

✅ **Manual Fix**: SQL query untuk pindahkan attendance ke week yang benar

⚠️ **Action Required**: 
1. Jalankan diagnostic SQL
2. Fix attendance yang salah (kalau ada)
3. Test dengan scenario di atas
4. Deploy ke production

---

**STATUS**: ✅ Fixed and ready to deploy
