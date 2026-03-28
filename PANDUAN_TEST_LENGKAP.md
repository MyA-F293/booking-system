# 🧪 Panduan Testing Lengkap - Week System

## 📋 Overview

File SQL untuk testing sistem week setelah reset batch.

---

## 🗂️ File SQL Testing

### 1. QUICK_TEST_WEEK.sql ⭐ (RECOMMENDED)
**Waktu**: 2 menit  
**Untuk**: Quick check sistem week

**Isi:**
- Check current week
- Check functions exist
- Check RLS policies
- Check data by week
- System status summary

**Cara pakai:**
```
1. Buka Supabase > SQL Editor
2. Copy-paste semua dari QUICK_TEST_WEEK.sql
3. Run
4. Lihat hasil
```

---

### 2. TEST_WEEK_SYSTEM_COMPLETE.sql
**Waktu**: 10 menit  
**Untuk**: Comprehensive testing (20 tests)

**Isi:**
- Test 1-5: Basic checks
- Test 6-10: Data consistency
- Test 11-15: Functions
- Test 16-20: End-to-end

**Cara pakai:**
```
1. Buka Supabase > SQL Editor
2. Copy-paste test by test
3. Run satu per satu
4. Verify hasil setiap test
```

---

### 3. TEST_MANUAL_INCREMENT.sql
**Waktu**: 3 menit  
**Untuk**: Test manual increment week

**Isi:**
- Check current week
- Increment week
- Verify new week
- Compare before/after

**Cara pakai:**
```
1. Copy-paste semua
2. Run
3. Verify week naik +1
```

---

### 4. TEST_GITHUB_ACTIONS_API.sql ⭐
**Waktu**: 5 menit  
**Untuk**: Test API function untuk GitHub Actions

**Isi:**
- Check function exists
- Test dengan API key benar
- Test dengan API key salah (security)
- Verify week increment
- Rollback

**Cara pakai:**
```
1. Copy-paste semua
2. GANTI 'your-api-key-here' dengan API key Anda
3. Run step by step
4. Verify hasil
```

**PENTING**: Ganti API key sebelum run!

---

### 5. TEST_RESET_BATCH_WEEK.sql
**Waktu**: 5 menit  
**Untuk**: Test reset batch & week

**Isi:**
- Setup test data (week = 5)
- Check data before reset
- Run reset batch
- Verify week = 1
- Verify data deleted

**Cara pakai:**
```
1. Copy-paste semua
2. Run step by step
3. Uncomment reset_batch line untuk test
4. Verify hasil
```

**HATI-HATI**: Reset batch akan delete data!

---

### 6. RUN_ALL_TESTS.sql
**Waktu**: 5 menit  
**Untuk**: Run semua test sekaligus

**Isi:**
- All basic tests
- System overview
- Data distribution
- Functions check

**Cara pakai:**
```
1. Copy-paste semua
2. Run sekali
3. Lihat hasil lengkap
```

---

## 🎯 Testing Flow (Recommended)

### Quick Test (5 menit):
```
1. Run: QUICK_TEST_WEEK.sql
   ✅ Check current week
   ✅ Check functions
   ✅ Check policies

2. Run: TEST_MANUAL_INCREMENT.sql
   ✅ Test increment
   ✅ Verify week naik

3. Test di UI:
   ✅ Buka AdminDashboard
   ✅ Klik button ▶
   ✅ Verify week naik
```

### Full Test (15 menit):
```
1. Run: RUN_ALL_TESTS.sql
   ✅ All basic tests

2. Run: TEST_GITHUB_ACTIONS_API.sql
   ✅ Test API function
   ✅ Test security

3. Run: TEST_RESET_BATCH_WEEK.sql
   ✅ Test reset batch
   ✅ Verify week = 1

4. Test di UI:
   ✅ Test semua fitur
   ✅ Verify tidak ada error
```

---

## 📊 Expected Results

### QUICK_TEST_WEEK.sql:
```
1️⃣ CURRENT WEEK
   current_week: 1
   updated_wib: 2026-03-27 ...

2️⃣ FUNCTIONS
   increment_current_week  | ✅ Manual increment
   api_increment_week      | ✅ GitHub Actions
   reset_batch             | ✅ Reset batch

3️⃣ RLS POLICIES
   settings_select_policy  | SELECT | {anon, authenticated}

4️⃣ DATA BY WEEK
   week_number | schedules | bookings | attendance | marker
   1           | 0         | 0        | 0          | 👉 Current Week
   2           | 0         | 0        | 0          | 📅 Next Week

5️⃣ SYSTEM STATUS
   {
     "current_week": 1,
     "total_students": 0,
     "total_schedules": 0,
     "total_bookings": 0,
     "total_attendance": 0,
     "last_updated": "2026-03-27..."
   }
```

### TEST_MANUAL_INCREMENT.sql:
```
BEFORE INCREMENT:  current_week = 1
AFTER INCREMENT:   current_week = 2
✅ Week naik +1
```

### TEST_GITHUB_ACTIONS_API.sql:
```
API call dengan key benar:
{
  "success": true,
  "old_week": 1,
  "new_week": 2,
  "timestamp": "..."
}

API call dengan key salah:
{
  "success": false,
  "error": "Invalid API key"
}

✅ Security works
```

### TEST_RESET_BATCH_WEEK.sql:
```
BEFORE RESET:  current_week = 5, students = 50
AFTER RESET:   current_week = 1, students = 0
✅ Reset works
```

---

## 🔧 Troubleshooting

### Function tidak ada:
```sql
-- Check
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name = 'api_increment_week';

-- Jika tidak ada, run:
-- File: database/CREATE_API_INCREMENT_WEEK.sql
```

### Week tidak increment:
```sql
-- Manual set
UPDATE settings SET current_week = 1 WHERE id = 1;

-- Verify
SELECT current_week FROM settings WHERE id = 1;
```

### RLS policy error:
```sql
-- Run fix
-- File: database/FIX_SETTINGS_AGGRESSIVE.sql
```

---

## 📁 File Testing Summary

| File | Waktu | Untuk | Priority |
|------|-------|-------|----------|
| QUICK_TEST_WEEK.sql | 2 min | Quick check | ⭐⭐⭐ |
| TEST_GITHUB_ACTIONS_API.sql | 5 min | Test API | ⭐⭐⭐ |
| TEST_MANUAL_INCREMENT.sql | 3 min | Test increment | ⭐⭐ |
| TEST_RESET_BATCH_WEEK.sql | 5 min | Test reset | ⭐⭐ |
| TEST_WEEK_SYSTEM_COMPLETE.sql | 10 min | Full test | ⭐ |
| RUN_ALL_TESTS.sql | 5 min | All-in-one | ⭐⭐ |

---

## 🚀 Quick Start

### Untuk test cepat (2 menit):
```
1. Run: database/QUICK_TEST_WEEK.sql
2. Verify: Semua hasil OK
3. Done!
```

### Untuk test GitHub Actions (5 menit):
```
1. Run: database/TEST_GITHUB_ACTIONS_API.sql
2. GANTI API key
3. Verify: API function works
4. Setup GitHub Secrets
5. Done!
```

### Untuk test reset batch (5 menit):
```
1. Run: database/TEST_RESET_BATCH_WEEK.sql
2. Uncomment reset_batch line
3. Verify: Week = 1
4. Done!
```

---

## ✅ Success Criteria

Sistem berfungsi dengan baik jika:
- ✅ Current week = 1 (setelah reset)
- ✅ 3 functions installed
- ✅ RLS policies allow SELECT
- ✅ Manual increment works
- ✅ API function works
- ✅ Reset batch → week = 1

---

## 📚 Related Files

**Setup:**
- SETUP_GITHUB_AUTO_INCREMENT.md
- GITHUB_AUTO_INCREMENT_CHECKLIST.txt

**Documentation:**
- SISTEM_WEEK_LENGKAP.md
- VISUAL_WEEK_SYSTEM.md
- VERIFY_GITHUB_ACTIONS_STATUS.md

**Testing:**
- TEST_RESET_BATCH_WEEK.md (UI testing)

---

**Date**: 27 Maret 2026  
**Status**: Ready to Test ✅
