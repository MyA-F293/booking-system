import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './Toast';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear, submitBatchAttendance, getAttendanceRecords, getDateForDayInWeek, formatDateShort } from '../utils/dbHelpers';

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

// Day emojis and colors - Softer Orange/Amber theme for admin
const dayConfig = {
    monday: { emoji: '🌙', color: 'from-orange-400 to-amber-400', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200' },
    tuesday: { emoji: '🔥', color: 'from-red-400 to-orange-400', bg: 'from-red-50 to-orange-50', border: 'border-red-200' },
    wednesday: { emoji: '🌿', color: 'from-amber-400 to-yellow-400', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200' },
    thursday: { emoji: '⚡', color: 'from-orange-400 to-amber-500', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200' },
    friday: { emoji: '🎉', color: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
    saturday: { emoji: '🌟', color: 'from-yellow-400 to-orange-400', bg: 'from-yellow-50 to-orange-50', border: 'border-yellow-200' },
    sunday: { emoji: '☀️', color: 'from-orange-400 to-red-400', bg: 'from-orange-50 to-red-50', border: 'border-orange-200' },
};

const AdminAttendanceManager = () => {
    const toast = useToast();
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

            console.log('📊 Found', allAttendance?.length || 0, 'attendance records');

            const attendanceMap = {};
            if (allAttendance && allAttendance.length > 0) {
                allAttendance.forEach(record => {
                    if (!attendanceMap[record.schedule_id]) {
                        attendanceMap[record.schedule_id] = 0;
                    }
                    attendanceMap[record.schedule_id]++;
                });
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

            const studentsData = await getScheduleStudents(schedule.id);
            setStudents(studentsData);

            const initialAttendance = {};
            studentsData.forEach(student => {
                initialAttendance[student.user_id] = null;
            });
            setAttendance(initialAttendance);
        } catch (err) {
            console.error('❌ Error loading students:', err);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (userId, status) => {
        setAttendance(prev => ({
            ...prev,
            [userId]: status
        }));
    };

    const handleSubmitAttendance = async () => {
        if (!selectedSchedule) return;

        if (submitting) {
            console.log('⚠️ Already submitting');
            return;
        }

        const markedAttendance = Object.values(attendance).filter(status => status !== null);
        if (markedAttendance.length === 0) {
            toast.error('Please mark attendance for at least one student');
            return;
        }

        try {
            setSubmitting(true);
            console.log('📤 Admin submitting attendance...');

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

            const result = await submitBatchAttendance(attendanceRecords);

            console.log('✅ Attendance submitted successfully!', result);

            // Show success notification with clear feedback
            const successMessage = result.skipped > 0
                ? `✅ SUCCESS! ${result.inserted} new, ${result.skipped} skipped (duplicates)`
                : `✅ SUCCESS! ${result.inserted} student(s) marked`;

            // Show toast notification
            toast.success(successMessage, { duration: 5000 });

            // Reload schedules to update status
            await loadAllSchedules();

            // Clear form and go back to list
            setSelectedSchedule(null);
            setStudents([]);
            setAttendance({});

        } catch (err) {
            console.error('❌ Error submitting attendance:', err);
            toast.error('Failed to submit attendance: ' + err.message);
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
            {/* Header - Softer Orange/Amber Admin Theme */}
            <div className="relative bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}></div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

                <div className="relative z-10 p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transform rotate-12">
                                <Calendar size={24} className="sm:w-8 sm:h-8 text-white -rotate-12" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Weekly Attendance</h1>
                                <p className="text-orange-100 text-xs sm:text-sm md:text-base mt-1">📅 Organized by day</p>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                            <label className="text-xs text-orange-100 block mb-1">Select Week</label>
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                className="w-full sm:w-auto bg-white text-gray-800 border-0 rounded-lg px-3 sm:px-4 py-2 font-semibold focus:ring-2 focus:ring-white/50 cursor-pointer text-sm"
                            >
                                {[...Array(10)].map((_, i) => {
                                    const week = getCurrentWeek() - 2 + i;
                                    return <option key={week} value={week}>Week {week}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Softer Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 sm:p-5 border-2 border-orange-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">📚 Total Sessions</p>
                            <p className="text-2xl sm:text-3xl font-bold text-orange-900">{schedules.length}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-lg">
                            <Calendar size={24} className="sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 sm:p-5 border-2 border-red-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">⏱️ Pending</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-900">{pendingCount}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                            <AlertCircle size={24} className="sm:w-7 sm:h-7 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-5 border-2 border-green-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">✅ Completed</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-900">{completedCount}</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
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
                            <Loader2 className="animate-spin text-indigo-500 mb-4 mx-auto" size={48} />
                            <p className="text-gray-600 font-medium">Loading schedules...</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar size={40} className="text-gray-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-700 mb-2">No Schedules Found</p>
                            <p className="text-gray-500 mb-6">
                                There are no classes scheduled for Week {selectedWeek}, {currentYear}
                            </p>
                            <button
                                onClick={() => setSelectedWeek(getCurrentWeek())}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                            >
                                Go to Current Week ({getCurrentWeek()})
                            </button>
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
                            <Search size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-xl font-bold text-gray-700 mb-2">No Results Found</p>
                            <p className="text-gray-500 mb-6">Try adjusting your search</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        Object.entries(groupedByDay).map(([day, daySchedules]) => {
                            if (daySchedules.length === 0) return null;

                            const config = dayConfig[day];
                            const isExpanded = expandedDays.has(day);
                            const pendingInDay = daySchedules.filter(s => !s.hasAttendance).length;
                            const completedInDay = daySchedules.filter(s => s.hasAttendance).length;

                            return (
                                <div key={day} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                                    {/* Day Header - Responsive */}
                                    <button
                                        onClick={() => toggleDayExpansion(day)}
                                        className={`w-full bg-gradient-to-r ${config.color} p-4 sm:p-5 flex items-center justify-between hover:opacity-90 transition-all`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                                                {config.emoji}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg sm:text-xl font-bold text-white capitalize">{day}</h3>
                                                <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1">
                                                    {daySchedules.length} session{daySchedules.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                {pendingInDay > 0 && (
                                                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                                        <span className="text-white font-bold text-xs sm:text-sm">⏱️ {pendingInDay}</span>
                                                    </div>
                                                )}
                                                {completedInDay > 0 && (
                                                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                                                        <span className="text-white font-bold text-xs sm:text-sm">✅ {completedInDay}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                {isExpanded ? (
                                                    <ChevronUp size={18} className="sm:w-5 sm:h-5 text-white" />
                                                ) : (
                                                    <ChevronDown size={18} className="sm:w-5 sm:h-5 text-white" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Day Sessions */}
                                    {isExpanded && (
                                        <div className={`p-4 bg-gradient-to-br ${config.bg} space-y-3`}>
                                            {daySchedules.map((schedule) => {
                                                const badge = getClassBadge(schedule.class?.name);
                                                return (
                                                    <button
                                                        key={schedule.id}
                                                        onClick={() => handleSelectSchedule(schedule)}
                                                        className={`w-full bg-white rounded-xl p-4 border-l-4 ${schedule.hasAttendance ? 'border-green-500' : 'border-red-500'
                                                            } shadow-sm hover:shadow-md transition-all text-left hover:scale-[1.01]`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-12 h-12 ${badge.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                                                                {badge.emoji}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-gray-900 text-base truncate">{schedule.class?.name}</div>
                                                                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold">{schedule.time_slot === 'afternoon' ? '🌤️ Afternoon' : '🌙 Evening'}</span>
                                                                        <span>•</span>
                                                                        <span>🕐 {getTimeRange(schedule.time_slot)}</span>
                                                                    </div>
                                                                    <div>📅 {getScheduleDate(schedule)}</div>
                                                                    <div>👨‍🏫 {schedule.teacher?.name || 'No teacher'}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 font-medium">
                                                                        {schedule.program}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 font-medium">
                                                                        {schedule.level}
                                                                    </span>
                                                                    {schedule.hasAttendance && (
                                                                        <span className="px-2 py-0.5 bg-green-100 rounded text-xs text-green-700 font-bold">
                                                                            ✅ {schedule.attendanceCount} marked
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${schedule.hasAttendance ? 'bg-green-100' : 'bg-red-100'
                                                                }`}>
                                                                {schedule.hasAttendance ? (
                                                                    <CheckCircle size={24} className="text-green-600" />
                                                                ) : (
                                                                    <AlertCircle size={24} className="text-red-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Attendance Form - Softer Orange/Amber Theme */
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 text-white p-4 sm:p-6">
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
                                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                    {students.map((student, index) => (
                                        <div key={student.user_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 gap-3 sm:gap-0">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center font-bold text-white text-sm">
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
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-500 hover:via-amber-500 hover:to-orange-600 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                                            <span>Submit Attendance</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAttendanceManager;
