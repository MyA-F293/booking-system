# Hapus 2 Schedule Berlebih di Week 5

## 🔍 Hasil Investigasi

### Schedule yang Berlebih (tidak ada di Week 4):

| ID | Class ID | Phase | Day | Time | Students | Created |
|----|----------|-------|-----|------|----------|---------|
| `5f3c8508-d890-4cd2-b035-16ffabbc0f86` | `e8c465de-9c4b-430e-bb6b-0e4ad1de5037` | phase2 | Saturday | afternoon | 1 | 2026-06-26 04:58:11 |
| `2aa988b4-95ac-4553-b504-4e1508810179` | `7bf33ed7-eed0-4e1c-938c-cd480fb2391c` | phase2 | Saturday | evening | 1 | 2026-06-26 04:04:44 |

### Kesimpulan:
✅ Kedua schedule ini **Saturday phase2** (afternoon & evening)
✅ Masing-masing hanya 1 student
✅ Tidak ada pasangan di Week 4 dengan kombinasi yang sama

---

## 📋 Langkah-Langkah Delete

Jalankan query di: **`database/delete_week5_extra_schedules.sql`**

### STEP 1: Lihat Nama Class
Untuk tahu class apa yang akan dihapus

### STEP 2: Check Bookings
Pastikan **0 rows** (tidak ada siswa yang book)

### STEP 3: Check Attendance  
Pastikan **0 rows** (tidak ada attendance record)

### STEP 4: DELETE Schedules
**HANYA jalankan jika Step 2 & 3 = 0 rows**

```sql
DELETE FROM schedules
WHERE id IN (
  '5f3c8508-d890-4cd2-b035-16ffabbc0f86',
  '2aa988b4-95ac-4553-b504-4e1508810179'
);
```

### STEP 5: Verify
Check total schedule Week 4 vs Week 5:
- Expected: **Week 4 = 71, Week 5 = 71** ✅

---

## ⚠️ Jika Ada Bookings/Attendance

**JANGAN DELETE!** Karena:
- Siswa sudah booking → akan error
- Sudah ada attendance → data hilang

**Alternatif:**
1. Pindahkan booking ke schedule lain yang valid
2. Atau biarkan schedule ini (Week 5 memang punya 73)

---

## 🎯 Root Cause

Kemungkinan penyebab 2 schedule extra:
1. **Manual add** - Admin sengaja tambah Saturday phase2 di Week 5
2. **Bug copy_week** - RPC copy schedule yang seharusnya tidak di-copy
3. **Class baru** - Saturday phase2 memang baru dibuka di Week 5

Perlu konfirmasi dengan admin:
- Apakah Saturday phase2 afternoon & evening memang sengaja dibuka di Week 5?
- Atau ini bug yang perlu dihapus?

---

## 📊 Status

🔴 **Menunggu konfirmasi** untuk jalankan DELETE

Jalankan Step 1-3 dulu untuk cek kondisi sebelum delete.
