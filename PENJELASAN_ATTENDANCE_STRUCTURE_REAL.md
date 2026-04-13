# 🎯 Penjelasan: Attendance Table Structure (Real)

## 📋 Actual Table Structure

```sql
attendance table:
- day (text)          ← Hari dalam seminggu (monday, tuesday, etc)
- week_number (integer) ← Minggu ke berapa
- updated_at (timestamp)
- ... (other columns)
```

**TIDAK ADA column `date`!**

---

## 🔍 Bagaimana UI Menampilkan Tanggal?

**UI Code (BookingDashboard.jsx):**
```jsx
<span className="text-gray-400 ml-1">
    ({formatDateShort(getDateForDayInWeek(schedule.day, displayWeek, currentYear))})
</span>
```

**Flow:**
1. Ambil `day` dari database → `'monday'`
2. Ambil `week_number` dari database → `2`
3. Hitung tanggal: `getDateForDayInWeek('monday', 2, 2026)`
4. Hasil: April 12, 2026
5. Tampilkan: "Monday (Apr 12)"

**Masalahnya:**
- April 12, 2026 adalah **Saturday**, bukan Monday!
- Jadi `day = 'monday'` di database itu SALAH

---

## 🎯 Root Cause

Attendance table menyimpan `day` yang salah. Kemungkinan:

1. **Admin salah input** - Pilih "Monday" tapi seharusnya "Saturday"
2. **Import CSV salah** - CSV punya day yang tidak match dengan week
3. **Copy dari schedule yang salah** - Schedule punya day yang salah, di-copy ke attendance

---

## 🔧 Cara Fix

Karena attendance tidak punya `date`, kita perlu:

1. **Cari tahu tanggal yang benar** dari `schedules` table
2. **Hitung day yang benar** dari tanggal tersebut
3. **Update `day` di attendance** dengan day yang benar

**Tapi ada masalah:**
- Attendance tidak punya foreign key ke schedules
- Kita tidak tahu schedule mana yang terkait dengan attendance ini

**Solusi:**
- Match attendance dengan schedules berdasarkan:
  - `week_number`
  - `class_name`
  - `time_slot`
  - `phase`
  - `student_id`

---

## 📊 Next Steps

Saya perlu lihat:
1. Struktur lengkap attendance table (semua columns)
2. Sample data dari attendance
3. Bagaimana attendance di-create (dari schedule atau manual?)

Jalankan query ini:

```sql
-- Lihat semua columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'attendance'
ORDER BY ordinal_position;

-- Lihat sample data
SELECT *
FROM attendance
LIMIT 5;
```

Kasih tau hasilnya, nanti saya buat fix query yang tepat!

---

**STATUS**: ⏳ Need more info about attendance table structure

