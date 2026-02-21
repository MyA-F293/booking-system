# Admin Schedule CRUD - Implementation Guide

## ✅ Sudah Diimplementasikan

1. **State Management** - Added states for:
   - `selectedStudentsForSchedule` - untuk menyimpan student yang dipilih
   - `studentFilterProgram` - untuk filter student berdasarkan program
   - `showDuplicateWarning` - untuk menampilkan modal warning duplikat
   - `duplicateScheduleInfo` - untuk menyimpan info schedule yang duplikat

2. **Duplicate Detection Logic** - Di `handleSaveSchedule()`:
   - Check database untuk schedule yang sama sebelum insert
   - Jika ditemukan duplikat, tampilkan modal warning
   - Jika tidak duplikat, lanjutkan create schedule

3. **Student Assignment** - Di `handleSaveSchedule()`:
   - Setelah schedule dibuat, assign students yang dipilih
   - Insert bookings untuk semua selected students
   - Show success message dengan jumlah students assigned

4. **Import AlertCircle** - Sudah ditambahkan ke lucide-react imports

## 📝 Yang Perlu Ditambahkan Manual

Karena file `AdminBookingDashboard.jsx` terlalu besar (>2000 lines), Anda perlu menambahkan 2 komponen berikut secara manual:

---

### 1. DUPLICATE WARNING MODAL

**Lokasi**: Tambahkan di bagian bawah return statement, sebelum closing `</div>` terakhir (sekitar line 1900-2000)

**Posisi**: Setelah modal WhatsApp dan sebelum closing tag

```jsx
{/* ==================== DUPLICATE WARNING MODAL ==================== */}
{showDuplicateWarning && createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 px-4 py-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-white" />
                <h3 className="text-base font-bold text-white">Duplicate Schedule Detected!</h3>
            </div>
            
            {/* Body */}
            <div className="p-4">
                <p className="text-sm text-gray-700 mb-3">
                    ⚠️ A schedule already exists with these details:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs border border-gray-200">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Class:</span>
                        <span className="text-gray-800">{duplicateScheduleInfo?.className}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Day:</span>
                        <span className="text-gray-800 capitalize">{duplicateScheduleInfo?.day}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Time:</span>
                        <span className="text-gray-800 capitalize">{duplicateScheduleInfo?.timeSlot}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Phase:</span>
                        <span className="text-gray-800 capitalize">{duplicateScheduleInfo?.phase}</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                    💡 Please choose a different day, time slot, or phase to avoid conflicts.
                </p>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 p-3 border-t flex gap-2">
                <button
                    onClick={() => {
                        setShowDuplicateWarning(false);
                        setDuplicateScheduleInfo(null);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm transition-all"
                >
                    OK, Got It
                </button>
            </div>
        </div>
    </div>,
    document.body
)}
```

---

### 2. STUDENT SELECTION SECTION IN CREATE SCHEDULE MODAL

**Lokasi**: Di dalam modal Create Schedule, tambahkan setelah field "Level" dan sebelum field "Week Number"

**Cari section ini** (sekitar line 1750-1800):
```jsx
{/* Level Selection */}
<div>
    <label className="block text-xs font-semibold text-gray-700 mb-2">
        Level <span className="text-red-500">*</span>
    </label>
    ...
</div>
```

**Tambahkan setelahnya**:

```jsx
{/* ==================== STUDENT ASSIGNMENT SECTION ==================== */}
{scheduleFormMode === 'create' && (
    <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700">
                Assign Students (Optional)
            </label>
            <span className="text-[10px] text-gray-500">
                {selectedStudentsForSchedule.length} selected
            </span>
        </div>
        
        {/* Program Filter Buttons */}
        <div className="flex gap-1.5 mb-2 flex-wrap">
            <button
                type="button"
                onClick={() => setStudentFilterProgram('all')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                    studentFilterProgram === 'all' 
                        ? 'bg-[#1F4E8C] text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                All Programs
            </button>
            <button
                type="button"
                onClick={() => setStudentFilterProgram('English Campus & Career')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                    studentFilterProgram === 'English Campus & Career' 
                        ? 'bg-[#1F4E8C] text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                Campus & Career
            </button>
            <button
                type="button"
                onClick={() => setStudentFilterProgram('English for Teens')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                    studentFilterProgram === 'English for Teens' 
                        ? 'bg-[#1F4E8C] text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                Teens
            </button>
            <button
                type="button"
                onClick={() => setStudentFilterProgram('Private')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                    studentFilterProgram === 'Private' 
                        ? 'bg-[#1F4E8C] text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                Private
            </button>
        </div>

        {/* Student List with Checkboxes */}
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50">
            {allStudents
                .filter(s => studentFilterProgram === 'all' || s.program === studentFilterProgram)
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map(student => (
                    <label 
                        key={student.id} 
                        className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors group"
                    >
                        <input
                            type="checkbox"
                            checked={selectedStudentsForSchedule.includes(student.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedStudentsForSchedule([...selectedStudentsForSchedule, student.id]);
                                } else {
                                    setSelectedStudentsForSchedule(selectedStudentsForSchedule.filter(id => id !== student.id));
                                }
                            }}
                            className="rounded border-gray-300 text-[#1F4E8C] focus:ring-[#1F4E8C] focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#1F4E8C] transition-colors">
                                {student.full_name}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                                {student.student_id} • {student.program}
                            </p>
                        </div>
                    </label>
                ))}
            
            {/* Empty State */}
            {allStudents.filter(s => studentFilterProgram === 'all' || s.program === studentFilterProgram).length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                    No students found for this program
                </div>
            )}
        </div>
        
        {/* Info Text */}
        <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
            <Users size={10} />
            Students will be automatically enrolled when schedule is created
        </p>
    </div>
)}
```

---

### 3. UPDATE MODAL CLOSE HANDLER

**Cari button close di modal header** (sekitar line 1690):

```jsx
<button
    onClick={() => setShowScheduleModal(false)}
    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
>
```

**Ganti dengan**:

```jsx
<button
    onClick={() => {
        setShowScheduleModal(false);
        setSelectedStudentsForSchedule([]);
        setStudentFilterProgram('all');
    }}
    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
>
```

---

## 🎯 Cara Implementasi

1. Buka file `booking-system/src/components/AdminBookingDashboard.jsx`
2. Scroll ke bagian bawah (sekitar line 1900-2000)
3. Cari section modal WhatsApp (yang terakhir)
4. Setelah closing tag modal WhatsApp, tambahkan **Duplicate Warning Modal**
5. Scroll ke modal Create Schedule (sekitar line 1750)
6. Cari field "Level Selection"
7. Setelah field Level, tambahkan **Student Assignment Section**
8. Update button close handler di modal header

---

## ✨ Fitur yang Akan Berfungsi

1. ✅ **Duplicate Detection**: Modal warning muncul jika schedule sudah ada
2. ✅ **Student Assignment**: Bisa pilih students saat create schedule
3. ✅ **Program Filter**: Filter students berdasarkan program
4. ✅ **Auto Enrollment**: Students langsung ter-enroll ke schedule baru
5. ✅ **Reduced Modal Size**: Semua item di modal lebih kecil dan compact

---

## 🐛 Testing

Setelah implementasi, test:
1. Create schedule baru → pilih beberapa students → save
2. Coba create schedule yang sama → harus muncul duplicate warning
3. Filter students by program → harus filter dengan benar
4. Check database → students harus ter-assign ke schedule

---

## 📌 Notes

- Duplicate check hanya untuk mode CREATE, tidak untuk EDIT
- Student assignment hanya muncul di mode CREATE
- Filter program default adalah "All Programs"
- Maximum 10 students per schedule (enforced by database trigger)
