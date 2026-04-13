# CARA JALANKAN INVESTIGASI COPY WEEK

## ❌ ERROR YANG TERJADI

Query `INVESTIGATE_COPY_WEEK_COMPLETE.sql` error karena terlalu kompleks dengan banyak UNION.

## ✅ SOLUSI: GUNAKAN VERSI SIMPLE

File: `database/INVESTIGATE_COPY_WEEK_SIMPLE.sql`

Query sudah dipisah menjadi 11 query terpisah yang lebih mudah dijalankan.

## 📋 CARA PAKAI

### Option 1: Jalankan Semua Sekaligus (Recommended)

1. Buka Supabase SQL Editor
2. Copy paste SEMUA isi file `INVESTIGATE_COPY_WEEK_SIMPLE.sql`
3. Klik Run
4. Lihat hasil di tab Results (akan ada 11 hasil terpisah)

### Option 2: Jalankan Satu Per Satu

Kalau masih error, jalankan query satu per satu:

#### Query 1: Summary
```sql
SELECT 
    '📊 SUMMARY' as info,
    (SELECT current_week - 1 FROM settings WHERE id = 1) as prev_week,
    (SELECT current_week FROM settings WHERE id = 1) as curr_week,
    (SELECT COUNT(DISTINCT b.user_id) 
     FROM bookings b 
     JOIN schedules s ON b.schedule_id = s.id 
     WHERE s.week_number = (SELECT current_week - 1 FROM settings WHERE id = 1)
     AND b.status = 'confirmed') as prev_week_students,
    (SELECT COUNT(DISTINCT b.user_id) 
     FROM bookings b 
     JOIN schedules s ON b.schedule_id = s.id 
     WHERE s.week_number = (SELECT current_week FROM settings WHERE id = 1)
     AND b.status = 'confirmed') as curr_week_students;
```

#### Query 2: Find Specific Students
```sql
SELECT 
    '🔍 FIND STUDENTS' as section,
    u.student_id,
    u.full_name,
    u.program,
    u.level,
    CASE 
        WHEN u.full_name ILIKE '%Talitha%' OR u.full_name ILIKE '%Raabih%' THEN 'Talitha'
        WHEN u.full_name ILIKE '%Nur%Afifah%' THEN 'St. Nur Afifah'
        WHEN u.full_name ILIKE '%Nilna%' THEN 'Nilna'
    END as search_name
FROM users u
WHERE u.full_name ILIKE '%Talitha%' 
   OR u.full_name ILIKE '%Raabih%'
   OR u.full_name ILIKE '%Nur%Afifah%'
   OR u.full_name ILIKE '%Nilna%';
```

#### Query 3-5: Student Bookings
Jalankan query untuk Talitha, St. Nur Afifah, dan Nilna (ada di file)

#### Query 6-7: Wednesday Evening Comparison
Bandingkan Wednesday evening prev week vs current week

#### Query 8: Missing Students
Siswa yang ada di prev week tapi tidak di current week

#### Query 9: Changed Class
Siswa yang pindah class otomatis

#### Query 10: Booking Timing
Check race condition (siswa booking saat copy berjalan)

#### Query 11: Full Schedules
Check overcapacity

## 🎯 YANG PERLU DICARI

Dari hasil query, cari:

### 1. Apakah Talitha, St. Nur, Nilna ada di database?
- Lihat hasil Query 2

### 2. Apakah mereka ada booking di prev week?
- Lihat hasil Query 3, 4, 5

### 3. Apakah mereka ada booking di current week?
- Lihat hasil Query 3, 4, 5

### 4. Apakah mereka masuk list "Missing Students"?
- Lihat hasil Query 8
- Kalau ada → tidak ter-copy

### 5. Apakah mereka masuk list "Changed Class"?
- Lihat hasil Query 9
- Kalau ada → pindah class otomatis (BUG!)

### 6. Apakah Wednesday evening full?
- Lihat hasil Query 6, 7
- Compare prev week vs current week
- Check current_students vs max_students

### 7. Kapan siswa booking di current week?
- Lihat hasil Query 10
- Kalau ada yang booking jam 0:00-0:05 → race condition!

### 8. Apakah ada schedule yang overcapacity?
- Lihat hasil Query 11

## 📊 INTERPRETASI HASIL

### Scenario A: Missing Students + Full Schedule
```
Query 8: Talitha ada di missing students
Query 7: Wednesday evening Oxford = 10/10 (FULL)
```
**Kesimpulan**: Tidak ter-copy karena schedule sudah full
**Root Cause**: Overcapacity prevention (bukan bug, ini fitur)

### Scenario B: Changed Class
```
Query 9: Nilna pindah dari Tokyo ke Oxford
```
**Kesimpulan**: Ada bug di class mapping
**Root Cause**: JOIN logic salah (ChatGPT benar!)

### Scenario C: Race Condition
```
Query 10: Banyak siswa booking jam 0:00-0:05
Query 8: Banyak missing students
```
**Kesimpulan**: Siswa booking sebelum copy selesai
**Root Cause**: Race condition / timing issue

### Scenario D: Missing + Not Full
```
Query 8: Talitha ada di missing students
Query 7: Wednesday evening Oxford = 7/10 (NOT FULL)
```
**Kesimpulan**: Ada bug serius!
**Root Cause**: Perlu investigasi lebih lanjut

## 🚀 NEXT STEPS

Setelah dapat hasil:

1. **Screenshot semua hasil query**
2. **Kirim ke saya** untuk analisis
3. **Identifikasi scenario** (A, B, C, atau D)
4. **Implement fix** sesuai root cause

## ⚠️ CATATAN

- Jalankan query saat current_week sudah di-increment (setelah copy)
- Kalau current_week masih sama dengan prev_week, ubah manual di query
- Ganti `current_week - 1` dengan week number yang sesuai

## 📝 CONTOH HASIL YANG BAGUS

```
Query 1 (Summary):
prev_week: 1
curr_week: 2
prev_week_students: 328
curr_week_students: 284
→ Missing: 44 students

Query 8 (Missing Students):
Talitha Raabih Faatihah | Oxford | Wednesday evening
St. Nur Afifah | Oxford | Wednesday evening
→ Confirmed: 2 siswa tidak ter-copy

Query 7 (Wednesday Evening Current):
Oxford Class | Wednesday evening | 10/10 (FULL)
→ Confirmed: Schedule full

KESIMPULAN: Overcapacity prevention
```

---

**File**: `database/INVESTIGATE_COPY_WEEK_SIMPLE.sql`
**Status**: Ready to run
**Error**: Fixed (query dipisah)
