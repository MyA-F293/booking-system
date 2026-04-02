# DEBUG: Week Masih Menampilkan Week 2 di Tanggal 30 Maret

## Masalah
- Tanggal sekarang: 30 Maret 2026
- Week yang ditampilkan: Week 2
- Week yang seharusnya: Week 6 atau 7

## Perhitungan
- Batch start: 17 Februari 2026
- Hari ini: 30 Maret 2026
- Selisih: 41 hari = 5 minggu 6 hari
- **Seharusnya Week 6 atau 7**

## Kemungkinan Penyebab

### 1. GitHub Actions Tidak Jalan
GitHub Actions dijadwalkan setiap Senin 00:01 WIB, tapi mungkin:
- Secrets tidak dikonfigurasi dengan benar
- Repository tidak aktif (GitHub menonaktifkan scheduled workflows di repo yang tidak aktif)
- Ada error saat eksekusi

### 2. Database Tidak Terupdate
- Settings table masih menyimpan week lama
- Auto-increment function tidak dipanggil

## Solusi Cepat

### Opsi 1: Manual Update via SQL (TERCEPAT)
Jalankan query ini di Supabase SQL Editor:

```sql
-- Update week ke nomor yang benar
UPDATE settings 
SET 
  current_week = FLOOR((CURRENT_DATE - batch_start_date) / 7) + 1,
  updated_at = NOW()
WHERE id = 1;

-- Verify
SELECT current_week, batch_start_date, CURRENT_DATE 
FROM settings WHERE id = 1;
```

File query: `booking-system/database/FIX_WEEK_TO_CORRECT_NUMBER.sql`

### Opsi 2: Trigger GitHub Actions Manual
1. Buka repository di GitHub
2. Pergi ke tab "Actions"
3. Pilih workflow "Auto Increment Week"
4. Klik "Run workflow" > "Run workflow"
5. Tunggu beberapa detik sampai selesai

### Opsi 3: Cek dan Fix GitHub Actions

#### Cek Status GitHub Actions:
1. Buka: https://github.com/[username]/[repo]/actions
2. Lihat apakah ada workflow yang gagal
3. Cek log error jika ada

#### Cek GitHub Secrets:
Pastikan secrets ini sudah dikonfigurasi di Settings > Secrets and variables > Actions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_API_KEY`

#### Re-enable Scheduled Workflows:
Jika repo tidak aktif, GitHub menonaktifkan scheduled workflows. Cara mengaktifkan:
1. Buka tab Actions
2. Jika ada pesan "Workflows have been disabled", klik "Enable workflows"

## Langkah-Langkah Debug

### 1. Cek Current Week di Database
```sql
-- File: booking-system/database/CHECK_WEEK_STATUS_NOW.sql
SELECT 
  current_week,
  batch_start_date,
  CURRENT_DATE,
  FLOOR((CURRENT_DATE - batch_start_date) / 7) + 1 as should_be_week
FROM settings WHERE id = 1;
```

### 2. Cek GitHub Actions History
- Buka GitHub Actions tab
- Lihat kapan terakhir workflow "Auto Increment Week" jalan
- Cek apakah ada error

### 3. Test Manual Increment
Jalankan workflow manual untuk test:
- GitHub > Actions > Auto Increment Week > Run workflow

## Rekomendasi

**UNTUK SEKARANG:**
Jalankan query manual update (Opsi 1) untuk fix week number segera.

**UNTUK JANGKA PANJANG:**
1. Pastikan GitHub Actions aktif dan berjalan setiap Senin
2. Setup monitoring/notification jika workflow gagal
3. Pertimbangkan backup solution (misalnya cron job di server)

## Files Terkait
- `booking-system/database/FIX_WEEK_TO_CORRECT_NUMBER.sql` - Manual fix
- `booking-system/database/CHECK_WEEK_STATUS_NOW.sql` - Check status
- `booking-system/.github/workflows/auto-increment-week.yml` - GitHub Actions config
- `booking-system/database/CREATE_API_INCREMENT_WEEK.sql` - RPC function
