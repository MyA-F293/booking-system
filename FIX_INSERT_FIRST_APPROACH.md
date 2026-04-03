# FIX: INSERT-First Approach untuk Race Condition

## MASALAH
Error "Duplicate schedule detected!" muncul karena:
1. **Trigger `prevent_duplicate_schedule`** masih aktif (atau ada protection lain)
2. **Race condition** dari pendekatan "check then insert"

## SOLUSI BARU: INSERT-First Pattern

### Pendekatan Lama (BERMASALAH):
```
1. Check apakah schedule ada
2. Kalau tidak ada → INSERT
3. Kalau ada → Return existing

❌ PROBLEM: 2 request bersamaan, keduanya cek "tidak ada", keduanya INSERT → ERROR
```

### Pendekatan Baru (ROBUST):
```
1. Langsung INSERT (optimistic)
2. Kalau sukses → Return new schedule ✅
3. Kalau error duplicate → Fetch existing schedule ✅
4. Retry dengan exponential backoff kalau belum ketemu

✅ BENEFIT: Tidak peduli ada trigger/constraint apa, code akan handle dengan baik
```

## PERUBAHAN CODE

**File:** `src/utils/dbHelpers.js`
**Function:** `getOrCreateSchedule()`

### Key Changes:
1. **Hapus SELECT check** - langsung INSERT
2. **Handle duplicate error** - catch error 23505 atau message "Duplicate schedule detected"
3. **Exponential backoff** - retry 5x dengan delay 50, 100, 200, 400, 800ms
4. **Robust error handling** - handle trigger error dan constraint error

### Error Handling:
```javascript
const isDuplicateError = createError.code === '23505' || 
                        createError.message?.includes('Duplicate schedule detected') ||
                        createError.message?.includes('already exists');
```

Ini akan catch:
- Constraint violation (23505)
- Trigger error ("Duplicate schedule detected!")
- Function error ("already exists")

## TESTING

### Test di Lokal:
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Login sebagai 2 student berbeda
3. Klik book Oxford Saturday Evening **bersamaan**
4. Keduanya harusnya sukses (atau salah satu sukses, yang lain dapat existing schedule)

### Expected Console Log:
```
📝 Attempting INSERT first (optimistic approach)...
⚠️ INSERT failed: Duplicate schedule detected!
✅ Duplicate detected - schedule already exists, fetching it...
✅ Found existing schedule: [schedule_id]
```

## KEUNTUNGAN

1. **Tidak perlu drop trigger** - code handle trigger error dengan baik
2. **Tidak perlu drop constraint** - code handle constraint error dengan baik
3. **Race condition safe** - INSERT-first pattern adalah best practice
4. **Retry mechanism** - exponential backoff untuk handle timing issues
5. **Clear logging** - mudah debug kalau ada masalah

## NEXT STEPS

1. ✅ Code sudah di-commit
2. ⏳ Test di lokal (hard refresh + book Oxford Saturday Evening)
3. ⏳ Verify di console log
4. ⏳ Deploy ke production (setelah test lokal sukses)

## CATATAN

Pendekatan ini adalah **database-agnostic** - tidak peduli ada protection apa di database, code akan handle dengan baik. Ini lebih robust daripada mencoba drop semua trigger/constraint.
