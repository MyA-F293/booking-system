import { useState, useEffect, lazy, Suspense } from 'react';
import Lottie from 'lottie-react';
import Login from './Login';
import { getCurrentUser, isTeacherRemembered } from './utils/authHelpers';
import { autoCopyBookingsToNextWeek } from './utils/dbHelpers';
import { initVersionCheck, stopVersionCheck } from './utils/versionCheck';
import lazyWithRetry from './utils/lazyWithRetry';
import academicHutAnimation from '../public/Academic Hut banner.json';
import studentLoadingAnimation from '../public/Loading 40 _ Paperplane.json';
import adminLoadingAnimation from '../public/admin_Loading 40 _ Paperplane .json';

// Lazy load heavy components with retry mechanism
const BookingSystemDB = lazy(() => lazyWithRetry(() => import('./BookingSystemDB')));
const AdminDashboard = lazy(() => lazyWithRetry(() => import('./AdminDashboard')));
const TeacherDashboard = lazy(() => lazyWithRetry(() => import('./components/TeacherDashboard')));
const InstallPWA = lazy(() => lazyWithRetry(() => import('./components/InstallPWA')));

// Loading fallback component - Different animation based on user role
const LoadingFallback = ({ userRole = 'student' }) => {
  const animation = userRole === 'admin' || userRole === 'teacher'
    ? adminLoadingAnimation
    : studentLoadingAnimation;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center transition-opacity duration-300 ease-in-out">
      <div className="w-40 h-40 sm:w-48 sm:h-48">
        <Lottie
          animationData={animation}
          loop={true}
          autoplay={true}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: true
          }}
        />
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      console.log('🚀 App: Initializing...');

      // Initialize version check for auto-update
      initVersionCheck();

      // Load current user first
      const currentUser = getCurrentUser();
      console.log('🔍 App: Checking current user:', currentUser);

      // Check if teacher is remembered
      let userToSet = currentUser;
      if (!currentUser && isTeacherRemembered()) {
        console.log('👨‍🏫 App: Teacher remembered, checking localStorage');
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'teacher') {
            userToSet = parsedUser;
          }
        }
      }

      // If user is already logged in, skip the long loading animation
      if (userToSet) {
        console.log('✅ User already logged in, skipping Academic Hut animation');
        setUser(userToSet);
        setLoading(false);

        // Still run auto-copy in background (non-blocking)
        autoCopyBookingsToNextWeek().catch(err =>
          console.error('❌ Background auto-copy error:', err)
        );

        return;
      }

      // Only show long loading animation for first-time visitors (not logged in)
      console.log('🎬 First time visitor, showing Academic Hut animation');

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

      // Add minimum 1.5 second delay to show Academic Hut banner properly
      // This serves as "loading system" alibi while actually loading data
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Trigger fade out animation
      setFadeOut(true);

      // Wait for fade out to complete before hiding
      await new Promise(resolve => setTimeout(resolve, 300));

      setLoading(false);
    };

    initApp();

    // Cleanup on unmount
    return () => {
      stopVersionCheck();
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    console.log('✅ App: Login successful, user data:', userData);
    setUser(userData);
  };

  // Initial loading with Academic Hut banner - Only for first-time visitors
  if (loading) {
    return (
      <div className={`min-h-screen bg-white flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <Lottie
            animationData={academicHutAnimation}
            loop={true}
            autoplay={true}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice',
              progressiveLoad: true
            }}
          />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    console.log('🔒 App: No user, showing login');
    return (
      <div className="animate-fadeIn">
        <Login onLoginSuccess={handleLoginSuccess} />
        <Suspense fallback={<LoadingFallback userRole="student" />}>
          <InstallPWA />
        </Suspense>
      </div>
    );
  }

  // Teacher
  if (user.role === 'teacher') {
    console.log('👨‍🏫 App: User is teacher, showing teacher dashboard');
    return (
      <div className="animate-fadeIn">
        <Suspense fallback={<LoadingFallback userRole="teacher" />}>
          <TeacherDashboard user={user} />
          <InstallPWA />
        </Suspense>
      </div>
    );
  }

  // Admin
  if (user.role === 'admin') {
    console.log('👑 App: User is admin, showing dashboard');
    return (
      <div className="animate-fadeIn">
        <Suspense fallback={<LoadingFallback userRole="admin" />}>
          <AdminDashboard user={user} />
          <InstallPWA />
        </Suspense>
      </div>
    );
  }

  // Student
  console.log('👨‍🎓 App: User is student, showing booking system');
  return (
    <div className="animate-fadeIn">
      <Suspense fallback={<LoadingFallback userRole="student" />}>
        <BookingSystemDB user={user} />
        <InstallPWA />
      </Suspense>
    </div>
  );
}

export default App;
