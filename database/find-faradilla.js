// Find Faradilla user
// Run this with: node database/find-faradilla.js

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

async function findFaradilla() {
    console.log('🔍 Searching for Faradilla...\n');

    try {
        // Search for users with "Faradilla" in name
        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name, program, batch')
            .ilike('full_name', '%Faradilla%');

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log(`📊 Found ${users.length} users:\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.full_name}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Program: ${user.program}`);
            console.log(`   Batch: ${user.batch}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run search
findFaradilla();
