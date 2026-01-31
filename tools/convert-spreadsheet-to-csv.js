/**
 * Simple converter for old attendance spreadsheet format
 * Converts the visual format to Supabase-ready CSV
 * 
 * USAGE:
 * 1. Export your Google Sheet to CSV
 * 2. Update the CONFIG section below
 * 3. Run: node tools/convert-spreadsheet-to-csv.js
 * 4. Output will be saved as 'attendance-import.csv'
 * 5. Import that CSV to Supabase via Dashboard
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    inputFile: './tools/old-attendance.csv',
    outputFile: './tools/attendance-import.csv',

    // Mapping untuk session (L1, L2, RC) ke hari
    sessionToDayMap: {
        'L1': 'monday',
        'L2': 'wednesday',
        'RC': 'friday'
    },

    // Default values
    defaults: {
        teacherName: 'Teacher Name', // GANTI INI
        className: 'Starter Class',   // GANTI INI
        program: 'Campus & Career',   // GANTI INI
        timeSlot: 'afternoon',        // GANTI INI
        year: 2025,                   // GANTI INI
        phase: 'phase1'               // GANTI INI
    },

    // Student ID mapping (opsional - jika tidak ada akan auto-generate)
    studentIdMap: {
        // 'Nama di Spreadsheet': 'STUDENT_ID_DI_DATABASE',
        // Contoh:
        // 'Rosavani (Batch 2)': 'STD001',
        // 'Andi Fatimah Azzahroh': 'STD002',
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function parseStatus(cellValue) {
    if (!cellValue || cellValue === '-' || cellValue.trim() === '') {
        return null; // Skip empty
    }

    const val = cellValue.toLowerCase().trim();

    if (val === '✓' || val === 'v' || val === 'present' || val === 'hadir') {
        return 'present';
    }
    if (val === '✗' || val === 'x' || val === 'absent' || val === 'tidak hadir') {
        return 'absent';
    }
    if (val === 'late' || val === 'terlambat' || val === 'l') {
        return 'late';
    }

    return null;
}

function getStudentId(studentName, index) {
    // Check if there's a manual mapping
    if (CONFIG.studentIdMap[studentName]) {
        return CONFIG.studentIdMap[studentName];
    }

    // Auto-generate
    return `IMPORT_${String(index + 1).padStart(3, '0')}`;
}

// ========================================
// MAIN CONVERSION
// ========================================

function convertAttendance() {
    console.log('🔄 Converting attendance data...\n');

    // Read input CSV
    console.log('📖 Reading:', CONFIG.inputFile);
    const csvContent = fs.readFileSync(CONFIG.inputFile, 'utf-8');

    // Parse CSV
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`✅ Found ${records.length} students\n`);

    const outputRecords = [];

    // Process each student
    records.forEach((record, studentIndex) => {
        const studentName = record.NAME || record.name;
        const level = record.LEVEL || record.level || CONFIG.defaults.level;

        if (!studentName) {
            console.log('⚠️  Skipping row with no name');
            return;
        }

        const studentId = getStudentId(studentName, studentIndex);
        console.log(`📝 ${studentIndex + 1}. ${studentName} → ${studentId}`);

        // Process each week (1-8)
        for (let week = 1; week <= 8; week++) {
            // Process each session (L1, L2, RC)
            ['L1', 'L2', 'RC'].forEach(session => {
                const columnName = `WEEK ${week} ${session}`;
                const cellValue = record[columnName];

                const status = parseStatus(cellValue);

                if (!status) {
                    return; // Skip if no valid status
                }

                // Create output record
                outputRecords.push({
                    teacher_name: CONFIG.defaults.teacherName,
                    class_name: CONFIG.defaults.className,
                    program: CONFIG.defaults.program,
                    level: level,
                    phase: CONFIG.defaults.phase,
                    day: CONFIG.sessionToDayMap[session] || 'monday',
                    time_slot: CONFIG.defaults.timeSlot,
                    week_number: week,
                    year: CONFIG.defaults.year,
                    student_id: studentId,
                    student_name: studentName,
                    status: status
                });
            });
        }
    });

    console.log(`\n📊 Total records created: ${outputRecords.length}`);

    // Write output CSV
    const csvOutput = stringify(outputRecords, {
        header: true,
        columns: [
            'teacher_name',
            'class_name',
            'program',
            'level',
            'phase',
            'day',
            'time_slot',
            'week_number',
            'year',
            'student_id',
            'student_name',
            'status'
        ]
    });

    fs.writeFileSync(CONFIG.outputFile, csvOutput);
    console.log(`✅ Output saved to: ${CONFIG.outputFile}\n`);

    // Print summary
    const summary = {
        present: outputRecords.filter(r => r.status === 'present').length,
        late: outputRecords.filter(r => r.status === 'late').length,
        absent: outputRecords.filter(r => r.status === 'absent').length
    };

    console.log('📈 Summary:');
    console.log(`   Present: ${summary.present}`);
    console.log(`   Late: ${summary.late}`);
    console.log(`   Absent: ${summary.absent}`);
    console.log(`   Total: ${outputRecords.length}\n`);

    console.log('🎉 Conversion complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the output file:', CONFIG.outputFile);
    console.log('2. Go to Supabase Dashboard → Table Editor → attendance');
    console.log('3. Click "Insert" → "Import data from CSV"');
    console.log('4. Upload the output file\n');
}

// Run conversion
try {
    convertAttendance();
} catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\n💡 Tips:');
    console.error('- Make sure the input CSV file exists');
    console.error('- Check that column names match (NAME, LEVEL, WEEK 1 L1, etc.)');
    console.error('- Install dependencies: npm install csv-parse csv-stringify');
    process.exit(1);
}
