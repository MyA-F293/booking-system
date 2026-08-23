# INVOICE

---

## EYSA – Booking System
www.eysalanguage.center

Jl. Tun Abdul Razak, Paccinongang, Kec. Somba Opu,
Kabupaten Gowa, Sulawesi Selatan 92311

**Number:** #WEB517
**Date:** 19/06/2026

---

| Deskripsi | Price |
|-----------|-------|
| Ghost Attendance Prevention – Database trigger + frontend fix | Rp 50.000 |
| Tambah 3 Week Tab (Previous/Current/Next) di Admin Booking | Rp 25.000 |
| Maintenance Mode Page | Rp 25.000 |
| Data Cleanup & Verification (Week 2, 3, 4) | Rp 35.000 |
| QA Testing & Verification – End-to-end testing semua fitur di production | Rp 100.000 |
| | |
| **Subtotal:** | **Rp 235.000** |

---

**Termasuk:**

- Fix kapasitas kelas baca max_students dari database (bukan hardcode 10)
- Fix RPC smart_copy_week agar hormati max_students per kelas
- Fix daftar "Students Who Haven't Booked" agar akurat (server-side filter)
- Database trigger mencegah attendance tanpa booking aktif (longterm)
- Fix week_number di attendance record (dari schedule, bukan global)
- Tambah tab Previous Week di Admin Manage Booking
- Halaman Under Maintenance (toggle on/off via kode)
- Pembersihan data Week 3 & 4 + verifikasi akurasi copy
- Testing & deployment

**Perlindungan Longterm yang Terpasang:**

| Layer | Proteksi |
|-------|----------|
| Database trigger | Tolak insert attendance jika siswa tidak punya booking di schedule itu |
| Frontend | `week_number` diambil dari schedule, bukan dari database global |
| Tutor view | Hanya tampilkan schedule current week + filter hari ini |
| `getScheduleStudents` | Hanya return siswa dengan booking `confirmed` di schedule spesifik |

Ringkasan tambahan:
- Capacity check dari `classes.max_students` di semua level (frontend + RPC)
- Stats Dashboard query filter server-side (tidak kena limit 1000 rows)

---

**Pembayaran:**

Bank Mandiri: 1700012359547
a.n. M YUDI AL FIQRAN

---

Thank you!
