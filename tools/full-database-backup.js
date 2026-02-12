/**
 * Full Database Backup Tool
 * Exports all tables with schema and data to SQL format
 * For migration to new hosting/database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// List of all tables to backup
const TABLES = [
    'users',
    'classes',
    'schedules',
    'bookings',
    'attendance',
    'teachers'
];

/**
 * Escape SQL string values
 */
function escapeSQLValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'object') {
        // Handle JSON objects
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    // String - escape single quotes
    return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Get table schema from Supabase
 */
async function getTableSchema(tableName) {
    try {
        // Get one row to understand the structure
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log(`⚠️  Table ${tableName} is empty, using basic schema`);
            return null;
        }

        return Object.keys(data[0]);
    } catch (err) {
        console.error(`❌ Error getting schema for ${tableName}:`, err.message);
        return null;
    }
}

/**
 * Backup single table
 */
async function backupTable(tableName) {
    console.log(`\n📦 Backing up table: ${tableName}`);

    try {
        // Get all data from table
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log(`   ⚠️  Table ${tableName} is empty - skipping`);
            return {
                tableName,
                rowCount: 0,
                sql: `-- Table ${tableName} is empty\n\n`
            };
        }

        console.log(`   ✅ Found ${data.length} rows`);

        // Generate SQL INSERT statements
        const columns = Object.keys(data[0]);
        let sql = `-- Backup for table: ${tableName}\n`;
        sql += `-- Total rows: ${data.length}\n`;
        sql += `-- Backup date: ${new Date().toISOString()}\n\n`;

        // Add TRUNCATE statement (optional, commented out for safety)
        sql += `-- TRUNCATE TABLE ${tableName} CASCADE;\n\n`;

        // Generate INSERT statements in batches
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);

            for (const row of batch) {
                const values = columns.map(col => escapeSQLValue(row[col])).join(', ');
                sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
            }

            sql += '\n';
        }

        return {
            tableName,
            rowCount: data.length,
            sql
        };

    } catch (err) {
        console.error(`   ❌ Error backing up ${tableName}:`, err.message);
        return {
            tableName,
            rowCount: 0,
            sql: `-- Error backing up ${tableName}: ${err.message}\n\n`,
            error: err.message
        };
    }
}

/**
 * Main backup function
 */
async function performFullBackup() {
    console.log('🚀 Starting Full Database Backup...\n');
    console.log('📊 Tables to backup:', TABLES.join(', '));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '..', 'backups');

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `full-backup-${timestamp}.sql`);

    let fullSQL = `-- ============================================\n`;
    fullSQL += `-- EYSA Booking System - Full Database Backup\n`;
    fullSQL += `-- Backup Date: ${new Date().toISOString()}\n`;
    fullSQL += `-- Database: Supabase\n`;
    fullSQL += `-- ============================================\n\n`;

    const results = [];

    // Backup each table
    for (const tableName of TABLES) {
        const result = await backupTable(tableName);
        results.push(result);
        fullSQL += result.sql;
        fullSQL += '\n\n';
    }

    // Write to file
    fs.writeFileSync(backupFile, fullSQL, 'utf8');

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKUP SUMMARY');
    console.log('='.repeat(60));

    let totalRows = 0;
    results.forEach(result => {
        const status = result.error ? '❌' : '✅';
        console.log(`${status} ${result.tableName.padEnd(20)} - ${result.rowCount} rows`);
        totalRows += result.rowCount;
    });

    console.log('='.repeat(60));
    console.log(`📦 Total rows backed up: ${totalRows}`);
    console.log(`💾 Backup file: ${backupFile}`);
    console.log(`📏 File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    console.log('='.repeat(60));

    // Also create a JSON backup for easier programmatic restore
    const jsonBackupFile = path.join(backupDir, `full-backup-${timestamp}.json`);
    const jsonBackup = {
        timestamp: new Date().toISOString(),
        database: 'supabase',
        tables: {}
    };

    for (const tableName of TABLES) {
        const { data } = await supabase.from(tableName).select('*');
        jsonBackup.tables[tableName] = data || [];
    }

    fs.writeFileSync(jsonBackupFile, JSON.stringify(jsonBackup, null, 2), 'utf8');
    console.log(`\n📄 JSON backup also created: ${jsonBackupFile}`);
    console.log(`📏 JSON size: ${(fs.statSync(jsonBackupFile).size / 1024).toFixed(2)} KB`);

    console.log('\n✅ Backup completed successfully!\n');
}

// Run backup
performFullBackup().catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
});
