import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// Admin client dengan service_role key (bypass RLS)
// Fallback ke anon key jika service_role key tidak ada
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Log warning jika menggunakan anon key
if (!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not found, using ANON_KEY. Admin operations may fail due to RLS policies.')
}
