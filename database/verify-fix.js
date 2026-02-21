// Verify Faradilla's bookings after fix
// Run this with: node database/verify-fix.js

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

async function verifyFaradillaBookings() {
    console.log('🔍 Verifying Faradilla\'s bookings...\n');

    try {
        // Check Faradilla's current bookings
        const { data: bookings, error } = await supabase
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
            .eq('schedule.year', 2026);

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log(`📊 Found ${bookings.length} bookings for Faradilla (Week 9, 2026):\n`);

        bookings.forEach((booking, index) => {
            console.log(`${index + 1}. ${booking.schedule.class.name}`);
            console.log(`   Day: ${booking.schedule.day}`);
            console.log(`   Time: ${booking.schedule.time_slot}`);
            console.log(`   Phase: ${booking.schedule.phase}`);
            console.log(`   Created: ${booking.created_at}`);
            console.log(`   Status: ${booking.status}`);
            console.log('');
        });

        // Expected: 2 bookings (Tuesday and Friday)
        if (bookings.length === 2) {
            const hasTuesday = bookings.some(b => b.schedule.day === 'tuesday');
            const hasFriday = bookings.some(b => b.schedule.day === 'friday');

            if (hasTuesday && hasFriday) {
                console.log('✅ SUCCESS! Faradilla has correct bookings:');
                console.log('   ✓ Tuesday afternoon (phase1)');
                console.log('   ✓ Friday afternoon (phase2)');
                console.log('   ✗ Monday booking removed');
            } else {
                console.log('⚠️  WARNING: Bookings exist but days are incorrect');
            }
        } else {
            console.log(`⚠️  WARNING: Expected 2 bookings, found ${bookings.length}`);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run verification
verifyFaradillaBookings();
