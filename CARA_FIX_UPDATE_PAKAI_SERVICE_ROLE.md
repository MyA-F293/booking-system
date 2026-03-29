# Cara Fix Update Student - Gunakan Service Role Key

## Masalah
Update student berhasil di console tapi tidak tersimpan ke database karena menggunakan ANON_KEY yang punya permission terbatas.

## Root Cause
File `.env.local` menggunakan `VITE_SUPABASE_ANON_KEY` yang tidak punya permission untuk UPDATE meskipun RLS sudah di-disable.

## Solusi 1: Tambah Service Role Key (Untuk Admin Only)

### Step 1: Dapatkan Service Role Key
1. Buka https://supabase.com
2. Pilih project Anda
3. Klik "Settings" > "API"
4. Copy "service_role" key (bukan anon key!)

### Step 2: Tambah ke .env.local
Tambahkan line ini di `.env.local`:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja2R6aWZqeW9nbHlxbnhkdGF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4NDMzMiwiZXhwIjoyMDgzMjYwMzMyfQ.PASTE_YOUR_SERVICE_ROLE_KEY_HERE
```

### Step 3: Buat Supabase Client Khusus Admin
Buat file baru `src/supabaseAdmin.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Admin client dengan service_role key (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### Step 4: Update authHelpers.js
Ubah fungsi `updateStudent` untuk pakai `supabaseAdmin`:

```javascript
import { supabaseAdmin } from '../supabaseAdmin'

export const updateStudent = async (studentId, studentData) => {
    console.log('📝 Updating student:', studentId, studentData);

    if (!isAdmin()) {
        throw new Error('Only admin can update students');
    }

    // Gunakan supabaseAdmin untuk bypass RLS
    const { data, error } = await supabaseAdmin
        .from('users')
        .update(studentData)
        .eq('id', studentId)
        .select()
        .single()

    if (error) {
        console.error('❌ Error updating student:', error);
        throw error;
    }

    console.log('✅ Student updated:', data);
    return data;
}
```

## Solusi 2: Fix RLS Policy (Lebih Aman)

Jika tidak mau pakai service_role key, fix RLS policy-nya:

### Step 1: Enable RLS Kembali
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policy yang Benar
```sql
-- Drop policy lama
DROP POLICY IF EXISTS "Anyone can update users" ON users;

-- Create policy baru dengan proper check
CREATE POLICY "Authenticated users can update"
ON users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT UPDATE ON users TO authenticated;
```

### Step 3: Update Supabase Client
Pastikan user login dengan proper authentication:

```javascript
// Di AdminDashboard.jsx, pastikan admin login dengan Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@eysa.com',
  password: 'admin_password'
})
```

## Rekomendasi

**Gunakan Solusi 1** (Service Role Key) karena:
- ✅ Lebih simple
- ✅ Bypass semua RLS (admin punya full access)
- ✅ Tidak perlu setup authentication
- ⚠️ JANGAN expose service_role key di frontend production!

**Gunakan Solusi 2** jika:
- ✅ Mau lebih aman
- ✅ Mau pakai proper authentication
- ❌ Lebih kompleks setup-nya

## Testing

Setelah implement salah satu solusi:

1. Restart dev server: `npm run dev`
2. Hard refresh browser: Ctrl+Shift+R
3. Login sebagai admin
4. Edit student
5. Ubah level
6. Klik Save
7. **Harusnya**: Data berubah di database!

## Verify di Database

```sql
SELECT student_id, full_name, level, updated_at
FROM users
WHERE student_id = 'EYSA26020020';
```

Harusnya `level` dan `updated_at` berubah.
