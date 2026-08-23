# Root Cause Analysis: Saturday Phase2 "Swap" Bug

## 🚨 Problem Identified

Dari hasil Step 1, ditemukan **pattern yang aneh**:

### Week 4 Saturday Phase2 (Source):
| Class ID (last 4 char) | Time Slot | Students |
|------------------------|-----------|----------|
| ...0037 | **evening** | 8 |
| ...391c | **afternoon** | 10 |
| + 6 class lainnya | mixed | 8-10 |

### Week 5 Extra Schedules (Target):
| Class ID (last 4 char) | Time Slot | Students | Status |
|------------------------|-----------|----------|--------|
| ...0037 | **afternoon** | 1 | ❌ EXTRA (tidak ada di Week 4) |
| ...391c | **evening** | 1 | ❌ EXTRA (tidak ada di Week 4) |

## 🔍 Pattern Analysis

### Class `e8c465de-9c4b-430e-bb6b-0e4ad1de5037`:
- **Week 4**: Saturday **evening** ✅
- **Week 5**: Saturday **afternoon** ❌ (seharusnya tidak ada)
- **Week 5**: Saturday **evening** ❓ (perlu dicek apakah ada)

### Class `7bf33ed7-eed0-4e1c-938c-cd480fb2391c`:
- **Week 4**: Saturday **afternoon** ✅
- **Week 5**: Saturday **afternoon** ❓ (perlu dicek apakah ada)
- **Week 5**: Saturday **evening** ❌ (seharusnya tidak ada)

**Kesimpulan**: Seperti 2 class ini **"tertukar" time_slot nya**!

---

## 🧪 Hipotesis

### Hipotesis A: Bug Manual Input
Admin accidentally create schedule dengan wrong time_slot.

**Probabilitas**: Low
- Created_at sama (`2026-06-26 04:58:11` & `04:04:44`)
- Pattern "swap" terlalu specific untuk human error

### Hipotesis B: Bug di RPC smart_copy_week
Logic error di RPC yang swap time_slot untuk class tertentu.

**Probabilitas**: Medium
- Perlu review RPC code
- Kemungkinan ada bug di loop atau mapping

### Hipotesis C: Duplicate + Delete Gone Wrong
Ada duplicate schedule yang di-delete, tapi yang salah yang kehapus.

**Probabilitas**: High
- Original schedule (correct time_slot) masih ada di Week 5
- Extra schedule (wrong time_slot) juga ada
- Total = 2 extra

**Expected scenario:**
1. Copy Week 4 → Week 5 (correct)
2. Manual add Saturday afternoon/evening (duplicate)
3. Sekarang Week 5 punya 2 versi schedule untuk class yang sama

### Hipotesis D: Race Condition / Concurrent Booking
Copy week jalan, lalu ada concurrent insert dari frontend.

**Probabilitas**: Low
- Timing sangat specific
- Pattern "swap" tidak masuk akal

---

## 🔬 Verification Query

Jalankan: **`database/confirm_swap_bug.sql`**

### Expected Results:

#### Scenario 1: Pure Extra (tidak ada yang correct)
```
Class 1 Week 4: evening ✅
Class 1 Week 5: afternoon ❌ (extra)
Class 1 Week 5: (no evening) ❌ (missing!)

Class 2 Week 4: afternoon ✅
Class 2 Week 5: (no afternoon) ❌ (missing!)
Class 2 Week 5: evening ❌ (extra)
```
**Root cause**: Copy week failed, manual add with wrong time_slot

#### Scenario 2: Both Exist (correct + extra)
```
Class 1 Week 4: evening ✅
Class 1 Week 5: evening ✅ (copied correctly)
Class 1 Week 5: afternoon ❌ (extra, should delete)

Class 2 Week 4: afternoon ✅
Class 2 Week 5: afternoon ✅ (copied correctly)
Class 2 Week 5: evening ❌ (extra, should delete)
```
**Root cause**: Copy week success, but someone add extra schedule

---

## 🎯 Resolution Plan

### If Scenario 1 (Missing + Extra):
**Action**: SWAP time_slot, don't delete!

```sql
-- Fix Class 1: Change afternoon → evening
UPDATE schedules
SET time_slot = 'evening'
WHERE id = '5f3c8508-d890-4cd2-b035-16ffabbc0f86';

-- Fix Class 2: Change evening → afternoon  
UPDATE schedules
SET time_slot = 'afternoon'
WHERE id = '2aa988b4-95ac-4553-b504-4e1508810179';
```

### If Scenario 2 (Correct + Extra):
**Action**: DELETE extra schedules

```sql
-- Delete extra schedules
DELETE FROM schedules
WHERE id IN (
  '5f3c8508-d890-4cd2-b035-16ffabbc0f86',
  '2aa988b4-95ac-4553-b504-4e1508810179'
);
```

---

## 📊 Impact Analysis

### Current State:
- Week 4: 71 schedules (correct)
- Week 5: 73 schedules (2 extra)

### After Fix:
- Week 4: 71 schedules (unchanged)
- Week 5: 71 schedules (correct)

### Affected Students:
- 2 schedules × 1 student each = **2 students**
- Need to check if they have bookings
- Need to move bookings to correct schedule if Scenario 1

---

## ⚠️ Pre-Fix Checklist

Before fixing:
1. ✅ Confirm scenario (1 or 2) with `confirm_swap_bug.sql`
2. ⬜ Check bookings for 2 extra schedules
3. ⬜ Check attendance records
4. ⬜ Backup schedules table
5. ⬜ Execute fix (UPDATE or DELETE)
6. ⬜ Verify count: Week 5 = 71

---

## 🚀 Next Step

**Jalankan**: `database/confirm_swap_bug.sql`

Paste hasil untuk determine Scenario 1 atau 2.
