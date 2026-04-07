# 2 Masalah Ditemukan - April 7, 2026

## Masalah 1: Harvard Class Masih Dikhususkan untuk Teens ❌

### Gejala:
- Screenshot menunjukkan pesan: "Harvard Class is exclusively for English for Teens program students!"
- Padahal kemarin sudah fix dan remove restriction ini

### Root Cause:
**BROWSER CACHE** - User masih pakai versi JavaScript lama

### Bukti:
- Code sudah bersih (grep search tidak menemukan "exclusively for")
- Deployment sudah success (commit cb98aec)
- Netlify sudah build ulang
- Tapi browser user masih cache versi lama

### Solusi:

#### Opsi 1: User Hard Refresh (CEPAT)
User yang kena masalah harus:
1. Tekan `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
2. Atau `Ctrl+F5`
3. Atau buka Incognito/Private mode

#### Opsi 2: Clear Service Worker Cache (LEBIH BAIK)
1. Buka DevTools (F12)
2. Application tab → Service Workers
3. Klik "Unregister"
4. Refresh halaman

#### Opsi 3: Bump Version Number (OTOMATIS UNTUK SEMUA)
Update version di `package.json` dan deploy ulang:
```json
{
  "version": "1.0.1" // Increment version
}
```

Ini akan trigger auto-update notification untuk semua user.

---

## Masalah 2: Tutor Harus Logout-Login Setiap Awal Minggu 🔄

### Gejala:
- Tutor harus logout dan login ulang setiap awal minggu
- Kalau tidak logout, attendance terbaca di minggu kemarin
- Ini terjadi setiap kali week increment (Sunday night)

### Root Cause:
**WeekContext hanya fetch week SEKALI saat login**

**Code Problem:**
```javascript
// src/contexts/WeekContext.jsx line 23-24
const fetchCurrentWeek = async () => {
    // Don't fetch if already initialized
    if (initialized) return; // ❌ MASALAH DI SINI!
    
    // ... fetch logic
}
```

**Flow Masalah:**
1. Tutor login → WeekContext fetch week dari database → `initialized = true`
2. Week berubah di database (Sunday night auto-increment: Week 1 → Week 2)
3. Tutor masih login → WeekContext tidak fetch lagi karena `initialized = true`
4. Attendance submit pakai week lama (Week 1) padahal seharusnya Week 2
5. Logout → Login lagi → WeekContext fetch ulang → Week update!

### Kenapa Ini Masalah Besar:
- ❌ Tutor harus ingat logout-login setiap Senin pagi
- ❌ Kalau lupa, attendance masuk ke week salah
- ❌ Admin harus pindahkan attendance manual
- ❌ User experience buruk

### Solusi:

#### Solusi 1: Auto-Refresh Week Setiap 5 Menit (RECOMMENDED)
Tambahkan polling di WeekContext:

```javascript
// src/contexts/WeekContext.jsx
useEffect(() => {
    // Initial fetch
    fetchCurrentWeek();
    
    // Poll every 5 minutes to check for week changes
    const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing week from database...');
        refreshWeekSilently(); // Fetch without resetting initialized flag
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
}, []);

const refreshWeekSilently = async () => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('current_week')
            .eq('id', 1)
            .single();
        
        if (data && data.current_week !== currentWeek) {
            console.log('📅 Week changed! Old:', currentWeek, 'New:', data.current_week);
            setCurrentWeek(data.current_week);
            // Show notification to user
            toast.info(`📅 Minggu berganti ke Week ${data.current_week}!`);
        }
    } catch (err) {
        console.error('❌ Error refreshing week:', err);
    }
};
```

**Keuntungan:**
- ✅ Otomatis detect week change
- ✅ Tidak perlu logout-login
- ✅ User dapat notifikasi saat week berubah
- ✅ Minimal overhead (5 menit sekali)

#### Solusi 2: Realtime Subscription (LEBIH BAIK)
Subscribe ke perubahan `settings` table:

```javascript
// src/contexts/WeekContext.jsx
useEffect(() => {
    // Initial fetch
    fetchCurrentWeek();
    
    // Subscribe to settings changes
    const subscription = supabase
        .channel('settings-changes')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'settings',
            filter: 'id=eq.1'
        }, (payload) => {
            console.log('📅 Week changed via realtime!', payload);
            const newWeek = payload.new.current_week;
            if (newWeek !== currentWeek) {
                setCurrentWeek(newWeek);
                toast.info(`📅 Minggu berganti ke Week ${newWeek}!`);
            }
        })
        .subscribe();
    
    return () => {
        subscription.unsubscribe();
    };
}, []);
```

**Keuntungan:**
- ✅ Instant update (tidak perlu tunggu 5 menit)
- ✅ Tidak perlu polling
- ✅ Lebih efisien
- ✅ Real-time notification

#### Solusi 3: Force Refresh on Page Focus (SIMPLE)
Refresh week saat user kembali ke tab:

```javascript
// src/contexts/WeekContext.jsx
useEffect(() => {
    const handleFocus = () => {
        console.log('👀 Page focused, refreshing week...');
        refreshWeekSilently();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
}, []);
```

**Keuntungan:**
- ✅ Simple
- ✅ Refresh saat user buka tab lagi
- ✅ Tidak perlu polling atau subscription

---

## Rekomendasi Fix

### Untuk Masalah 1 (Harvard Restriction):
**Action:** Inform user untuk hard refresh (`Ctrl+Shift+R`)

**Pesan ke User:**
```
Halo! 👋

Untuk fix masalah Harvard Class restriction, 
silakan refresh browser dengan cara:

1. Tekan Ctrl+Shift+R (Windows)
   atau Cmd+Shift+R (Mac)
2. Atau buka Incognito mode

Ini akan clear cache dan load versi terbaru.

Terima kasih! 😊
```

### Untuk Masalah 2 (Week Tutor):
**Action:** Implement Solusi 2 (Realtime Subscription) + Solusi 3 (Page Focus)

**Kenapa kombinasi?**
- Realtime subscription untuk instant update
- Page focus sebagai fallback jika subscription gagal
- Double protection!

---

## Implementation Plan

### Step 1: Fix WeekContext (HIGH PRIORITY)
File: `src/contexts/WeekContext.jsx`

**Changes:**
1. Remove `if (initialized) return;` check
2. Add realtime subscription
3. Add page focus listener
4. Add toast notification saat week berubah

### Step 2: Test Locally
1. Run `npm run dev`
2. Login sebagai tutor
3. Manual update `settings.current_week` di Supabase
4. Verify week update tanpa logout-login
5. Verify toast notification muncul

### Step 3: Deploy
1. Git commit
2. Git push
3. Netlify auto-deploy
4. Test di production

### Step 4: Inform Users (Harvard Issue)
Send message ke affected users untuk hard refresh

---

## Expected Results

### After Fix:
- ✅ Harvard restriction hilang (setelah user refresh)
- ✅ Tutor tidak perlu logout-login setiap Senin
- ✅ Week auto-update via realtime
- ✅ Toast notification saat week berubah
- ✅ Attendance masuk ke week yang benar

### User Experience:
**Before:**
- ❌ Tutor harus ingat logout-login setiap Senin
- ❌ Kalau lupa, attendance salah week
- ❌ Admin harus fix manual

**After:**
- ✅ Tutor tidak perlu logout-login
- ✅ Week update otomatis
- ✅ Dapat notifikasi saat week berubah
- ✅ Attendance selalu di week yang benar

---

## Files to Modify

1. `src/contexts/WeekContext.jsx` - Add realtime subscription + page focus
2. `package.json` - Bump version (optional, untuk force cache clear)

---

## Testing Checklist

### Test Scenario 1: Week Change Detection
- [ ] Login sebagai tutor
- [ ] Manual update `settings.current_week` di Supabase
- [ ] Verify week update tanpa refresh
- [ ] Verify toast notification muncul

### Test Scenario 2: Page Focus Refresh
- [ ] Login sebagai tutor
- [ ] Switch ke tab lain
- [ ] Manual update `settings.current_week` di Supabase
- [ ] Switch kembali ke booking tab
- [ ] Verify week update

### Test Scenario 3: Attendance Submit
- [ ] Login sebagai tutor
- [ ] Week berubah (via manual update)
- [ ] Submit attendance
- [ ] Verify attendance masuk ke week yang benar

### Test Scenario 4: Harvard Restriction
- [ ] Login sebagai student (non-teens)
- [ ] Hard refresh (`Ctrl+Shift+R`)
- [ ] Try booking Harvard Class
- [ ] Verify no restriction message

---

## Risk Assessment

### Risk Level: LOW ✅

**Why?**
- Changes only affect WeekContext
- No breaking changes
- Fallback mechanisms in place
- Easy to rollback

### Potential Issues:
1. **Realtime subscription fails** → Page focus fallback will work
2. **Too many notifications** → Add debounce (only show once per week change)
3. **Performance** → Minimal (1 subscription + 1 event listener)

---

## Timeline

**Estimated Time:** 30-45 minutes

1. Code changes: 15 minutes
2. Local testing: 10 minutes
3. Deploy: 5 minutes
4. Production testing: 10 minutes
5. Inform users: 5 minutes

---

**Status:** Ready to implement  
**Priority:** HIGH (affects tutor workflow daily)  
**Impact:** HIGH (better UX, no more logout-login)

