# Delete Next Week Button Feature

## ✅ Feature Added

Tombol **"Delete Next Week"** telah ditambahkan di Admin Booking Dashboard untuk menghapus semua jadwal minggu depan dengan konfirmasi.

---

## 🎯 Location

**File**: `src/components/AdminBookingDashboard.jsx`

**UI Position**: Di header Admin Booking, setelah tombol "Copy"

```
[Force Close] [Testing Mode] [Create] [Copy] [Delete Next] [W4][W5][W6]
```

---

## 🎨 UI Components

### 1. Delete Button
- **Color**: Red (bg-red-600)
- **Icon**: Trash2
- **Label**: "Delete Next"
- **State**: Loading spinner saat proses delete
- **Disabled**: Saat sedang proses delete

### 2. Confirmation Modal
- **Title**: "Delete Next Week"
- **Header Color**: Red gradient
- **Content**:
  - Target week display (Week X)
  - Warning list:
    - All schedules will be deleted
    - All bookings will be deleted
    - All attendance records will be deleted
    - Action CANNOT be undone
- **Buttons**:
  - "Yes, Delete All" (Red)
  - "No, Cancel" (Gray)

---

## ⚙️ Functionality

### Flow:
1. **User clicks** "Delete Next" button
2. **Modal appears** with confirmation
3. **User confirms** → handleDeleteNextWeek()
4. **Process**:
   - Step 1: Fetch all schedule IDs for next week
   - Step 2: Delete all bookings (cascade)
   - Step 3: Delete all attendance (cascade)
   - Step 4: Delete all schedules
5. **Success toast** with deleted count
6. **Reload** all schedules

### Code Structure:
```javascript
// State
const [showDeleteNextWeekModal, setShowDeleteNextWeekModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Handler
const handleDeleteNextWeek = async () => {
  // 1. Get schedule IDs
  // 2. Delete bookings
  // 3. Delete attendance
  // 4. Delete schedules
  // 5. Show success
  // 6. Reload
}
```

---

## 📊 Use Cases

### Use Case 1: Fix Week 5 Extra Schedules
**Problem**: Week 5 punya 73 schedules (Week 4 = 71)

**Solution**:
1. Click "Delete Next" (untuk Week 5)
2. Confirm delete
3. Click "Copy" (copy dari Week 4 ke Week 5)
4. Result: Week 5 = 71 schedules ✅

### Use Case 2: Reset Upcoming Week
**Problem**: Ada error di copy week, jadwal Week X kacau

**Solution**:
1. Switch tab ke Week X-1
2. Click "Delete Next" (akan delete Week X)
3. Confirm delete
4. Click "Copy" (copy ulang dari Week X-1)
5. Result: Week X fresh dan correct

### Use Case 3: Cancel Prepared Week
**Problem**: Sudah copy Week 6, tapi ada perubahan plan

**Solution**:
1. Click "Delete Next" untuk Week 6
2. Confirm delete
3. Adjust Week 5 schedules
4. Copy ulang ke Week 6 nanti

---

## ⚠️ Safety Features

### 1. Confirmation Modal
- Double-check sebelum delete
- Jelas tampilkan week mana yang akan dihapus
- Warning list lengkap
- Tombol "No, Cancel" sebagai default mental model

### 2. Error Handling
- Try-catch untuk semua database operations
- Error toast dengan message yang jelas
- Loading state untuk prevent double-click

### 3. No Data Loss (Intended)
- Hanya delete next week (currentWeek + 1)
- Tidak menyentuh current week atau previous weeks
- Cascade delete otomatis (bookings + attendance)

---

## 🔄 Integration dengan Copy Week

### Perfect Workflow:
```
1. Week 4 (current) → 71 schedules ✅
2. Week 5 (next) → 73 schedules ❌

Fix:
→ Switch to Week 4 tab
→ Click "Delete Next" (delete Week 5)
→ Confirm: Yes, Delete All
→ Toast: "Successfully deleted 73 schedules from Week 5"
→ Click "Copy" (copy Week 4 → Week 5)
→ Toast: "Schedules created: 71"
→ Result: Week 5 = 71 schedules ✅
```

---

## 🎨 Visual Design

### Button Design:
```jsx
<button className="px-2.5 sm:px-3 py-1.5 
  bg-red-600 hover:bg-red-700 
  text-white rounded-lg 
  font-medium text-[10px] sm:text-xs
  transition-all flex items-center gap-1 
  shadow-md disabled:opacity-50">
  <Trash2 size={14} />
  <span>Delete Next</span>
</button>
```

### Modal Design:
- Responsive: max-w-md
- Rounded: rounded-2xl sm:rounded-3xl
- Shadow: shadow-xl
- Border: border-gray-100/50
- Backdrop: bg-black/60 backdrop-blur-sm

---

## 🧪 Testing Checklist

### Frontend Testing:
- [ ] Button muncul di header
- [ ] Button disabled saat loading
- [ ] Modal muncul saat click button
- [ ] Modal close saat click X atau Cancel
- [ ] Loading spinner muncul saat proses
- [ ] Toast message muncul (info + success/error)

### Backend Testing:
- [ ] Schedules ter-delete dengan benar
- [ ] Bookings cascade delete
- [ ] Attendance cascade delete
- [ ] Count schedules sebelum = count schedules setelah (di deleted toast)
- [ ] Only next week yang ke-delete (tidak affect current/previous)

### Edge Cases:
- [ ] Next week tidak ada schedules (show info toast)
- [ ] Delete error (show error toast)
- [ ] Network error (show error, tidak stuck di loading)
- [ ] Concurrent delete (button disabled)

---

## 📝 Code Summary

### Files Modified:
- ✅ `src/components/AdminBookingDashboard.jsx`
  - Added state: `showDeleteNextWeekModal`, `isDeleting`
  - Added handler: `handleDeleteNextWeek()`
  - Added button UI
  - Added confirmation modal
  - Added modal scroll lock integration

### Lines Added: ~120 lines
- State: 2 lines
- Handler function: ~55 lines
- Button UI: ~13 lines
- Modal UI: ~50 lines

---

## 🚀 Deployment

### Steps:
1. ✅ Code added to `AdminBookingDashboard.jsx`
2. ⬜ Test locally
3. ⬜ Commit & push
4. ⬜ Deploy to production
5. ⬜ Test in production (with dummy week)
6. ⬜ Document in user guide

### Rollback Plan:
If issues occur, remove:
- State declarations
- handleDeleteNextWeek function
- Delete button UI
- Delete modal UI
- Modal scroll lock addition

---

## 💡 Future Improvements

### Option 1: Select Week to Delete
Instead of always "next week", allow admin to select which week to delete.

### Option 2: Preview Before Delete
Show list of schedules yang akan dihapus sebelum confirm.

### Option 3: Bulk Delete
Delete multiple weeks sekaligus (e.g., Week 5-10).

### Option 4: Soft Delete
Mark as deleted instead of hard delete, dengan restore option.

---

## Status

✅ **Feature Complete**

Ready untuk testing dan deployment.
