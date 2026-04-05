# 🎨 Realtime Sync - Visual Guide

**Simple explanation of how testing mode syncs between admin and students**

---

## 🔄 The Flow (Step by Step)

```
┌──────────────────────────────────────────────────────────────────┐
│                         STEP 1: ADMIN CLICKS                      │
└──────────────────────────────────────────────────────────────────┘

    Admin Dashboard
    ┌─────────────────────┐
    │  [Testing Mode]     │  ← Admin clicks this button
    │  ☑️ ON  ☐ OFF       │
    └─────────────────────┘
            │
            │ onClick → toggleBookingMode()
            ↓


┌──────────────────────────────────────────────────────────────────┐
│                    STEP 2: UPDATE DATABASE                        │
└──────────────────────────────────────────────────────────────────┘

    Supabase Database
    ┌─────────────────────────────────────┐
    │  settings table                     │
    │  ┌────┬──────────────┬────────────┐ │
    │  │ id │ testing_mode │ updated_at │ │
    │  ├────┼──────────────┼────────────┤ │
    │  │ 1  │ false → TRUE │ 2026-04-05 │ │  ← Value changes
    │  └────┴──────────────┴────────────┘ │
    └─────────────────────────────────────┘
            │
            │ Database triggers UPDATE event
            ↓


┌──────────────────────────────────────────────────────────────────┐
│                   STEP 3: BROADCAST TO CLIENTS                    │
└──────────────────────────────────────────────────────────────────┘

    Supabase Realtime Server
    ┌─────────────────────────────────────┐
    │  📡 Broadcasting UPDATE event...    │
    │                                     │
    │  Event: "settings table changed"    │
    │  New Value: testing_mode = true     │
    └─────────────────────────────────────┘
            │
            │ WebSocket broadcast
            ├──────────────┬──────────────┬──────────────┐
            ↓              ↓              ↓              ↓


┌──────────────────────────────────────────────────────────────────┐
│                  STEP 4: CLIENTS RECEIVE UPDATE                   │
└──────────────────────────────────────────────────────────────────┘

    Student 1          Student 2          Student 3          Admin
    ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ 🔔 Event │      │ 🔔 Event │      │ 🔔 Event │      │ 🔔 Event │
    │ Received │      │ Received │      │ Received │      │ Received │
    └──────────┘      └──────────┘      └──────────┘      └──────────┘
         │                 │                 │                 │
         │ Update state    │ Update state    │ Update state    │ Update state
         ↓                 ↓                 ↓                 ↓


┌──────────────────────────────────────────────────────────────────┐
│                      STEP 5: UI UPDATES                           │
└──────────────────────────────────────────────────────────────────┘

    All Pages Re-render Automatically
    
    Student Pages:
    ┌─────────────────────────────────────┐
    │  🎓 EYSA Booking System             │
    │                                     │
    │  ⚠️ TESTING MODE ACTIVE             │  ← Appears automatically
    │  You can book anytime               │     (no refresh needed!)
    │                                     │
    │  [Book Now] ← Now enabled           │
    └─────────────────────────────────────┘

    Admin Dashboard:
    ┌─────────────────────────────────────┐
    │  [Testing Mode] ✅ ON               │  ← Shows updated state
    └─────────────────────────────────────┘
```

---

## ⏱️ Timeline

```
0.0s  │ Admin clicks toggle
      │
0.1s  │ Database updated
      │
0.2s  │ Realtime broadcasts event
      │
0.3s  │ Students receive event
      │
0.4s  │ UI updates on all pages
      │
✅    │ DONE! (Total: ~400ms)
```

**Students see changes in less than half a second!** 🚀

---

## 🔍 What Happens Behind the Scenes

### On Page Load:
```javascript
// 1. Context subscribes to database changes
useEffect(() => {
    // Load initial value from database
    loadSettings();
    
    // Subscribe to future changes
    const subscription = supabase
        .channel('settings-changes')
        .on('postgres_changes', { table: 'settings' }, (payload) => {
            // Update state when database changes
            setTestingMode(payload.new.testing_mode);
        })
        .subscribe();
    
    // Cleanup on unmount
    return () => subscription.unsubscribe();
}, []);
```

### When Admin Toggles:
```javascript
// 2. Update database
const toggleBookingMode = async () => {
    await supabase
        .from('settings')
        .update({ testing_mode: true })
        .eq('id', 1);
    
    // Supabase automatically broadcasts this change
    // to all subscribed clients via WebSocket
};
```

### When Students Receive Update:
```javascript
// 3. Subscription callback fires
.on('postgres_changes', { table: 'settings' }, (payload) => {
    console.log('🔔 Realtime update received:', payload);
    
    // Update local state
    setTestingMode(payload.new.testing_mode);
    
    // React automatically re-renders UI
});
```

---

## 🎯 Key Benefits

### ✅ No Polling Required
- Old way: Check database every 5 seconds
- New way: Database pushes updates instantly

### ✅ Real-time Sync
- All users see changes within 1 second
- No manual refresh needed

### ✅ Efficient
- Only sends updates when data actually changes
- Uses WebSocket (persistent connection)

### ✅ Scalable
- Works with 1 student or 1000 students
- Supabase handles all the complexity

---

## 🧪 How to Verify It's Working

### 1. Open Console (F12)
Look for these logs:

**On Page Load**:
```
🔵 BookingModeContext: Setting up realtime subscription...
```

**When Admin Toggles**:
```
🔔 Realtime update received: { new: { testing_mode: true } }
✅ Settings updated from realtime: { testing_mode: true }
```

### 2. Watch the UI
- Testing mode badge should appear/disappear
- Booking restrictions should change
- No page refresh needed

### 3. Test with Multiple Windows
- Open 3+ browser windows
- Toggle in one window
- All windows update simultaneously

---

## ⚠️ Troubleshooting

### Not Working?

**Check 1**: Is Realtime enabled?
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_publication_tables WHERE tablename = 'settings';
-- Should show 'supabase_realtime'
```

**Check 2**: Any console errors?
- Look for WebSocket errors
- Look for permission denied errors

**Check 3**: Is database updating?
- Check Supabase dashboard
- Verify `testing_mode` value changes

---

## 📚 Learn More

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Simple, fast, and reliable!** ✨
