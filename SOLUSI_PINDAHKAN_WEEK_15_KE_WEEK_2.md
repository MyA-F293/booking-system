# Solusi: Pindahkan Week 15 ke Week 2

## Ide User: Lebih Baik Join daripada Hapus

**User suggestion:** "dari pada hapus joinkan itu yang week 1 ke jadwal yang sama pada week 2"

**Maksudnya:** Daripada hapus booking Week 15, lebih baik pindahkan ke Week 2 (join ke jadwal yang sama).

## Kenapa Ini Lebih Baik?

### Approach 1: Hapus (Original Plan) ❌
- Delete 6 bookings Week 15
- Delete 6 schedules Week 15
- Siswa kehilangan booking mereka
- Siswa harus booking ulang manual
- Perlu inform 2 siswa
- Siswa mungkin lupa booking ulang

### Approach 2: Pindahkan (User Suggestion) ✅
- Move 6 bookings dari Week 15 ke Week 2
- Siswa tidak kehilangan booking
- Tidak perlu booking ulang
- Tidak perlu inform siswa (optional)
- Lebih aman dan user-friendly

## Cara Kerja

### Konsep
```
BEFORE:
Week 2: Harvard Class - Tuesday Evening (5 students)
Week 15: Harvard Class - Tuesday Evening (1 student: Azlam)

AFTER:
Week 2: Harvard Class - Tuesday Evening (6 students) ← Azlam moved here
Week 15: Harvard Class - Tuesday Evening (DELETED - empty)
```

### Flow Diagram
```
STEP 1: Find Matching Schedules
├─ Week 15: Fahd - Sunday Afternoon
└─ Week 2: Fahd - Sunday Afternoon ✅ MATCH!

STEP 2: Move Bookings
├─ Andi's booking: Week 15 → Week 2
└─ Update schedule_id in bookings table

STEP 3: Update Counters
├─ Week 2 Fahd: current_students = 5 → 6
└─ Week 15 Fahd: current_students = 1 → 0

STEP 4: Delete Empty Week 15
└─ DELETE schedules WHERE week_number = 15 AND current_students = 0

STEP 5: Reset Current Week
└─ UPDATE settings SET current_week = 2
```

## Affected Students

### Student 1: Andi Nadila Salsabila Muslim (EYSA26020105)
**Week 15 Bookings (akan dipindahkan):**
- Fahd Class - Sunday Afternoon → Week 2
- Tsinghua Class - Tuesday Afternoon → Week 2
- Tsinghua Class - Friday Afternoon → Week 2

**Result:** 3 bookings moved to Week 2

### Student 2: Azlam Nas (EYSA26020018)
**Week 15 Bookings (akan dipindahkan):**
- Harvard Class - Tuesday Evening → Week 2
- Oxford Class - Thursday Evening → Week 2
- Tokyo Class - Sunday Afternoon → Week 2

**Result:** 3 bookings moved to Week 2

## SQL Query Breakdown

### Query 1: Check Matching Schedules
```sql
-- Cek apakah Week 2 punya jadwal yang sama dengan Week 15
SELECT w15.id, w2.id, c.name, w15.day, w15.time_slot
FROM schedules w15
LEFT JOIN schedules w2 ON 
    w2.class_id = w15.class_id 
    AND w2.day = w15.day 
    AND w2.time_slot = w15.time_slot 
    AND w2.week_number = 2
WHERE w15.week_number = 15;
```

**Expected Result:** All 6 Week 15 schedules have matching Week 2 schedules

### Query 2: Move Bookings
```sql
-- Pindahkan booking dari Week 15 ke Week 2
UPDATE bookings
SET schedule_id = (matching Week 2 schedule_id)
WHERE schedule_id IN (Week 15 schedule_ids);
```

**Result:** 6 bookings moved

### Query 3: Update Counters
```sql
-- Update current_students counter
UPDATE schedules
SET current_students = (SELECT COUNT(*) FROM bookings WHERE schedule_id = schedules.id)
WHERE week_number = 2;
```

**Result:** Week 2 counters updated

### Query 4: Delete Empty Week 15
```sql
-- Hapus Week 15 yang sudah kosong
DELETE FROM schedules
WHERE week_number = 15 AND current_students = 0;
```

**Result:** 6 empty schedules deleted

### Query 5: Reset Current Week
```sql
-- Reset current_week ke 2
UPDATE settings SET current_week = 2 WHERE id = 1;
```

**Result:** current_week = 2

## Safety Checks

### Before Running:
1. ✅ Check if Week 2 has matching schedules
2. ✅ Check if Week 2 has enough capacity
3. ✅ Verify no duplicate bookings will be created

### After Running:
1. ✅ Verify all bookings moved successfully
2. ✅ Verify counters are correct
3. ✅ Verify Week 15 is deleted
4. ✅ Verify current_week = 2

## Potential Issues

### Issue 1: Week 2 Schedule Doesn't Exist
**Scenario:** Week 15 has a schedule that doesn't exist in Week 2

**Solution:** Query will skip that booking (won't move it)

**Action:** Manually create Week 2 schedule first, then run query again

### Issue 2: Week 2 Schedule is Full
**Scenario:** Week 2 schedule already at max_capacity

**Solution:** Query will still move (we can override capacity temporarily)

**Action:** Admin can manually adjust or split class later

### Issue 3: Duplicate Booking
**Scenario:** Student already booked same class in Week 2

**Solution:** Database constraint will prevent duplicate

**Action:** Query will fail for that booking, but continue with others

## Advantages

✅ **User-Friendly:** Students don't lose bookings  
✅ **No Manual Work:** No need for students to rebook  
✅ **Safer:** No data loss  
✅ **Automatic:** One query does everything  
✅ **Maintains History:** Booking timestamps preserved  
✅ **No Communication Needed:** Students see bookings in Week 2 automatically  

## Disadvantages

⚠️ **Capacity Issues:** Week 2 might become overcapacity  
⚠️ **Duplicate Risk:** If student already booked same class in Week 2  
⚠️ **Complex Query:** More complex than simple delete  

## Comparison

| Aspect | Delete Approach | Move Approach |
|--------|----------------|---------------|
| Student Impact | High (lose bookings) | Low (keep bookings) |
| Admin Work | High (inform students) | Low (automatic) |
| Student Work | High (rebook manually) | None |
| Data Loss | Yes (6 bookings) | No |
| Risk | Low | Medium (capacity) |
| Complexity | Simple | Medium |
| User Experience | Poor | Excellent |

## Recommendation

**USE MOVE APPROACH** ✅

Reasons:
1. Better user experience
2. No data loss
3. No manual rebooking needed
4. Students won't even notice the issue
5. More professional solution

## How to Run

### Step 1: Backup (Optional but Recommended)
```sql
-- Backup bookings
CREATE TABLE bookings_backup AS SELECT * FROM bookings;

-- Backup schedules
CREATE TABLE schedules_backup AS SELECT * FROM schedules;
```

### Step 2: Run Main Query
```sql
-- Run the complete query in:
booking-system/database/MOVE_WEEK_15_TO_WEEK_2.sql
```

### Step 3: Verify Results
```sql
-- Check current week
SELECT current_week FROM settings WHERE id = 1;
-- Expected: 2

-- Check Week 15 schedules
SELECT COUNT(*) FROM schedules WHERE week_number = 15;
-- Expected: 0

-- Check moved students
SELECT u.full_name, COUNT(b.id) as bookings
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN schedules s ON b.schedule_id = s.id
WHERE s.week_number = 2
AND u.student_id IN ('EYSA26020105', 'EYSA26020018')
GROUP BY u.full_name;
-- Expected: Andi (3), Azlam (3)
```

## Message to Students (Optional)

### Short Version (WhatsApp)
```
ℹ️ Update: Booking kamu untuk Week 15 sudah otomatis 
dipindahkan ke Week 2 (week yang benar). 

Tidak perlu action dari kamu! Jadwal kelas tetap sama. 😊

- Admin EYSA
```

### Long Version (Email)
```
Dear [Student Name],

We've fixed a system error that caused Week 15 to appear 
in the booking system. 

Good news: Your bookings have been automatically moved 
to Week 2 (the correct week). You don't need to do anything!

Your classes remain the same:
[List their classes]

Thank you for your understanding.

Best regards,
EYSA Admin Team
```

## Next Steps After Fix

1. ✅ Verify all bookings moved successfully
2. ✅ Check GitHub Actions cron schedule
3. ✅ Add safeguards to increment_week() function
4. ✅ Monitor next week increment
5. ✅ (Optional) Inform students about the move

## Files

- `database/MOVE_WEEK_15_TO_WEEK_2.sql` - Complete query
- `database/SHOW_WEEK_15_SIMPLE.sql` - Check current state
- `database/FIX_WEEK_15_NOW.sql` - Delete approach (alternative)
- `MESSAGE_TO_AFFECTED_STUDENTS_WEEK_15.md` - Message templates

---

**Status:** Ready to run  
**Priority:** HIGH  
**Approach:** Move (recommended) ✅  
**Impact:** 2 students, 6 bookings  
**Risk:** Low  
**User Experience:** Excellent

