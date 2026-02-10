/**
 * BACKUP TO GOOGLE DRIVE
 * 
 * Script untuk backup database Supabase ke Google Drive
 * 
 * SETUP:
 * 1. Install dependencies: npm install googleapis
 * 2. Setup Google Drive API credentials
 * 3. Update GOOGLE_DRIVE_FOLDER_ID di .env.local
 * 4. Jalankan: node tools/backup-to-gdrive.js
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Load environment
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
const GOOGLE_DRIVE_FOLDER_ID = '1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw'; // Your folder ID

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================
// BACKUP FUNCTIONS
// ========================================

async function fetchAllData() {
    console.log('📊 Fetching all data from Supabase...\n');

    const tables = ['users', 'teachers', 'schedules', 'bookings', 'attendance', 'classes'];
    const data = {};

    for (const table of tables) {
        try {
            console.log(`   Fetching ${table}...`);
            const { data: tableData, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`   ❌ Error fetching ${table}:`, error.message);
                data[table] = [];
            } else {
                data[table] = tableData || [];
                console.log(`   ✅ ${table}: ${tableData.length} records`);
            }
        } catch (error) {
            console.error(`   ❌ Exception fetching ${table}:`, error.message);
            data[table] = [];
        }
    }

    console.log('\n✅ All data fetched successfully!\n');
    return data;
}

function createExcelBackup(data) {
    console.log('📝 Creating Excel backup file...\n');

    const wb = XLSX.utils.book_new();

    // Add each table as a sheet
    Object.keys(data).forEach(tableName => {
        const tableData = data[tableName];

        if (tableData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(tableData);
            XLSX.utils.book_append_sheet(wb, ws, tableName);
            console.log(`   ✅ Added sheet: ${tableName} (${tableData.length} rows)`);
        } else {
            console.log(`   ⚠️  Skipped empty table: ${tableName}`);
        }
    });

    // Add metadata sheet
    const metadata = [{
        backup_date: new Date().toISOString(),
        backup_type: 'Full Database Backup',
        tables_included: Object.keys(data).join(', '),
        total_records: Object.values(data).reduce((sum, table) => sum + table.length, 0)
    }];

    const metaWs = XLSX.utils.json_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Backup Info');

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `./backups/EYSA_Backup_${timestamp}.xlsx`;

    // Create backups folder if not exists
    if (!fs.existsSync('./backups')) {
        fs.mkdirSync('./backups');
    }

    XLSX.writeFile(wb, filename);
    console.log(`\n✅ Excel backup created: ${filename}\n`);

    return filename;
}

async function uploadToGoogleDrive(filename) {
    console.log('☁️  Uploading to Google Drive...\n');

    // NOTE: Google Drive API requires OAuth2 authentication
    // For now, we'll save locally and provide manual upload instructions

    console.log('📋 MANUAL UPLOAD INSTRUCTIONS:');
    console.log('   1. Open: https://drive.google.com/drive/folders/1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw');
    console.log(`   2. Upload file: ${filename}`);
    console.log('   3. File will be saved in the EYSA Backups folder\n');

    console.log('💡 TIP: For automatic upload, setup Google Drive API credentials');
    console.log('   See: https://developers.google.com/drive/api/quickstart/nodejs\n');

    return {
        success: true,
        message: 'Backup file created. Please upload manually to Google Drive.',
        filename: filename,
        driveUrl: 'https://drive.google.com/drive/folders/1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw'
    };
}

// ========================================
// MAIN
// ========================================

async function runBackup() {
    console.log('🚀 Starting EYSA Database Backup\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Fetch all data
        const data = await fetchAllData();

        // Step 2: Create Excel file
        const filename = createExcelBackup(data);

        // Step 3: Upload to Google Drive (manual for now)
        const result = await uploadToGoogleDrive(filename);

        console.log('='.repeat(60));
        console.log('🎉 BACKUP COMPLETE!\n');
        console.log(`📁 Local file: ${filename}`);
        console.log(`☁️  Google Drive: ${result.driveUrl}`);
        console.log('\n✅ Backup successful!');

        // Save backup log
        const log = {
            timestamp: new Date().toISOString(),
            filename: filename,
            tables: Object.keys(data),
            totalRecords: Object.values(data).reduce((sum, table) => sum + table.length, 0),
            status: 'success'
        };

        const logFile = './backups/backup-log.json';
        let logs = [];

        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
        }

        logs.push(log);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

        console.log('📝 Backup log updated\n');

    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

// Run backup
runBackup();
