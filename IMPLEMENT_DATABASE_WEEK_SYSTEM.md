# Implementasi Database Week System

## Overview
Mengubah sistem week dari ISO calendar ke database-based week system untuk mendukung batch kursus yang berlangsung 2 bulan.

## Perubahan yang Akan Dilakukan:

### 1. Database
- ✅ Tabel `settings` sudah dibuat dengan kolom `current_week`
- ✅ RPC function `reset_batch` sudah reset current_week ke 1

### 2. Frontend Code
- 🔄 Ubah `getCurrentWeek()` dari sync ke async (fetch dari database)
- 🔄 Tambah state management untuk current_week
- 🔄 Tambah fitur "Next Week" button untuk admin

### 3. Fitur Tambahan
- ➕ Button "Next Week" untuk admin increment week
- ➕ Auto-refresh current_week setiap load
- ➕ Display current_week di header

## Files yang Perlu Diubah:

1. `src/utils/dbHelpers.js` - Ubah getCurrentWeek() jadi async
2. `src/BookingSystemDB.jsx` - Update state management
3. `src/AdminDashboard.jsx` - Tambah Next Week button
4. `src/components/AdminAttendanceManager.jsx` - Update async calls

## Implementasi Step-by-Step:

### Step 1: Update dbHelpers.js
```javascript
// OLD (sync, ISO week)
export const getCurrentWeek = () => {
    const now = new Date()
    // ... ISO calculation
    return weekNumber
}

// NEW (async, from database)
export const getCurrentWeek = async () => {
    const { data, error } = await supabase
        .from('settings')
        .select('current_week')
        .eq('id', 1)
        .single()
    
    if (error) {
        console.error('Error getting current week:', error)
        return 1 // fallback
    }
    
    return data.current_week
}

// NEW: Function to increment week
export const incrementWeek = async () => {
    const currentWeek = await getCurrentWeek()
    const { error } = await supabase
        .from('settings')
        .update({ current_week: currentWeek + 1, updated_at: new Date() })
        .eq('id', 1)
    
    if (error) throw error
    return currentWeek + 1
}

// NEW: Function to set specific week
export const setCurrentWeek = async (weekNumber) => {
    const { error } = await supabase
        .from('settings')
        .update({ current_week: weekNumber, updated_at: new Date() })
        .eq('id', 1)
    
    if (error) throw error
    return weekNumber
}
```

### Step 2: Update Components
Semua component yang menggunakan `getCurrentWeek()` perlu diubah dari:
```javascript
const currentWeek = getCurrentWeek() // sync
```

Menjadi:
```javascript
const [currentWeek, setCurrentWeek] = useState(1)

useEffect(() => {
    const loadWeek = async () => {
        const week = await getCurrentWeek()
        setCurrentWeek(week)
    }
    loadWeek()
}, [])
```

### Step 3: Tambah Next Week Button di Admin
Button untuk admin increment week setiap minggu baru dimulai.

## Trade-offs:

### Kelebihan:
✅ Week relatif terhadap batch (Week 1-8 untuk 2 bulan)
✅ User tidak bingung dengan ISO week
✅ Konsisten dengan durasi kursus
✅ Reset batch = reset ke Week 1

### Kekurangan:
❌ Perlu manual increment week setiap Senin
❌ Banyak code yang perlu diubah (async)
❌ Perlu state management di semua component
❌ Tanggal tidak otomatis sinkron dengan kalender

## Solusi untuk Kekurangan:

1. **Auto-increment Week**
   - Buat cron job atau scheduled function
   - Setiap Senin jam 00:00, auto increment week
   - Atau admin bisa manual trigger

2. **State Management**
   - Gunakan Context API untuk share current_week
   - Tidak perlu fetch berkali-kali

3. **Tanggal Display**
   - Tetap tampilkan tanggal real di samping week
   - Contoh: "Week 1 (27 Mar - 2 Apr 2026)"

## Rekomendasi Implementasi:

Saya sarankan implementasi bertahap:
1. ✅ Database sudah siap (settings table + reset_batch function)
2. 🔄 Update dbHelpers.js (getCurrentWeek async)
3. 🔄 Buat WeekContext untuk state management
4. 🔄 Update semua components satu per satu
5. ➕ Tambah Next Week button di admin
6. ➕ (Optional) Auto-increment dengan cron

Apakah Anda ingin saya lanjutkan implementasi lengkapnya?
