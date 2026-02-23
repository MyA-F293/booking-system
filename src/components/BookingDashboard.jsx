import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Users, User, Clock, RefreshCw, Loader2, BookOpen, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear, getUserBookings, autoCopyBookingsToNextWeek, createBooking, hasUserBookedPhase, getDateForDayInWeek, formatDateShort } from '../utils/dbHelpers';
import { useRefreshCooldown } from '../utils/useDebounce';
import { supabase } from '../supabaseClient';
import { useToast } from './Toast';

const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
};

// Day order for sorting
const dayOrder = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
};

// Class badges - subtle icons/emojis for each class
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

const BookingDashboard = ({ user }) => {
    const { t } = useLanguage();
    const toast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleStudents, setScheduleStudents] = useState([]);
    const [selectedWeekTab, setSelectedWeekTab] = useState('next'); // Default to 'next' week for booking
    const [userBookings, setUserBookings] = useState([]); // Store user's bookings
    const [isBooking, setIsBooking] = useState(false); // Prevent double-click
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [bookedSchedule, setBookedSchedule] = useState(null);

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const nextWeek = currentWeek + 1;
    const displayWeek = selectedWeekTab === 'current' ? currentWeek : nextWeek;

    // Get user's batch and ID for filtering
    const userBatch = user?.batch;
    const userId = user?.id;

    // Refresh cooldown (3 seconds)
    const { execute: refreshWithCooldown, isOnCooldown, remainingTime } = useRefreshCooldown(loadUserBookings, 3000);

    useEffect(() => {
        loadUserBookings();
        // Auto-copy bookings from previous week (runs on Sunday night or Monday)
        autoCopyBookingsToNextWeek().then(result => {
            if (result.copied && result.count > 0) {
                console.log('✅ Auto-copied', result.count, 'bookings');
                toast.success(`✅ ${result.count} jadwal minggu lalu sudah di-copy otomatis!`);
                // Reload bookings to show the copied ones
                loadUserBookings();
            } else if (result.reason === 'already_copied') {
                console.log('ℹ️ Bookings already copied for this week');
            }
        }).catch(err => {
            console.error('❌ Auto-copy failed:', err);
        });
    }, [selectedWeekTab, userBatch, userId]);

    // Scroll to top when modal opens (no body lock - modal container is scrollable)
    useEffect(() => {
        if (selectedSchedule) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedSchedule]);

    async function loadUserBookings() {
        try {
            setLoading(true);
            console.log('📡 Loading all schedules for week:', displayWeek);
            console.log('👤 User batch:', userBatch);
            console.log('🔄 Timestamp:', new Date().toISOString()); // Cache busting log

            // Get ALL schedules for the selected week (show all, regardless of batch)
            const filters = {
                week_number: displayWeek,
                year: currentYear
                // Don't filter by batch here - show all schedules
            };
            const data = await getSchedules(filters);
            const activeSchedules = data.filter(s => s.current_students > 0);
            console.log('✅ All schedules loaded:', activeSchedules.length);
            console.log('📋 Schedules:', activeSchedules.map(s => ({
                id: s.id,
                class: s.class?.name,
                batch: s.batch,
                students: s.current_students
            })));
            setSchedules(activeSchedules);

            // Load user's bookings (filter by batch for user's own bookings)
            if (userId) {
                const bookings = await getUserBookings(userId, displayWeek, currentYear, userBatch);
                console.log('✅ User bookings loaded:', bookings.length);
                setUserBookings(bookings);
            }
        } catch (err) {
            console.error('❌ Error loading schedules:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleViewDetails = async (schedule) => {
        try {
            setSelectedSchedule(schedule);
            const students = await getScheduleStudents(schedule.id);
            setScheduleStudents(students);
        } catch (err) {
            console.error('Error loading students:', err);
        }
    };

    const handleBookClass = async (schedule) => {
        if (isBooking) return; // Prevent double-click

        try {
            setIsBooking(true);

            // Validation 1: Harvard Class is only for English for Teens
            const isTeensUser = user?.program?.toLowerCase().includes('teens');
            if (schedule.class?.name === 'Harvard Class' && !isTeensUser) {
                toast.error('Harvard Class is exclusively for English for Teens program students!');
                return;
            }

            // Validation 2: Check if already booked this phase
            const alreadyBookedPhase = await hasUserBookedPhase(
                userId,
                schedule.phase,
                displayWeek,
                currentYear,
                userBatch
            );

            if (alreadyBookedPhase) {
                toast.warning(`You already booked ${getPhaseLabel(schedule.phase)} for this week!`);
                return;
            }

            // Validation 3: Check if class is full
            if (schedule.current_students >= 10) {
                toast.error('Class is full! Maximum 10 students per class.');
                return;
            }

            // Create booking
            await createBooking({
                schedule_id: schedule.id,
                user_id: userId,
                status: 'confirmed'
            });

            setBookedSchedule(schedule);
            setShowSuccessModal(true);
            toast.success(`Successfully booked ${schedule.class?.name}!`);
            await loadUserBookings(); // Refresh data
        } catch (err) {
            console.error('Error booking class:', err);
            const errorMessage = err.message || '';

            if (errorMessage.includes('full capacity')) {
                toast.error('Class is full! Maximum 10 students per class.');
            } else if (errorMessage.includes('unique_booking_per_student') || errorMessage.includes('duplicate')) {
                toast.error('You are already enrolled in this class!');
            } else {
                toast.error('Booking failed: ' + errorMessage);
            }
        } finally {
            setIsBooking(false);
        }
    };

    const handleCancelBooking = async (schedule) => {
        if (isBooking) return; // Prevent double-click

        // Find user's booking for this schedule
        const userBooking = userBookings.find(b => b.schedule_id === schedule.id);
        if (!userBooking) {
            toast.error('Booking not found!');
            return;
        }

        toast.confirm(
            `Cancel booking for ${schedule.class?.name} - ${getDayLabel(schedule.day, schedule.phase)}?`,
            async () => {
                try {
                    setIsBooking(true);

                    // Delete booking
                    const { error } = await supabase
                        .from('bookings')
                        .delete()
                        .eq('id', userBooking.id);

                    if (error) throw error;

                    toast.success('Booking cancelled successfully!');
                    await loadUserBookings(); // Refresh data
                } catch (err) {
                    console.error('Error cancelling booking:', err);
                    toast.error('Failed to cancel booking: ' + err.message);
                } finally {
                    setIsBooking(false);
                }
            }
        );
    };

    const getPhaseLabel = (phase) => t(`phase.${phase}`);
    const getPhaseDays = (phase) => t(`phase.${phase}Days`);
    const getTimeLabel = (timeSlot) => t(`time.${timeSlot}`);
    const getTimeHours = (timeSlot) => t(`time.${timeSlot}.time`);
    const getDayLabel = (day, phase) => {
        if (day) {
            return dayLabels[day] || day;
        }
        // Fallback if day is empty
        if (phase === 'phase1') return 'Mon/Tue/Wed';
        if (phase === 'phase2') return 'Thu/Fri/Sat';
        if (phase === 'recap') return 'Sunday';
        return '-';
    };

    const getStatusColor = (count) => {
        if (count >= 10) return { bg: 'bg-red-500', text: 'text-white', border: 'border-l-red-500' };
        if (count >= 5) return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-l-emerald-500' };
        return { bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-l-amber-400' };
    };

    // Group schedules by phase and sort by day order
    const phases = ['phase1', 'phase2', 'recap'];
    const groupedSchedules = phases.reduce((acc, phase) => {
        acc[phase] = schedules
            .filter(s => s.phase === phase)
            .sort((a, b) => {
                const dayA = dayOrder[a.day] || 99;
                const dayB = dayOrder[b.day] || 99;
                return dayA - dayB;
            });
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header Card - Clean Modern Design */}
            <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] rounded-2xl shadow-xl relative overflow-hidden">
                {/* Subtle Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-[#F39C32]/10 rounded-full blur-xl"></div>

                <div className="relative z-10 p-4 sm:p-5">
                    {/* Single Row Layout */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Left - Icon & Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/15 rounded-xl">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{t('header.bookingDetails')}</h2>
                                <p className="text-blue-200 text-xs">
                                    {userBatch || 'All Batches'} • {t('header.weekLabel')}{displayWeek}
                                </p>
                            </div>
                        </div>

                        {/* Right - Week Toggle & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Week Toggle */}
                            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/20">
                                <button
                                    onClick={() => setSelectedWeekTab('current')}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-full font-medium text-[11px] sm:text-xs transition-all ${selectedWeekTab === 'current'
                                        ? 'bg-white text-[#1F4E8C] shadow'
                                        : 'text-white/70 hover:text-white'
                                        }`}
                                >
                                    W{currentWeek}
                                </button>
                                <button
                                    onClick={() => setSelectedWeekTab('next')}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-full font-medium text-[11px] sm:text-xs transition-all ${selectedWeekTab === 'next'
                                        ? 'bg-[#F39C32] text-white shadow'
                                        : 'text-white/70 hover:text-white'
                                        }`}
                                >
                                    W{nextWeek}
                                </button>
                            </div>

                            {/* Stats Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/20">
                                <span className="text-lg font-bold text-white">{schedules.length}</span>
                                <span className="text-blue-200 text-[10px]">{t('header.classCount')}</span>
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={refreshWithCooldown}
                                disabled={loading || isOnCooldown}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20 relative"
                                title={isOnCooldown ? `Wait ${remainingTime}s` : 'Refresh'}
                            >
                                <RefreshCw size={16} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                                {isOnCooldown && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                                        {remainingTime}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && schedules.length === 0 && (
                <div className="text-center py-16">
                    <Loader2 className="animate-spin mx-auto mb-4 text-[#1F4E8C]" size={48} />
                    <p className="text-gray-500 font-medium">{t('common.loading')}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && schedules.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                        {t('dashboard.noBookings')}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {t('dashboard.noBookingsDesc')}
                    </p>
                </div>
            )}

            {/* Schedule Cards Grouped by Phase */}
            {!loading && schedules.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {phases.map((phase) => {
                        const phaseSchedules = groupedSchedules[phase];
                        const hasSchedules = phaseSchedules.length > 0;

                        return (
                            <div key={phase} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                                {/* Phase Header - Compact Style */}
                                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[#1F4E8C] rounded-lg">
                                                <Calendar size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-800">{getPhaseLabel(phase)}</h3>
                                                <p className="text-gray-500 text-[10px]">{getPhaseDays(phase)}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#1F4E8C] text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                            {phaseSchedules.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Phase Schedule Cards */}
                                <div className="p-3 flex-1">
                                    {!hasSchedules ? (
                                        <div className="h-full flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <Calendar size={24} className="mx-auto mb-2 text-gray-300" />
                                                <p className="text-gray-400 text-xs">{t('dashboard.noBookings')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {phaseSchedules.map((schedule) => {
                                                const status = getStatusColor(schedule.current_students);
                                                // Check if user has booked this schedule
                                                const userHasBooked = userBookings.some(b => b.schedule_id === schedule.id);

                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className={`bg-white rounded-xl border ${userHasBooked ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 ${status.border}`}
                                                    >
                                                        <div className="p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-start gap-2">
                                                                    <span className={`${getClassBadge(schedule.class?.name).color} w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                                                                        {getClassBadge(schedule.class?.name).emoji}
                                                                    </span>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <h4 className="font-bold text-gray-800 text-sm">
                                                                                {schedule.class?.name || 'Unknown'}
                                                                            </h4>
                                                                            {userHasBooked && (
                                                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                                                                    ✓ Your Booking
                                                                                </span>
                                                                            )}
                                                                            {schedule.class?.name === 'Harvard Class' && (
                                                                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-semibold border border-red-200">
                                                                                    🎓 Teens Only
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                                                            {schedule.program} • {schedule.level}
                                                                            {schedule.batch && <span className="ml-1 text-[#1F4E8C]">• {schedule.batch}</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className={`${status.bg} ${status.text} px-2 py-0.5 rounded-full text-[10px] font-bold`}>
                                                                    {schedule.current_students}/10
                                                                </span>
                                                            </div>

                                                            {/* Info - Compact */}
                                                            <div className="space-y-1.5 text-xs">
                                                                <div className="flex items-start gap-2 text-gray-600">
                                                                    <Calendar size={12} className="text-[#1F4E8C] mt-0.5" />
                                                                    <div>
                                                                        <span>{getDayLabel(schedule.day, schedule.phase)}</span>
                                                                        {schedule.day && (
                                                                            <span className="text-gray-400 ml-1">
                                                                                ({formatDateShort(getDateForDayInWeek(schedule.day, displayWeek, currentYear))})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-600">
                                                                    <Clock size={12} className="text-[#F39C32]" />
                                                                    <span>{getTimeLabel(schedule.time_slot)} • {getTimeHours(schedule.time_slot)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-600">
                                                                    <User size={12} className="text-[#1F4E8C]" />
                                                                    <span>{schedule.teacher?.name || 'TBA'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="mt-3 flex gap-2">
                                                                {userHasBooked ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleViewDetails(schedule)}
                                                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1"
                                                                        >
                                                                            {t('dashboard.viewDetails')}
                                                                            <ChevronRight size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCancelBooking(schedule)}
                                                                            disabled={isBooking}
                                                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {isBooking ? 'Cancelling...' : 'Cancel'}
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleViewDetails(schedule)}
                                                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1"
                                                                        >
                                                                            {t('dashboard.viewDetails')}
                                                                            <ChevronRight size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleBookClass(schedule)}
                                                                            disabled={
                                                                                isBooking ||
                                                                                schedule.current_students >= 10 ||
                                                                                (schedule.class?.name === 'Harvard Class' && !user?.program?.toLowerCase().includes('teens'))
                                                                            }
                                                                            className="flex-1 bg-[#F39C32] hover:bg-[#e08a1f] text-white py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title={
                                                                                schedule.class?.name === 'Harvard Class' && !user?.program?.toLowerCase().includes('teens')
                                                                                    ? 'Harvard Class is only for English for Teens students'
                                                                                    : ''
                                                                            }
                                                                        >
                                                                            {isBooking ? 'Booking...' : schedule.current_students >= 10 ? 'Full' : 'Book Now'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedSchedule && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[60]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                        {/* Modal Header */}
                        <div className="bg-[#1F4E8C] text-white p-3 sm:p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-0.5 sm:mb-1">{t('dashboard.viewDetails')}</p>
                                    <h3 className="text-base sm:text-lg font-bold">{selectedSchedule.class?.name}</h3>
                                    <p className="text-blue-200 text-xs sm:text-sm mt-0.5 sm:mt-1">{selectedSchedule.program} • {selectedSchedule.level}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSchedule(null)}
                                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                            {/* Schedule Info */}
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                                    <Calendar size={14} className="sm:w-4 sm:h-4 text-[#1F4E8C]" />
                                    {t('booking.scheduleInfo')}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-100">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{t('booking.phase')}</p>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm">{getPhaseLabel(selectedSchedule.phase)}</p>
                                    </div>
                                    <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-100">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{t('booking.dayLabel')}</p>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm">
                                            {getDayLabel(selectedSchedule.day, selectedSchedule.phase)}
                                            {selectedSchedule.day && (
                                                <span className="text-gray-400 font-normal ml-1 text-[10px] sm:text-xs">
                                                    • {formatDateShort(getDateForDayInWeek(selectedSchedule.day, displayWeek, currentYear))}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-100">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{t('booking.time')}</p>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm">{getTimeLabel(selectedSchedule.time_slot)}</p>
                                    </div>
                                    <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-100">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{t('booking.teacher')}</p>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm">{selectedSchedule.teacher?.name || 'TBA'}</p>
                                    </div>
                                    <div className="bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-gray-100 col-span-2">
                                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{t('booking.studentsCount')}</p>
                                        <p className="font-semibold text-[#1F4E8C] text-xs sm:text-sm">{selectedSchedule.current_students}/10</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student List */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                                    <Users size={14} className="sm:w-4 sm:h-4 text-[#F39C32]" />
                                    {t('booking.studentList')} ({scheduleStudents.length})
                                </h4>

                                {/* Info Banner */}
                                {scheduleStudents.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3">
                                        <p className="text-[10px] sm:text-xs text-blue-700 flex items-center gap-1.5">
                                            <span className="text-blue-500">ℹ️</span>
                                            <span>You can see all students enrolled in this class</span>
                                        </p>
                                    </div>
                                )}

                                {scheduleStudents.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                                        <Users size={24} className="sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-gray-500 text-xs sm:text-sm">{t('dashboard.noBookingsDesc')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 sm:space-y-2">
                                        {scheduleStudents.map((booking, index) => {
                                            const isCurrentUser = booking.user_id === userId || booking.user?.id === userId;
                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={`flex items-center justify-between rounded-md sm:rounded-lg p-2 sm:p-3 transition-all border ${isCurrentUser
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                                                        : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${isCurrentUser
                                                            ? 'bg-[#1F4E8C] text-white shadow-md'
                                                            : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                <p className={`font-medium text-xs sm:text-sm truncate ${isCurrentUser ? 'text-[#1F4E8C]' : 'text-gray-800'
                                                                    }`}>
                                                                    {booking.user?.full_name || booking.users?.full_name || `User ID: ${booking.user_id}`}
                                                                </p>
                                                                {isCurrentUser && (
                                                                    <span className="text-[9px] sm:text-[10px] bg-[#1F4E8C] text-white px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-[10px] sm:text-xs text-gray-500 font-mono">
                                                                    {booking.user?.student_id || booking.users?.student_id || booking.user_id || '-'}
                                                                </p>
                                                                {(booking.user?.program || booking.users?.program) && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                                                            {booking.user?.program || booking.users?.program}
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium flex-shrink-0 ${isCurrentUser
                                                        ? 'bg-[#1F4E8C] text-white'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        ✓ {t('booking.confirmed')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-2.5 sm:p-3 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedSchedule(null)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Loading Modal */}
            {isBooking && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1F4E8C] mx-auto mb-4"></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Processing...</h3>
                        <p className="text-gray-600">Please wait while we book your class</p>
                    </div>
                </div>,
                document.body
            )}

            {/* Success Modal */}
            {showSuccessModal && bookedSchedule && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Successful!</h3>
                        <p className="text-gray-600 mb-4">
                            You've successfully booked <span className="font-semibold text-[#1F4E8C]">{bookedSchedule.class?.name}</span>
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                <Calendar size={16} className="text-[#1F4E8C]" />
                                <span>{getDayLabel(bookedSchedule.day, bookedSchedule.phase)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock size={16} className="text-[#F39C32]" />
                                <span>{bookedSchedule.time_slot}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                setBookedSchedule(null);
                            }}
                            className="w-full bg-[#1F4E8C] hover:bg-[#183d6e] text-white py-3 rounded-xl font-semibold transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BookingDashboard;

