# Enable Testing Mode - Quick Guide

## Masalah
Booking closed karena hari ini **Sunday**, tapi production mode hanya mengizinkan booking di **Thursday-Saturday**.

## Solusi Cepat: Enable Testing Mode

### Cara 1: Via Browser Console (Tercepat)

1. Buka halaman student (localhost:5173)
2. Tekan F12 → Console tab
3. Paste command ini:
   ```javascript
   localStorage.setItem('eysa_booking_mode', 'testing');
   location.reload();
   ```
4. Page akan reload
5. Booking sekarang OPEN (bisa booking kapan saja)

### Cara 2: Via Admin Dashboard (Jika Ada Toggle)

1. Login sebagai admin
2. Buka Settings
3. Cari toggle "Testing Mode" atau "Booking Mode"
4. Switch ke "Testing"
5. Student refresh → booking open

### Cara 3: Edit localStorage Manual

1. Buka Developer Tools (F12)
2. Go to Application tab → Storage → Local Storage
3. Cari key: `eysa_booking_mode`
4. Ubah value dari `production` ke `testing`
5. Refresh page

## Verifikasi

Setelah enable testing mode, cek console:
```
🔧 Booking Mode: TESTING  ← Harus TESTING
🔒 Force Close: false
```

Dan di UI seharusnya tidak ada "Booking is CLOSED" lagi.

## Disable Testing Mode (Kembali ke Production)

```javascript
localStorage.setItem('eysa_booking_mode', 'production');
location.reload();
```

## Catatan Penting

- Testing mode disimpan di localStorage (per browser)
- Jika clear browser data, akan reset ke production
- Testing mode bypass aturan hari (bisa booking kapan saja)
- Production mode hanya Thu-Sat sebelum 22:00
