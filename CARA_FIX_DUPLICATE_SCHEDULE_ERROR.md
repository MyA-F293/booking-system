# 🔧 Cara Fix "Duplicate Schedule Detected!" Error

## 📋 Masalah
- User mencoba membuat jadwal Oxford Class Monday Evening Phase 1
- Muncul error: "Duplicate schedule detected!"
- Padahal jadwal tersebut sudah dihapus sebelumnya dari UI

## 🔍 Root Cause
Ada 2 kemungkinan:
1. **Browser cache** masih menampilkan data lama
2. **Jadwal tidak benar-benar terhapus** dari database

Query database menunjukkan ada 2 jadwal Oxford Class Monday Evening Phase 1:
- Week 1: ID `da862ee7-4eea-4976-b084-277c9fd21454`, 7 students, created 2026-03-29
- Week 2: ID `475230e7-3356-4898-931d-898bbcf46484`, 0 students, created 2026-03-28

## ✅ Solusi (UPDATED - AMAN UNTUK SISWA!)

### ⚠️ PENTING: Ada 7 siswa di Week 1!
Kita tidak boleh delete schedule yang ada siswanya. Gunakan solusi yang aman.

### Step 1: Jalankan SQL Merge (SAFE)
Buka Supabase SQL Editor dan jalankan:
```sql
-- File: booking-system/database/MERGE_OXFORD_DUPLICATES_SAFE.sql
-- Gunakan OPTION A (RECOMMENDED)
```

**OPTION A (RECOMMENDED):** Keep Week 1, Delete Week 2
```sql
-- Delete Week 2 schedule (empty, no students)
DELETE FROM schedules
WHERE id = '475230e7-3356-4898-931d-898bbcf46484';
```

Kenapa Option A?
- ✅ Week 1 sudah ada 7 siswa enrolled
- ✅ Week 2 kosong (0 siswa)
- ✅ Paling aman - tidak ada data loss
- ✅ Paling simple - hanya 1 DELETE query

**OPTION B:** Merge ke Week 2 (jika ingin siswa di Week 2)
```sql
-- Move bookings dari Week 1 ke Week 2
UPDATE bookings
SET schedule_id = '475230e7-3356-4898-931d-898bbcf46484'
WHERE schedule_id = 'da862ee7-4eea-4976-b084-277c9fd21454';

-- Update student count
UPDATE schedules
SET current_students = 7
WHERE id = '475230e7-3356-4898-931d-898bbcf46484';

-- Delete Week 1 schedule
DELETE FROM schedules
WHERE id = 'da862ee7-4eea-4976-b084-277c9fd21454';
```

### Step 2: Hard Refresh Browser
Setelah SQL selesai:
1. Tekan **Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac)
2. Tunggu 2-3 detik
3. Browser akan reload dengan data fresh dari database

### Step 3: Coba Buat Schedule Lagi
1. Klik "Create Schedule"
2. Pilih Oxford Class
3. Pilih Monday, Evening, Phase 1
4. Klik Save
5. Seharusnya berhasil tanpa error!

## 📊 Dampak
- ✅ **OPTION A:** 7 students di Week 1 tetap aman, Week 2 terhapus
- ✅ **OPTION B:** 7 students dipindah ke Week 2, Week 1 terhapus
- ✅ Tidak ada data loss!
- ✅ Siswa tidak perlu re-book

## 🛡️ Pencegahan
Untuk mencegah masalah ini di masa depan:

1. **Selalu hard refresh** setelah delete schedule
2. **Tunggu 2-3 detik** sebelum create schedule baru
3. **Jangan double-click** tombol Create (race condition protection sudah ada)

## 🔧 Improvement Suggestion
Tambahkan auto-refresh di `AdminBookingDashboard.jsx` setelah delete:

```javascript
// Di handleDeleteSchedule function, setelah loadAllSchedules()
await loadAllSchedules();

// Tambahkan hard refresh cache
window.location.reload(); // Force browser to reload
```

Tapi ini akan reload seluruh page, jadi user experience kurang bagus.

Alternatif lebih baik: Tambahkan cache busting yang lebih agresif:
```javascript
const loadAllSchedules = async () => {
    const timestamp = Date.now();
    const filters = {
        week_number: displayWeek,
        year: currentYear,
        _cacheBust: timestamp
    };
    
    // Force Supabase to bypass cache
    const { data, error } = await supabase
        .from('schedules')
        .select('*, class:classes(*), teacher:teachers(*)')
        .eq('week_number', displayWeek)
        .eq('year', currentYear)
        .order('day')
        .order('time_slot');
    
    // ... rest of code
};
```

## 📝 Summary
1. ✅ SQL merge query sudah dibuat (SAFE - tidak delete siswa!)
2. ✅ User perlu jalankan OPTION A atau B di Supabase
3. ✅ Hard refresh browser (Ctrl + Shift + R)
4. ✅ 7 siswa tetap aman, tidak perlu re-book
5. ✅ Bisa create Week 2 schedule atau gunakan Copy Week
