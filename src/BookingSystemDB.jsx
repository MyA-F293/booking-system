import { useState, useEffect } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { useToast } from './components/Toast';

import BookingDashboard from './components/BookingDashboard';
// import StudentAttendanceHistory from './components/StudentAttendanceHistory';
import FeedbackButton from './components/FeedbackButton';
import UserGuide from './components/UserGuide';
import { X, Users, Calendar, Clock, User, Loader2, LogOut, Lock, Pencil, LayoutDashboard, PlusCircle, Check, Eye, EyeOff, Key, CheckCircle2, Sparkles, ClipboardList, HelpCircle } from 'lucide-react';
import { logout, updateOwnPassword } from './utils/authHelpers';
import {
    getClasses,
    getTeachers,
    getOrCreateSchedule,
    getSchedules,
    getOccupiedClassesByOtherPrograms,
    createBooking,
    hasUserBookedPhase,
    getUserBookings,
    getCurrentWeek,
    getCurrentYear,
    getDateForDayInWeek,
    formatDateShort,
    getAttendanceRecords
} from './utils/dbHelpers';

const BookingSystemDB = ({ user }) => {
    console.log('🚀 BookingSystemDB component mounted');
    console.log('👤 Received user prop:', user);
    console.log('📦 User batch:', user?.batch);

    const { t } = useLanguage();
    const { settings, updateSettings } = useSettings();
    const toast = useToast();

    const phases = [
        { id: 'phase1', days: ['monday', 'tuesday', 'wednesday'] },
        { id: 'phase2', days: ['thursday', 'friday', 'saturday'] },
        { id: 'recap', days: ['sunday'] }
    ];

    const dayLabels = {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
    };

    const times = [
        { id: 'afternoon' },
        { id: 'evening' }
    ];

    // Class badges - unique icons/emojis for each class
    const classBadges = {
        'Fahd Class': { emoji: '🏛️', color: 'bg-amber-100 text-amber-700' },
        'Harvard Class': { emoji: '🎓', color: 'bg-red-100 text-red-700' },
        'Oxford Class': { emoji: '📚', color: 'bg-blue-100 text-blue-700' },
        'Tokyo Class': { emoji: '🗼', color: 'bg-pink-100 text-pink-700' },
        'Tsinghua Class': { emoji: '🏯', color: 'bg-purple-100 text-purple-700' },
    };

    const getClassBadge = (className) => {
        return classBadges[className] || { emoji: '📖', color: 'bg-gray-100 text-gray-700' };
    };

    const [activeView, setActiveView] = useState('dashboard');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editBatch, setEditBatch] = useState(1);
    const [showUserGuide, setShowUserGuide] = useState(false);

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // User state
    const [currentUser] = useState(user);
    const [userId, setUserId] = useState(user?.id || null);

    // Booking state
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    // Data from database
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [userBookings, setUserBookings] = useState([]);

    // Track phases being booked (to prevent double booking during async operations)
    const [bookingInProgress, setBookingInProgress] = useState(null);

    // Track classes occupied by other programs (for room exclusivity)
    const [occupiedClasses, setOccupiedClasses] = useState([]);

    // Success modal state
    const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);
    const [lastBookedClass, setLastBookedClass] = useState(null);

    // Constants - all programs and levels active
    const programs = [
        { name: 'Campus & Career', comingSoon: false },
        { name: 'English for Teens', comingSoon: false }
    ];

    const levels = [
        { name: 'Starter', comingSoon: false },
        { name: 'Upper Starter', comingSoon: false },
        { name: 'Pre-Intermediate', comingSoon: false },
        { name: 'Intermediate', comingSoon: false }
    ];

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();

    console.log('📅 Current Week:', currentWeek, 'Year:', currentYear);

    // Logout handler
    const handleLogout = () => {
        console.log('🚪 Logging out from BookingSystemDB...');
        logout();
        window.location.reload();
    };

    // Change password handler
    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('password.notMatch') || 'New passwords do not match!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error(t('password.tooShort') || 'Password must be at least 6 characters!');
            return;
        }

        try {
            setLoading(true);
            await updateOwnPassword(userId, passwordData.currentPassword, passwordData.newPassword);
            toast.success(t('password.changeSuccess') || 'Password changed successfully!');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error changing password:', err);
            toast.error(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    // Pastikan user ada
    useEffect(() => {
        if (!user) {
            console.error('❌ No user prop received!');
            setError('User not found. Please login again.');
            return;
        }
        console.log('✅ User initialized:', user);
    }, [user]);

    // Check if user should see guide (first time login per user)
    useEffect(() => {
        if (userId) {
            const hasSeenGuide = localStorage.getItem(`eysa_guide_seen_${userId}`);
            if (!hasSeenGuide) {
                // Show guide after 1 second delay for better UX
                setTimeout(() => {
                    setShowUserGuide(true);
                }, 1000);
            }
        }
    }, [userId]);

    // Load initial data
    useEffect(() => {
        console.log('🔄 useEffect: loadInitialData triggered');
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            console.log('📡 Starting loadInitialData...');
            setLoading(true);

            console.log('🎓 Fetching classes...');
            const classesData = await getClasses();
            console.log('✅ Classes loaded:', classesData);

            console.log('👨‍🏫 Fetching teachers...');
            const teachersData = await getTeachers();
            console.log('✅ Teachers loaded:', teachersData);

            setClasses(classesData);
            setTeachers(teachersData);

            console.log('✅ Initial data loaded successfully');
        } catch (err) {
            console.error('❌ Error in loadInitialData:', err);
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            console.log('🏁 loadInitialData finished, loading:', false);
        }
    };

    // Load schedules when program/level selected
    useEffect(() => {
        console.log('🔄 useEffect: loadSchedules check', {
            selectedProgram,
            selectedLevel,
            selectedPhase,
            selectedDay,
            selectedTime
        });

        if (selectedProgram && selectedLevel && selectedPhase && selectedDay && selectedTime) {
            console.log('✅ Conditions met, loading schedules...');
            loadSchedules();
        } else {
            console.log('⏭️ Skipping loadSchedules, conditions not met');
        }
    }, [selectedProgram, selectedLevel, selectedPhase, selectedDay, selectedTime]);

    const loadSchedules = async () => {
        try {
            console.log('📡 Starting loadSchedules...');
            const bookingWeek = getBookingWeek();
            const userBatch = currentUser?.batch;
            const filters = {
                program: selectedProgram,
                level: selectedLevel,
                phase: selectedPhase,
                day: selectedDay,
                time_slot: selectedTime,
                week_number: bookingWeek,
                year: currentYear,
                batch: userBatch
            };

            console.log('🔍 Fetching schedules with filters:', filters);
            const data = await getSchedules(filters);
            console.log('✅ Schedules loaded:', data);
            setSchedules(data);

            // Also check for classes occupied by other programs (Room Exclusivity Rule)
            if (selectedDay && selectedTime) {
                const occupied = await getOccupiedClassesByOtherPrograms({
                    day: selectedDay,
                    time_slot: selectedTime,
                    week_number: bookingWeek,
                    year: currentYear,
                    currentProgram: selectedProgram,
                    batch: userBatch
                });
                setOccupiedClasses(occupied);
            }
        } catch (err) {
            console.error('❌ Error loading schedules:', err);
        }
    };

    // Load user bookings
    const loadUserBookings = async () => {
        if (!userId) {
            console.log('⏭️ Skipping loadUserBookings, no userId');
            return;
        }

        try {
            console.log('📡 Loading user bookings for userId:', userId);
            console.log('👤 User batch:', currentUser?.batch);
            const bookingWeek = getBookingWeek();
            const userBatch = currentUser?.batch;

            const bookingsCurrentWeek = await getUserBookings(userId, currentWeek, currentYear, userBatch);
            const bookingsNextWeek = await getUserBookings(userId, bookingWeek, currentYear, userBatch);

            const allBookings = [...bookingsCurrentWeek, ...bookingsNextWeek];
            const uniqueBookings = allBookings.filter((booking, index, self) =>
                index === self.findIndex(b => b.id === booking.id)
            );

            console.log('✅ User bookings loaded:', uniqueBookings);
            setUserBookings(uniqueBookings);
        } catch (err) {
            console.error('❌ Error loading bookings:', err);
        }
    };

    useEffect(() => {
        console.log('🔄 useEffect: loadUserBookings check, userId:', userId);
        if (userId) {
            loadUserBookings();
        }
    }, [userId]);

    // Check if today is Thursday (4), Friday (5), or Saturday (6) before 22:00
    const canBook = () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sunday, 4=Thursday, 5=Friday, 6=Saturday
        const hour = now.getHours();

        const isBookingDay = (dayOfWeek >= 4 && dayOfWeek <= 6);
        const isBeforeCutoff = hour < 22;
        const canBookNow = isBookingDay && isBeforeCutoff;

        console.log('🔍 canBook check:', {
            dayOfWeek,
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            hour,
            isBookingDay,
            isBeforeCutoff,
            canBookNow
        });

        // Thursday (4), Friday (5), or Saturday (6) before 22:00 (10 PM)
        return canBookNow;
    };

    // Booking for next week
    const getBookingWeek = () => {
        return currentWeek + 1; // Book for next week
    };

    const handleProgramSelect = (program) => {
        if (program.comingSoon) return;
        console.log('📚 Program selected:', program.name);
        setSelectedProgram(program.name);
        setSelectedLevel('');
    };

    const handleLevelSelect = (level) => {
        if (level.comingSoon) return;
        console.log('📊 Level selected:', level.name);
        if (!canBook()) {
            toast.warning(t('booking.bookingDayRestriction'));
            return;
        }
        setSelectedLevel(level.name);
        setShowBookingModal(true);
        setSelectedPhase('');
        setSelectedDay('');
        setSelectedTime('');
    };

    const getUserPhaseBooking = (phase) => {
        const bookingWeek = getBookingWeek();
        const booking = userBookings.find(b =>
            b.schedule.phase === phase &&
            b.schedule.week_number === bookingWeek
        );
        console.log('🔍 getUserPhaseBooking for phase:', phase, 'week:', bookingWeek, 'result:', booking);
        return booking;
    };

    const getClassStatus = (classItem, scheduleData) => {
        console.log('📊 getClassStatus called', { classItem, scheduleData });

        if (!classItem) {
            console.log('⚠️ No classItem');
            return { count: 0, available: false, status: 'unavailable' };
        }

        // Check if this class is occupied by another program (Room Exclusivity Rule)
        const occupiedByOther = occupiedClasses.find(oc => oc.class_id === classItem.id);
        if (occupiedByOther) {
            console.log('🚫 Class occupied by other program:', occupiedByOther.program);
            return {
                count: 0,
                available: false,
                status: 'occupied',
                occupiedBy: occupiedByOther.program
            };
        }

        if (!scheduleData) {
            console.log('⚠️ No scheduleData, returning default');
            return { count: 0, available: true, status: 'available' };
        }

        const count = scheduleData.current_students || 0;
        console.log('📊 Current students:', count);

        if (count >= 10) {
            return { count, available: false, status: 'full' };
        }

        return { count, available: true, status: count >= 4 ? 'active' : 'available' };
    };

    const handleClassSelect = async (classItem) => {
        console.log('🎯 handleClassSelect called', {
            classItem,
            selectedPhase,
            selectedDay,
            selectedTime,
            userId
        });

        if (!selectedPhase || !selectedDay || !selectedTime || !userId) {
            console.log('⚠️ Missing required data');
            return;
        }

        // Prevent double booking - check if already booking this phase
        if (bookingInProgress === selectedPhase) {
            console.log('⚠️ Booking already in progress for this phase');
            toast.warning('Booking in progress, please wait...');
            return;
        }

        const bookingWeek = getBookingWeek();
        const userBatch = currentUser?.batch;

        try {
            // Mark this phase as being booked
            setBookingInProgress(selectedPhase);
            setLoading(true);
            console.log('📡 Creating booking...');
            console.log('👤 User batch:', userBatch);

            // Double-check from database (not just local state) - filter by batch
            const hasBooked = await hasUserBookedPhase(userId, selectedPhase, bookingWeek, currentYear, userBatch);
            console.log('🔍 Has booked this phase:', hasBooked);

            if (hasBooked) {
                toast.warning(`You have already booked ${t(`phase.${selectedPhase}`)}. You can only book once per phase.`);
                return;
            }

            const teacherIndex = classes.findIndex(c => c.id === classItem.id);
            const teacher = teachers[teacherIndex % teachers.length];
            console.log('👨‍🏫 Selected teacher:', teacher);

            // Handle case when no teachers available
            const teacherId = teacher?.id || null;

            const scheduleData = {
                class_id: classItem.id,
                teacher_id: teacherId,
                program: selectedProgram,
                level: selectedLevel,
                phase: selectedPhase,
                day: selectedDay,
                time_slot: selectedTime,
                week_number: bookingWeek,
                year: currentYear,
                batch: userBatch
            };

            console.log('📅 Creating schedule with data:', scheduleData);
            const schedule = await getOrCreateSchedule(scheduleData);
            console.log('✅ Schedule created/retrieved:', schedule);

            // Check if schedule was created successfully
            if (!schedule || !schedule.id) {
                console.error('❌ Failed to create/get schedule');
                toast.error('Failed to book: Could not create schedule. Please try again.');
                return;
            }

            if (schedule.current_students >= 10) {
                console.log('⚠️ Class is full');
                toast.error(t('booking.classFull'));
                return;
            }

            console.log('📝 Creating booking...');
            await createBooking({
                schedule_id: schedule.id,
                user_id: userId,
                status: 'confirmed'
            });
            console.log('✅ Booking created');

            // Store booked class info for success modal
            setLastBookedClass({
                className: classItem.name,
                phase: selectedPhase,
                day: selectedDay,
                time: selectedTime,
                teacher: teacher?.name,
                week: bookingWeek
            });

            console.log('🔄 Reloading data...');
            await loadUserBookings();
            await loadSchedules();

            setShowBookingModal(false);
            setSelectedPhase('');
            setSelectedDay('');
            setSelectedTime('');

            // Show success modal
            setShowBookingSuccessModal(true);
        } catch (err) {
            console.error('❌ Booking error:', err);
            toast.error((t('booking.error') || 'Failed to book: ') + err.message);
        } finally {
            setLoading(false);
            setBookingInProgress(null);
        }
    };

    console.log('🎨 Rendering component, state:', {
        loading,
        error,
        classesLength: classes.length,
        teachersLength: teachers.length,
        selectedProgram,
        selectedLevel
    });

    // Loading screen
    if (loading && classes.length === 0) {
        console.log('⏳ Showing loading screen');
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
                <div className="text-center relative z-10">
                    <Loader2 className="animate-spin text-[#1F4E8C] mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading data from database...</p>
                </div>
            </div>
        );
    }

    // Inline Student Attendance History Component
    const StudentAttendanceView = () => {
        const [attendanceData, setAttendanceData] = useState([]);
        const [loadingAttendance, setLoadingAttendance] = useState(false);

        useEffect(() => {
            if (activeView === 'attendance') {
                fetchMyAttendance();
            }
        }, [activeView]);

        const fetchMyAttendance = async () => {
            setLoadingAttendance(true);
            try {
                // Fetch from Supabase instead of Google Sheets
                const data = await getAttendanceRecords({ student_id: currentUser.student_id });
                setAttendanceData(data);
            } catch (error) {
                console.error('Error fetching attendance:', error);
                toast.error('Failed to load attendance history');
                setAttendanceData([]);
            } finally {
                setLoadingAttendance(false);
            }
        };

        const stats = {
            total: attendanceData.length,
            present: attendanceData.filter(r => r.status === 'present').length,
            late: attendanceData.filter(r => r.status === 'late').length,
            absent: attendanceData.filter(r => r.status === 'absent').length,
        };

        const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

        return (
            <div className="space-y-4 sm:space-y-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">My Attendance History</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Track your class attendance and performance</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-[#1F4E8C]">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="text-[#1F4E8C] w-5 h-5" />
                            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-green-600 w-5 h-5" />
                            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Present</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.present}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-yellow-500">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="text-yellow-600 w-5 h-5" />
                            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Late</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.late}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#1F4E8C] to-[#163a6b] rounded-xl p-3 sm:p-5 shadow-md text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <p className="text-[10px] sm:text-xs opacity-90 font-medium">Rate</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">{attendanceRate}%</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#1F4E8C] to-[#163a6b] text-white">
                        <h3 className="text-base sm:text-lg font-bold">Attendance Records</h3>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Class</th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loadingAttendance ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                            Loading...
                                        </td>
                                    </tr>
                                ) : attendanceData.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Calendar size={48} className="text-gray-300" />
                                                <p className="text-sm font-semibold">No attendance records found</p>
                                                <p className="text-xs">Your attendance will appear here after classes</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    attendanceData.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-[10px] sm:text-sm text-gray-700">
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] sm:text-sm font-semibold text-gray-800">{record.class_name}</div>
                                                <div className="text-[9px] sm:text-xs text-gray-500">{record.day}</div>
                                            </td>
                                            <td className="px-3 py-2 text-[10px] sm:text-sm text-gray-700">{record.teacher_name}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-1 rounded-full text-[9px] sm:text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {stats.total > 0 && (
                    <div className={`rounded-xl p-4 ${attendanceRate >= 80 ? 'bg-green-50 border-2 border-green-200' :
                        attendanceRate >= 60 ? 'bg-yellow-50 border-2 border-yellow-200' :
                            'bg-red-50 border-2 border-red-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">
                                {attendanceRate >= 80 ? '🎉' : attendanceRate >= 60 ? '💪' : '📚'}
                            </div>
                            <div>
                                <h4 className={`text-sm sm:text-base font-bold mb-1 ${attendanceRate >= 80 ? 'text-green-800' :
                                    attendanceRate >= 60 ? 'text-yellow-800' :
                                        'text-red-800'
                                    }`}>
                                    {attendanceRate >= 80 ? 'Excellent Attendance!' :
                                        attendanceRate >= 60 ? 'Good Job! Keep It Up!' :
                                            'Let\'s Improve Together!'}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    {attendanceRate >= 80 ? 'You\'re doing amazing! Keep up the great work!' :
                                        attendanceRate >= 60 ? 'You\'re on the right track! Try to attend all classes.' :
                                            'Regular attendance is key to success. We believe in you!'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    console.log('✅ Rendering main UI');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-3 lg:py-4">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                        {/* Left: Logo & Title */}
                        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 min-w-0">
                            <div className="flex-shrink-0">
                                <img
                                    src="/eysa-logo.png"
                                    alt="EYSA Logo"
                                    className="h-6 sm:h-10 lg:h-14 w-auto drop-shadow-md"
                                />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-[11px] sm:text-base lg:text-xl font-bold text-[#1F4E8C] leading-tight">
                                    {t('login.title')}
                                </h1>
                                <div className="flex items-center gap-0.5">
                                    <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-500">
                                        {currentUser?.batch || `Batch ${settings.batch}`} | {t('common.week')} {currentWeek}
                                    </p>
                                    {currentUser?.role === 'admin' && (
                                        <button
                                            onClick={() => {
                                                setEditBatch(settings.batch);
                                                setShowSettingsModal(true);
                                            }}
                                            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                            title="Edit Info"
                                        >
                                            <Pencil size={8} className="sm:w-2.5 sm:h-2.5 text-gray-400 hover:text-[#F39C32]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: User Info, Toggles & Logout */}
                        {currentUser && (
                            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-semibold text-gray-800 truncate max-w-[120px] lg:max-w-none">
                                        {currentUser.full_name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {currentUser.student_id}
                                    </div>
                                </div>
                                {/* Help/Guide Button */}
                                <button
                                    onClick={() => setShowUserGuide(true)}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all shadow-md hover:shadow-lg"
                                    title="User Guide"
                                >
                                    <HelpCircle size={12} className="sm:w-4 sm:h-4" />
                                    <span className="hidden lg:inline text-[10px] sm:text-sm font-semibold">Guide</span>
                                </button>
                                {/* Change Password Button */}
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="bg-[#1F4E8C] hover:bg-[#183d6e] text-white p-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all"
                                    title={t('password.change') || 'Change Password'}
                                >
                                    <Key size={12} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all font-semibold text-[10px] sm:text-sm shadow-md hover:shadow-lg"
                                >
                                    <LogOut size={12} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t('common.logout')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                        <p className="text-red-600 font-semibold">❌ {error}</p>
                    </div>
                )}

                {/* Tab Navigation - Modern Style */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {[
                            { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard.bookingDetails'), shortLabel: 'Booking' },
                            { id: 'booking', icon: PlusCircle, label: t('dashboard.createNewBooking'), shortLabel: 'New' },
                            { id: 'attendance', icon: ClipboardList, label: 'My Attendance', shortLabel: 'Attendance' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id)}
                                className={`flex-1 relative py-2.5 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-6 font-poppins transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 group ${activeView === tab.id
                                    ? 'text-[#1F4E8C]'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon size={16} className={`sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110 ${activeView === tab.id ? 'text-[#1F4E8C]' : ''}`} />
                                <span className="font-semibold text-xs sm:text-sm">{tab.shortLabel}</span>

                                {/* Active indicator */}
                                {activeView === tab.id && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 sm:w-14 lg:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content based on active view */}
                {activeView === 'dashboard' ? (
                    <BookingDashboard user={currentUser} />
                ) : activeView === 'attendance' ? (
                    <StudentAttendanceView />
                ) : (
                    <>
                        {/* Booking Status Banner - Modern Design */}
                        <div className={`rounded-2xl p-4 sm:p-5 mb-6 relative overflow-hidden ${canBook()
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                            <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white/5 rounded-full translate-y-1/2"></div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`p-2.5 sm:p-3 rounded-xl ${canBook() ? 'bg-white/20' : 'bg-white/20'}`}>
                                        {canBook() ? (
                                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        ) : (
                                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm sm:text-lg">
                                            {canBook() ? 'Booking is OPEN' : 'Booking is CLOSED'}
                                        </p>
                                        <p className="text-white/80 text-xs sm:text-sm">
                                            {canBook()
                                                ? 'Available Thursday - Saturday (until 22:00)'
                                                : 'Opens Thursday - Saturday (until 22:00)'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2">
                                        <p className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wider">Week</p>
                                        <p className="text-white font-bold text-lg sm:text-2xl">{getBookingWeek()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Welcome - Simple Text */}
                        {currentUser && (
                            <div className="mb-6">
                                <p className="text-gray-500 text-sm">{t('common.welcome')}</p>
                                <p className="text-xl sm:text-2xl font-bold text-[#1F4E8C]">{currentUser.full_name}</p>
                            </div>
                        )}

                        {/* Program Selection - Clean */}
                        <div className="mb-6">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-[#1F4E8C]">1.</span> {t('booking.selectProgram')}
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {programs.map((program) => (
                                    <button
                                        key={program.name}
                                        onClick={() => handleProgramSelect(program)}
                                        disabled={program.comingSoon}
                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${!program.comingSoon ? 'active:scale-[0.98]' : ''} ${program.comingSoon
                                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                            : selectedProgram === program.name
                                                ? 'bg-[#1F4E8C] text-white border-[#1F4E8C] shadow-lg'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#1F4E8C]'
                                            }`}
                                    >
                                        {program.comingSoon && (
                                            <span className="absolute top-2 right-2 text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                                Soon
                                            </span>
                                        )}
                                        <span className={`text-sm sm:text-base font-semibold ${program.comingSoon ? 'text-gray-400' : ''}`}>
                                            {program.name === 'Campus & Career' ? t('program.campusCareer') : t('program.englishTeens')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level Selection - Clean */}
                        {selectedProgram && (
                            <div className="mb-6">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-[#F39C32]">2.</span> {t('booking.selectLevel')}
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    {levels.map((level) => {
                                        const levelKey = level.name
                                            .toLowerCase()
                                            .replace(/\s+/g, '')
                                            .replace('pre-', 'pre');

                                        return (
                                            <button
                                                key={level.name}
                                                onClick={() => handleLevelSelect(level)}
                                                disabled={level.comingSoon}
                                                className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${!level.comingSoon ? 'active:scale-[0.98]' : ''} ${level.comingSoon
                                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                                    : selectedLevel === level.name
                                                        ? 'bg-[#F39C32] text-white border-[#F39C32] shadow-lg'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#F39C32]'
                                                    }`}
                                            >
                                                {level.comingSoon && (
                                                    <span className="absolute -top-1 -right-1 text-[8px] font-bold text-amber-600 bg-amber-100 px-1 rounded">
                                                        Soon
                                                    </span>
                                                )}
                                                <span className={`text-xs sm:text-sm font-semibold ${level.comingSoon ? 'text-gray-400' : ''}`}>
                                                    {t(`level.${levelKey}`)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* User Bookings - Grouped by Week */}
                        {userBookings.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Calendar size={18} className="text-[#1F4E8C]" />
                                        {t('booking.myBookings')}
                                    </h2>
                                    <span className="text-xs font-semibold text-white bg-[#1F4E8C] px-2.5 py-1 rounded-full">
                                        {userBookings.length} Booking
                                    </span>
                                </div>

                                {/* Group bookings by week */}
                                {[currentWeek, getBookingWeek()].map((weekNum) => {
                                    const weekBookings = userBookings.filter(b => b.schedule.week_number === weekNum);
                                    if (weekBookings.length === 0) return null;

                                    const isCurrentWeek = weekNum === currentWeek;

                                    return (
                                        <div key={weekNum} className="mb-5">
                                            {/* Week Header */}
                                            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${isCurrentWeek ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                                <div className={`p-1.5 rounded-lg ${isCurrentWeek ? 'bg-[#1F4E8C]' : 'bg-[#F39C32]'}`}>
                                                    <Calendar size={14} className="text-white" />
                                                </div>
                                                <span className={`font-bold text-sm ${isCurrentWeek ? 'text-[#1F4E8C]' : 'text-[#F39C32]'}`}>
                                                    Week {weekNum} (This Week)
                                                </span>
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {weekBookings.length} booking{weekBookings.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Week Bookings Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {weekBookings.map((booking) => {
                                                    const phaseLabel = booking.schedule.phase === 'phase1' ? 'Phase 1' : booking.schedule.phase === 'phase2' ? 'Phase 2' : 'Recap';

                                                    // Get day label - fallback to phase default if day is empty
                                                    let dayLabel = '-';
                                                    if (booking.schedule.day) {
                                                        dayLabel = dayLabels[booking.schedule.day] || booking.schedule.day;
                                                    } else {
                                                        if (booking.schedule.phase === 'phase1') dayLabel = 'Mon/Tue/Wed';
                                                        else if (booking.schedule.phase === 'phase2') dayLabel = 'Thu/Fri/Sat';
                                                        else if (booking.schedule.phase === 'recap') dayLabel = 'Sunday';
                                                    }

                                                    // Handle both English and Indonesian time_slot values
                                                    const timeSlot = booking.schedule.time_slot;
                                                    const isAfternoon = timeSlot === 'afternoon' || timeSlot === 'sore';
                                                    const timeLabel = isAfternoon ? 'Afternoon' : 'Evening';
                                                    const timeHours = isAfternoon ? '16:00 - 17:30' : '19:00 - 20:30';

                                                    return (
                                                        <div key={booking.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                            {/* Phase Header */}
                                                            <div className={`px-4 py-2.5 flex items-center justify-between ${isCurrentWeek ? 'bg-[#1F4E8C]' : 'bg-[#F39C32]'}`}>
                                                                <div>
                                                                    <span className="text-white font-semibold text-sm">{phaseLabel}</span>
                                                                    <p className="text-white/70 text-[10px]">Day: {dayLabel}</p>
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="p-4 space-y-3">
                                                                {/* Program & Level */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                                                                        <Calendar size={16} className="text-purple-600" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Program</p>
                                                                        <p className="font-semibold text-sm text-gray-800 truncate">{booking.schedule.program || '-'}</p>
                                                                        <p className="text-[10px] text-gray-500">{booking.schedule.level || '-'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Class Name */}
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`${getClassBadge(booking.schedule.class?.name).color} w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                                                                        {getClassBadge(booking.schedule.class?.name).emoji}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Class</p>
                                                                        <p className="font-semibold text-sm text-gray-800 truncate">{booking.schedule.class?.name || 'Unknown'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Teacher */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-[#F39C32]/10 rounded-lg shrink-0">
                                                                        <User size={16} className="text-[#F39C32]" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Teacher</p>
                                                                        <p className="font-medium text-sm text-gray-700 truncate">{booking.schedule.teacher?.name || 'TBA'}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Time */}
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-[#1F4E8C]/10 rounded-lg shrink-0">
                                                                        <Clock size={16} className="text-[#1F4E8C]" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Time</p>
                                                                        <p className="font-medium text-sm text-gray-700">{timeLabel} • {timeHours}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Footer Status */}
                                                            <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-center gap-2">
                                                                <Check size={14} className="text-emerald-600" />
                                                                <span className="text-xs font-semibold text-emerald-700">Confirmed</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white/95 backdrop-blur-md w-full max-w-[95vw] sm:max-w-lg lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/50 max-h-[90vh] flex flex-col">

                        {/* Header - Fixed at top */}
                        <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-3 sm:p-6 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-sm sm:text-xl lg:text-2xl font-bold">
                                    {t('booking.selectClass')}
                                </h3>
                                <p className="text-blue-200 mt-0.5 sm:mt-1 text-[10px] sm:text-sm">
                                    {selectedProgram} — {selectedLevel}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition"
                            >
                                <X size={18} className="sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 overflow-y-auto flex-1">

                            {/* Phase Selection */}
                            <div>
                                <h4 className="text-sm sm:text-lg lg:text-xl font-bold text-[#1F4E8C] mb-2 sm:mb-4">
                                    3. {t('booking.selectPhase')}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                                    {phases.map((phase) => {
                                        const hasBooking = getUserPhaseBooking(phase.id);
                                        const isBookingThisPhase = bookingInProgress === phase.id;
                                        const isDisabled = !!hasBooking || isBookingThisPhase;

                                        return (
                                            <button
                                                key={phase.id}
                                                disabled={isDisabled}
                                                onClick={() => {
                                                    setSelectedPhase(phase.id);
                                                    setSelectedDay('');
                                                    setSelectedTime('');
                                                }}
                                                className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${selectedPhase === phase.id
                                                    ? 'bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white border-[#1F4E8C] shadow-lg'
                                                    : 'bg-white/80 text-[#1F4E8C] border-[#1F4E8C]/30 hover:border-[#1F4E8C] hover:shadow-md'
                                                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="font-semibold text-xs sm:text-lg">
                                                    {t(`phase.${phase.id}`)}
                                                </div>
                                                <div className="text-[10px] sm:text-sm mt-0.5 sm:mt-1 opacity-80">
                                                    {t(`phase.${phase.id}Days`)}
                                                </div>

                                                {hasBooking && (
                                                    <div className="text-[9px] sm:text-xs mt-1.5 sm:mt-3 font-semibold bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg inline-block">
                                                        ✓ {t('booking.alreadyBooked')}
                                                    </div>
                                                )}
                                                {isBookingThisPhase && (
                                                    <div className="text-[9px] sm:text-xs mt-1.5 sm:mt-3 font-semibold bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg inline-block">
                                                        ⏳ Booking...
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Day Selection - Only show if phase selected AND not already booked */}
                            {selectedPhase && !getUserPhaseBooking(selectedPhase) && (
                                <div>
                                    <h4 className="text-sm sm:text-lg lg:text-xl font-bold text-[#1F4E8C] mb-2 sm:mb-4">
                                        4. Select Day
                                    </h4>

                                    {/* Week Info Banner */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mb-2 sm:mb-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="p-1.5 sm:p-2.5 bg-[#1F4E8C] rounded-lg sm:rounded-xl">
                                                <Calendar size={14} className="sm:w-5 sm:h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] sm:text-xs text-blue-600 font-medium uppercase tracking-wide">Booking for</p>
                                                <p className="text-[#1F4E8C] font-bold text-xs sm:text-lg">Week {getBookingWeek()}, {currentYear}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`grid gap-2 sm:gap-3 ${phases.find(p => p.id === selectedPhase)?.days.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                        {phases.find(p => p.id === selectedPhase)?.days.map((day) => {
                                            const bookingWeek = getBookingWeek();
                                            const dayDate = getDateForDayInWeek(day, bookingWeek, currentYear);
                                            const dateStr = formatDateShort(dayDate);

                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => {
                                                        setSelectedDay(day);
                                                        setSelectedTime('');
                                                    }}
                                                    className={`group p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${selectedDay === day
                                                        ? 'bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white border-[#1F4E8C] shadow-lg scale-[1.02]'
                                                        : 'bg-white/80 text-[#1F4E8C] border-[#1F4E8C]/30 hover:border-[#1F4E8C] hover:shadow-md hover:scale-[1.01]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${selectedDay === day ? 'bg-white/20' : 'bg-[#1F4E8C]/10 group-hover:bg-[#1F4E8C]/20'}`}>
                                                            <Calendar size={14} className={`sm:w-5 sm:h-5 ${selectedDay === day ? 'text-white' : 'text-[#1F4E8C]'}`} />
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="font-bold text-xs sm:text-base block">{dayLabels[day] || day}</span>
                                                            <span className={`text-[10px] sm:text-sm font-medium ${selectedDay === day ? 'text-blue-200' : 'text-gray-500'}`}>
                                                                {dateStr}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Time Selection - Only show if phase not already booked */}
                            {selectedPhase && !getUserPhaseBooking(selectedPhase) && selectedDay && (
                                <div>
                                    <h4 className="text-sm sm:text-lg lg:text-xl font-bold text-[#1F4E8C] mb-2 sm:mb-4">
                                        5. {t('booking.selectTime')}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                        {times.map((time) => (
                                            <button
                                                key={time.id}
                                                onClick={() => setSelectedTime(time.id)}
                                                className={`p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all ${selectedTime === time.id
                                                    ? 'bg-gradient-to-r from-[#F39C32] to-[#f5a847] text-white border-[#F39C32] shadow-lg'
                                                    : 'bg-white/80 text-[#1F4E8C] border-[#1F4E8C]/30 hover:border-[#F39C32] hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${selectedTime === time.id ? 'bg-white/20' : 'bg-[#1F4E8C]/10'}`}>
                                                        <Clock size={14} className={`sm:w-5 sm:h-5 ${selectedTime === time.id ? 'text-white' : 'text-[#1F4E8C]'}`} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-semibold text-xs sm:text-base">
                                                            {t(`time.${time.id}`)}
                                                        </div>
                                                        <div className="text-[9px] sm:text-sm opacity-80">
                                                            {t(`time.${time.id}.time`)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Class Selection - Sticky Note Style - Only show if phase not already booked */}
                            {selectedPhase && !getUserPhaseBooking(selectedPhase) && selectedDay && selectedTime && (
                                <div>
                                    <h4 className="text-sm sm:text-lg lg:text-xl font-bold text-[#1F4E8C] mb-2 sm:mb-4">
                                        6. {t('booking.selectClass')}
                                    </h4>

                                    <p className="text-gray-600 mb-2 sm:mb-4 text-xs sm:text-base">
                                        {t('booking.clickToBook')}
                                    </p>

                                    {/* Info booking for next week - Enhanced */}
                                    {(() => {
                                        const bookingWeek = getBookingWeek();
                                        const selectedDayDate = getDateForDayInWeek(selectedDay, bookingWeek, currentYear);
                                        const dayName = dayLabels[selectedDay] || selectedDay;
                                        const dateStr = formatDateShort(selectedDayDate);
                                        const timeLabel = t(`time.${selectedTime}`);
                                        const timeHours = t(`time.${selectedTime}.time`);

                                        return (
                                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 p-3 sm:p-5 mb-3 sm:mb-6 rounded-xl sm:rounded-2xl">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="p-2 sm:p-3 bg-[#1F4E8C] rounded-lg sm:rounded-xl shadow-md">
                                                            <Calendar size={16} className="sm:w-6 sm:h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] sm:text-xs text-blue-600 font-semibold uppercase tracking-wider">Your Booking</p>
                                                            <p className="text-[#1F4E8C] font-bold text-xs sm:text-lg">{dayName}, {dateStr}</p>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:block w-px h-10 bg-blue-200"></div>
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="p-2 sm:p-3 bg-[#F39C32] rounded-lg sm:rounded-xl shadow-md">
                                                            <Clock size={16} className="sm:w-6 sm:h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] sm:text-xs text-orange-600 font-semibold uppercase tracking-wider">{timeLabel}</p>
                                                            <p className="text-gray-800 font-bold text-xs sm:text-lg">{timeHours}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                                        {classes.map((classItem) => {
                                            const schedule = schedules.find(
                                                s => s.class_id === classItem.id
                                            );

                                            const status = getClassStatus(classItem, schedule);
                                            const canClick = status.available && !loading;
                                            const isFull = status.status === 'full';
                                            const isActive = status.status === 'active';
                                            const isOccupied = status.status === 'occupied';

                                            const teacherIndex = classes.findIndex(c => c.id === classItem.id);
                                            const teacher = teachers[teacherIndex % teachers.length];

                                            const stickyNoteClass = isOccupied
                                                ? 'bg-gray-100 border-gray-400'
                                                : isFull
                                                    ? 'bg-red-50 border-red-300'
                                                    : isActive
                                                        ? 'bg-green-50 border-green-300'
                                                        : 'bg-yellow-50 border-yellow-300';

                                            return (
                                                <button
                                                    key={classItem.id}
                                                    disabled={!canClick}
                                                    onClick={() => handleClassSelect(classItem)}
                                                    className={`
                                                        relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left
                                                        transform hover:scale-[1.02] hover:-rotate-1
                                                        shadow-lg ${stickyNoteClass}
                                                        ${!canClick ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:shadow-xl'}
                                                    `}
                                                    style={{ minHeight: '100px' }}
                                                >
                                                    {/* Status indicator */}
                                                    <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isOccupied ? 'bg-gray-500' : isFull ? 'bg-red-500' : isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'}`} />

                                                    {/* Class name */}
                                                    <div className={`font-bold text-xs sm:text-lg mb-1 sm:mb-2 ${isOccupied ? 'text-gray-500' : isFull ? 'text-red-800' : 'text-[#1F4E8C]'}`}>
                                                        {classItem.name}
                                                    </div>

                                                    {/* Teacher */}
                                                    <div className="flex items-center gap-1 text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">
                                                        <User size={10} className="sm:w-3 sm:h-3" />
                                                        <span className="truncate">{teacher?.name || 'TBA'}</span>
                                                    </div>

                                                    {/* Student count - hide for occupied */}
                                                    {!isOccupied && (
                                                        <div className={`text-[10px] sm:text-sm font-semibold ${isFull ? 'text-red-700' : isActive ? 'text-green-700' : 'text-gray-600'}`}>
                                                            <Users size={10} className="sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                                                            {status.count}/10
                                                        </div>
                                                    )}

                                                    {/* Status label */}
                                                    <div className={`mt-1 sm:mt-2 text-[8px] sm:text-xs font-bold uppercase tracking-wide ${isOccupied ? 'text-gray-600' : isFull ? 'text-red-600' : isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {isOccupied
                                                            ? `⚫ ${t('booking.occupied') || 'TERPAKAI'}`
                                                            : isFull
                                                                ? `🔴 ${t('booking.full') || 'PENUH'}`
                                                                : isActive
                                                                    ? `🟢 ${t('booking.available') || 'TERSEDIA'}`
                                                                    : `🟡 ${t('booking.waitingMore') || 'MENUNGGU'}`}
                                                    </div>

                                                    {/* Show which program is using this class */}
                                                    {isOccupied && status.occupiedBy && (
                                                        <div className="mt-1 text-[7px] sm:text-[10px] text-gray-500 italic">
                                                            {status.occupiedBy === 'Campus & Career' ? t('program.campusCareer') : t('program.englishTeens')}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Legend */}
                            <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg sm:rounded-2xl p-2 sm:p-6 border border-gray-200">
                                <h5 className="font-bold text-[#1F4E8C] mb-1.5 sm:mb-4 text-[10px] sm:text-base">
                                    {t('booking.legend')}
                                </h5>

                                <div className="flex gap-2 sm:gap-6 flex-wrap">
                                    <div className="flex items-center gap-1.5 sm:gap-3">
                                        <div className="w-5 h-5 sm:w-10 sm:h-10 bg-green-100 rounded sm:rounded-xl border border-green-400 sm:border-2 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-green-700 text-[8px] sm:text-sm">
                                                🟢 {t('booking.legendAvailable')}
                                            </div>
                                            <div className="text-[7px] sm:text-xs text-gray-500 hidden sm:block">
                                                {t('booking.legendAvailableDesc')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-3">
                                        <div className="w-5 h-5 sm:w-10 sm:h-10 bg-red-100 rounded sm:rounded-xl border border-red-400 sm:border-2 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-red-700 text-[8px] sm:text-sm">
                                                🔴 {t('booking.legendFull')}
                                            </div>
                                            <div className="text-[7px] sm:text-xs text-gray-500 hidden sm:block">
                                                {t('booking.legendFullDesc')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-3">
                                        <div className="w-5 h-5 sm:w-10 sm:h-10 bg-gray-100 rounded sm:rounded-xl border border-gray-400 sm:border-2 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-gray-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-700 text-[8px] sm:text-sm">
                                                ⚫ {t('booking.occupied')}
                                            </div>
                                            <div className="text-[7px] sm:text-xs text-gray-500 hidden sm:block">
                                                {t('booking.occupiedByOther')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Settings Edit Modal - Admin Only */}
            {showSettingsModal && currentUser?.role === 'admin' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] text-white p-5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Pencil size={20} />
                                    Edit Info Header
                                </h3>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    Batch Number
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editBatch}
                                    onChange={(e) => setEditBatch(parseInt(e.target.value) || 1)}
                                    placeholder="e.g. 1"
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F39C32] text-sm"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex gap-3">
                            <button
                                onClick={async () => {
                                    await updateSettings({ batch: editBatch });
                                    toast.success('Header info updated successfully!');
                                    setShowSettingsModal(false);
                                }}
                                className="flex-1 bg-gradient-to-r from-[#F39C32] to-[#f5a847] text-white py-2.5 rounded-xl font-semibold text-sm hover:from-[#e08a1f] hover:to-[#F39C32] transition-all"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Key size={20} />
                                    {t('password.change') || 'Change Password'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    {t('password.current') || 'Current Password'} *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder={t('password.currentPlaceholder') || 'Enter current password'}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F4E8C] text-sm pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    {t('password.new') || 'New Password'} *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder={t('password.newPlaceholder') || 'Enter new password (min. 6 characters)'}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F4E8C] text-sm pr-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                    {t('password.confirm') || 'Confirm New Password'} *
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder={t('password.confirmPlaceholder') || 'Re-enter new password'}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F4E8C] text-sm"
                                    required
                                />
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                                <p>💡 {t('password.hint') || 'Password must be at least 6 characters'}</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white py-2.5 rounded-xl font-semibold text-sm hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all disabled:opacity-50"
                                >
                                    {loading ? (t('common.loading') || 'Processing...') : (t('password.changeButton') || 'Change Password')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Feedback Button */}
            <FeedbackButton user={currentUser} />

            {/* Booking Success Modal */}
            {showBookingSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                        {/* Success Header with Animation */}
                        <div className="bg-gradient-to-br from-[#1F4E8C] via-[#2a5fa3] to-[#1F4E8C] p-5 sm:p-8 text-center relative overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-full">
                                <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                                <div className="absolute top-8 right-8 w-3 h-3 bg-[#F39C32]/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                <div className="absolute bottom-6 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                                <div className="absolute top-1/2 right-4 w-1.5 h-1.5 bg-[#F39C32]/40 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                            </div>

                            {/* Success Icon */}
                            <div className="relative z-10">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-bounce-gentle">
                                    <div className="w-11 h-11 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={28} className="sm:w-10 sm:h-10 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                                    <Sparkles size={12} className="sm:w-4 sm:h-4 text-[#F39C32]" />
                                    <h3 className="text-base sm:text-xl font-bold text-white">{t('booking.success') || 'Booking Successful!'}</h3>
                                    <Sparkles size={12} className="sm:w-4 sm:h-4 text-[#F39C32]" />
                                </div>
                                <p className="text-blue-200 text-xs sm:text-sm">Your class has been booked</p>
                            </div>
                        </div>

                        {/* Success Content */}
                        <div className="p-4 sm:p-6">
                            {lastBookedClass && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 border border-blue-100">
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Class:</span>
                                            <span className="font-semibold text-gray-800">{lastBookedClass.className}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phase:</span>
                                            <span className="font-semibold text-gray-800">{t(`phase.${lastBookedClass.phase}`)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Day:</span>
                                            <span className="font-semibold text-gray-800">
                                                {dayLabels[lastBookedClass.day]}
                                                {lastBookedClass.day && (
                                                    <span className="text-gray-400 font-normal ml-1">
                                                        • {formatDateShort(getDateForDayInWeek(lastBookedClass.day, lastBookedClass.week || (currentWeek + 1), currentYear))}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Time:</span>
                                            <span className="font-semibold text-gray-800">
                                                {t(`time.${lastBookedClass.time}`)}
                                                <span className="text-gray-400 font-normal ml-1">
                                                    • {lastBookedClass.time === 'afternoon' ? '16:00 - 17:30' : '19:00 - 20:30'}
                                                </span>
                                            </span>
                                        </div>
                                        {lastBookedClass.teacher && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Teacher:</span>
                                                <span className="font-semibold text-gray-800">{lastBookedClass.teacher}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-center text-gray-600 text-xs sm:text-sm mb-4 sm:mb-5">
                                See you in class! 🎉
                            </p>

                            <button
                                onClick={() => setShowBookingSuccessModal(false)}
                                className="w-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white py-2.5 sm:py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Guide Modal */}
            {showUserGuide && (
                <UserGuide
                    onClose={() => setShowUserGuide(false)}
                    userRole="student"
                    userId={userId}
                />
            )}

            {/* Floating Feedback Button */}
            <FeedbackButton user={currentUser} />
        </div>
    );
};

export default BookingSystemDB;
