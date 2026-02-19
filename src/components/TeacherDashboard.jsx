import { useState, useEffect } from 'react';
import { LogOut, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Key, Eye, EyeOff } from 'lucide-react';
import { useToast } from './Toast';
import { logout, updateTeacherPassword } from '../utils/authHelpers';
import { getSchedules, getScheduleStudents, getCurrentWeek, getCurrentYear, submitBatchAttendance } from '../utils/dbHelpers';
import { supabase } from '../supabaseClient';

const TeacherDashboard = ({ user }) => {
    const toast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasExistingAttendance, setHasExistingAttendance] = useState(false); // NEW: Track if attendance already submitted

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();

    // Get current day and time period
    const getCurrentDayAndTime = () => {
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getDay()];
        const currentHour = now.getHours();

        // Determine which time periods are accessible
        // Afternoon class: accessible until 18:00 (6 PM)
        // Evening class: accessible until 21:00 (9 PM)
        const accessiblePeriods = [];

        if (currentHour < 18) {
            // Before 6 PM - can access afternoon classes
            accessiblePeriods.push('afternoon');
        }

        if (currentHour < 21) {
            // Before 9 PM - can access evening classes
            accessiblePeriods.push('evening');
        }

        return { currentDay, accessiblePeriods };
    };

    const filterSchedulesByCurrentTime = (schedules) => {
        const { currentDay, accessiblePeriods } = getCurrentDayAndTime();

        return schedules.filter(schedule => {
            const scheduleDay = schedule.day.toLowerCase();
            const scheduleTime = schedule.time_slot.toLowerCase();

            // Must match current day
            if (scheduleDay !== currentDay) return false;

            // Check if time period is accessible
            // Afternoon classes accessible until 18:00
            // Evening classes accessible until 21:00
            if (scheduleTime.includes('afternoon') && accessiblePeriods.includes('afternoon')) {
                return true;
            }
            if (scheduleTime.includes('evening') && accessiblePeriods.includes('evening')) {
                return true;
            }

            return false;
        });
    };

    useEffect(() => {
        loadTeacherSchedules();
    }, []);

    const loadTeacherSchedules = async () => {
        try {
            setLoading(true);
            // Get all schedules for this teacher in current week
            const data = await getSchedules({
                teacher_id: user.id,
                week_number: currentWeek,
                year: currentYear
            });

            console.log('📋 All schedules from DB:', data.length);
            console.log('🕐 Current day and time:', getCurrentDayAndTime());

            // Filter schedules by current day and time
            const filteredSchedules = filterSchedulesByCurrentTime(data);
            console.log('✅ Filtered schedules:', filteredSchedules.length);

            // Remove duplicates based on schedule ID
            const uniqueSchedules = filteredSchedules.filter((schedule, index, self) =>
                index === self.findIndex(s => s.id === schedule.id)
            );
            console.log('🔍 Unique schedules:', uniqueSchedules.length);

            setSchedules(uniqueSchedules);

            // Auto-select first schedule if available
            if (uniqueSchedules.length > 0 && !selectedSchedule) {
                handleSelectSchedule(uniqueSchedules[0]);
            }
        } catch (err) {
            console.error('❌ Error loading schedules:', err);
            toast.error('Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSchedule = async (schedule) => {
        try {
            setLoading(true);
            setSelectedSchedule(schedule);

            // Load students for this schedule
            const studentsData = await getScheduleStudents(schedule.id);
            setStudents(studentsData);

            // Check if attendance already exists for this schedule AND load existing data
            const { data: existingAttendance, error: checkError } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('schedule_id', schedule.id);

            if (checkError) {
                console.error('❌ Error checking existing attendance:', checkError);
            }

            const hasExisting = existingAttendance && existingAttendance.length > 0;
            setHasExistingAttendance(hasExisting);

            // Initialize attendance state
            const initialAttendance = {};

            if (hasExisting) {
                console.log('📋 Loading existing attendance for editing:', existingAttendance.length, 'records');
                toast.info('📝 Loading existing attendance for editing...', { duration: 3000 });

                // Create map of existing attendance by student_id
                const existingMap = {};
                existingAttendance.forEach(record => {
                    existingMap[record.student_id] = record.status;
                });

                // Set attendance based on existing data or null for new students
                studentsData.forEach(student => {
                    const studentId = student.user?.student_id;
                    initialAttendance[student.user_id] = existingMap[studentId] || null;
                });
            } else {
                // No existing attendance, initialize as empty
                studentsData.forEach(student => {
                    initialAttendance[student.user_id] = null;
                });
            }

            setAttendance(initialAttendance);
        } catch (err) {
            console.error('Error loading students:', err);
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

        // Prevent double submission
        if (submitting) {
            console.log('⚠️ Already submitting, ignoring duplicate click');
            return;
        }

        // Check if any attendance has been marked
        const markedAttendance = Object.values(attendance).filter(status => status !== null);
        if (markedAttendance.length === 0) {
            toast.error('Please mark attendance for at least one student');
            return;
        }

        try {
            setSubmitting(true);
            console.log('📤 Starting attendance submission/update...');

            // Check existing attendance to determine INSERT vs UPDATE
            const { data: existingAttendance, error: checkError } = await supabase
                .from('attendance')
                .select('id, student_id, status')
                .eq('schedule_id', selectedSchedule.id);

            if (checkError) {
                console.error('❌ Error checking existing attendance:', checkError);
                throw checkError;
            }

            // Create map of existing records by student_id
            const existingMap = {};
            if (existingAttendance) {
                existingAttendance.forEach(record => {
                    existingMap[record.student_id] = record;
                });
            }

            // Separate records into INSERT (new) and UPDATE (existing with changed status)
            const recordsToInsert = [];
            const recordsToUpdate = [];

            students
                .filter(student => attendance[student.user_id] !== null)
                .forEach(student => {
                    const studentId = student.user?.student_id || '-';
                    const status = attendance[student.user_id];

                    const existingRecord = existingMap[studentId];

                    if (existingRecord) {
                        // Record exists - UPDATE if status changed
                        if (existingRecord.status !== status) {
                            recordsToUpdate.push({
                                id: existingRecord.id,
                                status: status
                            });
                        }
                    } else {
                        // Record doesn't exist - INSERT
                        recordsToInsert.push({
                            teacher_id: user.id,
                            teacher_name: user.name,
                            schedule_id: selectedSchedule.id,
                            class_name: selectedSchedule.class?.name || '-',
                            program: selectedSchedule.program,
                            level: selectedSchedule.level,
                            phase: selectedSchedule.phase,
                            day: selectedSchedule.day,
                            time_slot: selectedSchedule.time_slot,
                            week_number: currentWeek,
                            year: currentYear,
                            student_id: studentId,
                            student_name: student.user?.full_name || '-',
                            status: status
                        });
                    }
                });

            console.log(`📊 Summary: ${recordsToInsert.length} to insert, ${recordsToUpdate.length} to update`);

            let insertedCount = 0;
            let updatedCount = 0;

            // INSERT new records
            if (recordsToInsert.length > 0) {
                const { data: insertData, error: insertError } = await supabase
                    .from('attendance')
                    .insert(recordsToInsert)
                    .select();

                if (insertError) {
                    console.error('❌ Error inserting attendance:', insertError);
                    throw insertError;
                }
                insertedCount = insertData?.length || 0;
                console.log(`✅ Inserted ${insertedCount} new records`);
            }

            // UPDATE existing records
            if (recordsToUpdate.length > 0) {
                // Update one by one (Supabase doesn't support batch update easily)
                for (const record of recordsToUpdate) {
                    const { error: updateError } = await supabase
                        .from('attendance')
                        .update({ status: record.status })
                        .eq('id', record.id);

                    if (updateError) {
                        console.error('❌ Error updating attendance:', updateError);
                    } else {
                        updatedCount++;
                    }
                }
                console.log(`✅ Updated ${updatedCount} existing records`);
            }

            // Show success message
            if (insertedCount > 0 && updatedCount > 0) {
                toast.success(
                    `✅ SUCCESS! ${insertedCount} new, ${updatedCount} updated`,
                    { duration: 5000 }
                );
            } else if (insertedCount > 0) {
                toast.success(
                    `✅ SUCCESS! ${insertedCount} new record(s) added`,
                    { duration: 5000 }
                );
            } else if (updatedCount > 0) {
                toast.success(
                    `✅ SUCCESS! ${updatedCount} record(s) updated`,
                    { duration: 5000 }
                );
            } else {
                toast.info('No changes to save', { duration: 3000 });
            }

            // Reload attendance to show updated data
            await handleSelectSchedule(selectedSchedule);

        } catch (err) {
            console.error('❌ Error submitting attendance:', err);
            toast.error('Failed to submit attendance: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        window.location.reload();
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setPasswordLoading(true);
            await updateTeacherPassword(
                user.id,
                passwordData.currentPassword,
                passwordData.newPassword
            );

            toast.success('Password updated successfully!');
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            console.error('Error updating password:', err);
            toast.error(err.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const getAttendanceStats = () => {
        const present = Object.values(attendance).filter(s => s === 'present').length;
        const late = Object.values(attendance).filter(s => s === 'late').length;
        const absent = Object.values(attendance).filter(s => s === 'absent').length;
        return { present, late, absent };
    };

    const stats = getAttendanceStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
            {/* Modern Header - Mobile Optimized */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-4">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {/* Left: Logo, Title & Info */}
                        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
                            {/* Logo */}
                            <img
                                src="/eysa-logo.svg"
                                alt="EYSA Logo"
                                className="h-8 sm:h-12 md:h-16 w-auto flex-shrink-0"
                            />

                            {/* Title & Info Column */}
                            <div className="min-w-0 flex-1">
                                {/* Row 1: Language Center + Badge */}
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <h1 className="text-xs sm:text-2xl md:text-3xl font-bold text-[#2C5F8D] leading-none">
                                        Language Center
                                    </h1>
                                    {/* Teacher Badge */}
                                    <span className="bg-gradient-to-r from-[#F39C32] to-[#e88b1f] text-white text-[7px] sm:text-[10px] font-bold px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm transform -rotate-12 shadow-md uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                                        Teacher
                                    </span>
                                </div>

                                {/* Row 2: Batch | Week | Name */}
                                <div className="flex items-center gap-0.5 sm:gap-2 text-[8px] sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                                    <span className="whitespace-nowrap">Batch {user.batch || 1}</span>
                                    <span>|</span>
                                    <span className="whitespace-nowrap">Week {currentWeek}</span>
                                    <span>|</span>
                                    <span className="font-semibold text-[#F39C32] truncate">{user.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="p-1 sm:p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md sm:rounded-lg transition-all shadow-md hover:shadow-lg"
                                title="Change Password"
                            >
                                <Key size={10} className="sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-1 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-2 transition-all font-semibold shadow-md hover:shadow-lg"
                                title="Logout"
                            >
                                <LogOut size={10} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
                {/* Schedule Selection */}
                {schedules.length > 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Select Class</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {schedules.map(schedule => (
                                <button
                                    key={schedule.id}
                                    onClick={() => handleSelectSchedule(schedule)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedSchedule?.id === schedule.id
                                        ? 'border-[#1F4E8C] bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-800">{schedule.class?.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {schedule.program} • {schedule.level}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {schedule.day} • {schedule.time_slot}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && !selectedSchedule ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-[#1F4E8C]" size={48} />
                    </div>
                ) : selectedSchedule ? (
                    <>
                        {/* Student List */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-3 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base sm:text-xl font-bold">Student Attendance</h2>
                                        <p className="text-blue-200 text-[10px] sm:text-sm mt-1">
                                            Week {currentWeek} • {students.length} Students
                                        </p>
                                    </div>
                                    <button
                                        onClick={loadTeacherSchedules}
                                        className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={16} className="sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Banner if attendance already submitted */}
                            {hasExistingAttendance && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 sm:p-4 mx-3 sm:mx-6 mt-4 rounded-lg">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h3 className="font-bold text-blue-900 text-sm sm:text-base">📝 Edit Mode: Attendance Already Submitted</h3>
                                            <p className="text-blue-800 text-xs sm:text-sm mt-1">
                                                You can edit existing attendance below. Change any status (e.g., Present → Late) and click Submit to update. New students will be added automatically.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {students.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto text-gray-300 mb-4" size={64} />
                                        <p className="text-gray-500 font-semibold">No students in this class yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        {students.map((student, index) => (
                                            <div
                                                key={student.user_id}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-4">
                                                    <div className="w-7 h-7 sm:w-10 sm:h-10 bg-[#1F4E8C] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                                            {student.user?.full_name}
                                                        </div>
                                                        <div className="text-[10px] sm:text-sm text-gray-500">
                                                            {student.user?.student_id}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 sm:gap-2">
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.user_id, 'present')}
                                                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-[10px] sm:text-sm ${attendance[student.user_id] === 'present'
                                                            ? 'bg-green-500 text-white shadow-lg'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        <CheckCircle size={14} className="inline mr-0.5 sm:mr-1 sm:w-[18px] sm:h-[18px]" />
                                                        <span className="hidden sm:inline">Present</span>
                                                        <span className="sm:hidden">✓</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.user_id, 'late')}
                                                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-[10px] sm:text-sm ${attendance[student.user_id] === 'late'
                                                            ? 'bg-yellow-500 text-white shadow-lg'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        <AlertCircle size={14} className="inline mr-0.5 sm:mr-1 sm:w-[18px] sm:h-[18px]" />
                                                        <span className="hidden sm:inline">Late</span>
                                                        <span className="sm:hidden">⏰</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttendanceChange(student.user_id, 'absent')}
                                                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-[10px] sm:text-sm ${attendance[student.user_id] === 'absent'
                                                            ? 'bg-red-500 text-white shadow-lg'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        <XCircle size={14} className="inline mr-0.5 sm:mr-1 sm:w-[18px] sm:h-[18px]" />
                                                        <span className="hidden sm:inline">Absent</span>
                                                        <span className="sm:hidden">✗</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {students.length > 0 && (
                                    <>
                                        <div className="mt-3 sm:mt-6 flex justify-end px-2 sm:px-0">
                                            <button
                                                onClick={handleSubmitAttendance}
                                                disabled={submitting}
                                                className="w-full sm:w-auto bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin sm:w-5 sm:h-5" />
                                                        <span className="hidden sm:inline">Submitting...</span>
                                                        <span className="sm:hidden">Submitting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={16} className="sm:w-5 sm:h-5" />
                                                        <span className="hidden sm:inline">Submit Attendance</span>
                                                        <span className="sm:hidden">Submit</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Cards - Moved below submit button */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6">
                            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border border-green-100">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="text-green-600" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Present</p>
                                        <p className="text-3xl sm:text-4xl font-bold text-green-600">{stats.present}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border border-yellow-100">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <AlertCircle className="text-yellow-600" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Late</p>
                                        <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{stats.late}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border border-red-100">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center">
                                        <XCircle className="text-red-600" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Absent</p>
                                        <p className="text-3xl sm:text-4xl font-bold text-red-600">{stats.absent}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Time Info */}
                        <div className="mt-6 bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100">
                            <div className="flex items-center justify-center gap-3 text-gray-700">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Clock size={20} className="text-blue-600" />
                                </div>
                                <div className="text-sm sm:text-base">
                                    <span className="font-semibold text-gray-800">Showing classes for: </span>
                                    <span className="capitalize font-medium text-blue-600">{getCurrentDayAndTime().currentDay}</span>
                                    <span className="text-gray-400 mx-1">•</span>
                                    <span className="capitalize font-medium text-blue-600">{getCurrentDayAndTime().timePeriod}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Classes Right Now</h3>
                        <p className="text-gray-500">No classes scheduled for {getCurrentDayAndTime().currentDay} {getCurrentDayAndTime().timePeriod}</p>
                    </div>
                )}
            </div>

            {/* Change Password Modal */}
            {
                showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-3 overflow-y-auto">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-3 sm:p-4 animate-fadeIn mt-12 mb-4">
                            <div className="flex items-center justify-between mb-4 sm:mb-5">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg sm:rounded-xl">
                                        <Key className="text-blue-600" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Change Password</h3>
                                        <p className="text-xs sm:text-sm text-gray-500">Update your password</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closePasswordModal}
                                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="Enter new password"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 sm:gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-sm"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                                                <span className="hidden sm:inline">Updating...</span>
                                                <span className="sm:hidden">Wait...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">Update Password</span>
                                                <span className="sm:hidden">Update</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closePasswordModal}
                                        className="px-3 sm:px-5 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-colors text-xs sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TeacherDashboard;
