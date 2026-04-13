# Cara Lacak Copy Week Issue

## Problem
Copy week tidak meng-copy 100% siswa. Ada siswa yang hilang, ada yang pindah kelas otomatis.

## Quick Investigation

### Step 1: Run Investigation Query
```bash
# Di Supabase SQL Editor, run:
booking-system/database/INVESTIGATE_COPY_WEEK_ISSUE.sql
```

### Step 2: Analyze Results

**Look for:**

1. **Missing Students**
   - Talitha Raabih Faatihah
   - St. Nur Afifah
   - Apakah mereka ada di previous week?
   - Apakah mereka tidak ada di current week?

2. **Students Who Changed Class**
   - Nilna (Tokyo → Oxford)
   - Apakah dia pindah manual atau otomatis?

3. **Booking Timestamps**
   - Kapan siswa booking current week?
   - Apakah sebelum atau sesudah copy?
   - Jam berapa copy dijalankan?

4. **Capacity Issues**
   - Apakah ada kelas yang full?
   - Apakah kelas full sebelum copy?

5. **Copy Success Rate**
   - Berapa % siswa yang ter-copy?
   - Berapa siswa yang hilang?
   - Berapa siswa baru yang masuk?

## Expected Output

### 1. Student Search Results
```
student_id    | full_name              | program
EYSA26020XXX  | Talitha Raabih Faatihah| English for Teens
EYSA26020YYY  | St. Nur Afifah         | English Campus & Career
EYSA26020ZZZ  | Nilna                  | English for Teens
```

### 2. Booking History
```
Week 1 (Previous):
- Talitha: Wednesday evening - Oxford Class ✓
- St. Nur Afifah: Wednesday evening - Oxford Class ✓
- Nilna: Monday afternoon - Tokyo Class ✓

Week 2 (Current):
- Talitha: (not found) ❌
- St. Nur Afifah: (not found) ❌
- Nilna: Monday evening - Oxford Class ❌ (wrong class!)
```

### 3. Wednesday Evening Comparison
```
PREVIOUS WEEK:
Oxford Class - Wednesday evening
- current_students: 8
- Students: Talitha, St. Nur Afifah, [6 others]

CURRENT WEEK:
Oxford Class - Wednesday evening
- current_students: 10 (FULL!)
- Students: [10 new students, no Talitha, no St. Nur Afifah]
```

### 4. Booking Timestamps
```
Current Week Bookings:
00:00:30 - Student A booked Oxford (DURING COPY)
00:01:15 - Student B booked Oxford (DURING COPY)
00:02:45 - Student C booked Oxford (DURING COPY)
...
00:05:00 - Oxford Class FULL (10/10)
00:05:30 - Copy process tries to copy Talitha → FAILED (class full)
00:05:31 - Copy process tries to copy St. Nur Afifah → FAILED (class full)
```

### 5. Missing Students List
```
MISSING FROM CURRENT WEEK:
- Talitha Raabih Faatihah (Oxford - Wednesday evening)
- St. Nur Afifah (Oxford - Wednesday evening)
- [other students if any]
```

### 6. Summary Statistics
```
========================================
COPY WEEK SUMMARY
========================================
Previous Week (1) Students: 45
Current Week (2) Students: 43
Missing Students: 2
New Students: 0
Copy Success Rate: 95.56%
========================================
```

## Root Cause Identification

### Scenario A: Race Condition
**Indicators:**
- Booking timestamps show students booking DURING copy (00:00-00:05)
- Class became full before copy completed
- Missing students were in classes that are now full

**Solution:** Lock schedules during copy

### Scenario B: Capacity Full Before Copy
**Indicators:**
- Class was already at capacity before copy
- New students booked before copy ran
- Copy couldn't add old students (no space)

**Solution:** Copy first, then open booking

### Scenario C: Copy Function Bug
**Indicators:**
- Copy success rate < 95%
- Random students missing (not just full classes)
- No pattern in missing students

**Solution:** Fix copy function logic

## Next Steps

### If Race Condition (Scenario A):
1. Implement schedule locking during copy
2. Prevent new bookings during copy process
3. Test with locked schedules

### If Capacity Issue (Scenario B):
1. Change copy timing (run earlier)
2. Implement priority system (old students first)
3. Temporarily increase capacity during copy

### If Copy Bug (Scenario C):
1. Review copy function code
2. Add error logging
3. Fix logic bugs
4. Add verification step

## Manual Fix for Current Issue

### Fix 1: Restore Missing Students
```sql
-- Add Talitha back to Wednesday evening
-- Add St. Nur Afifah back to Wednesday evening
-- (Will create query after investigation)
```

### Fix 2: Move Nilna Back to Tokyo
```sql
-- Move Nilna from Oxford back to Tokyo
-- (Will create query after investigation)
```

## Prevention

### Best Practice:
1. **Run copy at midnight (00:00)**
2. **Lock booking until copy completes**
3. **Verify copy success before unlocking**
4. **Alert admin if copy < 100%**

### Recommended Timing:
```
23:59:00 - Lock all schedules
00:00:00 - Run copy week
00:00:30 - Copy completes
00:00:31 - Verify copy success
00:00:32 - Unlock schedules
00:00:33 - Students can book
```

---

**Run the investigation query now to see actual data!**

File: `database/INVESTIGATE_COPY_WEEK_ISSUE.sql`
