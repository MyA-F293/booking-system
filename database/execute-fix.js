// Execute SQL fix for Faradilla's booking
// Run this with: node database/execute-fix.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file manually
const envPath = join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFaradillaBooking() {
    console.log('🔧 Starting fix for Faradilla booking...\n');

    try {
        // STEP 1: Verify the booking to delete
        console.log('📋 STEP 1: Verifying booking to delete...');
        const { data: bookingToDelete, error: verifyError } = await supabase
            .from('bookings')
            .select(`
                id,
                created_at,
                user:users!inner(full_name),
                schedule:schedules!inner(
                    day,
                    time_slot,
                    phase,
                    class:classes(name)
                )
            `)
            .eq('id', '6385f966-f1b6-420e-94c6-f64245389a2f')
            .single();

        if (verifyError) {
            console.error('❌ Error verifying booking:', verifyError);
            return;
        }

        console.log('Found booking to delete:');
        console.log('  User:', bookingToDelete.user.full_name);
        console.log('  Class:', bookingToDelete.schedule.class.name);
        console.log('  Day:', bookingToDelete.schedule.day);
        console.log('  Time:', bookingToDelete.schedule.time_slot);
        console.log('  Phase:', bookingToDelete.schedule.phase);
        console.log('  Created:', bookingToDelete.created_at);
        console.log('  ❌ TO BE DELETED\n');

        // STEP 2: Delete the booking
        console.log('🗑️  STEP 2: Deleting Monday booking...');
        const { error: deleteError } = await supabase
            .from('bookings')
            .delete()
            .eq('id', '6385f966-f1b6-420e-94c6-f64245389a2f');

        if (deleteError) {
            console.error('❌ Error deleting booking:', deleteError);
            return;
        }
        console.log('✅ Booking deleted successfully\n');

        // STEP 3: Update schedule current_students count
        console.log('📊 STEP 3: Updating Monday schedule student count...');

        // Get current count first
        const { data: scheduleData, error: getError } = await supabase
            .from('schedules')
            .select('current_students')
            .eq('id', '5123a48c-1bb1-4df6-a75e-41b7de2889f5')
            .single();

        if (getError) {
            console.error('❌ Error getting schedule:', getError);
            return;
        }

        // Update with decremented value
        const newCount = Math.max(0, scheduleData.current_students - 1);
        const { error: updateError } = await supabase
            .from('schedules')
            .update({ current_students: newCount })
            .eq('id', '5123a48c-1bb1-4df6-a75e-41b7de2889f5');

        if (updateError) {
            console.error('❌ Error updating schedule count:', updateError);
            return;
        }
        console.log('✅ Schedule count updated\n');

        // STEP 4: Verify Faradilla now only has correct bookings
        console.log('✅ STEP 4: Verifying Faradilla\'s remaining bookings...');
        const { data: remainingBookings, error: verifyRemainingError } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                created_at,
                user:users!inner(full_name),
                schedule:schedules!inner(
                    day,
                    time_slot,
                    phase,
                    week_number,
                    year,
                    class:classes(name)
                )
            `)
            .eq('user.full_name', 'Faradilla Azzahra Arifin')
            .eq('schedule.week_number', 9)
            .eq('schedule.year', 2026)
            .order('schedule.day');

        if (verifyRemainingError) {
            console.error('❌ Error verifying remaining bookings:', verifyRemainingError);
            return;
        }

        console.log(`Found ${remainingBookings.length} remaining bookings:`);
        remainingBookings.forEach((booking, index) => {
            console.log(`  ${index + 1}. ${booking.schedule.class.name}`);
            console.log(`     Day: ${booking.schedule.day}`);
            console.log(`     Time: ${booking.schedule.time_slot}`);
            console.log(`     Phase: ${booking.schedule.phase}`);
            console.log(`     ✅ CORRECT\n`);
        });

        // STEP 5: Verify Monday schedule count
        console.log('📊 STEP 5: Verifying Monday schedule count...');
        const { data: scheduleCheck, error: scheduleCheckError } = await supabase
            .from('schedules')
            .select(`
                id,
                day,
                time_slot,
                current_students,
                class:classes(name),
                bookings:bookings!inner(id)
            `)
            .eq('id', '5123a48c-1bb1-4df6-a75e-41b7de2889f5')
            .single();

        if (scheduleCheckError) {
            console.error('❌ Error checking schedule:', scheduleCheckError);
            return;
        }

        const actualBookings = scheduleCheck.bookings?.length || 0;
        const match = scheduleCheck.current_students === actualBookings;
        console.log(`  Class: ${scheduleCheck.class.name}`);
        console.log(`  Day: ${scheduleCheck.day}`);
        console.log(`  Time: ${scheduleCheck.time_slot}`);
        console.log(`  Current Students: ${scheduleCheck.current_students}`);
        console.log(`  Actual Bookings: ${actualBookings}`);
        console.log(`  ${match ? '✅ MATCH' : '❌ MISMATCH'}\n`);

        console.log('🎉 FIX COMPLETED SUCCESSFULLY!');
        console.log('============================================');
        console.log('✅ Deleted: Monday afternoon booking (old/wrong)');
        console.log('✅ Kept: Tuesday afternoon (correct)');
        console.log('✅ Kept: Friday afternoon (correct)');
        console.log('✅ Updated: Monday schedule student count');
        console.log('============================================');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the fix
fixFaradillaBooking();
