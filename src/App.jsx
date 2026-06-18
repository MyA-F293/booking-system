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

  // 🔧 MAINTENANCE MODE - set to true to show maintenance page
  const MAINTENANCE_MODE = false;

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

  // Maintenance mode page
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.78 3.43a.75.75 0 01-1.08-.67V5.87a.75.75 0 01.36-.64l5.78-3.43a.75.75 0 01.72 0l5.78 3.43a.75.75 0 01.36.64v12.06a.75.75 0 01-1.08.67l-5.78-3.43a.75.75 0 00-.72 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a2 2 0 104 0 2 2 0 00-4 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v1m0 4v1" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-blue-200 text-lg mb-6">
            We're improving our system to serve you better. Please check back shortly.
          </p>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-amber-300 text-sm font-medium">Maintenance in progress</span>
            </div>
            <p className="text-blue-300 text-sm">
              Estimated downtime: ~15 minutes
            </p>
          </div>
          <p className="text-slate-400 text-xs mt-6">EYS Academy Booking System</p>
        </div>
      </div>
    );
  }

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

  // Wrap entire app content (WeekProvider already in main.jsx)
  return (
    <>
      {/* Not logged in */}
      {!user && (
        <div className="animate-fadeIn">
          <Login onLoginSuccess={handleLoginSuccess} />
          <Suspense fallback={<LoadingFallback userRole="student" />}>
            <InstallPWA />
          </Suspense>
        </div>
      )}

      {/* Teacher */}
      {user && user.role === 'teacher' && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingFallback userRole="teacher" />}>
            <TeacherDashboard user={user} />
            <InstallPWA />
          </Suspense>
        </div>
      )}

      {/* Admin */}
      {user && user.role === 'admin' && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingFallback userRole="admin" />}>
            <AdminDashboard user={user} />
            <InstallPWA />
          </Suspense>
        </div>
      )}

      {/* Student */}
      {user && user.role === 'student' && (
        <div className="animate-fadeIn">
          <Suspense fallback={<LoadingFallback userRole="student" />}>
            <BookingSystemDB user={user} />
            <InstallPWA />
          </Suspense>
        </div>
      )}
    </>
  );
}

export default App;
