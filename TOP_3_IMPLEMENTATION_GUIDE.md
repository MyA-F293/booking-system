# 🚀 Top 3 Features - Implementation Guide

## Overview

Panduan detail implementasi untuk 3 fitur paling recommended:
1. 🔔 Push Notifications + Booking History
2. 📱 QR Code Attendance
3. 📊 Attendance Analytics

---

## 🔔 Feature #1: Push Notifications + Booking History

### A. Push Notifications

#### 1.1 Setup Push Notifications

**Dependencies:**
```bash
npm install web-push
```

**Backend Setup (Supabase Edge Functions):**
```javascript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { userId, title, body, url } = await req.json()
  
  // Get user's push subscription from database
  const { data: subscription } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (subscription) {
    // Send push notification
    await webpush.sendNotification(
      subscription.subscription_data,
      JSON.stringify({ title, body, url })
    )
  }
  
  return new Response(JSON.stringify({ success: true }))
})
```

**Database Schema:**
```sql
-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create notification_settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reminder_h1 BOOLEAN DEFAULT true,
  reminder_1hour BOOLEAN DEFAULT true,
  booking_confirmation BOOLEAN DEFAULT true,
  class_cancelled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Frontend Component:**
```jsx
// src/components/NotificationSettings.jsx
import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

const NotificationSettings = ({ userId }) => {
  const [settings, setSettings] = useState({
    reminder_h1: true,
    reminder_1hour: true,
    booking_confirmation: true,
    class_cancelled: true
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });

    // Save subscription to database
    await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription_data: subscription
      });

    setIsSubscribed(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">🔔 Notification Settings</h2>
      
      {!isSubscribed ? (
        <button onClick={subscribeToPush} className="btn-primary">
          Enable Notifications
        </button>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.reminder_h1}
              onChange={(e) => setSettings({...settings, reminder_h1: e.target.checked})}
            />
            <span>Reminder H-1 sebelum kelas (19:00)</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.reminder_1hour}
              onChange={(e) => setSettings({...settings, reminder_1hour: e.target.checked})}
            />
            <span>Reminder 1 jam sebelum kelas</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.booking_confirmation}
              onChange={(e) => setSettings({...settings, booking_confirmation: e.target.checked})}
            />
            <span>Konfirmasi booking</span>
          </label>
        </div>
      )}
    </div>
  );
};
```

**Cron Job (Supabase Edge Function):**
```javascript
// supabase/functions/send-reminders/index.ts
// Run every hour via cron

serve(async (req) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get bookings for tomorrow at 19:00
  if (now.getHours() === 19) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(*),
        schedule:schedules(*)
      `)
      .eq('status', 'confirmed')
      // Filter for tomorrow's classes
    
    for (const booking of bookings) {
      await sendNotification(
        booking.user_id,
        '📚 Reminder: Kelas Besok!',
        `Kelas ${booking.schedule.program} besok jam ${booking.schedule.time_slot}`,
        '/'
      );
    }
  }
  
  // Get bookings in 1 hour
  const oneHourLater = new Date(now);
  oneHourLater.setHours(oneHourLater.getHours() + 1);
  
  // Similar logic for 1-hour reminder
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

### B. Booking History & Calendar View

#### 1.2 Calendar Component

**Dependencies:**
```bash
npm install react-calendar date-fns
```

**Component:**
```jsx
// src/components/BookingCalendar.jsx
import { useState } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

const BookingCalendar = ({ userId }) => {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        schedule:schedules(
          *,
          class:classes(*)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });
    
    setBookings(data);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasBooking = bookings.some(booking => {
        const bookingDate = getDateForDayInWeek(
          booking.schedule.day,
          booking.schedule.week_number,
          booking.schedule.year
        );
        return isSameDay(date, bookingDate);
      });
      
      if (hasBooking) return 'has-booking';
    }
    return null;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayBookings = bookings.filter(booking => {
        const bookingDate = getDateForDayInWeek(
          booking.schedule.day,
          booking.schedule.week_number,
          booking.schedule.year
        );
        return isSameDay(date, bookingDate);
      });
      
      if (dayBookings.length > 0) {
        return (
          <div className="booking-dots">
            {dayBookings.map((_, i) => (
              <span key={i} className="dot"></span>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">📅 My Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg ${view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            List
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <Calendar
          onChange={setDate}
          value={date}
          tileClassName={tileClassName}
          tileContent={tileContent}
        />
      ) : (
        <BookingList bookings={bookings} />
      )}

      {/* Selected Date Details */}
      <SelectedDateBookings date={date} bookings={bookings} />
    </div>
  );
};
```

**Styling:**
```css
/* Add to your CSS */
.has-booking {
  background: #e3f2fd !important;
  font-weight: bold;
}

.booking-dots {
  display: flex;
  gap: 2px;
  justify-content: center;
  margin-top: 2px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #1F4E8C;
}
```

---

## 📱 Feature #2: QR Code Attendance

### 2.1 QR Code Generation

**Dependencies:**
```bash
npm install qrcode react-qr-scanner
```

**Teacher Component:**
```jsx
// src/components/QRAttendance.jsx
import { useState } from 'react';
import QRCode from 'qrcode';
import { Clock, QrCode } from 'lucide-react';

const QRAttendance = ({ schedule, students }) => {
  const [qrCode, setQrCode] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [checkedInStudents, setCheckedInStudents] = useState([]);

  const generateQRCode = async () => {
    // Create unique token for this session
    const token = `${schedule.id}_${Date.now()}`;
    
    // Save token to database with expiry
    await supabase
      .from('attendance_qr_sessions')
      .insert({
        schedule_id: schedule.id,
        token: token,
        expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        type: 'attendance',
        token: token,
        schedule_id: schedule.id
      })
    );

    setQrCode(qrDataUrl);
    setIsActive(true);

    // Listen for check-ins
    const subscription = supabase
      .channel(`qr_checkin_${schedule.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
        filter: `schedule_id=eq.${schedule.id}`
      }, (payload) => {
        setCheckedInStudents(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">📱 QR Code Attendance</h2>

      {!isActive ? (
        <button
          onClick={generateQRCode}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
        >
          <QrCode className="inline mr-2" />
          Generate QR Code
        </button>
      ) : (
        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="bg-white p-6 rounded-xl border-4 border-blue-500">
            <img src={qrCode} alt="QR Code" className="w-full max-w-sm mx-auto" />
            <p className="text-center mt-4 text-gray-600">
              <Clock className="inline mr-2" size={16} />
              Valid for 30 minutes
            </p>
          </div>

          {/* Check-in Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-2">
              Checked In: {checkedInStudents.length}/{students.length}
            </h3>
            <div className="space-y-2">
              {checkedInStudents.map(student => (
                <div key={student.id} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{student.student_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(student.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsActive(false)}
            className="w-full bg-red-500 text-white py-2 rounded-lg"
          >
            Stop QR Session
          </button>
        </div>
      )}
    </div>
  );
};
```

**Student Scanner Component:**
```jsx
// src/components/QRScanner.jsx
import { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { Camera, CheckCircle } from 'lucide-react';

const QRScanner = ({ userId }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (data) => {
    if (data) {
      try {
        const qrData = JSON.parse(data.text);
        
        if (qrData.type === 'attendance') {
          // Verify token is valid
          const { data: session } = await supabase
            .from('attendance_qr_sessions')
            .select('*')
            .eq('token', qrData.token)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (session) {
            // Check in student
            await submitAttendance({
              schedule_id: qrData.schedule_id,
              user_id: userId,
              status: 'present',
              check_in_method: 'qr_code'
            });

            setResult({ success: true, message: 'Check-in successful!' });
          } else {
            setResult({ success: false, message: 'QR Code expired or invalid' });
          }
        }
      } catch (err) {
        setResult({ success: false, message: 'Invalid QR Code' });
      }
      
      setScanning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">📷 Scan QR Code</h2>

      {!scanning && !result && (
        <button
          onClick={() => setScanning(true)}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
        >
          <Camera className="inline mr-2" />
          Open Camera
        </button>
      )}

      {scanning && (
        <div>
          <QrScanner
            delay={300}
            onError={(err) => console.error(err)}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
          <button
            onClick={() => setScanning(false)}
            className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? (
            <CheckCircle className="text-green-500 mx-auto mb-2" size={48} />
          ) : (
            <span className="text-red-500 text-4xl">❌</span>
          )}
          <p className="text-center font-semibold">{result.message}</p>
          <button
            onClick={() => setResult(null)}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};
```

**Database Schema:**
```sql
-- QR Sessions table
CREATE TABLE attendance_qr_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add check_in_method to attendance table
ALTER TABLE attendance ADD COLUMN check_in_method TEXT DEFAULT 'manual';
-- Values: 'manual', 'qr_code', 'auto'
```

---

## 📊 Feature #3: Attendance Analytics

### 3.1 Analytics Dashboard

**Component:**
```jsx
// src/components/AttendanceAnalytics.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';

const AttendanceAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [classComparison, setClassComparison] = useState([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Overall stats
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*');

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const rate = ((present / total) * 100).toFixed(1);

    setStats({ total, present, late, absent, rate });

    // Trend data (last 8 weeks)
    const trendData = await calculateWeeklyTrend();
    setTrendData(trendData);

    // Class comparison
    const classData = await calculateClassComparison();
    setClassComparison(classData);

    // Low attendance students
    const lowStudents = await findLowAttendanceStudents();
    setLowAttendanceStudents(lowStudents);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall Rate"
          value={`${stats?.rate}%`}
          icon={<TrendingUp />}
          color="blue"
          trend="+3%"
        />
        <StatCard
          title="Total Classes"
          value={stats?.total}
          icon={<Calendar />}
          color="green"
        />
        <StatCard
          title="Present"
          value={stats?.present}
          icon={<Users />}
          color="green"
        />
        <StatCard
          title="Absent"
          value={stats?.absent}
          icon={<Users />}
          color="red"
        />
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📈 Attendance Trend (8 Weeks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#1F4E8C" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Class Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">📊 Class Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="class" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="rate" fill="#1F4E8C" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low Attendance Alert */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">⚠️ Students Need Attention</h3>
        <div className="space-y-3">
          {lowAttendanceStudents.map(student => (
            <div key={student.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-gray-600">{student.student_id}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{student.rate}%</p>
                <p className="text-xs text-gray-600">{student.absents} absents</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={exportReport}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
      >
        📥 Export Report (PDF)
      </button>
    </div>
  );
};
```

---

## 📦 Implementation Checklist

### Phase 1: Push Notifications (2-3 days)
- [ ] Setup Supabase Edge Functions
- [ ] Create database tables
- [ ] Implement notification settings UI
- [ ] Create cron job for reminders
- [ ] Test on mobile devices

### Phase 2: Booking History (2-3 days)
- [ ] Install react-calendar
- [ ] Create calendar component
- [ ] Implement list view
- [ ] Add filters and search
- [ ] Test responsiveness

### Phase 3: QR Code Attendance (3-4 days)
- [ ] Install QR libraries
- [ ] Create QR generation component
- [ ] Create scanner component
- [ ] Implement validation logic
- [ ] Test on various devices

### Phase 4: Analytics (4-5 days)
- [ ] Install chart libraries
- [ ] Create analytics queries
- [ ] Build dashboard components
- [ ] Implement export functionality
- [ ] Test performance

---

## 🎯 Success Metrics

**Push Notifications:**
- ✅ 80%+ notification delivery rate
- ✅ 50%+ reduction in no-shows
- ✅ 90%+ user satisfaction

**Booking History:**
- ✅ 100% booking visibility
- ✅ < 2 seconds load time
- ✅ 95%+ user adoption

**QR Attendance:**
- ✅ < 5 minutes check-in time for full class
- ✅ 70%+ teacher adoption
- ✅ 99%+ accuracy

**Analytics:**
- ✅ Real-time data updates
- ✅ Actionable insights
- ✅ 80%+ admin usage

---

**Ready to implement?** Start with Phase 1 (Push Notifications) for maximum impact! 🚀
