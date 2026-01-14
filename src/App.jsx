import { useState, useEffect } from 'react';
import Login from './Login';
import BookingSystemDB from './BookingSystemDB';
import AdminDashboard from './AdminDashboard';
import { getCurrentUser } from './utils/authHelpers';
import { autoCopyBookingsToNextWeek } from './utils/dbHelpers';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Check and auto-copy bookings if needed
      console.log('🚀 App: Initializing...');
      const copyResult = await autoCopyBookingsToNextWeek();
      console.log('📋 App: Auto-copy result:', copyResult);

      // Load current user
      const currentUser = getCurrentUser();
      console.log('🔍 App: Checking current user:', currentUser);
      setUser(currentUser);
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
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin
  if (user.role === 'admin') {
    console.log('👑 App: User is admin, showing dashboard');
    return <AdminDashboard user={user} />;
  }

  // Student
  console.log('👨‍🎓 App: User is student, showing booking system');
  return <BookingSystemDB user={user} />;
}

export default App;