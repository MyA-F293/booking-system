# Investigasi: Week 5 Punya 73 Kelas (Week 4 = 71)

## Problem
Setelah copy week dari Week 4 ke Week 5, ternyata Week 5 punya 73 schedules, padahal Week 4 hanya 71 schedules.

## Data yang Sudah Dikumpulkan

### 5 Schedule Terbaru di Week 5
Semua dibuat pada: 2026-06-26 04:58:11 (saat copy week operation)

| class_id | program | level | phase | day | time_slot | students |
|----------|---------|-------|-------|-----|-----------|----------|
| ee5ab696... | English Campus & Career | Upper Starter | phase1 | tuesday | evening | 7 |
| e8c465de... | English for Teens | Upper Starter | phase1 | tuesday | afternoon | 6 |
| 88239a1c... | English Campus & Career | Starter | phase2 | friday | evening | 10 |
| e8c465de... | English for Teens | Upper Starter | phase1 | monday | evening | 7 |
| 88239a1c... | English Campus & Career | Starter | phase2 | friday | afternoon | 9 |

### 2 Class Candidates untuk Investigasi
1. **English Campus & Career - Upper Starter** (`ee5ab696-15d3-4f9e-be63-5e427db83309`)
2. **English for Teens - Upper Starter** (`e8c465de-9c4b-430e-bb6b-0e4ad1de5037`)

## Langkah Investigasi

### 1. Jalankan Query Perbandingan
File: `database/compare_week4_week5_schedules.sql`

Query ini akan:
- Step 1: Tampilkan semua schedule kelas-kelas ini di Week 4
- Step 2: Tampilkan semua schedule kelas-kelas ini di Week 5
- Step 3: Verifikasi total count (Week 4 = 71, Week 5 = 73)

### 2. Analisis Hasil
Bandingkan hasil Step 1 dan Step 2:
- Apakah ada schedule di Week 5 yang tidak ada di Week 4?
- Phase, day, time_slot mana yang berbeda?

### 3. Kemungkinan Penyebab
- **Legitimate**: Mungkin memang ada 2 kelas baru yang ditambah di Week 5
- **Bug**: Copy week operation salah/duplikat 2 schedule

### 4. Action Plan
**Jika legitimate (kelas baru):**
- Tidak perlu action, Week 5 memang benar punya 73 kelas

**Jika bug (duplikat/salah):**
- Identify 2 schedule yang berlebih
- Delete dengan query:
```sql
DELETE FROM schedules 
WHERE id IN ('schedule_id_1', 'schedule_id_2');
```

## Status
🔍 **Menunggu hasil query perbandingan**

## Next Steps
1. Jalankan `database/compare_week4_week5_schedules.sql` di Supabase SQL Editor
2. Paste hasilnya untuk analisis
3. Tentukan apakah perlu delete atau tidak
