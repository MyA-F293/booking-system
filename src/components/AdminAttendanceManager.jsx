import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search } from 'lucide-react';
import { useToast } from './Toast';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear, submitBatchAttendance, getAttendanceRecords } from '../utils/dbHelpers';

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
    const [filterStatus, setFilterStatus] = useState('pending'); // 'all', 'pending', 'completed'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());

    const currentYear = getCurrentYear();

    useEffect(() => {
        loadAllSchedules();
    }, [selectedWeek]);

    useEffect(() => {
        applyFilters();
    }, [schedules, filterStatus, searchQuery]);

    const loadAllSchedules = async () => {
        try {
            setLoading(true);
            console.log('🔍 AdminAttendanceManager: Loading schedules for week', selectedWeek, 'year', currentYear);

            // Get ALL schedules for selected week (no time restriction for admin)
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

            // Check which schedules already have attendance submitted
            const schedulesWithStatus = await Promise.all(
                data.map(async (schedule) => {
                    const attendanceRecords = await getAttendanceRecords({
                        schedule_id: schedule.id
                    });
                    return {
                        ...schedule,
                        hasAttendance: attendanceRecords.length > 0,
                        attendanceCount: attendanceRecords.length
                    };
                })
            );

            console.log('📋 Loaded schedules with attendance status:', schedulesWithStatus.length);
            console.log('📋 Sample schedule:', schedulesWithStatus[0]);
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

        // Filter by status
        if (filterStatus === 'pending') {
            filtered = filtered.filter(s => !s.hasAttendance);
        } else if (filterStatus === 'completed') {
            filtered = filtered.filter(s => s.hasAttendance);
        }

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

    const handleSelectSchedule = async (schedule) => {
        try {
            setLoading(true);
            setSelectedSchedule(schedule);

            // Load students for this schedule
            const studentsData = await getScheduleStudents(schedule.id);
            setStudents(studentsData);

            // Initialize attendance state
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

            // Show success message with details
            if (result.skipped > 0) {
                toast.success(
                    `✅ SUCCESS! ${result.inserted} new record(s) submitted. ${result.skipped} already existed (skipped duplicates)`,
                    { duration: 6000 }
                );
            } else {
                toast.success(
                    `✅ SUCCESS! Attendance submitted for ${result.inserted} student(s)`,
                    { duration: 5000 }
                );
            }

            // Reload schedules to update status
            await loadAllSchedules();

            // Clear selection
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Attendance Management</h1>
                <p className="text-orange-100">Fill attendance for any class, anytime</p>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats */}
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                    <div className="text-sm text-gray-600">Total Classes</div>
                    <div className="text-2xl font-bold text-gray-800">{schedules.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                </div>

                {/* Week Selector */}
                <div className="bg-white rounded-xl p-4 shadow-md">
                    <label className="text-sm text-gray-600 block mb-2">Week</label>
                    <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                        {[...Array(10)].map((_, i) => {
                            const week = getCurrentWeek() - 2 + i;
                            return <option key={week} value={week}>Week {week}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'all'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'pending'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'completed'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Completed ({completedCount})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search class, teacher, program..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule List or Selected Schedule */}
            {!selectedSchedule ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {filterStatus === 'pending' ? 'Classes Pending Attendance' : 'All Classes'}
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-orange-500" size={48} />
                            <p className="ml-3 text-gray-600">Loading schedules...</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-20">
                            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-xl font-semibold text-gray-700 mb-2">No Schedules Found</p>
                            <p className="text-gray-500 mb-4">
                                There are no classes scheduled for Week {selectedWeek}, {currentYear}
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                                <p className="text-sm text-blue-800 font-semibold mb-2">💡 Possible reasons:</p>
                                <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                                    <li>No bookings have been made for this week yet</li>
                                    <li>Try selecting a different week from the dropdown above</li>
                                    <li>Check if students have booked classes in the Booking tab</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => setSelectedWeek(getCurrentWeek())}
                                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Go to Current Week ({getCurrentWeek()})
                            </button>
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <Search size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-semibold text-gray-700 mb-2">No Classes Match Your Filter</p>
                            <p className="text-gray-500 mb-4">
                                {filterStatus === 'pending'
                                    ? 'All classes for this week already have attendance filled! 🎉'
                                    : filterStatus === 'completed'
                                        ? 'No classes have attendance filled yet for this week'
                                        : 'Try adjusting your search or filter'}
                            </p>
                            <button
                                onClick={() => {
                                    setFilterStatus('all');
                                    setSearchQuery('');
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchedules.map(schedule => (
                                <button
                                    key={schedule.id}
                                    onClick={() => handleSelectSchedule(schedule)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${schedule.hasAttendance
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-red-200 bg-red-50 hover:border-red-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-semibold text-gray-800">{schedule.class?.name}</div>
                                        {schedule.hasAttendance ? (
                                            <CheckCircle size={20} className="text-green-600" />
                                        ) : (
                                            <AlertCircle size={20} className="text-red-600" />
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>{schedule.program} • {schedule.level}</div>
                                        <div>{schedule.day} • {schedule.time_slot}</div>
                                        <div className="text-xs text-gray-500">{schedule.teacher?.name}</div>
                                    </div>
                                    {schedule.hasAttendance && (
                                        <div className="mt-2 text-xs text-green-600 font-medium">
                                            ✓ {schedule.attendanceCount} students marked
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Attendance Form - Similar to TeacherDashboard */
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Mark Attendance</h2>
                                <p className="text-orange-100 text-sm mt-1">
                                    {selectedSchedule.class?.name} • {students.length} Students
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedSchedule(null);
                                    setStudents([]);
                                    setAttendance({});
                                }}
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {students.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No students in this class</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 mb-6">
                                    {students.map((student, index) => (
                                        <div key={student.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800">{student.user?.full_name}</div>
                                                    <div className="text-sm text-gray-500">{student.user?.student_id}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'present')}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'present'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'late')}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'late'
                                                        ? 'bg-yellow-500 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <Clock size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(student.user_id, 'absent')}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.user_id] === 'absent'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSubmitAttendance}
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
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
