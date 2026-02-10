/**
 * TOOL: Validasi dan Import CSV Attendance
 * 
 * Tool ini akan:
 * 1. Membaca CSV Anda
 * 2. Validasi nama siswa, teacher, class dengan database
 * 3. Tampilkan preview mapping
 * 4. Import hanya jika Anda approve
 * 
 * CARA PAKAI:
 * 1. Simpan CSV Anda sebagai 'attendance-to-import.csv' di folder tools/
 * 2. Update .env.local dengan Supabase credentials
 * 3. Jalankan: node tools/validate-and-import-csv.js
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// ========================================
// LOAD ENVIRONMENT VARIABLES
// ========================================

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    csvFilePath: './tools/attendance-to-import.csv',

    // Mapping time slot
    timeSlotMapping: {
        'afternoon': 'afternoon',
        'evening': 'evening',
        'sore': 'afternoon',
        'malam': 'evening'
    },

    // Mapping status
    statusMapping: {
        'present': 'present',
        'late': 'late',
        'absent': 'absent',
        'hadir': 'present',
        'terlambat': 'late',
        'tidak hadir': 'absent',
        'present or absent': 'present', // Default dari CSV Anda
        'late or not': 'late'
    },

    // Mapping day
    dayMapping: {
        'monday': 'monday',
        'tuesday': 'tuesday',
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
        'saturday': 'saturday',
        'sunday': 'sunday',
        'senin': 'monday',
        'selasa': 'tuesday',
        'rabu': 'wednesday',
        'kamis': 'thursday',
        'jumat': 'friday',
        'sabtu': 'saturday',
        'minggu': 'sunday'
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function normalizeString(str) {
    if (!str) return '';
    return str.toString().toLowerCase().trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove punctuation
}

// Fuzzy matching untuk nama yang mirip
function calculateSimilarity(str1, str2) {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1.0; // Exact match

    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
}

function findBestMatch(name, existingNames) {
    let bestMatch = null;
    let bestScore = 0;

    for (const existing of existingNames) {
        const score = calculateSimilarity(name, existing);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = existing;
        }
    }

    return { match: bestMatch, score: bestScore };
}

function parseDate(dateStr) {
    // Parse "Friday,Feb 6th 2026" format
    try {
        const parts = dateStr.split(',');
        if (parts.length < 2) return null;

        const datePart = parts[1].trim(); // "Feb 6th 2026"
        const cleaned = datePart.replace(/(\d+)(st|nd|rd|th)/, '$1'); // Remove st/nd/rd/th
        const date = new Date(cleaned);

        if (isNaN(date.getTime())) return null;
        return date;
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// ========================================
// DATABASE QUERIES
// ========================================

async function fetchExistingData() {
    console.log('📊 Fetching existing data from database...\n');

    // Fetch existing attendance records
    const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*');

    if (attError) {
        console.error('❌ Error fetching attendance:', attError);
        return { attendance: [], students: new Set(), teachers: new Set(), classes: new Set() };
    }

    // Extract unique values
    const students = new Set();
    const teachers = new Set();
    const classes = new Set();

    attendance.forEach(record => {
        students.add(normalizeString(record.student_name));
        teachers.add(normalizeString(record.teacher_name));
        classes.add(normalizeString(record.class_name));
    });

    console.log(`✅ Found in database:`);
    console.log(`   - ${students.size} unique students`);
    console.log(`   - ${teachers.size} unique teachers`);
    console.log(`   - ${classes.size} unique classes`);
    console.log(`   - ${attendance.length} total attendance records\n`);

    return { attendance, students, teachers, classes };
}

// ========================================
// CSV PROCESSING
// ========================================

async function processCSV() {
    console.log('🚀 Starting CSV Validation and Import Tool\n');
    console.log('='.repeat(60));

    // Check if CSV file exists
    if (!fs.existsSync(CONFIG.csvFilePath)) {
        console.error(`❌ Error: CSV file not found at ${CONFIG.csvFilePath}`);
        console.log('\n📝 Please save your CSV file as "attendance-to-import.csv" in the tools/ folder');
        process.exit(1);
    }

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(CONFIG.csvFilePath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`✅ Found ${records.length} rows in CSV\n`);

    // Fetch existing data
    const existing = await fetchExistingData();

    // Process records
    const processedRecords = [];
    const warnings = [];
    const newStudents = new Set();
    const newTeachers = new Set();
    const newClasses = new Set();

    console.log('🔍 Validating CSV data...\n');

    for (let i = 0; i < records.length; i++) {
        const row = records[i];

        // Parse date
        const date = parseDate(row.date);
        if (!date) {
            warnings.push(`Row ${i + 1}: Invalid date format "${row.date}"`);
            continue;
        }

        // Extract data
        const studentName = row.name?.trim();
        const teacherName = row.teacher?.trim();
        const className = row.class?.trim();
        const timeSlot = normalizeString(row.time);
        const status = normalizeString(row['present or absent']);

        // Validate required fields
        if (!studentName) {
            warnings.push(`Row ${i + 1}: Missing student name`);
            continue;
        }

        if (!teacherName) {
            warnings.push(`Row ${i + 1}: Missing teacher name`);
            continue;
        }

        if (!className) {
            warnings.push(`Row ${i + 1}: Missing class name`);
            continue;
        }

        // Check if exists in database
        const studentNorm = normalizeString(studentName);
        const teacherNorm = normalizeString(teacherName);
        const classNorm = normalizeString(className);

        if (!existing.students.has(studentNorm)) {
            newStudents.add(studentName);
        }

        if (!existing.teachers.has(teacherNorm)) {
            newTeachers.add(teacherName);
        }

        if (!existing.classes.has(classNorm)) {
            newClasses.add(className);
        }

        // Map values
        const mappedTimeSlot = CONFIG.timeSlotMapping[timeSlot] || 'afternoon';
        const mappedStatus = CONFIG.statusMapping[status] || 'present';

        // Create record
        const record = {
            teacher_name: teacherName,
            class_name: className,
            program: 'Campus & Career', // Default, bisa di-update
            level: 'Starter', // Default, bisa di-update
            phase: 'phase1', // Default
            day: date.toLocaleDateString('en-US', { weekday: 'lowercase' }),
            time_slot: mappedTimeSlot,
            week_number: getWeekNumber(date),
            year: date.getFullYear(),
            student_id: `IMPORT_${String(i + 1).padStart(4, '0')}`, // Temporary ID
            student_name: studentName,
            status: mappedStatus,
            created_at: date.toISOString()
        };

        processedRecords.push(record);
    }

    // Display validation results
    console.log('='.repeat(60));
    console.log('📊 VALIDATION RESULTS\n');

    console.log(`✅ Valid records: ${processedRecords.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
        if (warnings.length > 10) {
            console.log(`   ... and ${warnings.length - 10} more warnings\n`);
        }
    }

    console.log('🔗 AUTO-MATCHED (fuzzy matching):');
    console.log(`   - ${fuzzyMatches.length} names matched automatically\n`);

    if (fuzzyMatches.length > 0) {
        console.log('   Matched Names:');
        fuzzyMatches.slice(0, 10).forEach(m => {
            console.log(`      ${m.type}: "${m.csv}" → "${m.database}" (${(m.score * 100).toFixed(0)}% match)`);
        });
        if (fuzzyMatches.length > 10) {
            console.log(`      ... and ${fuzzyMatches.length - 10} more matches`);
        }
        console.log();
    }

    console.log('🆕 NEW DATA (not in database):');
    console.log(`   - ${newStudents.size} new students`);
    console.log(`   - ${newTeachers.size} new teachers`);
    console.log(`   - ${newClasses.size} new classes\n`);

    if (newStudents.size > 0) {
        console.log('   New Students:');
        Array.from(newStudents).slice(0, 10).forEach(s => console.log(`      - ${s}`));
        if (newStudents.size > 10) {
            console.log(`      ... and ${newStudents.size - 10} more`);
        }
        console.log();
    }

    if (newTeachers.size > 0) {
        console.log('   New Teachers:');
        Array.from(newTeachers).forEach(t => console.log(`      - ${t}`));
        console.log();
    }

    if (newClasses.size > 0) {
        console.log('   New Classes:');
        Array.from(newClasses).forEach(c => console.log(`      - ${c}`));
        console.log();
    }

    // Show sample records
    console.log('📝 SAMPLE RECORDS (first 3):\n');
    processedRecords.slice(0, 3).forEach((record, i) => {
        console.log(`Record ${i + 1}:`);
        console.log(`   Date: ${new Date(record.created_at).toLocaleDateString()}`);
        console.log(`   Teacher: ${record.teacher_name}`);
        console.log(`   Class: ${record.class_name}`);
        console.log(`   Student: ${record.student_name}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Week: ${record.week_number}, Year: ${record.year}`);
        console.log();
    });

    console.log('='.repeat(60));

    // Ask for confirmation
    const answer = await askQuestion('\n❓ Do you want to proceed with import? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Import cancelled by user');
        process.exit(0);
    }

    // Import to database
    console.log('\n⏳ Importing to Supabase...\n');

    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < processedRecords.length; i += batchSize) {
        const batch = processedRecords.slice(i, i + batchSize);

        try {
            const { data, error } = await supabase
                .from('attendance')
                .insert(batch);

            if (error) {
                console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                errors += batch.length;
            } else {
                imported += batch.length;
                console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
            }
        } catch (err) {
            console.error(`❌ Exception importing batch ${Math.floor(i / batchSize) + 1}:`, err.message);
            errors += batch.length;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPORT COMPLETE!\n');
    console.log(`✅ Successfully imported: ${imported} records`);
    console.log(`❌ Failed: ${errors} records`);
    console.log('='.repeat(60));

    // Save summary
    const summary = {
        timestamp: new Date().toISOString(),
        totalRows: records.length,
        validRecords: processedRecords.length,
        imported: imported,
        failed: errors,
        warnings: warnings,
        newStudents: Array.from(newStudents),
        newTeachers: Array.from(newTeachers),
        newClasses: Array.from(newClasses)
    };

    fs.writeFileSync('./tools/import-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to tools/import-summary.json');
}

// Run the script
processCSV().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
