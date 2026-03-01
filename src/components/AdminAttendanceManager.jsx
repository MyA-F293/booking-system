import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './Toast';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear, submitBatchAttendance, getAttendanceRecords, getDateForDayInWeek, formatDateShort } from '../utils/dbHelpers';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';

// Class badges
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

// Day emojis and colors - Darker Orange theme
const dayConfig = {
    monday: { emoji: '🌙', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    tuesday: { emoji: '🔥', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    wednesday: { emoji: '🌿', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    thursday: { emoji: '⚡', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    friday: { emoji: '🎉', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    saturday: { emoji: '🌟', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
    sunday: { emoji: '☀️', color: 'from-[#E67E22] to-[#D35400]', bg: 'from-orange-50/80 to-orange-100/80', border: 'border-orange-300' },
};

const AdminAttendanceManager = () => {
    const toast = useToast();
    const { isOpen, modalConfig, hideModal, showSuccess } = useModal();
    const [schedules, setSchedules] = useState([]);
    const [filteredSchedules, setFilteredSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
    const [expandedDays, setExpandedDays] = useState(new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])); // Default expand weekdays

    const currentYear = getCurrentYear();

    useEffect(() => {
        loadAllSchedules();
    }, [selectedWeek]);

    useEffect(() => {
        applyFilters();
    }, [schedules, searchQuery]);

    const loadAllSchedules = async () => {
        try {
            setLoading(true);
            console.log('🔍 AdminAttendanceManager: Loading schedules for week', selectedWeek, 'year', currentYear);

            const data = await getSchedules({
                week_number: selectedWeek,
                year: currentYear
            });

            console.log('📊 AdminAttendanceManager: Received', data?.length || 0, 'schedules');

            if (!data || data.length === 0) {
                console.log('⚠️ No schedules found for week', selectedWeek);
                setSchedules([]);
                return;
            }

            const allAttendance = await getAttendanceRecords({
                week_number: selectedWeek,
                year: currentYear
            });

            console.log('📊 AdminAttendanceManager: Found', allAttendance?.length || 0, 'attendance records');
            console.log('📋 AdminAttendanceManager: Attendance records sample:', allAttendance?.slice(0, 3));

            const attendanceMap = {};
            if (allAttendance && allAttendance.length > 0) {
                allAttendance.forEach(record => {
                    if (!attendanceMap[record.schedule_id]) {
                        attendanceMap[record.schedule_id] = 0;
                    }
                    attendanceMap[record.schedule_id]++;
                });
                console.log('📊 AdminAttendanceManager: Attendance map:', attendanceMap);
            } else {
                console.log('⚠️ AdminAttendanceManager: No attendance records found for week', selectedWeek);
            }

            const schedulesWithStatus = data.map(schedule => ({
                ...schedule,
                hasAttendance: attendanceMap[schedule.id] > 0,
                attendanceCount: attendanceMap[schedule.id] || 0
            }));

            console.log('✅ Loaded schedules with attendance status:', schedulesWithStatus.length);
            setSchedules(schedulesWithStatus);
        } catch (err) {
            console.error('❌ Error loading schedules:', err);
            toast.error('Failed to load schedules: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...schedules];

        // DEDUPLICATION
        const uniqueSchedules = [];
        const seenKeys = new Set();

        filtered.forEach(schedule => {
            const uniqueKey = `${schedule.class_id}-${schedule.day}-${schedule.time_slot}-${schedule.phase}-${schedule.week_number}`;
            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                uniqueSchedules.push(schedule);
            }
        });

        filtered = uniqueSchedules;

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.class?.name.toLowerCase().includes(query) ||
                s.teacher?.name.toLowerCase().includes(query) ||
                s.program.toLowerCase().includes(query) ||
                s.level.toLowerCase().includes(query)
            );
        }

        console.log('🔍 Filtered schedules:', filtered.length);
        setFilteredSchedules(filtered);
    };

    // Group schedules by day
    const groupSchedulesByDay = (scheduleList) => {
        const grouped = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
        };

        scheduleList.forEach(schedule => {
            const day = schedule.day?.toLowerCase();
            if (grouped[day]) {
                grouped[day].push(schedule);
            }
        });

        // Sort schedules within each day by time
        Object.keys(grouped).forEach(day => {
            grouped[day].sort((a, b) => {
                const timeOrder = { afternoon: 1, evening: 2 };
                return (timeOrder[a.time_slot] || 99) - (timeOrder[b.time_slot] || 99);
            });
        });

        return grouped;
    };

    const toggleDayExpansion = (day) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(day)) {
            newExpanded.delete(day);
        } else {
            newExpanded.add(day);
        }
        setExpandedDays(newExpanded);
    };

    const handleSelectSchedule = async (schedule) => {
        try {
            setLoading(true);
            setSelectedSchedule(schedule);

            // Load students
            const studentsData = await getScheduleStudents(schedule.id);
            setStudents(studentsData);

            // Load existing attendance if available
            const existingAttendance = await getAttendanceRecords({
                schedule_id: schedule.id,
                week_number: selectedWeek,
                year: currentYear
            });

            console.log('📊 AdminAttendanceManager: Existing attendance records:', existingAttendance?.length || 0);

            // Build attendance map - FILTER OUT INVALID RECORDS
            const initialAttendance = {};
            let unmatchedCount = 0;

            if (existingAttendance && existingAttendance.length > 0) {
                // If attendance exists, populate from database
                const attendanceMap = {};
                existingAttendance.forEach(record => {
                    // Find the user_id from student data
                    const student = studentsData.find(s => s.user?.student_id === record.student_id);
                    if (student) {
                        attendanceMap[student.user_id] = record.status;
                    } else {
                        unmatchedCount++;
                        console.warn('⚠️ Unmatched attendance record:', {
                            student_id: record.student_id,
                            student_name: record.student_name,
                            class: record.class_name,
                            week: record.week_number
                        });
                    }
                });

                // Set attendance with existing data
                studentsData.forEach(student => {
                    initialAttendance[student.user_id] = attendanceMap[student.user_id] || null;
                });

                console.log('✅ AdminAttendanceManager: Loaded existing attendance:', Object.keys(attendanceMap).length, 'matched');
                if (unmatchedCount > 0) {
                    console.warn(`⚠️ AdminAttendanceManager: ${unmatchedCount} attendance records couldn't be matched (invalid student_id)`);
                }
            } else {
                // No existing attendance, set all to null
                studentsData.forEach(student => {
                    initialAttendance[student.user_id] = null;
                });
                console.log('📝 AdminAttendanceManager: No existing attendance, starting fresh');
            }

            setAttendance(initialAttendance);
        } catch (err) {
            console.error('❌ Error loading students:', err);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (userId, status) => {
        console.log('👆 Attendance clicked:', userId, status);
        setAttendance(prev => {
            const updated = {
                ...prev,
                [userId]: status
            };
            console.log('📝 Updated attendance state:', updated);
            return updated;
        });
    };

    const handleSubmitAttendance = async (e) => {
        // Prevent any default behavior
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!selectedSchedule) {
            console.log('⚠️ No schedule selected');
            return;
        }

        if (submitting) {
            console.log('⚠️ Already submitting, please wait...');
            toast.warning('Please wait, submitting attendance...');
            return;
        }

        const markedAttendance = Object.values(attendance).filter(status => status !== null);
        if (markedAttendance.length === 0) {
            toast.error('Please mark attendance for at least one student');
            return;
        }

        try {
            setSubmitting(true);
            console.log('📤 Admin submitting attendance for', markedAttendance.length, 'students...');

            const attendanceRecords = students
                .filter(student => attendance[student.user_id] !== null)
                .map(student => ({
                    teacher_id: selectedSchedule.teacher_id,
                    teacher_name: selectedSchedule.teacher?.name || 'Admin',
                    schedule_id: selectedSchedule.id,
                    class_name: selectedSchedule.class?.name || '-',
                    program: selectedSchedule.program,
                    level: selectedSchedule.level,
                    phase: selectedSchedule.phase,
                    day: selectedSchedule.day,
                    time_slot: selectedSchedule.time_slot,
                    week_number: selectedWeek,
                    year: currentYear,
                    student_id: student.user?.student_id || '-',
                    student_name: student.user?.full_name || '-',
                    status: attendance[student.user_id]
                }));

            console.log('📋 Attendance records to submit:', attendanceRecords);

            const result = await submitBatchAttendance(attendanceRecords);

            console.log('✅ Attendance submitted successfully!', result);

            // Show success notification with clear feedback
            const successMessage = result.skipped > 0
                ? `Attendance submitted for ${result.inserted} student(s).\n\n${result.skipped} record(s) were skipped (already existed).\n\n💡 Go to "Attendance" tab and click Refresh to see updated report.`
                : `Attendance submitted for ${result.inserted} student(s).\n\n💡 Go to "Attendance" tab and click Refresh to see updated report.`;

            // Show modal popup
            showSuccess(successMessage, '✅ SUCCESS!');

            // Also show toast notification with reminder
            toast.success(`✅ ${result.inserted} student(s) marked. Go to Attendance tab to see report.`, { duration: 5000 });

            // Reload schedules to update status
            await loadAllSchedules();

            // Clear form and go back to list
            setSelectedSchedule(null);
            setStudents([]);
            setAttendance({});

        } catch (err) {
            console.error('❌ Error submitting attendance:', err);
            toast.error('Failed to submit attendance: ' + err.message);
            // Don't clear form on error so user can retry
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = schedules.filter(s => !s.hasAttendance).length;
    const completedCount = schedules.filter(s => s.hasAttendance).length;

    const getTimeRange = (timeSlot) => {
        if (timeSlot === 'afternoon') return '16:00 - 17:30';
        if (timeSlot === 'evening') return '19:00 - 20:30';
        return timeSlot;
    };

    const getScheduleDate = (schedule) => {
        try {
            const date = getDateForDayInWeek(schedule.day, schedule.week_number, schedule.year);
            return formatDateShort(date);
        } catch (err) {
            return schedule.day;
        }
    };

    const groupedByDay = groupSchedulesByDay(filteredSchedules);

    return (
        <div className="space-y-6">
            {/* Header - Darker Orange Theme like Booking Tab */}
            <div className="bg-gradient-to-r from-[#E67E22] to-[#D35400] rounded-2xl shadow-xl relative overflow-hidden">
                {/* Subtle Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

                <div className="relative z-10 p-4 sm:p-5">
                    {/* Single Row Layout */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Left - Icon & Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/15 rounded-xl">
                                <Calendar size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">Weekly Attendance</h2>
                                <p className="text-orange-100 text-xs">📅 Organized by day</p>
                            </div>
                        </div>

                        {/* Right - Week Selector */}
                        <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 border border-white/30 backdrop-blur-sm">
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                className="bg-white text-gray-800 border-0 rounded-md px-2 py-1 font-semibold focus:ring-2 focus:ring-white/50 cursor-pointer text-sm"
                            >
                                {[...Array(10)].map((_, i) => {
                                    const week = getCurrentWeek() - 2 + i;
                                    return <option key={week} value={week} className="bg-white text-gray-800">Week {week}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Darker Orange Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-orange-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">📚 Total Sessions</p>
                            <p className="text-2xl sm:text-3xl font-bold text-[#E67E22]">{schedules.length}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar size={24} className="sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-orange-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">⏱️ Pending</p>
                            <p className="text-2xl sm:text-3xl font-bold text-[#E67E22]">{pendingCount}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-xl flex items-center justify-center shadow-lg">
                            <AlertCircle size={24} className="sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-orange-300 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">✅ Completed</p>
                            <p className="text-2xl sm:text-3xl font-bold text-[#E67E22]">{completedCount}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-xl flex items-center justify-center shadow-lg">
                            <CheckCircle size={24} className="sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Filter - Responsive */}
            {!loading && schedules.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="🔍 Search by class, teacher, program..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                    {searchQuery && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <span className="text-gray-600 font-medium">Search results:</span>
                            <span className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                🔍 "{searchQuery}"
                            </span>
                            <span className="text-gray-500">({filteredSchedules.length} found)</span>
                        </div>
                    )}
                </div>
            )}

            {/* Day-Grouped Schedule List */}
            {!selectedSchedule ? (
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
                            <Loader2 className="animate-spin text-[#F39C32] mb-4 mx-auto" size={48} />
                            <p className="text-gray-600 font-medium">Loading schedules...</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={40} className="text-[#F39C32]" />
                            </div>
                            <p className="text-xl font-bold text-gray-700 mb-2">No Schedules Found</p>
                            <p className="text-gray-500 mb-6">
                                There are no classes scheduled for Week {selectedWeek}, {currentYear}
                            </p>
                            <button
                                onClick={() => setSelectedWeek(getCurrentWeek())}
                                className="bg-gradient-to-r from-[#F39C32] to-[#e08a1f] hover:from-[#e08a1f] hover:to-[#d07a15] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                            >
                                Go to Current Week ({getCurrentWeek()})
                            </button>
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
                            <Search size={48} className="mx-auto mb-4 text-[#F39C32]" />
                            <p className="text-xl font-bold text-gray-700 mb-2">No Results Found</p>
                            <p className="text-gray-500 mb-6">Try adjusting your search</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="bg-gradient-to-r from-[#F39C32] to-[#e08a1f] hover:from-[#e08a1f] hover:to-[#d07a15] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        // Card Grid Layout - Like Booking Tab
                        <div className="space-y-6">
                            {Object.entries(groupedByDay).map(([day, daySchedules]) => {
                                if (daySchedules.length === 0) return null;

                                const config = dayConfig[day];

                                return (
                                    <div key={day} className="space-y-4">
                                        {/* Day Header - Compact */}
                                        <div className={`bg-gradient-to-r ${config.color} rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-md`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                                                    {config.emoji}
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-bold text-white capitalize">{day}</h3>
                                                    <p className="text-white/90 text-xs">
                                                        {daySchedules.length} session{daySchedules.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {daySchedules.filter(s => !s.hasAttendance).length > 0 && (
                                                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg">
                                                        <span className="text-white font-bold text-xs">⏱️ {daySchedules.filter(s => !s.hasAttendance).length}</span>
                                                    </div>
                                                )}
                                                {daySchedules.filter(s => s.hasAttendance).length > 0 && (
                                                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg">
                                                        <span className="text-white font-bold text-xs">✅ {daySchedules.filter(s => s.hasAttendance).length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Grid - 3 columns on desktop, 1 on mobile - Like Booking Tab */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {daySchedules.map((schedule) => {
                                                const badge = getClassBadge(schedule.class?.name);
                                                return (
                                                    <div
                                                        key={schedule.id}
                                                        className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${schedule.hasAttendance ? 'border-green-300' : 'border-orange-300'
                                                            } hover:scale-[1.02] cursor-pointer border-l-4`}
                                                        onClick={() => handleSelectSchedule(schedule)}
                                                    >
                                                        {/* Card Header */}
                                                        <div className="p-4 border-b border-gray-100">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className={`w-12 h-12 ${badge.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                                                                        {badge.emoji}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-bold text-gray-900 text-sm truncate">{schedule.class?.name}</h4>
                                                                        <p className="text-xs text-gray-500 truncate">{schedule.program} • {schedule.level}</p>
                                                                    </div>
                                                                </div>
                                                                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${schedule.hasAttendance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {schedule.hasAttendance ? `${schedule.attendanceCount}/10` : 'Not Yet'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="p-4 space-y-2">
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Calendar size={14} className="text-[#E67E22] flex-shrink-0" />
                                                                <span className="truncate">{getScheduleDate(schedule)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Clock size={14} className="text-[#E67E22] flex-shrink-0" />
                                                                <span className="truncate">{schedule.time_slot === 'afternoon' ? 'Afternoon' : 'Evening'} • {getTimeRange(schedule.time_slot)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Users size={14} className="text-[#E67E22] flex-shrink-0" />
                                                                <span className="truncate">{schedule.teacher?.name || 'No teacher'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className={`p-3 ${schedule.hasAttendance ? 'bg-green-50' : 'bg-orange-50'}`}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectSchedule(schedule);
                                                                }}
                                                                className={`w-full py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 ${schedule.hasAttendance
                                                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                    : 'bg-[#E67E22] hover:bg-[#D35400] text-white'
                                                                    }`}
                                                            >
                                                                {schedule.hasAttendance ? (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        <span>View Attendance</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <AlertCircle size={16} />
                                                                        <span>Mark Attendance</span>
                                                                    </>
                                                                )}
                                                            </button>
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
                </div>
            ) : (
                /* Attendance Form - Darker Orange Theme */
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#E67E22] to-[#D35400] text-white p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold">✏️ Mark Attendance</h2>
                                <p className="text-orange-100 text-xs sm:text-sm mt-1">
                                    {selectedSchedule.class?.name} • {students.length} Students
                                </p>
                                <p className="text-orange-100 text-xs mt-1">
                                    📅 {getScheduleDate(selectedSchedule)} • 🕐 {getTimeRange(selectedSchedule.time_slot)} • 👨‍🏫 {selectedSchedule.teacher?.name || 'No teacher'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedSchedule(null);
                                    setStudents([]);
                                    setAttendance({});
                                }}
                                className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded-lg transition-all font-semibold text-sm"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {students.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No students in this class</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Bar */}
                                <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#E67E22] to-[#D35400] rounded-xl flex items-center justify-center">
                                                <Users size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Attendance Progress</p>
                                                <p className="text-2xl font-bold text-[#E67E22]">
                                                    {Object.values(attendance).filter(s => s !== null).length} / {students.length}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                                                ✓ {Object.values(attendance).filter(s => s === 'present').length} Present
                                            </div>
                                            <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-semibold">
                                                ⏰ {Object.values(attendance).filter(s => s === 'late').length} Late
                                            </div>
                                            <div className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold">
                                                ✗ {Object.values(attendance).filter(s => s === 'absent').length} Absent
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                    {students.map((student, index) => (
                                        <div key={student.user_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-orange-50/50 rounded-xl border border-orange-200 gap-3 sm:gap-0">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F39C32] to-[#e08a1f] flex items-center justify-center font-bold text-white text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm sm:text-base">{student.user?.full_name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-500">{student.user?.student_id}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'present')}
                                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'present'
                                                        ? 'bg-green-500 text-white shadow-md scale-105'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'late')}
                                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'late'
                                                        ? 'bg-yellow-500 text-white shadow-md scale-105'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <Clock size={18} className="sm:w-5 sm:h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'absent')}
                                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'absent'
                                                        ? 'bg-red-500 text-white shadow-md scale-105'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <XCircle size={18} className="sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSubmitAttendance}
                                    disabled={submitting || Object.values(attendance).filter(s => s !== null).length === 0}
                                    className="w-full bg-gradient-to-r from-[#E67E22] to-[#D35400] hover:from-[#D35400] hover:to-[#C0392B] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                                            <span>Submit Attendance ({Object.values(attendance).filter(s => s !== null).length}/{students.length})</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Success Modal */}
            <Modal
                isOpen={isOpen}
                onClose={hideModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                actions={modalConfig.actions}
            />
        </div>
    );
};

export default AdminAttendanceManager;
