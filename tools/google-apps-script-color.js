/**
 * Google Apps Script untuk konversi attendance BERDASARKAN WARNA CELL
 * 
 * CARA PAKAI:
 * 1. Buka Google Sheets Anda
 * 2. Extensions → Apps Script
 * 3. Copy-paste script ini
 * 4. Edit CONFIG (year, startWeek)
 * 5. Klik Run → convertAttendanceByColor
 * 6. Sheet baru "Import Format" akan dibuat otomatis
 * 7. Download sheet tersebut sebagai CSV
 * 8. Import ke Supabase
 * 
 * DETEKSI WARNA:
 * - Hijau (#00ff00, green) → present
 * - Kuning (#ffff00, yellow) → late
 * - Merah (#ff0000, red) → absent
 */

function convertAttendanceByColor() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Auto-detect: gunakan sheet yang sedang aktif
    const sourceSheet = ss.getActiveSheet();

    // Atau jika ingin spesifik, uncomment dan ganti nama sheet:
    // const sourceSheet = ss.getSheetByName('Sheet3');

    // Validasi: pastikan sheet ditemukan
    if (!sourceSheet) {
        SpreadsheetApp.getUi().alert(
            '❌ Error: Sheet tidak ditemukan!\\n\\n' +
            'Pastikan Anda sudah membuka sheet yang berisi data attendance.'
        );
        return;
    }

    Logger.log('📋 Using sheet: ' + sourceSheet.getName());

    // Buat sheet baru untuk output
    let outputSheet = ss.getSheetByName('Import Format');
    if (outputSheet) {
        try {
            ss.deleteSheet(outputSheet);
        } catch (e) {
            // Ignore error jika sheet tidak bisa dihapus
            Logger.log('Could not delete existing sheet: ' + e);
        }
    }
    outputSheet = ss.insertSheet('Import Format');

    // Header
    const headers = [
        'teacher_name', 'class_name', 'program', 'level', 'phase',
        'day', 'time_slot', 'week_number', 'year', 'student_id',
        'student_name', 'status'
    ];
    outputSheet.appendRow(headers);

    // ========================================
    // KONFIGURASI - EDIT INI!
    // ========================================
    const CONFIG = {
        teacherName: 'Unknown Teacher',
        className: 'Unknown Class',
        program: 'Campus & Career',
        day: 'monday',
        timeSlot: 'afternoon',
        year: 2024,      // 🔴 GANTI: 2024 atau 2025?
        startWeek: 2,    // 🔴 Week pertama di spreadsheet = Week 2!

        // Kolom di spreadsheet
        columns: {
            studentId: 1,  // Kolom A = student_id (EYSA2601002, dll)
            name: 2,       // Kolom B = Name
            level: 3,      // Kolom C = level (Starter, dll)
            firstWeek: 4   // Kolom D = WEEK 2 Phase 1 (mulai dari sini)
        },

        // Berapa week yang ada di spreadsheet? (Week 2-9 = 8 weeks)
        totalWeeks: 8
    };

    // Mapping phase
    const phaseMap = {
        'L1': 'phase1',
        'L2': 'phase2',
        'RC': 'recap'
    };

    // ========================================
    // FUNGSI DETEKSI WARNA
    // ========================================
    function parseStatusByColor(cell) {
        const background = cell.getBackground();
        const value = cell.getValue();

        // Skip jika kosong
        if (!value || value === '-' || value === '') return null;

        // CEK TEXT DULU (untuk cell dengan text "Hadir", "Telat", "Alpa")
        const valStr = value.toString().trim().toLowerCase();

        // Deteksi berdasarkan text
        if (valStr === 'hadir' || valStr === '✓') return 'present';
        if (valStr === 'alpa' || valStr === '✗') return 'absent';
        if (valStr === 'telat' || valStr === '@') return 'late';

        // Konversi warna ke lowercase untuk matching
        const bgLower = background.toLowerCase();

        // Deteksi HIJAU = present
        if (bgLower.includes('00ff') ||
            bgLower.includes('0f0') ||
            bgLower === '#00ff00' ||
            bgLower === '#00ff01' ||
            bgLower === '#34a853' ||
            bgLower === '#93c47d' ||
            bgLower === '#6aa84f' ||
            bgLower === '#38761d' ||
            bgLower === '#274e13') {
            return 'present';
        }

        // Deteksi KUNING = late
        if (bgLower.includes('ff0') ||
            bgLower === '#ffff00' ||
            bgLower === '#ffff01' ||
            bgLower === '#fbbc04' ||
            bgLower === '#ffd966' ||
            bgLower === '#f1c232' ||
            bgLower === '#f9cb9c') {
            return 'late';
        }

        // Deteksi MERAH = absent
        if (bgLower.includes('ff00') ||
            bgLower.includes('f00') ||
            bgLower === '#ff0000' ||
            bgLower === '#ff0001' ||
            bgLower === '#ea4335' ||
            bgLower === '#e06666' ||
            bgLower === '#cc0000' ||
            bgLower === '#990000') {
            return 'absent';
        }

        // Deteksi ABU-ABU = absent (untuk simbol @)
        if (bgLower.includes('ccc') ||
            bgLower.includes('999') ||
            bgLower.includes('666') ||
            bgLower === '#cccccc' ||
            bgLower === '#999999' ||
            bgLower === '#666666' ||
            bgLower === '#d9d9d9' ||
            bgLower === '#efefef' ||
            bgLower.includes('gray') ||
            bgLower.includes('grey')) {
            return 'absent';
        }

        // Fallback: cek nilai text lagi (case insensitive)
        const valLower = valStr.toLowerCase();
        if (valLower === 'v' || valLower === 'present' || valLower === 'hadir') return 'present';
        if (valLower === 'x' || valLower === 'absent' || valLower === 'tidak hadir') return 'absent';

        // Jika masih tidak ketemu, skip (jangan log warning untuk mengurangi noise)
        return null;
    }

    // ========================================
    // PROSES DATA
    // ========================================
    const lastRow = sourceSheet.getLastRow();
    let outputData = [];
    let studentIndex = 0;
    let skippedCells = 0;

    // Process setiap siswa (mulai dari row 2, skip header)
    for (let rowIndex = 2; rowIndex <= lastRow; rowIndex++) {
        const studentIdCell = sourceSheet.getRange(rowIndex, CONFIG.columns.studentId);
        const nameCell = sourceSheet.getRange(rowIndex, CONFIG.columns.name);
        const levelCell = sourceSheet.getRange(rowIndex, CONFIG.columns.level);

        const studentId = studentIdCell.getValue();
        const name = nameCell.getValue();
        const level = levelCell.getValue();

        if (!name || !studentId) continue; // Skip empty rows

        studentIndex++;

        // Process setiap week (Week 2-9 = 8 weeks)
        for (let week = 0; week < CONFIG.totalWeeks; week++) {
            const actualWeek = CONFIG.startWeek + week; // Week 2, 3, 4, ...

            // Process setiap phase (Phase 1, Phase 2, Recap)
            ['L1', 'L2', 'RC'].forEach((session, sessionIndex) => {
                // Hitung kolom
                // Week 2: D, E, F (Phase 1, Phase 2, Recap)
                // Week 3: G, H, I (Phase 1, Phase 2, Recap)
                // dst...
                const colIndex = CONFIG.columns.firstWeek + (week * 3) + sessionIndex;

                // Ambil CELL untuk baca warna
                const cell = sourceSheet.getRange(rowIndex, colIndex);

                // Parse status berdasarkan WARNA
                const status = parseStatusByColor(cell);

                if (!status) {
                    skippedCells++;
                    return; // Skip empty atau tidak jelas
                }

                const phase = phaseMap[session];

                outputData.push([
                    CONFIG.teacherName,
                    CONFIG.className,
                    CONFIG.program,
                    level,  // Level dari spreadsheet (Starter, dll)
                    phase,
                    CONFIG.day,
                    CONFIG.timeSlot,
                    actualWeek,  // Week number yang sebenarnya (2, 3, 4, ...)
                    CONFIG.year,
                    studentId,  // Student ID dari kolom A (EYSA2601002, dll)
                    name,
                    status
                ]);
            });
        }
    }

    // ========================================
    // TULIS OUTPUT
    // ========================================
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

    // ========================================
    // SUMMARY
    // ========================================
    const summary = {
        total: outputData.length,
        present: outputData.filter(r => r[11] === 'present').length,
        late: outputData.filter(r => r[11] === 'late').length,
        absent: outputData.filter(r => r[11] === 'absent').length,
        students: studentIndex,
        skipped: skippedCells
    };

    SpreadsheetApp.getUi().alert(
        '✅ Konversi selesai!\\n\\n' +
        '📊 Summary:\\n' +
        '- Total students: ' + summary.students + '\\n' +
        '- Total records: ' + summary.total + '\\n' +
        '- Present: ' + summary.present + '\\n' +
        '- Late: ' + summary.late + '\\n' +
        '- Absent: ' + summary.absent + '\\n' +
        '- Skipped cells: ' + summary.skipped + '\\n\\n' +
        '📥 Sheet "Import Format" sudah dibuat.\\n' +
        'Download sebagai CSV dan import ke Supabase.'
    );
}

/**
 * Test function untuk cek warna cell tertentu
 */
function testColorDetection() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const cell = sheet.getActiveCell();

    const background = cell.getBackground();
    const value = cell.getValue();

    SpreadsheetApp.getUi().alert(
        'Cell Info:\\n\\n' +
        'Value: ' + value + '\\n' +
        'Background: ' + background + '\\n\\n' +
        'Pilih cell yang ingin di-test, lalu run function ini.'
    );
}

/**
 * Tambahkan menu custom di Google Sheets
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📊 Import Tools')
        .addItem('🔄 Convert Attendance (By Color)', 'convertAttendanceByColor')
        .addSeparator()
        .addItem('🎨 Test Color Detection', 'testColorDetection')
        .addToUi();
}
