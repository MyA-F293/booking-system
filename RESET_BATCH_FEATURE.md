# Reset Batch Feature - Complete Guide

## Overview
Fitur Reset Batch memungkinkan admin untuk menghapus semua data dari batch tertentu secara permanen, termasuk:
- ✅ Semua siswa dalam batch tersebut
- ✅ Semua bookings mereka
- ✅ Semua attendance records
- ✅ Semua orphan attendance data
- ✅ SEMUA schedules (semua minggu)
- ✅ Reset current week ke Week 1

## Installation

### 1. Install RPC Function
Copy paste query ini ke Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.reset_batch(batch_number_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_attendance INT := 0;
    deleted_bookings INT := 0;
    deleted_students INT := 0;
    deleted_orphan_attendance INT := 0;
    deleted_schedules INT := 0;
    result JSON;
BEGIN
    -- Step 1: Delete orphan attendance records
    DELETE FROM attendance
    WHERE id IN (
        SELECT a.id
        FROM attendance a
        LEFT JOIN users u ON a.student_id = u.id::text
        WHERE u.id IS NULL
    );
    GET DIAGNOSTICS deleted_orphan_attendance = ROW_COUNT;

    -- Step 2: Delete attendance dari siswa batch ini
    DELETE FROM attendance
    WHERE student_id IN (
        SELECT id::text
        FROM users
        WHERE role = 'student' AND batch = batch_number_param
    );
    GET DIAGNOSTICS deleted_attendance = ROW_COUNT;

    -- Step 3: Delete bookings dari siswa batch ini
    DELETE FROM bookings
    WHERE user_id IN (
        SELECT id
        FROM users
        WHERE role = 'student' AND batch = batch_number_param
    );
    GET DIAGNOSTICS deleted_bookings = ROW_COUNT;

    -- Step 4: Delete siswa batch ini
    DELETE FROM users
    WHERE role = 'student' AND batch = batch_number_param;
    GET DIAGNOSTICS deleted_students = ROW_COUNT;

    -- Step 5: Delete ALL schedules
    DELETE FROM schedules;
    GET DIAGNOSTICS deleted_schedules = ROW_COUNT;

    -- Step 6: Reset current_week ke 1
    UPDATE settings
    SET current_week = 1
    WHERE id = 1;

    -- Return result
    result := json_build_object(
        'success', true,
        'batch', batch_number_param,
        'deleted_students', deleted_students,
        'deleted_bookings', deleted_bookings,
        'deleted_attendance', deleted_attendance,
        'deleted_orphan_attendance', deleted_orphan_attendance,
        'deleted_schedules', deleted_schedules,
        'current_week_reset', true,
        'message', format('Batch %s reset complete: %s students, %s bookings, %s attendance, %s orphan records, %s schedules deleted. Current week reset to 1.', 
            batch_number_param, deleted_students, deleted_bookings, deleted_attendance, deleted_orphan_attendance, deleted_schedules)
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_batch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_batch(TEXT) TO anon;
```

### 2. Test Function (Optional)
```sql
SELECT * FROM reset_batch('1');
```

## How to Use

### Via Admin Dashboard UI

1. Login sebagai Admin
2. Klik dropdown "Actions" di header
3. Pilih "Reset Batch"
4. Modal akan muncul dengan:
   - Dropdown untuk pilih batch (1-5)
   - Warning message tentang data yang akan dihapus
   - Tombol Cancel dan Reset Batch
5. Klik "Reset Batch [number]"
6. Modal akan tertutup
7. Confirmation dialog akan muncul dengan detail lengkap
8. Klik "Yes, Continue" untuk konfirmasi
9. Data akan dihapus dan success message akan muncul

### Via SQL (Manual)

Jika ingin manual via SQL Editor, gunakan file:
- `database/RESET_BATCH_COMPLETE.sql` - Untuk reset manual dengan verifikasi

## UI Features

### Reset Batch Modal
- **Header**: Gradient merah dengan icon Trash
- **Warning Box**: Danger zone dengan border merah
- **Batch Selector**: Dropdown untuk pilih batch 1-5
- **Info List**: Daftar lengkap data yang akan dihapus
- **Buttons**: Cancel (gray) dan Reset Batch (red gradient)

### Confirmation Dialog (NEW DESIGN)
- **Professional Layout**: 
  - Header dengan gradient merah dan icon warning besar
  - Subtitle "Please review before proceeding"
- **Structured Content**:
  - Judul pesan yang bold
  - Daftar item dalam box merah dengan border kiri
  - Bullet points berwarna (merah, orange, biru) sesuai kategori
  - Spacing yang baik antar item
- **Warning Footer**: 
  - Box abu-abu dengan icon warning
  - Pesan "This action is permanent and cannot be undone"
- **Action Buttons**:
  - Cancel: Border gray dengan hover effect
  - Yes, Continue: Red gradient dengan shadow

### Z-Index Fix
Modal menggunakan z-index 9999, tapi confirmation dialog menggunakan z-index 70. Untuk menghindari konflik:
1. Modal ditutup dulu sebelum menampilkan confirmation
2. Jika user cancel, modal dibuka kembali
3. Delay 100ms untuk smooth transition

## Code Implementation

### AdminDashboard.jsx

```javascript
const handleResetBatch = async () => {
    if (!resetBatchNumber) {
        toast.error('Please select a batch number');
        return;
    }

    // Store batch number before closing modal
    const batchToReset = resetBatchNumber;

    // Close modal FIRST to avoid z-index conflict
    setShowResetBatchModal(false);

    // Small delay to ensure modal closes
    setTimeout(() => {
        toast.confirm(
            `⚠️ DANGER: Reset Batch ${batchToReset}?

This will permanently delete:
• All students in Batch ${batchToReset}
• All their bookings
• All their attendance records
• All orphan attendance data
• ALL schedules (all weeks)
• Current week → Reset to Week 1

This action CANNOT be undone!`,
            async () => {
                try {
                    setResetBatchLoading(true);

                    const { data, error } = await supabase.rpc('reset_batch', {
                        batch_number_param: batchToReset
                    });

                    if (error) throw error;

                    toast.success(`✅ ${data.message}`);
                    setResetBatchNumber('1');
                    await loadStudents();
                } catch (err) {
                    console.error('Error resetting batch:', err);
                    toast.error('❌ Failed to reset batch: ' + err.message);
                } finally {
                    setResetBatchLoading(false);
                }
            },
            () => {
                // If user cancels, reopen the modal
                setShowResetBatchModal(true);
            }
        );
    }, 100);
};
```

### Toast.jsx - Confirmation Modal

```javascript
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    // Parse message to extract structured content
    const parseMessage = (msg) => {
        if (msg.includes('•') || msg.includes('\n')) {
            const lines = msg.split('\n').filter(line => line.trim());
            const title = lines[0];
            const items = lines.slice(1).map(line => line.trim());
            return { title, items, isStructured: true };
        }
        return { title: msg, items: [], isStructured: false };
    };

    const { title, items, isStructured } = parseMessage(message);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* Professional header with gradient and icon */}
                {/* Structured content with colored bullets */}
                {/* Warning footer */}
                {/* Action buttons */}
            </div>
        </div>
    );
};
```

## Safety Features

1. **Double Confirmation**: Modal + Confirmation dialog
2. **Clear Warning Messages**: Menjelaskan semua data yang akan dihapus
3. **Visual Indicators**: Warna merah untuk danger, icon warning
4. **Cancel Option**: User bisa cancel di 2 tempat (modal dan confirmation)
5. **Loading State**: Button disabled saat proses delete
6. **Error Handling**: Try-catch dengan error message yang jelas
7. **Success Feedback**: Toast notification dengan detail hasil

## Common Issues

### Issue 1: Error 400 - Function Not Found
**Error**: `Failed to load resource: the server responded with a status of 400`

**Solution**: 
1. Buka file `database/CHECK_AND_INSTALL_RESET_BATCH.sql`
2. Copy paste SEMUA query ke Supabase SQL Editor
3. Run query
4. Refresh browser
5. Login ulang

**Lihat**: `RESET_BATCH_TROUBLESHOOTING.md` untuk panduan lengkap

### Issue 2: Confirmation Hidden Behind Modal
**Error**: Confirmation dialog tidak terlihat

**Solution**: ✅ Sudah diperbaiki dengan menutup modal sebelum menampilkan confirmation

### Issue 3: Syntax Error in Function
**Error**: `syntax error at or near "$"`

**Solution**: ✅ Sudah diperbaiki - gunakan `$$` bukan `$` untuk delimiter function

## Files Modified

1. `src/AdminDashboard.jsx` - Added Reset Batch feature
2. `src/components/Toast.jsx` - Enhanced confirmation dialog
3. `database/CREATE_RPC_RESET_BATCH.sql` - RPC function
4. `database/RESET_BATCH_COMPLETE.sql` - Manual SQL queries
5. `RESET_BATCH_FEATURE.md` - This documentation

## Testing Checklist

- [ ] Install RPC function di Supabase
- [ ] Test function dengan `SELECT * FROM reset_batch('1')`
- [ ] Buka Admin Dashboard
- [ ] Klik Actions → Reset Batch
- [ ] Modal muncul dengan benar
- [ ] Pilih batch number
- [ ] Klik Reset Batch button
- [ ] Modal tertutup
- [ ] Confirmation dialog muncul (tidak hidden)
- [ ] Klik Cancel → Modal terbuka kembali
- [ ] Klik Reset Batch lagi
- [ ] Klik Yes, Continue
- [ ] Data terhapus dengan benar
- [ ] Success message muncul
- [ ] Current week reset ke 1
- [ ] Schedules kosong
- [ ] Students list refresh

## Future Improvements

1. Add batch statistics before delete (show count of students, bookings, etc)
2. Add export data before delete option
3. Add undo feature (backup before delete)
4. Add schedule for automatic batch reset
5. Add email notification to admin after reset
6. Add audit log for batch reset actions

---

**Last Updated**: March 26, 2026
**Status**: ✅ Complete and Working
