# ✏️ Cara Edit Attendance untuk Tutor

Panduan lengkap untuk tutor memperbaiki attendance yang sudah disubmit.

---

## 🎯 Kapan Perlu Edit Attendance?

### Scenario 1: Student Terlambat
- Tutor sudah submit attendance dengan status "Present"
- Student datang terlambat
- Tutor perlu ubah status dari "Present" ke "Late"

### Scenario 2: Student Absent Ternyata Hadir
- Tutor mark student sebagai "Absent"
- Student datang setelah submit
- Tutor perlu ubah status dari "Absent" ke "Present" atau "Late"

### Scenario 3: Salah Mark Status
- Tutor tidak sengaja mark status yang salah
- Perlu koreksi sebelum data final

### Scenario 4: Ada Student Baru
- Admin add student baru ke class
- Tutor perlu submit attendance untuk student baru
- Student lama tetap sama, hanya add yang baru

---

## 📝 Cara Edit Attendance (Step by Step)

### Step 1: Login sebagai Tutor
```
1. Buka website
2. Login dengan Teacher ID dan password
3. Masuk ke Teacher Dashboard
```

### Step 2: Select Schedule yang Sudah Disubmit
```
1. Di Teacher Dashboard, lihat list schedule hari ini
2. Klik schedule yang mau diedit
3. System akan load attendance yang sudah ada
```

### Step 3: Lihat Banner "Edit Mode"
```
Akan muncul banner biru:
📝 Edit Mode: Attendance Already Submitted
You can edit existing attendance below. Change any status 
(e.g., Present → Late) and click Submit to update. 
New students will be added automatically.
```

### Step 4: Edit Status yang Salah
```
1. Lihat student list dengan status yang sudah ada
2. Status yang sudah disubmit akan terlihat (button aktif)
3. Klik button status baru untuk student yang mau diubah
   - Present → Late (jika student terlambat)
   - Absent → Present (jika student ternyata hadir)
   - Late → Present (jika koreksi)
4. Status lain yang sudah benar, biarkan saja
```

### Step 5: Submit Update
```
1. Klik button "Submit Attendance"
2. System akan:
   - UPDATE status yang berubah
   - INSERT student baru (jika ada)
   - SKIP yang tidak berubah
3. Tunggu success message
```

### Step 6: Verify Update
```
Success message akan menunjukkan:
- "X new, Y updated" (jika ada new dan update)
- "X new record(s) added" (jika hanya add new)
- "X record(s) updated" (jika hanya update)
- "No changes to save" (jika tidak ada perubahan)
```

---

## 💡 Contoh Kasus

### Contoh 1: Student Terlambat

**Situasi:**
- Tutor submit attendance jam 16:05
- Mark semua student "Present"
- Student A datang jam 16:20 (terlambat)

**Solusi:**
```
1. Select schedule yang sama
2. Lihat banner "Edit Mode"
3. Student A statusnya "Present" (button hijau aktif)
4. Klik button "Late" (kuning) untuk Student A
5. Student lain biarkan "Present"
6. Klik "Submit Attendance"
7. Success: "1 record(s) updated"
```

**Result:**
- Student A: Present → Late ✅
- Student lain: tetap Present ✅

### Contoh 2: Student Absent Ternyata Hadir

**Situasi:**
- Tutor submit attendance, mark Student B "Absent"
- Student B datang 5 menit kemudian
- Tutor perlu ubah ke "Late"

**Solusi:**
```
1. Select schedule yang sama
2. Student B statusnya "Absent" (button merah aktif)
3. Klik button "Late" (kuning) untuk Student B
4. Klik "Submit Attendance"
5. Success: "1 record(s) updated"
```

**Result:**
- Student B: Absent → Late ✅

### Contoh 3: Ada Student Baru

**Situasi:**
- Tutor sudah submit attendance untuk 8 students
- Admin add 2 students baru ke class
- Tutor perlu submit attendance untuk 2 student baru

**Solusi:**
```
1. Select schedule yang sama
2. Lihat banner "Edit Mode"
3. 8 students lama sudah ada statusnya (biarkan)
4. 2 students baru belum ada status (button abu-abu)
5. Mark status untuk 2 students baru (Present/Late/Absent)
6. Klik "Submit Attendance"
7. Success: "2 new record(s) added"
```

**Result:**
- 8 students lama: tetap sama ✅
- 2 students baru: ditambahkan ✅

### Contoh 4: Multiple Changes

**Situasi:**
- Student A: Present → Late (terlambat)
- Student B: Absent → Present (ternyata hadir)
- Student C & D: ada student baru

**Solusi:**
```
1. Select schedule
2. Ubah Student A ke "Late"
3. Ubah Student B ke "Present"
4. Mark Student C & D (new)
5. Klik "Submit Attendance"
6. Success: "2 new, 2 updated"
```

**Result:**
- Student A: updated ✅
- Student B: updated ✅
- Student C & D: inserted ✅
- Student lain: tidak berubah ✅

---

## 🔍 Visual Indicators

### Banner Colors

**Blue Banner (Edit Mode):**
```
📝 Edit Mode: Attendance Already Submitted
```
- Artinya: Attendance sudah ada, bisa diedit
- Warna: Biru (informasi)
- Action: Bisa edit dan submit update

### Button States

**Active Button (Status Sudah Dipilih):**
- Present: Hijau terang + shadow
- Late: Kuning terang + shadow
- Absent: Merah terang + shadow

**Inactive Button (Status Belum Dipilih):**
- Semua: Abu-abu
- Hover: Abu-abu lebih gelap

### Success Messages

**Insert Only:**
```
✅ SUCCESS! X new record(s) added
```

**Update Only:**
```
✅ SUCCESS! X record(s) updated
```

**Insert + Update:**
```
✅ SUCCESS! X new, Y updated
```

**No Changes:**
```
ℹ️ No changes to save
```

---

## ⚠️ Important Notes

### ✅ DO:
1. **Check banner** untuk tahu mode (new vs edit)
2. **Verify status** sebelum submit
3. **Only change** yang perlu diubah
4. **Submit once** setelah semua perubahan
5. **Check success message** untuk konfirmasi

### ❌ DON'T:
1. **Jangan submit 2x** untuk perubahan yang sama
2. **Jangan ubah** status yang sudah benar
3. **Jangan panic** jika ada banner edit mode (ini normal)
4. **Jangan skip** verification setelah submit

### 💡 Tips:
- Edit mode otomatis aktif jika attendance sudah ada
- Bisa edit kapan saja (tidak ada time limit)
- System otomatis detect INSERT vs UPDATE
- Tidak perlu hapus data lama, langsung edit saja
- Check "Attendance Report" untuk verify final data

---

## 🔧 Technical Details

### How It Works

#### 1. Load Existing Attendance
```javascript
// Saat select schedule
const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('schedule_id', schedule.id);

// Map existing status ke form
existingMap[student_id] = status;
```

#### 2. Detect Changes
```javascript
// Saat submit
if (existingRecord) {
    // Record exists
    if (existingRecord.status !== newStatus) {
        // Status changed → UPDATE
        recordsToUpdate.push({...});
    }
} else {
    // Record doesn't exist → INSERT
    recordsToInsert.push({...});
}
```

#### 3. Execute Updates
```javascript
// INSERT new records
await supabase.from('attendance').insert(recordsToInsert);

// UPDATE existing records
for (const record of recordsToUpdate) {
    await supabase
        .from('attendance')
        .update({ status: record.status })
        .eq('id', record.id);
}
```

---

## 🧪 Testing Checklist

### Test Scenario 1: Edit Single Status
- [ ] Select schedule yang sudah disubmit
- [ ] Banner "Edit Mode" muncul
- [ ] Status existing terlihat (button aktif)
- [ ] Ubah 1 status
- [ ] Submit berhasil
- [ ] Success message: "1 record(s) updated"
- [ ] Reload schedule, status sudah berubah

### Test Scenario 2: Add New Student
- [ ] Admin add student baru
- [ ] Tutor select schedule
- [ ] Student baru muncul tanpa status
- [ ] Mark status untuk student baru
- [ ] Submit berhasil
- [ ] Success message: "1 new record(s) added"
- [ ] Student lama tidak berubah

### Test Scenario 3: Multiple Changes
- [ ] Ubah 2 status existing
- [ ] Add 1 student baru
- [ ] Submit berhasil
- [ ] Success message: "1 new, 2 updated"
- [ ] Semua perubahan tersimpan

### Test Scenario 4: No Changes
- [ ] Select schedule
- [ ] Tidak ubah apapun
- [ ] Submit
- [ ] Message: "No changes to save"
- [ ] Data tetap sama

---

## 🚨 Troubleshooting

### Problem: Banner tidak muncul
**Solusi:**
- Refresh page
- Check attendance sudah pernah disubmit atau belum
- Check browser console untuk errors

### Problem: Status tidak berubah setelah submit
**Solusi:**
- Check success message (berapa yang updated)
- Refresh schedule untuk reload data
- Check "Attendance Report" untuk verify
- Check browser console untuk errors

### Problem: Student baru tidak muncul
**Solusi:**
- Refresh schedule list
- Check admin sudah add student ke class atau belum
- Check booking student ke schedule

### Problem: Submit error
**Solusi:**
- Check internet connection
- Check supabase connection
- Try refresh dan submit lagi
- Contact admin jika masih error

---

## 📞 Support

Jika ada masalah dengan edit attendance:
1. Check banner dan success message
2. Refresh page dan try again
3. Check "Attendance Report" untuk verify data
4. Screenshot error dan report ke admin
5. Contact developer jika persistent error

---

**Last Updated:** 2025-02-12
**Version:** 1.0.0
**Status:** ✅ IMPLEMENTED & TESTED
