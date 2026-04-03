# 🔍 Investigasi Lengkap - Oxford Booking Error

## 🎯 LANGKAH INVESTIGASI

### STEP 1: Jalankan SQL Debug (Supabase)

**File:** `booking-system/database/DEBUG_OXFORD_LENGKAP.sql`

**Copy paste ke Supabase SQL Editor dan run.**

Query ini akan menampilkan SEMUA informasi dalam 1 output:
1. Status trigger (enabled/disabled)
2. Oxford Saturday Evening schedules yang ada
3. Duplicate check
4. Empty schedules di Week 2
5. Batch 1 schedules
6. Current week setting
7. Simulasi booking flow

**Output akan tampil dalam 1 tabel besar dengan kolom:**
- section (bagian mana)
- detail (detail info)
- status (status/value)
- diagnosis (kesimpulan)

---

### STEP 2: Test Booking dengan Console Log

1. **Buka browser** (Chrome recommended)
2. **Buka Developer Tools:** `F12` atau `Ctrl + Shift + I`
3. **Pilih tab Console**
4. **Hard refresh:** `Ctrl + Shift + R`
5. **Login sebagai student**
6. **Coba booking Oxford Saturday Evening**
7. **Lihat console log**

**Console log akan menampilkan:**
```
🎯 handleClassSelect called
📡 Creating booking...
👤 User batch: 2
🔍 Has booked this phase: false
👨‍🏫 Selected teacher: ...
📅 Creating schedule with data: {...}
📡 dbHelpers: getOrCreateSchedule called with: {...}
🔍 DEBUG: Full schedule data: {...}
🔍 DEBUG: Building query to check existing schedule...
🔍 DEBUG: Adding day filter: saturday
🔍 DEBUG: Adding batch filter: 2
🔍 DEBUG: Executing query to find existing schedule...
🔍 DEBUG: Query result: { found: false, error: undefined }
📝 Schedule not found, creating new schedule...
🔍 DEBUG: INSERT data: {...}
```

**Jika error muncul, akan ada log:**
```
❌ Error creating schedule: {...}
🔍 DEBUG: Error code: ...
🔍 DEBUG: Error message: ...
🔍 DEBUG: Error details: ...
🔍 DEBUG: Error hint: ...
```

**Jika error dari trigger:**
```
🚨 DEBUG: TRIGGER ERROR DETECTED!
🚨 This error comes from prevent_duplicate_schedule trigger
🚨 Trigger is blocking the INSERT even though schedule should be allowed
🚨 SOLUTION: Disable the trigger in Supabase
```

---

### STEP 3: Analisis Hasil

#### Scenario A: Trigger Masih Enabled
**SQL Output:**
```
1. TRIGGER STATUS | prevent_duplicate_schedule | ✅ ENABLED | ⚠️ Trigger masih aktif - ini penyebab error!
```

**Console Log:**
```
🚨 DEBUG: TRIGGER ERROR DETECTED!
Error message: Duplicate schedule detected! Schedule already exists...
```

**DIAGNOSIS:** Trigger masih aktif dan blocking INSERT
**SOLUSI:** Jalankan `FIX_SEKARANG_SIMPLE.sql` untuk disable trigger

---

#### Scenario B: Empty Schedules Exist
**SQL Output:**
```
4. EMPTY SCHEDULES | Total: 15 | Oxford saturday evening, ... | ⚠️ Empty schedules exist
```

**DIAGNOSIS:** Empty schedules menyebabkan trigger lebih sensitive
**SOLUSI:** Delete empty schedules

---

#### Scenario C: Multiple Oxford Schedules
**SQL Output:**
```
2. OXFORD SATURDAY EVENING SCHEDULES
   Schedule 1: Teens/Starter/NULL - 0/10 students | ⚠️ EMPTY
   Schedule 2: Teens/Starter/2 - 5/10 students | ✅ Available
```

**DIAGNOSIS:** Ada 2 schedules untuk program/level yang sama
**SOLUSI:** Delete yang empty (Schedule 1)

---

#### Scenario D: Batch 1 Schedules Exist
**SQL Output:**
```
5. BATCH 1 SCHEDULES | Total: 9 | Oxford saturday evening (Week 2), ... | ⚠️ Batch 1 schedules exist
```

**DIAGNOSIS:** Old Batch 1 schedules masih ada
**SOLUSI:** Delete semua Batch 1 schedules

---

#### Scenario E: Trigger Function Too Strict
**SQL Output:**
```
6. TRIGGER FUNCTION CHECK | function_definition | ⚠️ Does NOT check program/level/batch - too strict!
```

**DIAGNOSIS:** Trigger hanya check class/day/time/phase/week, tidak check program/level/batch
**SOLUSI:** Disable trigger (code sudah ada duplicate checking)

---

### STEP 4: Apply Fix Based on Diagnosis

#### Fix 1: Disable Trigger + Delete Empty Schedules
**File:** `database/FIX_SEKARANG_SIMPLE.sql`

```sql
ALTER TABLE schedules DISABLE TRIGGER prevent_duplicate_schedule;
DELETE FROM schedules WHERE current_students = 0;
```

**Kapan pakai:** Jika trigger masih enabled DAN ada empty schedules

---

#### Fix 2: Delete Specific Empty Schedules
**File:** `database/DELETE_EMPTY_OXFORD_SATURDAY.sql`

**Kapan pakai:** Jika hanya Oxford Saturday Evening yang bermasalah

---

#### Fix 3: Comprehensive Fix
**File:** `database/FIX_ALL_ISSUES_NOW.sql`

**Kapan pakai:** Jika ada multiple issues (trigger + empty + Batch 1)

---

### STEP 5: Verify Fix

#### Test 1: Single Student Booking
1. Hard refresh: `Ctrl + Shift + R`
2. Login sebagai student
3. Book Oxford Saturday Evening
4. Check console log - harus ada: `✅ Schedule created` atau `✅ Schedule found`
5. Check toast - harus success, tidak ada error

#### Test 2: Multiple Students (Race Condition)
1. Open 2 browsers (Chrome + Firefox)
2. Login sebagai 2 students berbeda
3. Book Oxford Saturday Evening **bersamaan** (dalam 1-2 detik)
4. Check console log di kedua browser
5. Kedua booking harus berhasil

#### Test 3: Verify Database
**Run query:**
```sql
SELECT 
    program,
    level,
    COALESCE(batch, 'NULL') as batch,
    current_students
FROM schedules s
JOIN classes c ON s.class_id = c.id
WHERE c.name = 'Oxford Class'
  AND s.day = 'saturday'
  AND s.time_slot = 'evening'
  AND s.week_number = 2
  AND s.year = 2026;
```

**Expected:**
- 1 schedule per program/level combination
- current_students > 0
- No empty schedules

---

## 📊 DIAGNOSIS CHECKLIST

Gunakan hasil dari `DEBUG_OXFORD_LENGKAP.sql`:

- [ ] Trigger status: DISABLED? (jika ENABLED → disable)
- [ ] Oxford schedules: Ada yang empty? (jika ada → delete)
- [ ] Duplicate check: Ada multiple schedules? (jika ada → delete yang empty)
- [ ] Empty schedules: Ada di Week 2? (jika ada → delete)
- [ ] Batch 1: Ada schedules? (jika ada → delete)
- [ ] Trigger function: Check program/level? (jika tidak → disable trigger)

---

## 🚨 KEMUNGKINAN ROOT CAUSE

### 1. Trigger Masih Enabled (PALING MUNGKIN)
**Symptom:** Error "Duplicate schedule detected!"
**Console:** `🚨 DEBUG: TRIGGER ERROR DETECTED!`
**Fix:** Disable trigger

### 2. Empty Duplicate Schedules
**Symptom:** Kadang bisa, kadang tidak
**SQL:** Multiple Oxford schedules, ada yang empty
**Fix:** Delete empty schedules

### 3. Race Condition
**Symptom:** User A bisa, User B tidak (bersamaan)
**Console:** User B dapat error, User A success
**Fix:** Disable trigger + handle retry di code

### 4. Batch Mismatch
**Symptom:** Student Batch 2 tidak bisa book schedule Batch 1
**SQL:** Schedule batch = '1', student batch = '2'
**Fix:** Delete Batch 1 schedules

---

## 📁 FILES UNTUK INVESTIGASI

### SQL Debug:
- `database/DEBUG_OXFORD_LENGKAP.sql` ← **JALANKAN INI DULU**

### SQL Fix (pilih sesuai diagnosis):
- `database/FIX_SEKARANG_SIMPLE.sql` ← Simple fix (disable + delete)
- `database/FIX_ALL_ISSUES_NOW.sql` ← Comprehensive fix
- `database/DELETE_EMPTY_OXFORD_SATURDAY.sql` ← Specific fix

### Code Debug:
- `src/utils/dbHelpers.js` ← Sudah ada debug logging
- `src/BookingSystemDB.jsx` ← Sudah ada debug logging

---

## 🧪 TESTING PROTOCOL

1. **Run SQL debug** → Lihat diagnosis
2. **Apply fix** → Sesuai diagnosis
3. **Hard refresh** → `Ctrl + Shift + R`
4. **Test booking** → Lihat console log
5. **Verify database** → Check schedules
6. **Test race condition** → 2 students bersamaan

---

**Created:** April 3, 2026
**Status:** Investigation tools ready
**Next:** Run `DEBUG_OXFORD_LENGKAP.sql` dan share hasilnya
