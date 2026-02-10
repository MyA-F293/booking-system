/**
 * TOOL: Import Excel/CSV Attendance dengan Smart Matching
 * 
 * SUPPORT:
 * ✅ Excel (.xlsx, .xls)
 * ✅ CSV (.csv)
 * ✅ Smart fuzzy matching (85%+ similarity)
 * ✅ Auto-adjust nama dari database
 * 
 * CARA PAKAI:
 * 1. Simpan file sebagai 'attendance-to-import.xlsx' atau 'attendance-to-import.csv' di folder tools/
 * 2. Jalankan: node tools/import-excel.js
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import * as XLSX from 'xlsx';

// ========================================
// LOAD ENVIRONMENT
// ========================================

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
// CONFIG
// ========================================

const CONFIG = {
    excelFilePath: './tools/attendance-to-import.xlsx',
    csvFilePath: './tools/attendance-to-import.csv',
    fuzzyMatchThreshold: 0.85,

    statusMapping: {
        'present': 'present',
        'late': 'late',
        'absent': 'absent',
        'hadir': 'present',
        'terlambat': 'late',
        'tidak hadir': 'absent'
    },

    timeSlotMapping: {
        'afternoon': 'afternoon',
        'evening': 'evening',
        'sore': 'afternoon',
        'malam': 'evening'
    }
};

// ========================================
// HELPERS
// ========================================

function normalizeString(str) {
    if (!str) return '';
    return str.toString().toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
}

function calculateSimilarity(str1, str2) {
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

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
    try {
        // Handle Excel date format
        if (typeof dateStr === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(dateStr);
            return new Date(date.y, date.m - 1, date.d);
        }

        // Handle string format "Friday,Feb 6th 2026"
        const parts = dateStr.toString().split(',');
        if (parts.length >= 2) {
            const datePart = parts[1].trim();
            const cleaned = datePart.replace(/(\d+)(st|nd|rd|th)/, '$1');
            const date = new Date(cleaned);
            if (!isNaN(date.getTime())) return date;
        }

        // Try direct parse
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;

        return null;
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
// DATABASE
// ========================================

async function fetchExistingData() {
    console.log('📊 Fetching existing data from database...\n');

    const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*');

    if (attError) {
        console.error('❌ Error fetching attendance:', attError);
        return {
            attendance: [],
            students: new Set(),
            teachers: new Set(),
            classes: new Set(),
            studentMap: new Map(),
            teacherMap: new Map(),
            classMap: new Map()
        };
    }

    const students = new Set();
    const teachers = new Set();
    const classes = new Set();

    const studentMap = new Map();
    const teacherMap = new Map();
    const classMap = new Map();

    attendance.forEach(record => {
        const studentNorm = normalizeString(record.student_name);
        const teacherNorm = normalizeString(record.teacher_name);
        const classNorm = normalizeString(record.class_name);

        students.add(studentNorm);
        teachers.add(teacherNorm);
        classes.add(classNorm);

        if (!studentMap.has(studentNorm)) {
            studentMap.set(studentNorm, record.student_name);
        }
        if (!teacherMap.has(teacherNorm)) {
            teacherMap.set(teacherNorm, record.teacher_name);
        }
        if (!classMap.has(classNorm)) {
            classMap.set(classNorm, record.class_name);
        }
    });

    console.log(`✅ Found in database:`);
    console.log(`   - ${students.size} unique students`);
    console.log(`   - ${teachers.size} unique teachers`);
    console.log(`   - ${classes.size} unique classes`);
    console.log(`   - ${attendance.length} total attendance records\n`);

    return {
        attendance,
        students,
        teachers,
        classes,
        studentMap,
        teacherMap,
        classMap
    };
}

// ========================================
// MAIN
// ========================================

async function processFile() {
    console.log('🚀 Starting Excel/CSV Import Tool (Smart Matching)\n');
    console.log('='.repeat(60));

    let records = [];
    let fileType = '';

    // Try Excel first
    if (fs.existsSync(CONFIG.excelFilePath)) {
        console.log('📖 Reading Excel file...');
        fileType = 'Excel';

        try {
            const workbook = XLSX.readFile(CONFIG.excelFilePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            records = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: ''
            });

            console.log(`✅ Found ${records.length} rows in Excel (Sheet: ${sheetName})\n`);
        } catch (error) {
            console.error('❌ Error reading Excel:', error.message);
            fileType = '';
        }
    }

    // Try CSV if Excel not found
    if (!fileType && fs.existsSync(CONFIG.csvFilePath)) {
        console.log('📖 Reading CSV file...');
        fileType = 'CSV';

        const csvContent = fs.readFileSync(CONFIG.csvFilePath, 'utf-8');
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        records = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index]?.trim() || '';
            });
            records.push(record);
        }

        console.log(`✅ Found ${records.length} rows in CSV\n`);
    }

    if (!fileType) {
        console.error(`❌ Error: No file found`);
        console.log('\n📝 Please save your file as:');
        console.log('   - "attendance-to-import.xlsx" (Excel), OR');
        console.log('   - "attendance-to-import.csv" (CSV)');
        console.log('   in the tools/ folder');
        process.exit(1);
    }

    const existing = await fetchExistingData();

    const processedRecords = [];
    const warnings = [];
    const newStudents = new Set();
    const newTeachers = new Set();
    const newClasses = new Set();
    const fuzzyMatches = [];

    console.log('🔍 Validating data with smart matching...\n');

    for (let i = 0; i < records.length; i++) {
        const row = records[i];

        const date = parseDate(row.date);
        if (!date) {
            warnings.push(`Row ${i + 1}: Invalid date "${row.date}"`);
            continue;
        }

        const studentName = row.name?.trim();
        const teacherName = row.teacher?.trim();
        const className = row.class?.trim();
        const timeSlot = normalizeString(row.time);
        const status = normalizeString(row['present or absent']);

        if (!studentName || !teacherName || !className) {
            warnings.push(`Row ${i + 1}: Missing required fields`);
            continue;
        }

        const studentNorm = normalizeString(studentName);
        const teacherNorm = normalizeString(teacherName);
        const classNorm = normalizeString(className);

        let finalStudentName = studentName;
        let finalTeacherName = teacherName;
        let finalClassName = className;

        // Smart matching
        if (existing.students.has(studentNorm)) {
            finalStudentName = existing.studentMap.get(studentNorm);
        } else {
            const match = findBestMatch(studentName, Array.from(existing.studentMap.values()));
            if (match.score >= CONFIG.fuzzyMatchThreshold) {
                fuzzyMatches.push({ type: 'student', csv: studentName, database: match.match, score: match.score });
                finalStudentName = match.match;
            } else {
                newStudents.add(studentName);
            }
        }

        if (existing.teachers.has(teacherNorm)) {
            finalTeacherName = existing.teacherMap.get(teacherNorm);
        } else {
            const match = findBestMatch(teacherName, Array.from(existing.teacherMap.values()));
            if (match.score >= CONFIG.fuzzyMatchThreshold) {
                fuzzyMatches.push({ type: 'teacher', csv: teacherName, database: match.match, score: match.score });
                finalTeacherName = match.match;
            } else {
                newTeachers.add(teacherName);
            }
        }

        if (existing.classes.has(classNorm)) {
            finalClassName = existing.classMap.get(classNorm);
        } else {
            const match = findBestMatch(className, Array.from(existing.classMap.values()));
            if (match.score >= CONFIG.fuzzyMatchThreshold) {
                fuzzyMatches.push({ type: 'class', csv: className, database: match.match, score: match.score });
                finalClassName = match.match;
            } else {
                newClasses.add(className);
            }
        }

        const mappedTimeSlot = CONFIG.timeSlotMapping[timeSlot] || 'afternoon';
        const mappedStatus = CONFIG.statusMapping[status] || 'present';

        const record = {
            teacher_name: finalTeacherName,
            class_name: finalClassName,
            program: 'Campus & Career',
            level: 'Starter',
            phase: 'phase1',
            day: date.toLocaleDateString('en-US', { weekday: 'lowercase' }),
            time_slot: mappedTimeSlot,
            week_number: getWeekNumber(date),
            year: date.getFullYear(),
            student_id: `IMPORT_${String(i + 1).padStart(4, '0')}`,
            student_name: finalStudentName,
            status: mappedStatus,
            created_at: date.toISOString()
        };

        processedRecords.push(record);
    }

    // Display results
    console.log('='.repeat(60));
    console.log('📊 VALIDATION RESULTS\n');

    console.log(`✅ Valid records: ${processedRecords.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
        if (warnings.length > 10) console.log(`   ... and ${warnings.length - 10} more\n`);
    }

    console.log('🔗 AUTO-MATCHED (smart fuzzy matching):');
    console.log(`   - ${fuzzyMatches.length} names matched automatically\n`);

    if (fuzzyMatches.length > 0) {
        console.log('   Matched Names:');
        fuzzyMatches.slice(0, 15).forEach(m => {
            console.log(`      ${m.type.padEnd(8)}: "${m.csv}" → "${m.database}" (${(m.score * 100).toFixed(0)}% match)`);
        });
        if (fuzzyMatches.length > 15) console.log(`      ... and ${fuzzyMatches.length - 15} more`);
        console.log();
    }

    console.log('🆕 NEW DATA (not in database):');
    console.log(`   - ${newStudents.size} new students`);
    console.log(`   - ${newTeachers.size} new teachers`);
    console.log(`   - ${newClasses.size} new classes\n`);

    if (newStudents.size > 0) {
        console.log('   New Students:');
        Array.from(newStudents).slice(0, 10).forEach(s => console.log(`      - ${s}`));
        if (newStudents.size > 10) console.log(`      ... and ${newStudents.size - 10} more`);
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

    const answer = await askQuestion('\n❓ Do you want to proceed with import? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Import cancelled');
        process.exit(0);
    }

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
                console.error(`❌ Error batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                errors += batch.length;
            } else {
                imported += batch.length;
                console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`);
            }
        } catch (err) {
            console.error(`❌ Exception batch ${Math.floor(i / batchSize) + 1}:`, err.message);
            errors += batch.length;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPORT COMPLETE!\n');
    console.log(`✅ Successfully imported: ${imported} records`);
    console.log(`❌ Failed: ${errors} records`);
    console.log('='.repeat(60));

    const summary = {
        timestamp: new Date().toISOString(),
        fileType: fileType,
        totalRows: records.length,
        validRecords: processedRecords.length,
        imported: imported,
        failed: errors,
        warnings: warnings,
        fuzzyMatches: fuzzyMatches,
        newStudents: Array.from(newStudents),
        newTeachers: Array.from(newTeachers),
        newClasses: Array.from(newClasses)
    };

    fs.writeFileSync('./tools/import-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to tools/import-summary.json');
}

processFile().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
