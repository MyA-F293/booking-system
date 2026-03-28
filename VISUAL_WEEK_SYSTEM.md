# 🎨 Visual: Sistem Week Setelah Reset Batch

## 📊 Diagram Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEBELUM RESET BATCH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database:                                                      │
│  ┌──────────────────────────────────────┐                      │
│  │ settings.current_week = 5            │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  AdminDashboard Header:                                         │
│  ┌──────────────────────────────────────┐                      │
│  │ "Batch 2 | Week 5"              [▶]  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  Stats Cards:                                                   │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ W5 bookings  │  │ W6 bookings  │                           │
│  │     45       │  │     38       │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            ⬇️ ADMIN KLIK "RESET BATCH"

┌─────────────────────────────────────────────────────────────────┐
│                    SETELAH RESET BATCH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database:                                                      │
│  ┌──────────────────────────────────────┐                      │
│  │ settings.current_week = 1  ✨ RESET  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  AdminDashboard Header:                                         │
│  ┌──────────────────────────────────────┐                      │
│  │ "Batch 3 | Week 1"              [▶]  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  Stats Cards:                                                   │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ W1 bookings  │  │ W2 bookings  │                           │
│  │      0       │  │      0       │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
│  ✅ Semua data batch lama terhapus                              │
│  ✅ Week kembali ke 1                                           │
│  ✅ Siap untuk batch baru                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Cara Increment Week (Manual)

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN KLIK BUTTON "▶" (Next Week)                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  incrementWeek() dipanggil                                      │
│  ┌──────────────────────────────────────┐                      │
│  │ UPDATE settings                      │                      │
│  │ SET current_week = current_week + 1  │                      │
│  │ WHERE id = 1                         │                      │
│  └──────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database: current_week = 2                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  WeekContext: refreshWeek() → fetch dari database               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI Update:                                                     │
│  ┌──────────────────────────────────────┐                      │
│  │ "Batch 3 | Week 2"              [▶]  │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ W2 bookings  │  │ W3 bookings  │                           │
│  │      0       │  │      0       │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Auto-Increment (Belum Aktif)

Setelah setup GitHub Actions:

```
┌─────────────────────────────────────────────────────────────────┐
│  SETIAP SENIN JAM 00:01 WIB                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered                              │
│  (Cron: "1 17 * * 0" = Minggu 17:01 UTC)                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Call Supabase API:                                             │
│  POST /rest/v1/rpc/api_increment_week                           │
│  Body: { "api_key": "your-secret-key" }                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Function: api_increment_week()                             │
│  1. Verify API key                                              │
│  2. Increment current_week                                      │
│  3. Return success message                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database: current_week = current_week + 1                      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  User buka app → WeekContext fetch → UI update otomatis         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Contoh Penggunaan

### Scenario 1: Batch Baru Dimulai
```
Tanggal: 1 Maret 2026 (Senin)
Admin: Reset Batch → Batch 3

Database:
  current_week = 1 ✅

AdminDashboard:
  Header: "Batch 3 | Week 1" ✅
  Stats: "W1 bookings: 0" ✅

Student Login:
  Bisa booking untuk Week 1 ✅
```

### Scenario 2: Minggu Ke-2
```
Tanggal: 8 Maret 2026 (Senin)
Auto-increment (atau manual klik ▶)

Database:
  current_week = 2 ✅

AdminDashboard:
  Header: "Batch 3 | Week 2" ✅
  Stats: "W2 bookings: 15" ✅

Student Login:
  Bisa booking untuk Week 2 ✅
```

### Scenario 3: Minggu Ke-8 (Akhir Batch)
```
Tanggal: 19 April 2026 (Senin)
Auto-increment (atau manual klik ▶)

Database:
  current_week = 8 ✅

AdminDashboard:
  Header: "Batch 3 | Week 8" ✅
  Stats: "W8 bookings: 20" ✅

Admin:
  Siap reset batch untuk Batch 4 ✅
```

---

## 🎯 Yang Perlu Diingat

### ✅ Sudah Berfungsi:
1. Reset batch → Week kembali ke 1
2. Manual increment via button ▶
3. AdminDashboard menampilkan database week
4. Tidak ada error atau crash

### ⏳ Belum Aktif:
1. Auto-increment via GitHub Actions
   - Perlu setup 3 GitHub Secrets
   - Perlu run SQL untuk create API function
   - Perlu push workflow ke GitHub

### 🔮 Opsional (Future):
1. Migrate komponen lain ke `useWeek()` hook
2. Hapus ISO week sepenuhnya
3. Semua komponen pakai database week

---

## 🚀 Next Steps

### Untuk Sekarang:
1. ✅ Test reset batch → Week kembali ke 1
2. ✅ Test manual increment → Week naik
3. ✅ Test student booking → Tidak ada error

### Untuk Nanti (Optional):
1. Setup GitHub Actions (5-10 menit)
   - File: `SETUP_GITHUB_AUTO_INCREMENT.md`
   - Checklist: `GITHUB_AUTO_INCREMENT_CHECKLIST.txt`

---

## 💡 Tips

**Jika week tidak update setelah reset batch:**
```bash
# Refresh browser
Ctrl + R (atau F5)

# Check database
SELECT * FROM settings WHERE id = 1;

# Manual set week
UPDATE settings SET current_week = 1 WHERE id = 1;
```

**Jika ingin test auto-increment tanpa GitHub Actions:**
```sql
-- Run di Supabase SQL Editor
SELECT increment_current_week();
```

---

**Status**: System Working ✅  
**Date**: 27 Maret 2026
