import { useState, useEffect } from 'react';
import { Calendar, Users, User, Clock, RefreshCw, Loader2, BookOpen, X, GraduationCap, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear } from '../utils/dbHelpers';
import { useRefreshCooldown } from '../utils/useDebounce';

const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
};

// Helper function to get date for a specific day in a given week/year
const getDateForDay = (day, weekNumber, year) => {
    if (!day) return null;

    const dayIndex = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0
    };

    // Get January 4th of the year (always in week 1 per ISO)
    const jan4 = new Date(year, 0, 4);
    // Get the Monday of week 1
    const dayOfWeek = jan4.getDay() || 7;
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - dayOfWeek + 1);

    // Calculate the Monday of the target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

    // Calculate the target day
    const targetDay = new Date(targetMonday);
    const targetDayIndex = dayIndex[day.toLowerCase()];
    if (targetDayIndex === 0) {
        // Sunday is 6 days after Monday
        targetDay.setDate(targetMonday.getDate() + 6);
    } else {
        targetDay.setDate(targetMonday.getDate() + targetDayIndex - 1);
    }

    return targetDay;
};

// Format date to display (e.g., "13 Jan")
const formatDateShort = (date) => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
};

// Day order for sorting within each phase
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
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleStudents, setScheduleStudents] = useState([]);
    const [selectedWeekTab, setSelectedWeekTab] = useState('next'); // 'current' or 'next'

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const nextWeek = currentWeek + 1;
    const displayWeek = selectedWeekTab === 'current' ? currentWeek : nextWeek;

    // Get user's batch for filtering
    const userBatch = user?.batch;

    // Refresh cooldown (3 seconds)
    const { execute: refreshWithCooldown, isOnCooldown, remainingTime } = useRefreshCooldown(loadAllSchedules, 3000);

    useEffect(() => {
        loadAllSchedules();
    }, [selectedWeekTab, userBatch]);

    async function loadAllSchedules() {
        try {
            setLoading(true);
            // Filter by user's batch if available
            const filters = {
                week_number: displayWeek,
                year: currentYear,
                batch: userBatch
            };
            const data = await getSchedules(filters);
            const activeSchedules = data.filter(s => s.current_students > 0);
            setSchedules(activeSchedules);
        } catch (err) {
            console.error('Error loading schedules:', err);
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-[#1F4E8C]/10 rounded-lg sm:rounded-xl shrink-0">
                            <Calendar size={18} className="sm:w-5 sm:h-5 text-[#1F4E8C]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{schedules.length}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('dashboard.activeClasses')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-[#F39C32]/10 rounded-lg sm:rounded-xl shrink-0">
                            <Users size={18} className="sm:w-5 sm:h-5 text-[#F39C32]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{schedules.reduce((acc, s) => acc + s.current_students, 0)}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('dashboard.totalStudents')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl shrink-0">
                            <GraduationCap size={18} className="sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{new Set(schedules.map(s => s.teacher?.id)).size}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('dashboard.activeTeachers')}</p>
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
                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 ${status.border}`}
                                                    >
                                                        <div className="p-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-start gap-2">
                                                                    <span className={`${getClassBadge(schedule.class?.name).color} w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                                                                        {getClassBadge(schedule.class?.name).emoji}
                                                                    </span>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-800 text-sm">
                                                                            {schedule.class?.name || 'Unknown'}
                                                                        </h4>
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
                                                                                ({formatDateShort(getDateForDay(schedule.day, displayWeek, currentYear))})
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

                                                            {/* Action Button */}
                                                            <button
                                                                onClick={() => handleViewDetails(schedule)}
                                                                className="w-full mt-3 bg-[#1F4E8C] hover:bg-[#183d6e] text-white py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1"
                                                            >
                                                                {t('dashboard.viewDetails')}
                                                                <ChevronRight size={14} />
                                                            </button>
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
            {selectedSchedule && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="bg-[#1F4E8C] text-white p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">{t('dashboard.viewDetails')}</p>
                                    <h3 className="text-xl font-bold">{selectedSchedule.class?.name}</h3>
                                    <p className="text-blue-200 text-sm mt-1">{selectedSchedule.program} • {selectedSchedule.level}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSchedule(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {/* Schedule Info */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-[#1F4E8C]" />
                                    {t('booking.scheduleInfo')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.phase')}</p>
                                        <p className="font-semibold text-gray-800">{getPhaseLabel(selectedSchedule.phase)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.dayLabel')}</p>
                                        <p className="font-semibold text-gray-800">
                                            {getDayLabel(selectedSchedule.day, selectedSchedule.phase)}
                                            {selectedSchedule.day && (
                                                <span className="text-gray-400 font-normal ml-1">
                                                    • {formatDateShort(getDateForDay(selectedSchedule.day, displayWeek, currentYear))}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.time')}</p>
                                        <p className="font-semibold text-gray-800">{getTimeLabel(selectedSchedule.time_slot)}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.teacher')}</p>
                                        <p className="font-semibold text-gray-800">{selectedSchedule.teacher?.name || 'TBA'}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-gray-100 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.studentsCount')}</p>
                                        <p className="font-semibold text-[#1F4E8C]">{selectedSchedule.current_students}/10</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student List */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users size={16} className="text-[#F39C32]" />
                                    {t('booking.studentList')} ({scheduleStudents.length})
                                </h4>

                                {scheduleStudents.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                        <Users size={32} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-gray-500 text-sm">{t('dashboard.noBookingsDesc')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {scheduleStudents.map((booking, index) => (
                                            <div
                                                key={booking.id}
                                                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-all border border-gray-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-[#1F4E8C] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{booking.user?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{booking.user?.student_id || '-'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                                                    ✓ {t('booking.confirmed')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedSchedule(null)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium transition-colors text-sm"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDashboard;
