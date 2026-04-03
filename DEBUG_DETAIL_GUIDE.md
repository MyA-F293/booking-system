# DEBUG GUIDE: Investigasi Detail Race Condition

## PERTANYAAN KUNCI

**Apakah ini benar-benar race condition?**

Untuk jawab ini, kita perlu lihat:
1. Apakah ada schedule yang MIRIP (tanpa program/level) di database?
2. Apakah trigger masih aktif dan block INSERT?
3. Apakah error muncul KONSISTEN atau hanya kadang-kadang?

## LANGKAH DEBUG

### 1. Check Database - Apa yang Trigger Lihat?

**Run SQL:** `database/DEBUG_WHAT_TRIGGER_SEES.sql`

**Expected Output:**

**Scenario A: Trigger Block (Bukan Race Condition)**
```
🔍 What Trigger Sees: 1 schedule found
✅ What Code Checks: 0 schedules found
🚨 TRIGGER WILL BLOCK! Schedule exists (without program filter)
✅ Code will create new schedule
```
→ **Artinya:** Ada schedule dari program lain, trigger block karena tidak cek program

**Scenario B: Race Condition**
```
🔍 What Trigger Sees: 0 schedules found
✅ What Code Checks: 0 schedules found
✅ Trigger will allow (no schedule found)
✅ Code will create new schedule
```
→ **Artinya:** Tidak ada schedule, tapi 2 student klik bersamaan

### 2. Check Trigger Status

**Run SQL:** `database/CHECK_TRIGGER_STATUS_NOW.sql`

**Expected Output:**
```
Trigger: prevent_duplicate_schedule
Status: ✅ Enabled (Origin)
```

**Jika trigger ENABLED:**
- Run `database/DROP_TRIGGER_NOW.sql` untuk drop trigger
- Trigger ini yang bikin masalah!

**Jika trigger DISABLED:**
- Masalahnya bukan trigger
- Cek constraint atau RLS policy

### 3. Check Trigger Function Logic

**Run SQL:** `database/DEBUG_TRIGGER_FUNCTION.sql`

**Look for:**
```sql
-- Function definition akan show EXACT fields yang di-check
-- Harusnya cuma check: class_id, day, time_slot, phase, week_number
-- MISSING: program, level, batch
```

### 4. Test di Browser dengan Console Log

**Steps:**
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Open Console (F12)
3. Login sebagai student
4. Click book Oxford Saturday Evening
5. **LIHAT CONSOLE LOG DENGAN DETAIL:**

**Expected Log (Success):**
```
═══════════════════════════════════════════════════════════
📡 getOrCreateSchedule CALLED
═══════════════════════════════════════════════════════════
🔢 Retry count: 0
📦 Schedule data: {...}
───────────────────────────────────────────────────────────
🚀 STEP 1: Attempting INSERT (optimistic approach)...
📝 INSERT data breakdown:
   - class_id: [uuid]
   - program: English for Teens
   - level: Starter
   - phase: phase2
   - day: saturday
   - time_slot: evening
   - week_number: 2
   - year: 2026
   - batch: 2
───────────────────────────────────────────────────────────
✅✅✅ SUCCESS: Schedule created!
🆔 New schedule ID: [uuid]
═══════════════════════════════════════════════════════════
```

**Expected Log (Duplicate - Trigger Block):**
```
═══════════════════════════════════════════════════════════
📡 getOrCreateSchedule CALLED
═══════════════════════════════════════════════════════════
...
───────────────────────────────────────────────────────────
❌❌❌ INSERT FAILED!
═══════════════════════════════════════════════════════════
🔴 ERROR DETAILS:
   - Message: Duplicate schedule detected! Schedule for this class/day/time/phase/week already exists.
   - Code: P0001 (or 23505)
   - Details: ...
───────────────────────────────────────────────────────────
🔍 ANALYZING ERROR TYPE:
   - Is code 23505? false
   - Contains "Duplicate schedule detected"? true
   - isDuplicateError: true
───────────────────────────────────────────────────────────
🔄 STEP 2: Duplicate detected - fetching existing schedule...
───────────────────────────────────────────────────────────
🔍 Building SELECT query with EXACT same filters:
   - class_id: [uuid]
   - program: English for Teens  ⬅️ Code checks this
   - level: Starter              ⬅️ Code checks this
   ...
───────────────────────────────────────────────────────────
📊 SELECT RESULT:
   - Found: false  ⬅️ TIDAK KETEMU!
   - ⚠️ NO SCHEDULE FOUND!
   - This means: INSERT failed but SELECT also failed
   - Possible causes:
     1. Race condition
     2. Trigger blocking INSERT but schedule does not exist
     3. Database transaction not committed yet
───────────────────────────────────────────────────────────
⏳ RETRY MECHANISM:
   - Waiting 50ms before retry 1/5...
```

### 5. Analisis Console Log

**Jika log menunjukkan:**

**A. INSERT failed + SELECT found schedule:**
```
❌ INSERT FAILED
✅ Found existing schedule
```
→ **Bukan race condition** - schedule memang sudah ada
→ **Solusi:** Code sudah handle dengan baik, harusnya sukses

**B. INSERT failed + SELECT NOT found:**
```
❌ INSERT FAILED
⚠️ NO SCHEDULE FOUND!
```
→ **Ini masalahnya!** Ada 2 kemungkinan:

**Kemungkinan 1: Trigger Block (Bukan Race Condition)**
- Trigger cek schedule TANPA program/level filter
- Trigger find schedule dari program lain
- Trigger block INSERT
- Code cek schedule DENGAN program/level filter
- Code tidak find schedule (karena beda program)
- **Solusi:** Drop trigger

**Kemungkinan 2: True Race Condition**
- 2 student klik bersamaan
- Keduanya INSERT bersamaan
- Salah satu sukses, yang lain error
- Yang error retry dan find schedule
- **Solusi:** Code sudah handle dengan retry mechanism

## CARA BEDAKAN RACE CONDITION vs TRIGGER BLOCK

### Test 1: Single User Test
1. Login sebagai 1 student saja
2. Book Oxford Saturday Evening
3. **Jika ERROR** → **BUKAN race condition!** (cuma 1 user, tidak mungkin race)
4. **Jika SUCCESS** → Lanjut Test 2

### Test 2: Check Database
1. Run `database/DEBUG_WHAT_TRIGGER_SEES.sql`
2. **Jika ada schedule tanpa program filter** → **Trigger block!**
3. **Jika tidak ada schedule** → **True race condition**

### Test 3: Multiple User Test
1. Login sebagai 2 student berbeda (beda browser/incognito)
2. Klik book **BERSAMAAN** (dalam 1 detik)
3. **Jika keduanya ERROR** → **Trigger block!**
4. **Jika salah satu sukses** → **True race condition** (code handle dengan baik)

## KESIMPULAN

**Jika Test 1 (single user) ERROR:**
→ **BUKAN race condition!**
→ **Trigger atau constraint block INSERT**
→ **Solusi:** Drop trigger/constraint

**Jika Test 1 (single user) SUCCESS:**
→ **Mungkin race condition**
→ **Code sudah handle dengan baik**
→ **Test dengan multiple users untuk confirm**

## NEXT STEPS

1. ✅ Code debug sudah ditambahkan (commit: 9027ba9)
2. ⏳ **RUN TEST 1** - Single user test
3. ⏳ **RUN SQL** - `DEBUG_WHAT_TRIGGER_SEES.sql`
4. ⏳ Analisis hasil
5. ⏳ Tentukan solusi (drop trigger atau code fix)

## FILES

- `database/DEBUG_WHAT_TRIGGER_SEES.sql` - Check apa yang trigger lihat
- `database/DEBUG_TRIGGER_FUNCTION.sql` - Check trigger function definition
- `database/CHECK_ALL_PROTECTIONS.sql` - Check semua protections
- `database/DROP_TRIGGER_NOW.sql` - Drop trigger (jika perlu)
- `src/utils/dbHelpers.js` - Enhanced debug logging
