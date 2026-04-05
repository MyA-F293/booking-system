# Cara Check Jadwal Kosong (0 Siswa)

## Query File
`database/CHECK_ALL_EMPTY_SCHEDULES.sql`

## Cara Menggunakan

### 1. Buka Supabase SQL Editor
1. Login ke Supabase Dashboard
2. Pilih project booking system
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New Query"

### 2. Copy-Paste Query
Ada 8 query berbeda, pilih sesuai kebutuhan:

#### Query 1: Summary (Quick Check) ⚡
```sql
SELECT 
    COUNT(*) as total_empty_schedules,
    COUNT(DISTINCT class_id) as affected_classes,
    COUNT(DISTINCT week_number) as affected_weeks
FROM schedules
WHERE current_students = 0;
```

**Output Example**:
```
total_empty_schedules | affected_classes | affected_weeks
---------------------|------------------|---------------
9                    | 2                | 1
```

**Artinya**: Ada 9 jadwal kosong, dari 2 kelas berbeda, di 1 minggu.

#### Query 2: Per Class (Kelas Mana yang Bermasalah?) 📊
```sql
SELECT 
    c.name as class_name,
    COUNT(*) as empty_schedules_count,
    STRING_AGG(DISTINCT s.day::text, ', ') as days,
    STRING_AGG(DISTINCT s.time_slot::text, ', ') as time_slots
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students = 0
GROUP BY c.name
ORDER BY empty_schedules_count DESC;
```

**Output Example**:
```
class_name    | empty_schedules_count | days              | time_slots
--------------|----------------------|-------------------|------------
Fahd Class    | 3                    | tuesday, saturday | afternoon, evening
Oxford Class  | 6                    | monday, sunday    | evening
```

**Artinya**: Fahd Class punya 3 jadwal kosong, Oxford Class punya 6.

#### Query 4: Full Detail (Lihat Semua) 📋
Ini yang paling lengkap! Shows:
- ID jadwal
- Nama kelas
- Hari, waktu, fase
- Week number
- Program & level
- Kapan dibuat
- Konflik dengan kelas lain

**Gunakan ini untuk analisis detail.**

#### Query 5: Duplicates (Cari Duplikat) 🔍
```sql
SELECT 
    c.name as class_name,
    s.day,
    s.time_slot,
    s.phase,
    s.week_number,
    COUNT(*) as duplicate_count
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE s.current_students = 0
GROUP BY c.name, s.day, s.time_slot, s.phase, s.week_number
HAVING COUNT(*) > 1;
```

**Output Example**:
```
class_name  | day     | time_slot | phase  | week_number | duplicate_count
------------|---------|-----------|--------|-------------|----------------
Fahd Class  | tuesday | afternoon | phase1 | 2           | 2
```

**Artinya**: Ada 2 jadwal Tuesday Afternoon Phase1 yang sama persis (DUPLIKAT!)

#### Query 8: Recommendations (Apa yang Harus Dihapus?) 💡
Ini yang paling berguna! Memberikan rekomendasi:
- ❌ DUPLICATE - Hapus yang ini
- ⚠️ OLD & EMPTY - Pertimbangkan hapus (> 7 hari)
- ⚠️ ROOM CONFLICT - Ada kelas lain yang punya siswa
- ✅ KEEP - Jadwal baru, mungkin akan ada siswa

## Interpretasi Hasil

### Scenario 1: Duplicate Empty Schedules ❌
```
Fahd Class - Tuesday Afternoon Phase1 - Week 2 (2x)
```
**Action**: Hapus salah satu, keep yang lebih lama (created_at lebih awal)

### Scenario 2: Old Empty Schedule (> 7 days) ⚠️
```
Oxford Class - Saturday Evening - Week 2 (created 10 days ago)
```
**Action**: Hapus, karena sudah lama tidak ada yang booking

### Scenario 3: Room Conflict ⚠️
```
Fahd Class - Tuesday Afternoon (0 siswa)
Oxford Class - Tuesday Afternoon (9 siswa) ← Same time!
```
**Action**: 
- Jika memang sengaja (siswa pilih salah satu): Keep
- Jika tidak sengaja: Hapus yang kosong

### Scenario 4: New Empty Schedule ✅
```
Harvard Class - Monday Morning - Week 3 (created 1 hour ago)
```
**Action**: Keep, baru dibuat, tunggu siswa booking

## Kapan Jadwal Kosong Itu NORMAL?

### ✅ Normal (Keep):
1. **Jadwal baru** (< 24 jam) - Belum dibuka booking
2. **Jadwal minggu depan** - Advance scheduling
3. **Jadwal alternatif** - Siswa pilih salah satu dari 2 kelas

### ❌ Tidak Normal (Delete):
1. **Duplikat** - Ada 2+ jadwal sama persis
2. **Jadwal lama** (> 7 hari) - Tidak ada yang booking
3. **Jadwal salah** - Wrong day/time/phase

## Action Plan Berdasarkan Hasil

### Step 1: Run Query 1 (Summary)
```
Hasil: 9 empty schedules
```
→ Lanjut ke Step 2

### Step 2: Run Query 5 (Duplicates)
```
Hasil: 2 duplicates found (Fahd Tuesday)
```
→ Hapus 1 duplicate = 8 empty schedules remaining

### Step 3: Run Query 8 (Recommendations)
```
Hasil:
- 2 duplicates → Delete
- 3 old & empty → Consider delete
- 4 new → Keep
```
→ Hapus 2 duplicates + 3 old = 5 deleted, 4 remaining

### Step 4: Run Query 6 (Room Conflicts)
```
Hasil: Fahd conflicts with Oxford (Oxford has 9 students)
```
→ Decision: Keep or delete based on business logic

### Step 5: Use "Clean" Button in Admin Dashboard
- Buka Admin Dashboard
- Lihat Quick Insights
- Klik "Clean" button
- Confirm deletion

## Comparison: Manual Query vs Clean Button

### Manual Query (SQL) 🔧
**Pros**:
- Selective deletion (pilih mana yang dihapus)
- Detailed analysis
- Can check before delete

**Cons**:
- Perlu akses database
- More complex
- Manual process

**Use when**: 
- Want to analyze first
- Need selective deletion
- Have database access

### Clean Button (UI) 🖱️
**Pros**:
- One-click solution
- No database access needed
- Safe (confirmation dialog)

**Cons**:
- Deletes ALL empty schedules
- No selective option
- Less control

**Use when**:
- Want quick cleanup
- Trust the system
- No database access

## Expected Results (Fahd Class Case)

Based on previous analysis:

**Before Cleanup**:
```
Total: 9 empty schedules
- Fahd Class: 3 (2 Tuesday duplicates + 1 Saturday)
- Other classes: 6
```

**After Cleanup** (Delete duplicates + old):
```
Total: 4 empty schedules (new ones, keep for now)
- Fahd Class: 1 (Thursday or Friday with students)
- Other classes: 3 (new schedules)
```

**Database Impact**:
- 5 schedules deleted
- Database cleaner
- No more duplicates
- Only valid schedules remain

## Troubleshooting

### Query Returns 0 Results
```
total_empty_schedules: 0
```
**Artinya**: Tidak ada jadwal kosong! Database sudah bersih ✅

### Query Returns Too Many Results
```
total_empty_schedules: 50+
```
**Artinya**: Banyak jadwal kosong, perlu cleanup besar-besaran
**Action**: 
1. Check duplicates first (Query 5)
2. Check old schedules (Query 7)
3. Use Clean button or manual delete

### Query Shows Conflicts
```
Fahd Class conflicts with Oxford Class
```
**Artinya**: 2 kelas di waktu yang sama
**Action**: 
- Check if intentional (students choose one)
- If not, delete the empty one

## Files Related

1. `database/CHECK_ALL_EMPTY_SCHEDULES.sql` - Query file
2. `database/DELETE_FAHD_EMPTY_NOW.sql` - Delete specific schedules
3. `src/AdminDashboard.jsx` - Clean button implementation
4. `CARA_GUNAKAN_EMPTY_SCHEDULES_CLEANUP.md` - Clean button guide

---
**Status**: Query ready to use  
**Recommendation**: Run Query 1 first for quick check, then Query 8 for recommendations  
**Next**: Use Clean button or manual SQL delete based on analysis
