// Check ALL Faradilla's bookings (any week)
// Run this with: node database/check-all-faradilla.js

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

async function checkAllFaradillaBookings() {
    console.log('🔍 Checking ALL Faradilla\'s bookings...\n');

    try {
        const userId = '1807ae8d-9b2c-43e0-838c-443cc822cabe';

        console.log('👤 Checking bookings for user ID:', userId);
        console.log('');

        // Check ALL bookings for this user
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                created_at,
                schedule:schedules!inner(
                    id,
                    day,
                    time_slot,
                    phase,
                    week_number,
                    year,
                    class:classes(name)
                )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log(`📊 Found ${bookings.length} total bookings:\n`);

        if (bookings.length === 0) {
            console.log('⚠️  No bookings found for this user!');
            console.log('   This might mean:');
            console.log('   1. All bookings were deleted');
            console.log('   2. User needs to book classes again');
            console.log('   3. Admin needs to assign student to schedules');
        } else {
            bookings.forEach((booking, index) => {
                console.log(`${index + 1}. ${booking.schedule.class.name}`);
                console.log(`   Week: ${booking.schedule.week_number}, Year: ${booking.schedule.year}`);
                console.log(`   Day: ${booking.schedule.day}`);
                console.log(`   Time: ${booking.schedule.time_slot}`);
                console.log(`   Phase: ${booking.schedule.phase}`);
                console.log(`   Created: ${booking.created_at}`);
                console.log(`   Status: ${booking.status}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run check
checkAllFaradillaBookings();
