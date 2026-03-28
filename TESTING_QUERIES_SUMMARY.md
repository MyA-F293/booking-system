# 🧪 SQL Testing Queries - Summary

## 🎯 File SQL untuk Testing

Saya sudah buatkan 6 file SQL untuk test sistem week:

---

### 1️⃣ TEST_SEKARANG.sql ⭐⭐⭐ (PALING SIMPLE)
**Waktu**: 1 menit  
**Untuk**: Quick test sekarang juga

**Isi:**
- Check current week
- Check functions installed
- Test increment
- Verify result
- Rollback

**Cara pakai:**
```
1. Buka Supabase > SQL Editor
2. Copy-paste semua dari TEST_SEKARANG.sql
3. Run
4. Done!
```

**Expected:**
```
1️⃣ CURRENT WEEK:     Week 1 ✅
2️⃣ FUNCTIONS:        3 installed ✅
3️⃣ TEST INCREMENT:   Success ✅
4️⃣ AFTER INCREMENT:  Week 2 ✅
5️⃣ ROLLBACK:         Week 1 ✅
```

---

### 2️⃣ QUICK_TEST_WEEK.sql ⭐⭐ (RECOMMENDED)
**Waktu**: 2 menit  
**Untuk**: Quick check dengan detail

**Isi:**
- Current week status
- Functions check
- RLS policies check
- Data distribution by week
- System overview

**Cara pakai:**
```
1. Copy-paste semua
2. Run
3. Lihat hasil lengkap
```

---

### 3️⃣ TEST_MANUAL_INCREMENT.sql ⭐⭐
**Waktu**: 3 menit  
**Untuk**: Test manual increment step-by-step

**Isi:**
- Before increment
- Increment
- After increment
- Compare
- Rollback

**Cara pakai:**
```
1. Copy-paste step by step
2. Run satu per satu
3. Verify setiap step
```

---

### 4️⃣ TEST_GITHUB_ACTIONS_API.sql ⭐⭐⭐
**Waktu**: 5 menit  
**Untuk**: Test API function untuk GitHub Actions

**Isi:**
- Check function exists
- Test dengan API key benar
- Test dengan API key salah
- Verify security
- Rollback

**Cara pakai:**
```
1. Copy-paste semua
2. GANTI 'your-api-key-here' dengan API key Anda
3. Run step by step
4. Verify API works
```

**PENTING**: Ini untuk verify GitHub Actions bisa call API!

---

### 5️⃣ TEST_RESET_BATCH_WEEK.sql ⭐
**Waktu**: 5 menit  
**Untuk**: Test reset batch & week

**Isi:**
- Setup test data
- Check before reset
- Run reset batch
- Verify week = 1
- Verify data deleted

**Cara pakai:**
```
1. Copy-paste semua
2. Run step by step
3. Uncomment reset_batch untuk test
4. Verify hasil
```

**HATI-HATI**: Akan delete data batch!

---

### 6️⃣ TEST_WEEK_SYSTEM_COMPLETE.sql ⭐
**Waktu**: 10 menit  
**Untuk**: Comprehensive testing (20 tests)

**Isi:**
- 20 test cases lengkap
- Performance test
- Security test
- Data consistency test
- End-to-end test

**Cara pakai:**
```
1. Copy-paste test by test
2. Run satu per satu
3. Verify setiap hasil
```

---

## 🚀 Quick Start

### Untuk test cepat (1 menit):
```sql
-- Run: database/TEST_SEKARANG.sql
-- Paling simple, langsung run semua
```

### Untuk verify GitHub Actions (5 menit):
```sql
-- Run: database/TEST_GITHUB_ACTIONS_API.sql
-- GANTI API key dulu!
-- Test apakah API function works
```

### Untuk test lengkap (10 menit):
```sql
-- Run: database/TEST_WEEK_SYSTEM_COMPLETE.sql
-- 20 test cases
-- Comprehensive
```

---

## 📋 Testing Checklist

### Database Testing:
- [ ] Run TEST_SEKARANG.sql → Verify basic functions
- [ ] Run QUICK_TEST_WEEK.sql → Verify system status
- [ ] Run TEST_GITHUB_ACTIONS_API.sql → Verify API works
- [ ] Check hasil: Semua ✅

### UI Testing:
- [ ] Buka AdminDashboard
- [ ] Check header: "Batch X | Week Y"
- [ ] Klik button ▶ → Week naik
- [ ] Check stats: "WY bookings"
- [ ] Test reset batch → Week = 1

### GitHub Actions Testing:
- [ ] Go to: GitHub > Actions tab
- [ ] Check: "Auto Increment Week" workflow
- [ ] Run manual test
- [ ] Check logs: Success ✅
- [ ] Verify database: Week naik +1

---

## 🎯 Priority Testing

**Must Test** (5 menit):
1. TEST_SEKARANG.sql ⭐⭐⭐
2. UI: Klik button ▶
3. Verify: Week naik

**Should Test** (10 menit):
1. TEST_GITHUB_ACTIONS_API.sql ⭐⭐⭐
2. QUICK_TEST_WEEK.sql ⭐⭐
3. GitHub Actions manual run

**Nice to Test** (15 menit):
1. TEST_WEEK_SYSTEM_COMPLETE.sql
2. TEST_RESET_BATCH_WEEK.sql
3. Full UI testing

---

## 💡 Tips

**Jika error saat run SQL:**
```
1. Check connection ke Supabase
2. Check RLS policies (run FIX_SETTINGS_AGGRESSIVE.sql)
3. Check function exists (run CREATE_API_INCREMENT_WEEK.sql)
```

**Jika week tidak increment:**
```
1. Check console browser (F12)
2. Check WeekContext logs
3. Refresh browser (Ctrl+R)
```

**Jika GitHub Actions gagal:**
```
1. Check secrets (3 secrets)
2. Check API key di SQL function
3. Test manual dengan TEST_GITHUB_ACTIONS_API.sql
```

---

## 📊 File Locations

```
booking-system/
├── database/
│   ├── TEST_SEKARANG.sql              ⭐⭐⭐ (1 min)
│   ├── QUICK_TEST_WEEK.sql            ⭐⭐  (2 min)
│   ├── TEST_MANUAL_INCREMENT.sql      ⭐⭐  (3 min)
│   ├── TEST_GITHUB_ACTIONS_API.sql    ⭐⭐⭐ (5 min)
│   ├── TEST_RESET_BATCH_WEEK.sql      ⭐   (5 min)
│   ├── TEST_WEEK_SYSTEM_COMPLETE.sql  ⭐   (10 min)
│   └── RUN_ALL_TESTS.sql              ⭐⭐  (5 min)
└── PANDUAN_TEST_LENGKAP.md            📚 (This file)
```

---

## ✅ Success Criteria

Sistem berfungsi dengan baik jika:
- ✅ TEST_SEKARANG.sql → All pass
- ✅ UI button ▶ → Week naik
- ✅ Reset batch → Week = 1
- ✅ Tidak ada error di console
- ✅ GitHub Actions (optional) → Auto-increment works

---

**Recommendation**: Start dengan **TEST_SEKARANG.sql** (paling simple)

**Date**: 27 Maret 2026
