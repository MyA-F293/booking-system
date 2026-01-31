# 🔔 Push Notifications Guide - EYSA PWA

## Apa itu VAPID Keys?

**VAPID** = Voluntary Application Server Identification

VAPID keys adalah sepasang kunci (public & private) yang digunakan untuk:
- ✅ **Autentikasi** server yang mengirim push notifications
- ✅ **Keamanan** - hanya server Anda yang bisa kirim notif ke user Anda
- ✅ **Required** untuk Web Push API di browser modern

## 🔑 Your VAPID Keys

### Public Key (Safe to expose - sudah di .env.local):
```
BC7mGzQjrEjRAcJXXMIMLhCj8j8P75wz8MTlM523n-XBRna_jnYKH3kMgcdyQNlrXMVnYQXouVkefEYjGlFMcp8
```

### Private Key (KEEP SECRET - jangan commit ke git!):
```
3AXGkj-UuoRQqjxomNJnKVh4stJkGVzsam2qFqY0cQQ
```

⚠️ **PENTING**: Private key harus disimpan di backend server, JANGAN di frontend!

## 📊 Cara Kerja Push Notifications

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Backend   │────────>│ Push Service │────────>│   Browser   │
│   Server    │  VAPID  │ (Google/     │  Push   │   (User)    │
│             │  Auth   │  Mozilla)    │  Notif  │             │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. **User** subscribe ke push notifications di browser
2. **Browser** generate subscription object (endpoint + keys)
3. **Frontend** kirim subscription ke backend server
4. **Backend** simpan subscription di database
5. **Backend** kirim push notification menggunakan VAPID private key
6. **Push Service** (Google/Mozilla) forward ke browser user
7. **Browser** tampilkan notification

## 🚀 Setup Push Notifications

### Step 1: Frontend (Sudah Done ✅)

File yang sudah dibuat:
- ✅ `src/utils/pwaHelpers.js` - Helper functions
- ✅ `public/sw.js` - Service Worker dengan push handler
- ✅ `.env.local` - VAPID public key

### Step 2: User Subscribe (Frontend)

```javascript
import { subscribeToPush, requestNotificationPermission } from './utils/pwaHelpers';

// Request permission
const hasPermission = await requestNotificationPermission();

if (hasPermission) {
  // Subscribe to push
  const subscription = await subscribeToPush();
  
  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      subscription: subscription
    })
  });
}
```

### Step 3: Backend Server (Perlu Dibuat)

Anda perlu membuat backend API untuk:

#### A. Save Subscription Endpoint

```javascript
// POST /api/push/subscribe
app.post('/api/push/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;
  
  // Save to database (Supabase)
  await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      subscription: subscription,
      updated_at: new Date()
    });
  
  res.json({ success: true });
});
```

#### B. Send Push Notification

```javascript
const webpush = require('web-push');

// Set VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
async function sendPushNotification(userId, payload) {
  // Get user's subscription from database
  const { data } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();
  
  if (!data) return;
  
  // Send push
  await webpush.sendNotification(
    data.subscription,
    JSON.stringify(payload)
  );
}

// Example: Send class reminder
await sendPushNotification(userId, {
  title: 'Class Reminder',
  body: 'Your class starts in 30 minutes!',
  icon: '/eysa-logo.png',
  url: '/?action=attendance'
});
```

### Step 4: Database Schema (Supabase)

```sql
-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

## 📱 Use Cases untuk EYSA

### 1. Class Reminders
```javascript
// 30 menit sebelum kelas
await sendPushNotification(studentId, {
  title: '⏰ Class Reminder',
  body: 'Your English class starts in 30 minutes!',
  icon: '/eysa-logo.png',
  badge: '/eysa-logo.png',
  url: '/?action=attendance',
  actions: [
    { action: 'view', title: 'View Schedule' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

### 2. Booking Confirmation
```javascript
await sendPushNotification(studentId, {
  title: '✅ Booking Confirmed',
  body: 'Your class has been booked successfully!',
  icon: '/eysa-logo.png',
  url: '/?action=bookings'
});
```

### 3. Attendance Submitted
```javascript
await sendPushNotification(studentId, {
  title: '📊 Attendance Updated',
  body: 'Your attendance has been recorded.',
  icon: '/eysa-logo.png',
  url: '/?action=attendance'
});
```

### 4. Low Attendance Alert
```javascript
await sendPushNotification(studentId, {
  title: '⚠️ Attendance Alert',
  body: 'Your attendance rate is below 80%. Please attend regularly.',
  icon: '/eysa-logo.png',
  url: '/?action=attendance'
});
```

### 5. New Announcement
```javascript
await sendPushNotification(studentId, {
  title: '📢 New Announcement',
  body: 'Check out the latest updates from EYSA!',
  icon: '/eysa-logo.png',
  url: '/'
});
```

## 🧪 Testing Push Notifications

### Local Testing (Without Backend)

```javascript
// Test local notification
import { showNotification } from './utils/pwaHelpers';

await showNotification('Test Notification', {
  body: 'This is a test notification',
  icon: '/eysa-logo.png',
  badge: '/eysa-logo.png'
});
```

### Testing with Backend

1. **Install web-push library**:
```bash
npm install web-push
```

2. **Create test script** (`test-push.js`):
```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:test@example.com',
  'BC7mGzQjrEjRAcJXXMIMLhCj8j8P75wz8MTlM523n-XBRna_jnYKH3kMgcdyQNlrXMVnYQXouVkefEYjGlFMcp8',
  '3AXGkj-UuoRQqjxomNJnKVh4stJkGVzsam2qFqY0cQQ'
);

// Get subscription from browser console
const subscription = {
  endpoint: 'YOUR_ENDPOINT',
  keys: {
    p256dh: 'YOUR_P256DH_KEY',
    auth: 'YOUR_AUTH_KEY'
  }
};

webpush.sendNotification(subscription, JSON.stringify({
  title: 'Test Push',
  body: 'Hello from EYSA!',
  icon: '/eysa-logo.png'
}));
```

3. **Run test**:
```bash
node test-push.js
```

## 🔒 Security Best Practices

1. ✅ **Never expose private key** di frontend atau git
2. ✅ **Validate user permissions** sebelum kirim notif
3. ✅ **Rate limiting** untuk prevent spam
4. ✅ **User preferences** - allow users to opt-out
5. ✅ **HTTPS required** - push notifications hanya work di HTTPS

## 📚 Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push library](https://github.com/web-push-libs/web-push)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)

## 🎯 Next Steps

1. ✅ VAPID keys generated
2. ✅ Frontend setup complete
3. ⏳ Create backend API endpoints
4. ⏳ Create Supabase table
5. ⏳ Implement notification triggers
6. ⏳ Test end-to-end flow

## 💡 Tips

- Test di Chrome DevTools → Application → Push Messaging
- Use Chrome's "Send test notification" feature
- Check browser console for errors
- Verify service worker is active
- Test on real mobile device for best results

---

**Status**: Frontend ready ✅ | Backend pending ⏳
