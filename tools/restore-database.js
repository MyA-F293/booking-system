/**
 * Database Restore Tool
 * Restores database from backup file (SQL or JSON)
 * For migration to new hosting/database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

/**
 * Restore from JSON backup
 */
async function restoreFromJSON(backupFile) {
    console.log('📂 Reading JSON backup file...');

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`\n📊 Backup Info:`);
    console.log(`   Date: ${backupData.timestamp}`);
    console.log(`   Database: ${backupData.database}`);
    console.log(`   Tables: ${Object.keys(backupData.tables).length}`);

    // Show table summary
    console.log('\n📋 Tables in backup:');
    for (const [tableName, rows] of Object.entries(backupData.tables)) {
        console.log(`   - ${tableName}: ${rows.length} rows`);
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will INSERT data into your database!');
    console.log('⚠️  Make sure you have backed up your current database first!');
    const confirmed = await askConfirmation('\nDo you want to continue? (yes/no): ');

    if (!confirmed) {
        console.log('❌ Restore cancelled by user');
        return;
    }

    console.log('\n🚀 Starting restore...\n');

    const results = [];

    for (const [tableName, rows] of Object.entries(backupData.tables)) {
        console.log(`📦 Restoring table: ${tableName}`);

        if (rows.length === 0) {
            console.log(`   ⚠️  No data to restore`);
            results.push({ tableName, inserted: 0, errors: 0 });
            continue;
        }

        let inserted = 0;
        let errors = 0;

        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            try {
                const { error } = await supabase
                    .from(tableName)
                    .insert(batch);

                if (error) {
                    console.error(`   ❌ Error inserting batch: ${error.message}`);
                    errors += batch.length;
                } else {
                    inserted += batch.length;
                    process.stdout.write(`\r   ✅ Inserted: ${inserted}/${rows.length} rows`);
                }
            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
                errors += batch.length;
            }
        }

        console.log(''); // New line after progress
        results.push({ tableName, inserted, errors });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESTORE SUMMARY');
    console.log('='.repeat(60));

    results.forEach(result => {
        const status = result.errors > 0 ? '⚠️' : '✅';
        console.log(`${status} ${result.tableName.padEnd(20)} - ${result.inserted} inserted, ${result.errors} errors`);
    });

    console.log('='.repeat(60));
    console.log('\n✅ Restore completed!\n');
}

/**
 * List available backup files
 */
function listBackupFiles() {
    const backupDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupDir)) {
        console.log('❌ No backups directory found');
        return [];
    }

    const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.json') || f.endsWith('.sql'))
        .map(f => ({
            name: f,
            path: path.join(backupDir, f),
            size: fs.statSync(path.join(backupDir, f)).size,
            modified: fs.statSync(path.join(backupDir, f)).mtime
        }))
        .sort((a, b) => b.modified - a.modified);

    return files;
}

/**
 * Main restore function
 */
async function performRestore() {
    console.log('🔄 Database Restore Tool\n');

    // List available backups
    const backups = listBackupFiles();

    if (backups.length === 0) {
        console.log('❌ No backup files found in backups/ directory');
        console.log('💡 Run full-database-backup.js first to create a backup');
        return;
    }

    console.log('📁 Available backup files:\n');
    backups.forEach((backup, index) => {
        const sizeKB = (backup.size / 1024).toFixed(2);
        const date = backup.modified.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`${index + 1}. ${backup.name}`);
        console.log(`   Size: ${sizeKB} KB | Modified: ${date}\n`);
    });

    // Get user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter backup file number to restore (or 0 to cancel): ', async (answer) => {
        rl.close();

        const choice = parseInt(answer);

        if (choice === 0 || isNaN(choice) || choice < 1 || choice > backups.length) {
            console.log('❌ Restore cancelled');
            return;
        }

        const selectedBackup = backups[choice - 1];
        console.log(`\n📂 Selected: ${selectedBackup.name}`);

        if (selectedBackup.name.endsWith('.json')) {
            await restoreFromJSON(selectedBackup.path);
        } else {
            console.log('❌ SQL restore not yet implemented');
            console.log('💡 Please use the JSON backup file for restore');
        }
    });
}

// Run restore
performRestore().catch(err => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
