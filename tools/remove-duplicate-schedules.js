/**
 * Remove Duplicate Schedules from Database
 * 
 * This script removes duplicate schedule entries from the database,
 * keeping only ONE unique schedule per combination of:
 * (class_id, day, time_slot, phase, week_number, year)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicates() {
    console.log('\n🔍 Step 1: Finding duplicate schedules...\n');

    const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .order('id');

    if (error) {
        console.error('❌ Error fetching schedules:', error);
        return null;
    }

    // Group schedules by unique key
    const groups = {};
    schedules.forEach(schedule => {
        const key = `${schedule.class_id}-${schedule.day}-${schedule.time_slot}-${schedule.phase}-${schedule.week_number}-${schedule.year}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(schedule);
    });

    // Find groups with duplicates
    const duplicates = {};
    Object.entries(groups).forEach(([key, group]) => {
        if (group.length > 1) {
            duplicates[key] = group;
        }
    });

    return { schedules, duplicates, groups };
}

async function removeDuplicates(duplicates) {
    console.log('\n🗑️  Step 2: Removing duplicate schedules...\n');

    let totalRemoved = 0;
    const idsToDelete = [];

    for (const [key, group] of Object.entries(duplicates)) {
        // Keep the first one (oldest), delete the rest
        const [keep, ...remove] = group.sort((a, b) => a.id - b.id);

        console.log(`📋 ${key}:`);
        console.log(`   ✅ Keeping ID ${keep.id} (${keep.class?.name || 'Unknown'})`);
        console.log(`   ❌ Removing ${remove.length} duplicate(s): ${remove.map(r => r.id).join(', ')}`);

        idsToDelete.push(...remove.map(r => r.id));
        totalRemoved += remove.length;
    }

    if (idsToDelete.length === 0) {
        console.log('\n✅ No duplicates found! Database is clean.\n');
        return 0;
    }

    // Delete duplicates
    console.log(`\n🔄 Deleting ${idsToDelete.length} duplicate schedule(s)...`);

    const { error } = await supabase
        .from('schedules')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error('❌ Error deleting duplicates:', error);
        return 0;
    }

    console.log(`✅ Successfully removed ${totalRemoved} duplicate schedule(s)!\n`);
    return totalRemoved;
}

async function verifyNoDuplicates() {
    console.log('🔍 Step 3: Verifying no duplicates remain...\n');

    const result = await findDuplicates();
    if (!result) return false;

    const { duplicates } = result;
    const duplicateCount = Object.keys(duplicates).length;

    if (duplicateCount === 0) {
        console.log('✅ Verification passed! No duplicates found.\n');
        return true;
    } else {
        console.log(`⚠️  Warning: ${duplicateCount} duplicate group(s) still exist!\n`);
        return false;
    }
}

async function showStatistics(before, after) {
    console.log('\n📊 Statistics:\n');
    console.log(`   Total schedules before: ${before.schedules.length}`);
    console.log(`   Duplicate groups found: ${Object.keys(before.duplicates).length}`);
    console.log(`   Total duplicate records: ${before.schedules.length - Object.keys(before.groups).length}`);
    console.log(`   Records removed: ${after}`);
    console.log(`   Total schedules after: ${before.schedules.length - after}`);
    console.log('');
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   🔧 Remove Duplicate Schedules from Database         ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    // Step 1: Find duplicates
    const before = await findDuplicates();
    if (!before) {
        console.error('❌ Failed to fetch schedules');
        process.exit(1);
    }

    const duplicateCount = Object.keys(before.duplicates).length;

    if (duplicateCount === 0) {
        console.log('✅ No duplicates found! Database is already clean.\n');
        process.exit(0);
    }

    console.log(`⚠️  Found ${duplicateCount} duplicate group(s):\n`);

    // Show duplicate details
    for (const [key, group] of Object.entries(before.duplicates)) {
        const sample = group[0];
        console.log(`   📌 ${key}`);
        console.log(`      Count: ${group.length} duplicates`);
        console.log(`      IDs: ${group.map(g => g.id).join(', ')}`);
        console.log('');
    }

    // Step 2: Remove duplicates
    const removed = await removeDuplicates(before.duplicates);

    // Step 3: Verify
    const verified = await verifyNoDuplicates();

    // Show statistics
    await showStatistics(before, removed);

    if (verified) {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║   ✅ SUCCESS! All duplicates removed successfully      ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        console.log('📝 Next steps:');
        console.log('   1. Hard refresh your browser (Ctrl+Shift+R)');
        console.log('   2. Check Admin Booking Dashboard');
        console.log('   3. Each class should now appear only once\n');

        console.log('🔒 To prevent future duplicates, run this SQL in Supabase:');
        console.log('   ALTER TABLE schedules');
        console.log('   ADD CONSTRAINT unique_schedule_slot');
        console.log('   UNIQUE (class_id, day, time_slot, phase, week_number, year);\n');
    } else {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║   ⚠️  WARNING! Some duplicates may still exist         ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log('Please run the script again or check the database manually.\n');
    }
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
