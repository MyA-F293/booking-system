# Force Close Booking - Flow Diagram

## Current Implementation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    APP STARTS (main.jsx)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BookingModeProvider Wraps App                   │
│  🔵 Log: "BookingModeProvider: Component mounted/rendered"  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Load bookingMode from localStorage                 │
│  🔵 Log: "Loaded bookingMode from localStorage: production"  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              useEffect Runs (on mount)                       │
│  🔵 Log: "Starting to load force_close_booking..."          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Query Supabase settings table                      │
│  🔵 Log: "Querying settings table..."                       │
│  Query: SELECT force_close_booking FROM settings LIMIT 1    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        ┌───────────────────┐  ┌───────────────────┐
        │   SUCCESS         │  │   ERROR           │
        │   data exists     │  │   error exists    │
        └───────────────────┘  └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐  ┌───────────────────┐
        │ setForceClose()   │  │ setForceClose()   │
        │ = data.value      │  │ = false           │
        │ ✅ Log: "Loaded   │  │ ❌ Log: "Error    │
        │ force_close..."   │  │ loading..."       │
        └───────────────────┘  └───────────────────┘
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              setLoading(false)                               │
│  🔵 Log: "Loading complete, loading state set to false"     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         BookingSystemDB Component Renders                    │
│  🚀 Log: "BookingSystemDB component mounted"                │
│  🔒 Log: "Force Close: false"                               │
│  ⏳ Log: "BookingMode Loading: false"                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              canBook() Function Checks                       │
│  if (forceClose) return false  ← BOOKING CLOSED             │
│  if (isTestingMode) return true ← ALWAYS OPEN               │
│  if (Thu-Sat before 22:00) return true ← OPEN               │
│  else return false ← CLOSED                                  │
└─────────────────────────────────────────────────────────────┘
```

## Admin Toggle Flow

```
┌─────────────────────────────────────────────────────────────┐
│         Admin Clicks "Force Close Booking" Toggle           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              toggleForceClose() Called                       │
│  newValue = !forceClose                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Update Supabase settings table                       │
│  UPDATE settings SET force_close_booking = newValue         │
│  WHERE id = 1                                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        ┌───────────────────┐  ┌───────────────────┐
        │   SUCCESS         │  │   ERROR           │
        └───────────────────┘  └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐  ┌───────────────────┐
        │ setForceClose()   │  │ throw error       │
        │ = newValue        │  │ ❌ Log: "Failed   │
        │ ✅ Log: "Force    │  │ to toggle..."     │
        │ Close updated"    │  │                   │
        └───────────────────┘  └───────────────────┘
                    ↓                   ↓
        ┌───────────────────┐  ┌───────────────────┐
        │ Admin UI updates  │  │ Show error toast  │
        │ Toggle reflects   │  │ Toggle reverts    │
        │ new state         │  │                   │
        └───────────────────┘  └───────────────────┘
```

## Student Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Student Refreshes Page (F5)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         BookingModeProvider Re-mounts                        │
│  (Same flow as app start - see first diagram)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│    Query Supabase → Get LATEST force_close_booking          │
│  (This should reflect admin's toggle)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Student sees updated booking status                  │
│  If force_close = true → "Booking is CLOSED"                │
│  If force_close = false → Normal booking rules apply         │
└─────────────────────────────────────────────────────────────┘
```

## Debugging Decision Tree

```
START: Student doesn't see force close change
  ↓
  ├─ Check: Do you see 🔵 logs in console?
  │   ├─ NO → Context not mounting
  │   │   └─ Action: Check React/build issues
  │   │
  │   └─ YES → Continue
  │       ↓
  │       ├─ Check: Do you see ✅ "Loaded force_close_booking"?
  │       │   ├─ NO → Database query failed
  │       │   │   └─ Action: Check error message, fix RLS/Supabase
  │       │   │
  │       │   └─ YES → Continue
  │       │       ↓
  │       │       ├─ Check: Does value match database?
  │       │       │   ├─ NO → Query returning wrong data
  │       │       │   │   └─ Action: Check database directly
  │       │       │   │
  │       │       │   └─ YES → Continue
  │       │       │       ↓
  │       │       │       ├─ Check: Does UI show correct status?
  │       │       │       │   ├─ NO → canBook() logic issue
  │       │       │       │   │   └─ Action: Check BookingSystemDB.jsx
  │       │       │       │   │
  │       │       │       │   └─ YES → Everything works!
  │       │       │       │       └─ Action: Deploy + hard refresh
```

## Key Points

### Why Logging is Important:
1. **Pinpoints exact failure point** - We know which step failed
2. **Eliminates guesswork** - No need to assume what's wrong
3. **Faster debugging** - Can fix specific issue immediately
4. **Verifies success** - Confirms everything works end-to-end

### What Each Log Tells Us:
- `🔵 BookingModeProvider: Component mounted` → Context is rendering
- `🔵 Loaded bookingMode from localStorage` → State initialization works
- `🔵 Starting to load force_close_booking` → useEffect is running
- `🔵 Querying settings table` → Supabase query started
- `🔵 Query result: {...}` → Can see exact data/error returned
- `✅ Loaded force_close_booking: false` → Success! Value loaded
- `🔒 Force Close: false` → Component is using the value

### Common Issues:
1. **Cache** - Old JavaScript bundle without new code
   - Solution: Hard refresh (Ctrl+Shift+R)
   
2. **RLS Policy** - Students can't read settings table
   - Solution: Check/fix RLS policies
   
3. **Environment Variables** - Wrong Supabase URL/key
   - Solution: Check .env.local file
   
4. **Build Issue** - Code not compiled/deployed
   - Solution: npm run build + deploy

## Testing Checklist

- [ ] Rebuild app: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Open incognito browser
- [ ] Login as student
- [ ] Open console (F12)
- [ ] Check for 🔵 logs
- [ ] Verify ✅ success log
- [ ] Check 🔒 Force Close value
- [ ] Test admin toggle
- [ ] Refresh student page
- [ ] Verify change reflected
