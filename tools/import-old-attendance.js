/**
 * Script to import old attendance data from Google Sheets CSV to Supabase
 * 
 * INSTRUCTIONS:
 * 1. Export your Google Sheet to CSV
 * 2. Place the CSV file in this directory as 'old-attendance.csv'
 * 3. Update the configuration below
 * 4. Run: node tools/import-old-attendance.js
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

const CONFIG = {
    // Supabase credentials (from your .env.local)
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY',

    // Default values for missing data
    teacherName: 'Unknown Teacher', // Default teacher name
    className: 'Starter Class', // Default class name
    program: 'Campus & Career', // Default program
    level: 'Starter', // Default level
    phase: 'phase1', // Default phase
    day: 'monday', // Default day
    timeSlot: 'afternoon', // Default time slot
    year: 2025, // Year of the data

    // CSV file path
    csvFilePath: './tools/old-attendance.csv',

    // Week mapping (which weeks to import)
    startWeek: 1,
    endWeek: 8,

    // Status color mapping (from spreadsheet colors)
    statusMapping: {
        'green': 'present',
        'yellow': 'late',
        'red': 'absent',
        '✓': 'present',
        '✗': 'absent',
        '-': 'absent'
    }
};

// ========================================
// MAIN SCRIPT
// ========================================

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

async function importAttendance() {
    console.log('🚀 Starting attendance import...\n');

    // Read CSV file
    console.log('📖 Reading CSV file:', CONFIG.csvFilePath);
    const csvContent = fs.readFileSync(CONFIG.csvFilePath, 'utf-8');

    // Parse CSV
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`✅ Found ${records.length} student records\n`);

    const attendanceRecords = [];
    let recordCount = 0;

    // Process each student
    for (const record of records) {
        const studentName = record.NAME || record.name;
        const level = record.LEVEL || record.level || CONFIG.level;

        if (!studentName) {
            console.log('⚠️  Skipping row with no name');
            continue;
        }

        console.log(`📝 Processing: ${studentName}`);

        // Process each week
        for (let week = CONFIG.startWeek; week <= CONFIG.endWeek; week++) {
            // Process L1, L2, RC columns for each week
            const sessions = ['L1', 'L2', 'RC'];
            const days = ['monday', 'wednesday', 'friday']; // Adjust based on your schedule

            sessions.forEach((session, index) => {
                const columnName = `WEEK ${week} ${session}`;
                const cellValue = record[columnName];

                if (!cellValue || cellValue === '-' || cellValue === '') {
                    return; // Skip empty cells
                }

                // Determine status based on cell value or color
                let status = 'absent';
                if (cellValue === '✓' || cellValue.toLowerCase().includes('present')) {
                    status = 'present';
                } else if (cellValue === '✗' || cellValue.toLowerCase().includes('absent')) {
                    status = 'absent';
                } else if (cellValue.toLowerCase().includes('late')) {
                    status = 'late';
                }

                // Create attendance record
                const attendanceRecord = {
                    teacher_name: CONFIG.teacherName,
                    class_name: CONFIG.className,
                    program: CONFIG.program,
                    level: level,
                    phase: CONFIG.phase,
                    day: days[index] || CONFIG.day,
                    time_slot: CONFIG.timeSlot,
                    week_number: week,
                    year: CONFIG.year,
                    student_id: `STUDENT_${recordCount + 1}`, // You may need to map this
                    student_name: studentName,
                    status: status,
                    created_at: new Date().toISOString()
                };

                attendanceRecords.push(attendanceRecord);
                recordCount++;
            });
        }
    }

    console.log(`\n📊 Total attendance records to import: ${attendanceRecords.length}`);
    console.log('⏳ Importing to Supabase...\n');

    // Import in batches of 100
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
        const batch = attendanceRecords.slice(i, i + batchSize);

        try {
            const { data, error } = await supabase
                .from('attendance')
                .insert(batch);

            if (error) {
                console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
                errors += batch.length;
            } else {
                imported += batch.length;
                console.log(`✅ Imported batch ${i / batchSize + 1} (${batch.length} records)`);
            }
        } catch (err) {
            console.error(`❌ Exception importing batch ${i / batchSize + 1}:`, err.message);
            errors += batch.length;
        }
    }

    console.log('\n🎉 Import complete!');
    console.log(`✅ Successfully imported: ${imported} records`);
    console.log(`❌ Failed: ${errors} records`);

    // Save failed records to file for review
    if (errors > 0) {
        console.log('\n💾 Check logs for error details');
    }
}

// Run the import
importAttendance().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
