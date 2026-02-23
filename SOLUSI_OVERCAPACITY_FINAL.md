# 🔴 SOLUSI OVERCAPACITY - Analisis Final

## Status Saat Ini (Setelah UNDO)

### Overcapacity Classes:
1. **Oxford Friday Afternoon (phase2)**: 28 students (need max 10) → **18 over**
2. **Oxford Tuesday Afternoon (phase1)**: 27 students (need max 10) → **17 over**
3. **Harvard Friday Afternoon (phase2)**: 15 students (need max 10) → **5 over**

**TOTAL NEED TO MOVE: 40 students**

## Root Cause Analysis

### Bagaimana Ini Terjadi?

1. **Bug di Create Schedule Form** → Membuat ratusan duplicate schedules kosong
2. **Students tetap booking** → Ke schedule yang sama (yang ada students-nya)
3. **Tidak ada capacity validation** → Saat booking, tidak ada check max 10
4. **Akumulasi dari minggu lalu** → Auto-copy booking dari week 8 ke week 9

### Kenapa Merge Tidak Salah?

Merge script bekerja CORRECT:
- Group by: `class + day + time_slot + phase + week`
- Keep schedule dengan MOST students
- Move bookings dari duplicates ke kept schedule
- **Result**: 28 students tetap 28, bukan jadi 28 karena merge

**Bukti**: Sebelum merge sudah ada 28 students di 1 schedule + 253 duplicate kosong

## Available Slots Analysis

### Slots yang Tersedia (< 10 students):

**Saturday:**
- Oxford Saturday Afternoon (phase2): 4/10 → **6 slots**
- Oxford Saturday Evening (phase2): 3/10 → **7 slots**

**Sunday:**
- Oxford Sunday Afternoon (recap): 6/10 → **4 slots**
- Harvard Sunday Afternoon (recap): 9/10 → **1 slot**

**Wednesday:**
- Oxford Wednesday Afternoon (phase1): 8/10 → **2 slots**
- Oxford Wednesday Evening (phase1): 6/10 → **4 slots**
- Harvard Wednesday Afternoon (phase1): 1/10 → **9 slots**

**TOTAL AVAILABLE: ~33 slots**
**NEED TO MOVE: 40 students**
**GAP: 7 students** ❌

## 3 Solusi yang Tersedia

---

## ✅ OPSI 1: Increase Capacity to 15 Students (RECOMMENDED)

### Pros:
- ✅ Paling cepat (5 menit)
- ✅ Tidak perlu move students
- ✅ Tidak disruptive
- ✅ Tidak perlu notify students
- ✅ Realistic untuk class size

### Cons:
- ⚠️ Class size jadi lebih besar (10 → 15)

### Implementation:
```sql
-- Update max capacity di database
UPDATE classes 
SET max_students = 15 
WHERE name IN ('Oxford Class', 'Harvard Class');
```

### Result:
- Oxford Friday: 28 students → Still over (need 30 capacity)
- Oxford Tuesday: 27 students → Still over (need 30 capacity)
- Harvard Friday: 15 students → ✅ OK

**WAIT!** Ini masih tidak cukup. Need capacity 30 untuk Oxford.

---

## ✅ OPSI 2: Distribute + Create New Schedules (COMPLEX)

### Strategy:
1. Move students ke available slots (33 slots)
2. Create new schedules untuk remaining 7 students
3. Notify students tentang schedule changes

### Steps:

**Step 1: Move to Available Slots (33 students)**
- Oxford Friday Afternoon: Move 18 students
  - 6 → Saturday Afternoon
  - 7 → Saturday Evening
  - 4 → Sunday Afternoon
  - 1 → Harvard Sunday Afternoon
- Oxford Tuesday Afternoon: Move 17 students
  - 2 → Wednesday Afternoon
  - 4 → Wednesday Evening
  - 9 → Harvard Wednesday Afternoon
  - 2 → Create new schedule
- Harvard Friday Afternoon: Move 5 students
  - 5 → Create new schedule

**Step 2: Create New Schedules**
- Oxford Friday Evening 2 (phase2): 2 students
- Harvard Friday Evening 2 (phase2): 5 students

### Pros:
- ✅ Maintain max 10 capacity
- ✅ All students still enrolled

### Cons:
- ❌ Very complex (2-3 hours work)
- ❌ Need to manually select which students to move
- ❌ Need to notify all moved students
- ❌ Students might be unhappy with new schedule
- ❌ Risk of errors during manual selection

---

## ✅ OPSI 3: Cancel All Week 9 + Fresh Start (NUCLEAR)

### Strategy:
1. Cancel ALL week 9 bookings
2. Ask students to rebook with proper capacity validation
3. First come first served

### Steps:
```sql
-- Cancel all week 9 bookings
UPDATE bookings 
SET status = 'cancelled'
WHERE schedule_id IN (
    SELECT id FROM schedules WHERE week_number = 9
);

-- Reset current_students
UPDATE schedules 
SET current_students = 0
WHERE week_number = 9;
```

### Pros:
- ✅ Clean slate
- ✅ Proper capacity validation from start
- ✅ Fair (first come first served)

### Cons:
- ❌ VERY disruptive
- ❌ Students akan complain
- ❌ Need to notify ALL students
- ❌ Some students might not get their preferred schedule

---

## 🎯 RECOMMENDATION

### Best Option: OPSI 1 (Modified)

**Increase capacity to 30 students per class**

Why 30?
- Oxford Friday: 28 students (need 30)
- Oxford Tuesday: 27 students (need 30)
- Harvard Friday: 15 students (OK with 30)

```sql
UPDATE classes 
SET max_students = 30 
WHERE name IN ('Oxford Class', 'Harvard Class');
```

### Alternative: OPSI 2 (If capacity must stay 10)

If you MUST keep max 10, then:
1. Use available 33 slots
2. Create 2 new schedules for remaining 7 students
3. Manually select students to move (prioritize by booking time)
4. Send notification to moved students

### NOT Recommended: OPSI 3

Too disruptive. Only use if:
- You want to completely reset week 9
- You're okay with student complaints
- You have time to handle rebooking process

---

## Decision Time

**Pilih salah satu:**

1. **"Increase capacity to 30"** → I'll run the SQL
2. **"Distribute students (keep max 10)"** → I'll create detailed distribution plan
3. **"Cancel all week 9"** → I'll create cancellation script

**Waiting for your decision...**
