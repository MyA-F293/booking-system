# 🔄 Auto-Update System Guide

## Overview
Sistem ini memastikan aplikasi otomatis update setiap kali ada push ke GitHub tanpa perlu manual clear cache.

## Cara Kerja

### 1. **Auto-Versioning Service Worker**
- Service Worker menggunakan timestamp sebagai version: `BUILD_VERSION = new Date().getTime()`
- Setiap build menghasilkan version baru yang unik
- Cache name berubah otomatis: `eysa-v{timestamp}`

### 2. **Automatic Cache Cleanup**
- Saat Service Worker activate, semua cache lama otomatis dihapus
- Hanya cache dengan version terbaru yang dipertahankan
- Proses ini terjadi otomatis tanpa intervensi user

### 3. **Auto-Reload Mechanism**
- Service Worker mengirim message ke semua clients saat update
- Aplikasi mendeteksi message dan auto-reload setelah 1 detik
- User tidak perlu manual refresh

### 4. **Periodic Update Check**
- Aplikasi check update setiap 60 detik
- Check update saat user kembali ke tab (visibility change)
- Memastikan user selalu mendapat version terbaru

## Fitur

### ✅ Auto-Update Features
1. **Timestamp-based Versioning**: Setiap build = version baru
2. **Auto Cache Cleanup**: Cache lama otomatis terhapus
3. **Auto Reload**: Aplikasi reload otomatis saat ada update
4. **Periodic Check**: Check update setiap 60 detik
5. **Visibility Check**: Check update saat user kembali ke tab
6. **Force Update Function**: `window.forceUpdate()` untuk manual update

### 🎯 Benefits
- ✅ Tidak perlu manual clear cache
- ✅ User selalu mendapat version terbaru
- ✅ Update otomatis dalam 1-2 menit setelah push
- ✅ Smooth transition tanpa error
- ✅ Developer-friendly dengan console logs

## Workflow

### Development to Production
```bash
# 1. Make changes to code
git add .
git commit -m "Feature: New feature"
git push

# 2. Build automatically generates new version
npm run build

# 3. Deploy to production (Vercel/Netlify auto-deploy)

# 4. Users get update automatically:
#    - Service Worker detects new version
#    - Cache cleared automatically
#    - App reloads automatically
#    - User sees new version (1-2 minutes)
```

### Timeline
- **0:00** - Push to GitHub
- **0:30** - Build & Deploy complete
- **1:00** - User's browser checks for update
- **1:01** - New Service Worker installed
- **1:02** - Old cache deleted
- **1:03** - App reloads automatically
- **1:04** - User sees new version ✅

## Manual Force Update

### For Users
Jika user ingin force update manual:
```javascript
// Open browser console (F12)
window.forceUpdate()
```

### For Developers
```bash
# Clear all caches and reload
npm run dev
# Then in console:
window.forceUpdate()
```

## Console Commands

### Check PWA Status
```javascript
// Check if PWA is installed
window.isInstalled()

// Check PWA capabilities
window.checkPWACapabilities()

// Check if online
navigator.onLine
```

### Service Worker Commands
```javascript
// Check current service worker
navigator.serviceWorker.controller

// Get all registrations
navigator.serviceWorker.getRegistrations()

// Force update check
navigator.serviceWorker.getRegistration().then(reg => reg.update())
```

### Cache Commands
```javascript
// List all caches
caches.keys()

// Clear specific cache
caches.delete('cache-name')

// Clear all caches
caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
```

## Troubleshooting

### Issue: Update tidak terdeteksi
**Solution:**
1. Check console untuk error
2. Pastikan Service Worker registered
3. Manual reload dengan `Ctrl+Shift+R` (hard reload)
4. Run `window.forceUpdate()` di console

### Issue: Cache tidak terhapus
**Solution:**
1. Open DevTools > Application > Storage
2. Click "Clear site data"
3. Reload page
4. Service Worker akan re-register dengan version baru

### Issue: Service Worker tidak update
**Solution:**
1. Check Network tab untuk `/sw.js` request
2. Pastikan tidak ada error 404
3. Check Service Worker scope
4. Unregister manual: `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()))`

## Best Practices

### For Developers
1. ✅ Always test locally before push
2. ✅ Check console logs after deploy
3. ✅ Monitor Service Worker status
4. ✅ Use semantic commit messages
5. ✅ Test on multiple devices

### For Users
1. ✅ Keep browser updated
2. ✅ Allow notifications for update alerts
3. ✅ Don't force close browser tabs
4. ✅ Check console if issues occur
5. ✅ Report bugs to developer

## Configuration

### Service Worker Version
Located in: `public/sw.js`
```javascript
const BUILD_VERSION = new Date().getTime();
```

### Update Check Interval
Located in: `src/utils/pwaHelpers.js`
```javascript
// Check every 60 seconds
setInterval(() => {
    registration.update();
}, 60000);
```

### Auto-Reload Delay
Located in: `src/utils/pwaHelpers.js`
```javascript
// Reload after 1 second
setTimeout(() => {
    window.location.reload();
}, 1000);
```

## Monitoring

### Check Update Status
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('Active:', reg.active);
    console.log('Installing:', reg.installing);
    console.log('Waiting:', reg.waiting);
});
```

### Check Cache Status
```javascript
// List all caches with sizes
caches.keys().then(async names => {
    for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        console.log(`${name}: ${keys.length} items`);
    }
});
```

## Summary

### What Happens on Git Push
1. ✅ Code pushed to GitHub
2. ✅ Auto-build triggered (Vercel/Netlify)
3. ✅ New Service Worker with timestamp version
4. ✅ Users' browsers detect new version
5. ✅ Old cache automatically deleted
6. ✅ App automatically reloads
7. ✅ Users see new version

### No Manual Steps Required
- ❌ No need to clear cache manually
- ❌ No need to hard reload
- ❌ No need to unregister Service Worker
- ❌ No need to tell users to refresh

### Everything is Automatic! 🎉

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Author:** EYSA Development Team
