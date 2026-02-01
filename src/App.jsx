import { useState, useEffect } from 'react';
import Login from './Login';
import BookingSystemDB from './BookingSystemDB';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import InstallPWA from './components/InstallPWA';
import { getCurrentUser, isTeacherRemembered } from './utils/authHelpers';
import { autoCopyBookingsToNextWeek } from './utils/dbHelpers';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      console.log('🚀 App: Initializing...');

      try {
        // Check and auto-copy bookings with timeout (max 5 seconds)
        const copyPromise = autoCopyBookingsToNextWeek();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ copied: false, reason: 'timeout' }), 5000)
        );

        const copyResult = await Promise.race([copyPromise, timeoutPromise]);
        console.log('📋 App: Auto-copy result:', copyResult);
      } catch (error) {
        console.error('❌ App: Auto-copy error (non-critical):', error);
        // Continue even if auto-copy fails
      }

      // Load current user
      const currentUser = getCurrentUser();
      console.log('🔍 App: Checking current user:', currentUser);

      // If teacher is remembered, auto-login
      if (!currentUser && isTeacherRemembered()) {
        console.log('👨‍🏫 App: Teacher remembered, checking localStorage');
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'teacher') {
            setUser(parsedUser);
          }
        }
      } else {
        setUser(currentUser);
      }

      setLoading(false);
    };

    initApp();
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log('✅ App: Login successful, user data:', userData);
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    console.log('🔒 App: No user, showing login');
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        <InstallPWA />
      </>
    );
  }

  // Teacher
  if (user.role === 'teacher') {
    console.log('👨‍🏫 App: User is teacher, showing teacher dashboard');
    return (
      <>
        <TeacherDashboard user={user} />
        <InstallPWA />
      </>
    );
  }

  // Admin
  if (user.role === 'admin') {
    console.log('👑 App: User is admin, showing dashboard');
    return (
      <>
        <AdminDashboard user={user} />
        <InstallPWA />
      </>
    );
  }

  // Student
  console.log('👨‍🎓 App: User is student, showing booking system');
  return (
    <>
      <BookingSystemDB user={user} />
      <InstallPWA />
    </>
  );
}

export default App;