# CARA MENAMBAHKAN STANFORD CLASS

## Status: READY TO DEPLOY ✅

Stanford Class telah ditambahkan ke sistem dengan kapasitas **6 siswa** (berbeda dari kelas lain yang 10 siswa).

## Langkah 1: Tambah ke Database

Jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- Insert Stanford Class dengan kapasitas 6 siswa
INSERT INTO classes (name, min_students, max_students, is_active)
VALUES ('Stanford Class', 4, 6, TRUE);
```

Verifikasi berhasil:
```sql
SELECT * FROM classes WHERE name = 'Stanford Class';
```

## Langkah 2: Deploy Code Changes

Code sudah diupdate di:
- ✅ `src/BookingSystemDB.jsx` — UI siswa
- ✅ `src/components/BookingDashboard.jsx` — Alternative booking view
- ✅ `src/components/AdminBookingDashboard.jsx` — Admin scheduling  
- ✅ `src/components/AdminAttendanceManager.jsx` — Admin attendance

### Changes Made:

1. **Added Stanford Class badge** 🌲 (green color)
2. **Dynamic capacity check** — sistem sekarang baca `max_students` dari database, bukan hardcoded 10
3. **UI displays correct capacity** — "6/6" untuk Stanford, "10/10" untuk kelas lain

## Langkah 3: Test Checklist

Setelah deploy, test:

- [ ] Stanford Class muncul di dropdown admin saat buat schedule
- [ ] Stanford Class muncul di UI siswa saat booking
- [ ] Kapasitas tertulis "X/6" bukan "X/10"
- [ ] Siswa tidak bisa booking jika sudah 6 orang (kapasitas penuh)
- [ ] Kelas lain masih berfungsi normal dengan kapasitas 10

## Fitur Dinamis yang Sudah Ditambahkan

Sistem sekarang **100% dinamis** — kapasitas kelas dibaca dari database kolom `max_students`. Kalau nanti mau ubah kapasitas atau tambah kelas baru, tinggal:

1. Insert/Update di tabel `classes`
2. Tambah badge di code (opsional, kalau ga ada pakai default 📖)
3. Deploy

Tidak perlu ubah logika capacity check lagi.

## Stanford Class Details

- **Name**: Stanford Class
- **Emoji**: 🌲 (Pine tree - representing Stanford's location)
- **Color**: Green
- **Min Students**: 4
- **Max Students**: 6 ← **BERBEDA dari kelas lain**
- **Active**: Yes

## Files Modified

1. `src/BookingSystemDB.jsx` (Student UI - main booking flow)
2. `src/components/BookingDashboard.jsx` (Student alternative view)
3. `src/components/AdminBookingDashboard.jsx` (Admin scheduling)
4. `src/components/AdminAttendanceManager.jsx` (Admin attendance)
5. `database/add_stanford_class.sql` (Database migration)
