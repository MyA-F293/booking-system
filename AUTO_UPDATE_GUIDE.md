# 🔄 Auto-Update System Guide

## Overview
Sistem auto-update otomatis mendeteksi versi baru dan meminta user untuk reload tanpa perlu manual clear cache.

## How It Works

### 1. Version Detection
- Setiap build menghasilkan version number unik berdasarkan timestamp
- Version disimpan di `public/version.json` dan `src/utils/versionCheck.js`
- App check version setiap 5 menit

### 2. Cache Busting Strategy
- **HTML files**: No cache (always fresh)
- **version.json**: No cache (always fresh)
- **JS/CSS files**: Cache 1 year dengan hash di filename (e.g., `main-abc123.js`)
- **Images**: Cache 1 year

### 3. Auto-Reload Flow
```
User opens app
  ↓
Check version.json from server
  ↓
Compare with stored version
  ↓
If different → Show update notification
  ↓
User clicks "Reload Now" OR auto-reload after 10s
  ↓
Clear all caches
  ↓
Reload page with fresh content
```

## Files Involved

### Core Files
- `src/utils/versionCheck.js` - Version checking logic
- `public/version.json` - Current version info
- `scripts/update-version.js` - Auto-generate version on build
- `vite.config.js` - Build configuration with hash
- `.htaccess` - Cache control headers

### Configuration
```javascript
// versionCheck.js
const APP_VERSION = '2025.02.19.1430'; // Auto-updated on build
const VERSION_CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute
```

## Build Process

### Automatic (Recommended)
```bash
npm run build
```
This automatically:
1. Runs `scripts/update-version.js` (prebuild)
2. Generates new version number
3. Updates `version.json` and `versionCheck.js`
4. Builds with Vite (adds hash to filenames)

### Manual Version Update
If you need to manually update version:
```bash
node scripts/update-version.js
```

## Deployment

### Step 1: Build
```bash
npm run build
```

### Step 2: Upload to Hosting
Upload entire `dist` folder including:
- `dist/index.html` (no cache)
- `dist/version.json` (no cache)
- `dist/assets/*.js` (cached with hash)
- `dist/assets/*.css` (cached with hash)

### Step 3: Verify
1. Open app in browser
2. Check console for version: `🔄 Version check initialized: 2025.02.19.1430`
3. Deploy new version
4. Wait 1 minute or refresh
5. Should see update notification

## User Experience

### Update Notification
When new version detected, user sees:
```
┌─────────────────────────────────────┐
│ 🔄 New Update Available!            │
│ Please reload to get latest version │
│                                      │
│ [Reload Now]                         │
└─────────────────────────────────────┘
```

### Auto-Reload
- Notification shows for 10 seconds
- If user doesn't click, auto-reload happens
- All caches cleared before reload

## Testing

### Test Update Flow
1. Build and deploy version 1:
   ```bash
   npm run build
   # Upload to hosting
   ```

2. Open app, check console:
   ```
   🔄 Version check initialized: 2025.02.19.1430
   ```

3. Make a change, build version 2:
   ```bash
   npm run build
   # Upload to hosting
   ```

4. Wait 1 minute or manually trigger check
5. Should see update notification

### Force Update Check (Dev)
In browser console:
```javascript
// Trigger immediate version check
fetch('/version.json?t=' + Date.now())
  .then(r => r.json())
  .then(d => console.log('Server version:', d.version));

// Check stored version
console.log('Stored version:', localStorage.getItem('app_version'));
```

## Troubleshooting

### Update Not Detected
1. Check `version.json` on server:
   ```bash
   curl https://your-domain.com/version.json
   ```

2. Verify cache headers:
   ```bash
   curl -I https://your-domain.com/version.json
   # Should see: Cache-Control: no-cache, no-store
   ```

3. Check browser console for errors

### Users Still See Old Version
1. Verify `.htaccess` is uploaded
2. Check hosting supports `.htaccess`
3. Manually clear browser cache once
4. Check version in localStorage:
   ```javascript
   localStorage.getItem('app_version')
   ```

### Version Check Not Running
1. Check console for initialization:
   ```
   🔄 Version check initialized
   ```

2. Verify no JavaScript errors
3. Check network tab for version.json requests

## Best Practices

### When to Update Version
- Bug fixes → Build and deploy
- New features → Build and deploy
- UI changes → Build and deploy
- Config changes → Build and deploy

### Version Numbering
Auto-generated format: `YYYY.MM.DD.HHMM`
- Example: `2025.02.19.1430` = Feb 19, 2025 at 14:30

### Deployment Frequency
- Critical bugs: Deploy immediately
- Features: Deploy during low-traffic hours
- Updates: Users auto-reload within 1-2 minutes

## Advanced Configuration

### Change Check Interval
Edit `src/utils/versionCheck.js`:
```javascript
const VERSION_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

### Disable Auto-Reload
Edit `src/utils/versionCheck.js`:
```javascript
// Comment out auto-reload
// setTimeout(() => {
//   window.location.reload(true);
// }, 10000);
```

### Custom Version Format
Edit `scripts/update-version.js`:
```javascript
const version = '1.2.3'; // Manual version
```

## Monitoring

### Check Active Version
```javascript
// In browser console
console.log('Current version:', localStorage.getItem('app_version'));
```

### Version History
Check `version.json` after each deployment:
```json
{
  "version": "2025.02.19.1430",
  "buildDate": "2025-02-19",
  "buildTime": "2025-02-19T14:30:00.000Z",
  "description": "Auto-generated version for cache busting"
}
```

## Summary

✅ **Automatic**: Version updates on every build
✅ **User-Friendly**: Clear notification with reload button
✅ **No Manual Cache Clear**: System handles everything
✅ **Fast**: Check every 1 minute
✅ **Reliable**: Multiple cache-busting strategies

Users will always get the latest version within 1-2 minutes of deployment!
