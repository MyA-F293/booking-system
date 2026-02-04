import { useState, useEffect, lazy, Suspense } from 'react';
import Login from './Login';
import { getCurrentUser, isTeacherRemembered } from './utils/authHelpers';
import { autoCopyBookingsToNextWeek } from './utils/dbHelpers';

// Lazy load heavy components
const BookingSystemDB = lazy(() => import('./BookingSystemDB'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const InstallPWA = lazy(() => import('./components/InstallPWA'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#1F4E8C] mb-4"></div>
      <p className="text-gray-600 font-semibold">Loading...</p>
    </div>
  </div>
);

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
        <Suspense fallback={<LoadingFallback />}>
          <InstallPWA />
        </Suspense>
      </>
    );
  }

  // Teacher
  if (user.role === 'teacher') {
    console.log('👨‍🏫 App: User is teacher, showing teacher dashboard');
    return (
      <Suspense fallback={<LoadingFallback />}>
        <TeacherDashboard user={user} />
        <InstallPWA />
      </Suspense>
    );
  }

  // Admin
  if (user.role === 'admin') {
    console.log('👑 App: User is admin, showing dashboard');
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboard user={user} />
        <InstallPWA />
      </Suspense>
    );
  }

  // Student
  console.log('👨‍🎓 App: User is student, showing booking system');
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingSystemDB user={user} />
      <InstallPWA />
    </Suspense>
  );
}

export default App;