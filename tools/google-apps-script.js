/**
 * Google Apps Script untuk konversi attendance di Google Sheets
 * 
 * CARA PAKAI:
 * 1. Buka Google Sheets Anda
 * 2. Extensions → Apps Script
 * 3. Copy-paste script ini
 * 4. Klik Run → convertAttendance
 * 5. Sheet baru "Import Format" akan dibuat otomatis
 * 6. Download sheet tersebut sebagai CSV
 * 7. Import ke Supabase
 */

function convertAttendance() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName('Sheet1'); // Ganti jika nama sheet berbeda

    // Buat sheet baru untuk output
    let outputSheet = ss.getSheetByName('Import Format');
    if (outputSheet) {
        ss.deleteSheet(outputSheet);
    }
    outputSheet = ss.insertSheet('Import Format');

    // Header
    const headers = [
        'teacher_name', 'class_name', 'program', 'level', 'phase',
        'day', 'time_slot', 'week_number', 'year', 'student_id',
        'student_name', 'status'
    ];
    outputSheet.appendRow(headers);

    // Konfigurasi
    const CONFIG = {
        teacherName: 'Unknown Teacher',
        className: 'Unknown Class',
        program: 'Campus & Career',
        day: 'monday',
        timeSlot: 'afternoon',
        year: 2024, // GANTI INI
        startWeek: 1
    };

    // Mapping phase
    const phaseMap = {
        'L1': 'phase1',
        'L2': 'phase2',
        'RC': 'recap'
    };

    // Mapping status
    function parseStatus(value) {
        if (!value || value === '-') return null;
        if (value === '✓' || value === 'v') return 'present';
        if (value === '✗' || value === 'x') return 'absent';
        if (value.toLowerCase() === 'late') return 'late';
        return null;
    }

    // Ambil data dari sheet asli
    const lastRow = sourceSheet.getLastRow();
    const data = sourceSheet.getRange(2, 1, lastRow - 1, sourceSheet.getLastColumn()).getValues();

    let outputData = [];
    let studentIndex = 0;

    // Process setiap siswa
    data.forEach((row, index) => {
        const no = row[0];
        const name = row[1];
        const level = row[2];

        if (!name) return; // Skip empty rows

        studentIndex++;
        const studentId = 'IMPORT_' + String(studentIndex).padStart(3, '0');

        // Process setiap week (1-8)
        for (let week = 1; week <= 8; week++) {
            // Process setiap phase (L1, L2, RC)
            ['L1', 'L2', 'RC'].forEach((session, sessionIndex) => {
                // Hitung kolom (D = week 1 L1, E = week 1 L2, F = week 1 RC, dst)
                const colIndex = 3 + (week - 1) * 3 + sessionIndex;
                const cellValue = row[colIndex];

                const status = parseStatus(cellValue);
                if (!status) return; // Skip empty

                const phase = phaseMap[session];

                outputData.push([
                    CONFIG.teacherName,
                    CONFIG.className,
                    CONFIG.program,
                    level,
                    phase,
                    CONFIG.day,
                    CONFIG.timeSlot,
                    CONFIG.startWeek + week - 1,
                    CONFIG.year,
                    studentId,
                    name,
                    status
                ]);
            });
        }
    });

    // Tulis ke output sheet
    if (outputData.length > 0) {
        outputSheet.getRange(2, 1, outputData.length, headers.length).setValues(outputData);
    }

    // Format header
    outputSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4285f4')
        .setFontColor('#ffffff')
        .setFontWeight('bold');

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
        outputSheet.autoResizeColumn(i);
    }

    SpreadsheetApp.getUi().alert(
        'Konversi selesai!\\n\\n' +
        'Total records: ' + outputData.length + '\\n\\n' +
        'Sheet "Import Format" sudah dibuat.\\n' +
        'Download sebagai CSV dan import ke Supabase.'
    );
}

/**
 * Tambahkan menu custom di Google Sheets
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Import Tools')
        .addItem('Convert Attendance', 'convertAttendance')
        .addToUi();
}
