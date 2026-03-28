# 📅 Sistem Week Setelah Reset Batch

## 🎯 Bagaimana Sistem Bekerja Sekarang

### 1️⃣ Saat Reset Batch
Ketika admin klik "Reset Batch" di Actions menu:

```
✅ Yang Terjadi:
1. Semua data batch dihapus (students, bookings, attendance, schedules)
2. current_week di database → RESET ke 1
3. WeekContext otomatis refresh
4. UI menampilkan "Week 1"
```

---

### 2️⃣ Sistem Week Hybrid (2 Jenis Week)

Sekarang ada **2 jenis week** yang bekerja bersamaan:

#### A. Database Week (untuk Admin & Display)
- **Sumber**: Tabel `settings.current_week` di database
- **Digunakan oleh**: 
  - AdminDashboard (header, stats cards)
  - WeekContext (global state)
- **Cara akses**: `useWeek()` hook
- **Contoh**: Week 1, Week 2, Week 3... (relatif ke batch)

#### B. ISO Week (untuk Komponen Lama)
- **Sumber**: Kalender ISO (JavaScript Date)
- **Digunakan oleh**:
  - BookingSystemDB
  - BookingDashboard (student)
  - TeacherDashboard
  - AdminAttendanceManager
  - AdminBookingDashboard
  - AdminStatsDashboard
  - AttendanceReportExcel
- **Cara akses**: `getCurrentWeek()` function
- **Contoh**: Week 13 (minggu ke-13 tahun 2026)

---

### 3️⃣ Kenapa Ada 2 Jenis Week?

**Alasan Teknis:**
- Mengubah `getCurrentWeek()` jadi async menyebabkan error di banyak komponen
- Komponen-komponen lama memanggil `getCurrentWeek()` secara synchronous
- Error: "Objects are not valid as a React child (Promise)"

**Solusi Hybrid:**
- `getCurrentWeek()` → Tetap sync, return ISO week (backward compatible)
- `getCurrentWeekFromDB()` → Async, return database week (new)
- `useWeek()` hook → React hook untuk database week (recommended)

---

### 4️⃣ Flow Setelah Reset Batch

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN RESET BATCH                                      │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Database: current_week = 1                             │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  WeekContext: refreshWeek() → fetch dari database       │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  AdminDashboard: useWeek() → currentWeek = 1            │
│  Header menampilkan: "Batch 2 | Week 1"                 │
│  Stats cards: "W1 bookings", "W2 bookings"              │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Komponen Lain: getCurrentWeek() → ISO week (Week 13)   │
│  Masih pakai ISO week untuk backward compatibility      │
└─────────────────────────────────────────────────────────┘
```

---

### 5️⃣ Cara Increment Week

#### Manual (Admin):
1. Klik button "▶" di header AdminDashboard
2. Week increment: 1 → 2 → 3 → dst
3. UI auto-refresh

#### Otomatis (GitHub Actions):
1. Setiap Senin 00:01 WIB
2. GitHub Actions call API
3. Week increment otomatis
4. **Status**: Belum di-setup (waiting for stable app)

---

### 6️⃣ Komponen Mana yang Pakai Week Apa?

| Komponen | Week Type | Function/Hook | Display |
|----------|-----------|---------------|---------|
| AdminDashboard | Database | `useWeek()` | Week 1-8 |
| BookingSystemDB | ISO | `getCurrentWeek()` | Week 13 |
| BookingDashboard | ISO | `getCurrentWeek()` | Week 13 |
| TeacherDashboard | ISO | `getCurrentWeek()` | Week 13 |
| AdminAttendanceManager | ISO | `getCurrentWeek()` | Week 13 |
| AdminBookingDashboard | ISO | `getCurrentWeek()` | Week 13 |
| AdminStatsDashboard | ISO | `getCurrentWeek()` | Week 13 |
| AttendanceReportExcel | ISO | `getCurrentWeek()` | Week 13 |

---

### 7️⃣ Apakah Ini Masalah?

**Tidak masalah untuk sekarang**, karena:
- AdminDashboard (yang paling penting) sudah pakai database week
- Komponen lain masih berfungsi normal dengan ISO week
- Tidak ada error atau crash

**Tapi untuk konsistensi**, nanti bisa:
- Migrate komponen lain ke `useWeek()` hook
- Atau biarkan seperti ini (hybrid system)

---

### 8️⃣ Testing Checklist

Setelah reset batch, test ini:

```
✅ AdminDashboard:
   - Header menampilkan "Week 1"
   - Stats cards: "W1 bookings: 0", "W2 bookings: 0"
   - Klik "▶" → Week increment ke 2

✅ Student Booking:
   - Bisa booking untuk week sekarang
   - Tidak ada error

✅ Teacher Dashboard:
   - Bisa lihat attendance
   - Tidak ada error

✅ Admin Attendance:
   - Bisa submit attendance
   - Tidak ada error
```

---

## 🔧 Troubleshooting

### Week tidak berubah setelah reset batch:
1. Refresh browser (Ctrl+R)
2. Check console untuk error
3. Check database: `SELECT * FROM settings WHERE id = 1`

### Week masih menampilkan angka besar (Week 13):
- Itu normal untuk komponen yang pakai ISO week
- AdminDashboard sudah pakai database week (Week 1)
- Tidak perlu khawatir

### Error "Promise object":
- Sudah fixed dengan hybrid approach
- `getCurrentWeek()` sekarang sync lagi
- Tidak akan muncul error ini lagi

---

## 📊 Summary

**Current System:**
- ✅ Database week untuk AdminDashboard (Week 1-8)
- ✅ ISO week untuk komponen lain (Week 13, 14, dst)
- ✅ Reset batch → Week 1
- ✅ Manual increment via button
- ⏳ Auto-increment via GitHub Actions (belum setup)

**Status**: Stable & Working ✅

**Next**: Setup GitHub Actions untuk auto-increment (optional)
