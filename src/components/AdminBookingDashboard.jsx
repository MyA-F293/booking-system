import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Trash2, UserPlus, RefreshCw, ArrowRight, Loader2, BookOpen, X, GraduationCap, Edit3, MessageCircle, Search } from 'lucide-react';
import { getSchedules, getScheduleStudents, getAllStudents, createBooking, getCurrentWeek, getCurrentYear, getTeachers, assignTeacherToSchedule } from '../utils/dbHelpers';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
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

const AdminBookingDashboard = () => {
    const { t } = useLanguage();
    const toast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [scheduleStudents, setScheduleStudents] = useState([]);
    const [selectedWeekTab, setSelectedWeekTab] = useState('next'); // 'current' or 'next'
    const [hideEmpty, setHideEmpty] = useState(true); // Hide empty schedules by default

    const [showAddModal, setShowAddModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [targetSchedule, setTargetSchedule] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    // WhatsApp notification state
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');

    // Search state for Add Student modal
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    // Refresh cooldown state
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    // NEW: Grouping and filtering states
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
    const [filterDay, setFilterDay] = useState('all'); // 'all', 'monday', 'tuesday', etc.
    const [expandedClasses, setExpandedClasses] = useState(new Set()); // Track which classes are expanded

    // Helper function to parse database errors into user-friendly messages
    const parseDbError = (error) => {
        const errorMessage = error?.message || '';

        // Capacity error from trigger
        if (errorMessage.includes('full capacity') || errorMessage.includes('capacity')) {
            return 'Class is full! Maximum 10 students per class.';
        }
        // Duplicate booking error from constraint
        if (errorMessage.includes('unique_booking_per_student') || errorMessage.includes('duplicate key')) {
            return 'Student is already enrolled in this class!';
        }
        // Duplicate schedule error from constraint
        if (errorMessage.includes('unique_schedule_combination')) {
            return 'Schedule with this combination already exists!';
        }
        // Invalid data error from validation trigger
        if (errorMessage.includes('Invalid day') || errorMessage.includes('Invalid phase') || errorMessage.includes('Invalid time_slot')) {
            return 'Invalid data! Please check your input.';
        }
        // Generic error
        return errorMessage;
    };

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const nextWeek = currentWeek + 1;
    const displayWeek = selectedWeekTab === 'current' ? currentWeek : nextWeek;

    const phases = ['phase1', 'phase2', 'recap'];

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

    // NEW: Group schedules by class
    const groupSchedulesByClass = (scheduleList) => {
        const grouped = {};
        scheduleList.forEach(schedule => {
            const className = schedule.class?.name || 'Unknown';
            if (!grouped[className]) {
                grouped[className] = [];
            }
            grouped[className].push(schedule);
        });

        // Sort schedules within each class by day and time
        Object.keys(grouped).forEach(className => {
            grouped[className].sort((a, b) => {
                const dayA = dayOrder[a.day?.toLowerCase()] || 99;
                const dayB = dayOrder[b.day?.toLowerCase()] || 99;
                if (dayA !== dayB) return dayA - dayB;
                // If same day, sort by time_slot
                const timeOrder = { afternoon: 1, evening: 2 };
                return (timeOrder[a.time_slot] || 99) - (timeOrder[b.time_slot] || 99);
            });
        });

        return grouped;
    };

    // Filter schedules by day
    // Apply hide empty filter
    const visibleSchedules = hideEmpty
        ? schedules.filter(s => s.current_students > 0)
        : schedules;

    const filteredSchedules = filterDay === 'all'
        ? visibleSchedules
        : visibleSchedules.filter(s => s.day?.toLowerCase() === filterDay);

    // Group filtered schedules by class
    const groupedByClass = groupSchedulesByClass(filteredSchedules);

    // OLD: Group by phase (for backward compatibility)
    const groupedSchedules = phases.reduce((acc, phase) => {
        acc[phase] = visibleSchedules
            .filter(s => s.phase === phase)
            .sort((a, b) => {
                const dayA = dayOrder[a.day?.toLowerCase()] || 99;
                const dayB = dayOrder[b.day?.toLowerCase()] || 99;
                return dayA - dayB;
            });
        return acc;
    }, {});

    // Check if any schedules are grouped
    const hasGroupedSchedules = phases.some(phase => groupedSchedules[phase]?.length > 0);

    // Toggle class expansion
    const toggleClassExpansion = (className) => {
        const newExpanded = new Set(expandedClasses);
        if (newExpanded.has(className)) {
            newExpanded.delete(className);
        } else {
            newExpanded.add(className);
        }
        setExpandedClasses(newExpanded);
    };

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

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([loadAllSchedules(), loadAllStudents(), loadAllTeachers()]);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllSchedules = async () => {
        const filters = { week_number: displayWeek, year: currentYear };
        const data = await getSchedules(filters);

        // DEDUPLICATION: Remove duplicate schedules based on unique combination
        // of class_id, day, time_slot, phase, week_number
        const uniqueSchedules = [];
        const seenKeys = new Set();

        data.forEach(schedule => {
            const uniqueKey = `${schedule.class_id}-${schedule.day}-${schedule.time_slot}-${schedule.phase}-${schedule.week_number}`;
            if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey);
                uniqueSchedules.push(schedule);
            } else {
                console.log('🔍 Duplicate schedule found and removed:', schedule.class?.name, schedule.day, schedule.time_slot);
            }
        });

        console.log(`📊 Loaded ${data.length} schedules, removed ${data.length - uniqueSchedules.length} duplicates, showing ${uniqueSchedules.length} unique schedules`);
        setSchedules(uniqueSchedules);
    };

    const loadAllStudents = async () => {
        const data = await getAllStudents();
        setAllStudents(data);
    };

    const loadAllTeachers = async () => {
        const data = await getTeachers();
        setAllTeachers(data.filter(t => t.is_active !== false));
    };

    // Refresh with cooldown handler
    const refreshWithCooldown = async () => {
        if (isOnCooldown) return;
        setIsOnCooldown(true);
        setRemainingTime(3);
        await loadData();

        const interval = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsOnCooldown(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        loadData();
    }, [selectedWeekTab]);

    const handleViewDetails = async (schedule) => {
        try {
            setSelectedSchedule(schedule);
            const students = await getScheduleStudents(schedule.id);
            setScheduleStudents(students);
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error(t('adminBooking.loadStudentsFailed'));
        }
    };

    const handleAddStudent = async (studentId) => {
        if (!selectedSchedule) return;
        try {
            setLoading(true);

            // Frontend validation (fast feedback)
            const alreadyBooked = scheduleStudents.some(b => b.user.id === studentId);
            if (alreadyBooked) {
                toast.warning(t('adminBooking.studentAlreadyInClass'));
                return;
            }
            if (selectedSchedule.current_students >= 10) {
                toast.error(t('adminBooking.classFull'));
                return;
            }

            // Try to create booking
            await createBooking({ schedule_id: selectedSchedule.id, user_id: studentId, status: 'confirmed' });
            toast.success(t('adminBooking.studentAdded'));
            await loadAllSchedules();
            await handleViewDetails(selectedSchedule);
            setShowAddModal(false);
        } catch (err) {
            console.error('Error adding student:', err);
            toast.error(parseDbError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedSchedule || !selectedTeacher) {
            toast.warning(t('adminBooking.selectTeacherFirst'));
            return;
        }
        try {
            setLoading(true);
            await assignTeacherToSchedule(selectedSchedule.id, selectedTeacher);
            toast.success(t('adminBooking.teacherAssigned'));
            await loadAllSchedules();
            const updatedSchedule = { ...selectedSchedule, teacher_id: selectedTeacher, teacher: allTeachers.find(t => t.id === selectedTeacher) };
            setSelectedSchedule(updatedSchedule);
            setShowTeacherModal(false);
            setSelectedTeacher('');
        } catch (err) {
            console.error('Error assigning teacher:', err);
            toast.error(t('adminBooking.assignTeacherFailed') + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveStudent = async () => {
        if (!selectedStudent || !targetSchedule) {
            toast.warning(t('adminBooking.selectTargetClass'));
            return;
        }
        try {
            setLoading(true);
            const newSchedule = schedules.find(s => s.id === targetSchedule);
            if (!newSchedule) {
                toast.error(t('adminBooking.targetClassNotFound'));
                return;
            }

            // Frontend validation
            if (newSchedule.current_students >= 10) {
                toast.error('Target class is full! Maximum 10 students per class.');
                return;
            }

            // Store data for WhatsApp notification before moving
            const notificationData = {
                studentName: selectedStudent.user?.full_name || 'Unknown',
                studentId: selectedStudent.user?.student_id || '-',
                fromClass: selectedSchedule.class?.name || 'Unknown',
                fromPhase: getPhaseLabel(selectedSchedule.phase),
                fromDay: getDayLabel(selectedSchedule.day, selectedSchedule.phase),
                fromTime: `${getTimeLabel(selectedSchedule.time_slot)} (${getTimeHours(selectedSchedule.time_slot)})`,
                toClass: newSchedule.class?.name || 'Unknown',
                toPhase: getPhaseLabel(newSchedule.phase),
                toDay: getDayLabel(newSchedule.day, newSchedule.phase),
                toTime: `${getTimeLabel(newSchedule.time_slot)} (${getTimeHours(newSchedule.time_slot)})`
            };

            const { error: deleteError } = await supabase.from('bookings').delete().eq('id', selectedStudent.id);
            if (deleteError) throw deleteError;

            await createBooking({ schedule_id: targetSchedule, user_id: selectedStudent.user.id, status: 'confirmed' });
            toast.success(t('adminBooking.studentMoved'));
            await loadAllSchedules();
            await handleViewDetails(selectedSchedule);
            setShowMoveModal(false);
            setSelectedStudent(null);
            setTargetSchedule('');

            // Show WhatsApp notification modal
            const message = generateWhatsAppMessage('move', notificationData);
            showNotificationModal(message);
        } catch (err) {
            console.error('Error moving student:', err);

            // Parse database errors for user-friendly messages
            const errorMessage = err.message || '';

            // Capacity error from trigger
            if (errorMessage.includes('full capacity') || errorMessage.includes('capacity')) {
                toast.error('❌ Kelas tujuan sudah penuh! Maksimal 10 siswa per kelas.');
            }
            // Duplicate booking error from constraint
            else if (errorMessage.includes('unique_booking_per_student') || errorMessage.includes('duplicate')) {
                toast.error('⚠️ Siswa sudah terdaftar di kelas tujuan!');
            }
            // Generic error
            else {
                toast.error('❌ Gagal memindahkan siswa: ' + errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCleanEmptySchedules = async () => {
        toast.confirm(
            'Delete all empty schedules (0 students)? This cannot be undone.',
            async () => {
                try {
                    setLoading(true);

                    // Delete schedules with 0 students
                    const { data, error } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('current_students', 0)
                        .select();

                    if (error) throw error;

                    const deletedCount = data?.length || 0;
                    toast.success(`✅ Deleted ${deletedCount} empty schedules!`);
                    await loadAllSchedules();
                } catch (err) {
                    console.error('Error cleaning empty schedules:', err);
                    toast.error('❌ Failed to clean schedules: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const handleDeleteStudent = async (bookingId, studentName, studentId) => {
        toast.confirm(
            `${t('adminBooking.confirmDelete')} ${studentName} ${t('adminBooking.fromThisClass')}?`,
            async () => {
                try {
                    setLoading(true);

                    // Store data for WhatsApp notification before deleting
                    const notificationData = {
                        studentName: studentName,
                        studentId: studentId || '-',
                        className: selectedSchedule.class?.name || 'Unknown',
                        phase: getPhaseLabel(selectedSchedule.phase),
                        day: getDayLabel(selectedSchedule.day, selectedSchedule.phase),
                        time: `${getTimeLabel(selectedSchedule.time_slot)} (${getTimeHours(selectedSchedule.time_slot)})`
                    };

                    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
                    if (error) throw error;
                    toast.success(t('adminBooking.studentDeleted'));
                    await loadAllSchedules();
                    await handleViewDetails(selectedSchedule);

                    // Show WhatsApp notification modal
                    const message = generateWhatsAppMessage('remove', notificationData);
                    showNotificationModal(message);
                } catch (err) {
                    console.error('Error deleting student:', err);
                    toast.error(t('adminBooking.deleteStudentFailed') + err.message);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const handleDeleteSchedule = async (schedule) => {
        toast.confirm(
            `${t('adminBooking.confirmDeleteSchedule')} "${schedule.class?.name}" (${schedule.current_students} ${t('adminBooking.studentsCount')})? ${t('adminBooking.allBookingsDeleted')}`,
            async () => {
                try {
                    setLoading(true);

                    // First delete all bookings for this schedule
                    const { error: bookingsError } = await supabase
                        .from('bookings')
                        .delete()
                        .eq('schedule_id', schedule.id);

                    if (bookingsError) throw bookingsError;

                    // Then delete the schedule
                    const { error: scheduleError } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('id', schedule.id);

                    if (scheduleError) throw scheduleError;

                    toast.success(t('adminBooking.scheduleDeleted'));
                    setSelectedSchedule(null);
                    await loadAllSchedules();
                } catch (err) {
                    console.error('Error deleting schedule:', err);
                    toast.error(t('adminBooking.deleteScheduleFailed') + err.message);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const getPhaseLabel = (phase) => t(`phase.${phase}`);
    const getPhaseDays = (phase) => t(`phase.${phase}Days`);
    const getTimeLabel = (timeSlot) => t(`time.${timeSlot}`);
    const getTimeHours = (timeSlot) => t(`time.${timeSlot}.time`);

    const getAvailableStudents = () => {
        const bookedStudentIds = scheduleStudents.map(b => b.user.id);
        let available = allStudents.filter(s => !bookedStudentIds.includes(s.id));

        // Apply search filter if query exists
        if (studentSearchQuery.trim()) {
            const query = studentSearchQuery.toLowerCase().trim();
            available = available.filter(s =>
                s.full_name?.toLowerCase().includes(query) ||
                s.student_id?.toLowerCase().includes(query) ||
                s.program?.toLowerCase().includes(query) ||
                s.level?.toLowerCase().includes(query)
            );
        }

        return available;
    };

    const getStatusColor = (count) => {
        if (count >= 10) return { bg: 'bg-red-500', text: 'text-white', border: 'border-l-red-500' };
        if (count >= 4) return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-l-emerald-500' };
        return { bg: 'bg-amber-400', text: 'text-amber-900', border: 'border-l-amber-400' };
    };

    // WhatsApp notification functions
    const generateWhatsAppMessage = (type, data) => {
        const header = `📢 *EYSA Language Center*\n_Booking Update - Week ${displayWeek}_\n${'─'.repeat(20)}\n\n`;

        let message = header;

        switch (type) {
            case 'move':
                message += `🔄 *Student Moved*\n\n`;
                message += `👤 *Student:* ${data.studentName}\n`;
                message += `📋 *ID:* ${data.studentId}\n\n`;
                message += `📍 *From:*\n`;
                message += `   • Class: ${data.fromClass}\n`;
                message += `   • ${data.fromPhase} - ${data.fromDay}\n`;
                message += `   • ${data.fromTime}\n\n`;
                message += `📍 *To:*\n`;
                message += `   • Class: ${data.toClass}\n`;
                message += `   • ${data.toPhase} - ${data.toDay}\n`;
                message += `   • ${data.toTime}\n`;
                break;

            case 'remove':
                message += `❌ *Student Removed*\n\n`;
                message += `👤 *Student:* ${data.studentName}\n`;
                message += `📋 *ID:* ${data.studentId}\n\n`;
                message += `📍 *From:*\n`;
                message += `   • Class: ${data.className}\n`;
                message += `   • ${data.phase} - ${data.day}\n`;
                message += `   • ${data.time}\n`;
                break;

            case 'add':
                message += `✅ *Student Added*\n\n`;
                message += `👤 *Student:* ${data.studentName}\n`;
                message += `📋 *ID:* ${data.studentId}\n\n`;
                message += `📍 *To:*\n`;
                message += `   • Class: ${data.className}\n`;
                message += `   • ${data.phase} - ${data.day}\n`;
                message += `   • ${data.time}\n`;
                break;

            case 'teacher':
                message += `👨‍🏫 *Teacher Assigned*\n\n`;
                message += `📍 *Class:* ${data.className}\n`;
                message += `   • ${data.phase} - ${data.day}\n`;
                message += `   • ${data.time}\n\n`;
                message += `👨‍🏫 *Teacher:* ${data.teacherName}\n`;
                break;
        }

        message += `\n${'─'.repeat(20)}\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}`;

        return message;
    };

    const openWhatsApp = (message) => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    const showNotificationModal = (message) => {
        setWhatsAppMessage(message);
        setShowWhatsAppModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Admin Header - Clean Modern Design */}
            <div className="bg-gradient-to-r from-[#F39C32] to-[#e08a1f] rounded-2xl shadow-xl relative overflow-hidden">
                {/* Subtle Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-[#1F4E8C]/10 rounded-full blur-xl"></div>

                <div className="relative z-10 p-4 sm:p-5">
                    {/* Single Row Layout */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Left - Icon & Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/15 rounded-xl">
                                <BookOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{t('header.manageBooking')}</h2>
                                <p className="text-orange-100 text-xs">{t('header.weekLabel')}{displayWeek}</p>
                            </div>
                        </div>

                        {/* Right - Week Toggle & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Week Toggle */}
                            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/20">
                                <button
                                    onClick={() => setSelectedWeekTab('current')}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-full font-medium text-[11px] sm:text-xs transition-all ${selectedWeekTab === 'current'
                                        ? 'bg-white text-[#F39C32] shadow'
                                        : 'text-white/70 hover:text-white'
                                        }`}
                                >
                                    W{currentWeek}
                                </button>
                                <button
                                    onClick={() => setSelectedWeekTab('next')}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-full font-medium text-[11px] sm:text-xs transition-all ${selectedWeekTab === 'next'
                                        ? 'bg-[#1F4E8C] text-white shadow'
                                        : 'text-white/70 hover:text-white'
                                        }`}
                                >
                                    W{nextWeek}
                                </button>
                            </div>

                            {/* Stats Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/20">
                                <span className="text-lg font-bold text-white">{visibleSchedules.length}</span>
                                <span className="text-orange-100 text-[10px]">{hideEmpty ? 'Active' : 'Total'}</span>
                            </div>

                            {/* Hide Empty Toggle */}
                            <button
                                onClick={() => setHideEmpty(!hideEmpty)}
                                className={`px-2.5 py-1.5 rounded-lg font-medium text-[10px] sm:text-xs transition-all border ${hideEmpty
                                    ? 'bg-white/20 border-white/30 text-white'
                                    : 'bg-white/10 border-white/20 text-white/70 hover:text-white'
                                    }`}
                                title={hideEmpty ? 'Show all schedules' : 'Hide empty schedules'}
                            >
                                {hideEmpty ? '👁️ Active' : '👁️‍🗨️ All'}
                            </button>

                            {/* Clean Empty Button - Only show when not hiding empty */}
                            {!hideEmpty && (
                                <button
                                    onClick={handleCleanEmptySchedules}
                                    disabled={loading}
                                    className="px-2.5 sm:px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg font-medium text-[10px] sm:text-xs transition-all flex items-center gap-1 disabled:opacity-50"
                                    title="Delete all empty schedules"
                                >
                                    <Trash2 size={12} />
                                    <span className="hidden sm:inline">Clean</span>
                                </button>
                            )}

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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 border-orange-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg sm:rounded-xl flex-shrink-0">
                            <Calendar size={16} className="sm:w-5 sm:h-5 text-[#F39C32]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{schedules.length}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('stats.totalClasses')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg sm:rounded-xl flex-shrink-0">
                            <Users size={16} className="sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{schedules.reduce((acc, s) => acc + s.current_students, 0)}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('stats.totalStudents')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex-shrink-0">
                            <GraduationCap size={16} className="sm:w-5 sm:h-5 text-[#1F4E8C]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{allTeachers.length}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('stats.totalTeachers')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border-2 border-red-100 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2.5 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg sm:rounded-xl flex-shrink-0">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">!</div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{schedules.filter(s => s.current_students >= 10).length}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{t('stats.fullClasses')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW: Filters and View Mode */}
            {!loading && schedules.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-between">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">View:</span>
                            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 sm:p-1 flex-1 lg:flex-initial">
                                <button
                                    onClick={() => setViewMode('grouped')}
                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-[11px] sm:text-sm transition-all flex-1 lg:flex-initial ${viewMode === 'grouped'
                                        ? 'bg-[#F39C32] text-white shadow'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <span className="hidden sm:inline">📚 Grouped by Class</span>
                                    <span className="sm:hidden">📚 Grouped</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-[11px] sm:text-sm transition-all flex-1 lg:flex-initial ${viewMode === 'list'
                                        ? 'bg-[#F39C32] text-white shadow'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <span className="hidden sm:inline">📋 List by Phase</span>
                                    <span className="sm:hidden">📋 List</span>
                                </button>
                            </div>
                        </div>

                        {/* Day Filter */}
                        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Day:</span>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                {['all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => setFilterDay(day)}
                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium text-[10px] sm:text-xs transition-all ${filterDay === day
                                            ? 'bg-[#1F4E8C] text-white shadow'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day === 'all' ? 'All Days' : day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Info */}
                    {filterDay !== 'all' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Showing schedules for:</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                                    {dayLabels[filterDay] || filterDay}
                                </span>
                                <span className="text-gray-500">({filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''})</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && schedules.length === 0 && (
                <div className="text-center py-16">
                    <Loader2 className="animate-spin mx-auto mb-4 text-[#F39C32]" size={48} />
                    <p className="text-gray-500 font-medium">{t('common.loading')}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && schedules.length === 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar size={40} className="text-[#F39C32]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">{t('adminBooking.noSchedules')}</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">{t('adminBooking.noSchedulesDesc')}</p>
                </div>
            )}

            {/* NEW: Grouped by Class View */}
            {!loading && schedules.length > 0 && viewMode === 'grouped' && (
                <div className="space-y-3 sm:space-y-4">
                    {Object.entries(groupedByClass).map(([className, classSchedules]) => {
                        const badge = getClassBadge(className);
                        const isExpanded = expandedClasses.has(className);
                        const totalStudents = classSchedules.reduce((sum, s) => sum + s.current_students, 0);
                        const maxCapacity = classSchedules.length * 10;

                        return (
                            <div key={className} className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {/* Class Header - Clickable to expand/collapse */}
                                <button
                                    onClick={() => toggleClassExpansion(className)}
                                    className="w-full bg-gradient-to-r from-gray-50 to-slate-50 hover:from-orange-50 hover:to-amber-50 px-3 sm:px-6 py-3 sm:py-4 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                                            {/* Class Badge */}
                                            <div className={`${badge.color} w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-md flex-shrink-0`}>
                                                {badge.emoji}
                                            </div>

                                            {/* Class Info */}
                                            <div className="text-left min-w-0">
                                                <h3 className="text-sm sm:text-xl font-bold text-gray-800 truncate">{className}</h3>
                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <span className="text-[10px] sm:text-sm text-gray-600 truncate">
                                                        📅 {classSchedules.length} schedule{classSchedules.length !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-[10px] sm:text-sm text-gray-400 hidden sm:inline">•</span>
                                                    <span className="text-[10px] sm:text-sm text-gray-600 truncate hidden sm:inline">
                                                        👥 {totalStudents}/{maxCapacity} students
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expand/Collapse Icon */}
                                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                            <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-sm ${totalStudents >= maxCapacity * 0.8
                                                ? 'bg-red-100 text-red-700'
                                                : totalStudents >= maxCapacity * 0.5
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {Math.round((totalStudents / maxCapacity) * 100)}%
                                            </div>
                                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#F39C32] text-white flex items-center justify-center transition-transform text-xs sm:text-base ${isExpanded ? 'rotate-180' : ''
                                                }`}>
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Schedule Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 bg-white">
                                        <div className="p-3 sm:p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                {classSchedules.map((schedule) => {
                                                    const status = getStatusColor(schedule.current_students);
                                                    return (
                                                        <div key={schedule.id} className={`bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg sm:rounded-xl border-2 ${status.border} p-3 sm:p-4 hover:shadow-md transition-all`}>
                                                            {/* Schedule Header */}
                                                            <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-1.5">
                                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                    <div className={`${status.bg} ${status.text} px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold`}>
                                                                        {schedule.current_students}/10
                                                                    </div>
                                                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] sm:text-xs font-semibold truncate">
                                                                        {schedule.program}
                                                                    </span>
                                                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] sm:text-xs font-semibold truncate">
                                                                        {schedule.level}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Schedule Details */}
                                                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                                                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                                                                    <Calendar size={14} className="sm:w-4 sm:h-4 text-[#F39C32] flex-shrink-0" />
                                                                    <span className="font-semibold truncate">{getDayLabel(schedule.day, schedule.phase)}</span>
                                                                    {schedule.day && (
                                                                        <span className="text-gray-400 text-[10px] sm:text-xs truncate">
                                                                            ({formatDateShort(getDateForDay(schedule.day, displayWeek, currentYear))})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                                                                    <Clock size={14} className="sm:w-4 sm:h-4 text-[#F39C32] flex-shrink-0" />
                                                                    <span className="truncate">{getTimeLabel(schedule.time_slot)} • {getTimeHours(schedule.time_slot)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700">
                                                                    <GraduationCap size={14} className="sm:w-4 sm:h-4 text-[#F39C32] flex-shrink-0" />
                                                                    <span className="truncate">{schedule.teacher?.name || t('adminBooking.noTeacherYet')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 text-[10px] sm:text-xs">
                                                                    <span className="px-1.5 sm:px-2 py-0.5 bg-gray-200 rounded truncate">
                                                                        {getPhaseLabel(schedule.phase)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleViewDetails(schedule)}
                                                                    className="flex-1 bg-[#F39C32] hover:bg-[#e08a1f] text-white py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Users size={14} />
                                                                    Manage ({schedule.current_students})
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSchedule(schedule)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all"
                                                                    title="Delete Schedule"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* OLD: Schedule Cards Grouped by Phase (List View) */}
            {!loading && schedules.length > 0 && viewMode === 'list' && hasGroupedSchedules && (
                <div className="space-y-6">
                    {phases.map((phase) => {
                        const phaseSchedules = groupedSchedules[phase];
                        if (!phaseSchedules || phaseSchedules.length === 0) return null;

                        return (
                            <div key={phase} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                {/* Phase Header - Clean Style with Orange Accent */}
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#F39C32] rounded-lg">
                                                <Calendar size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{getPhaseLabel(phase)}</h3>
                                                <p className="text-gray-500 text-xs sm:text-sm">{getPhaseDays(phase)}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#F39C32] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                                            {phaseSchedules.length} {t('header.classCount')}
                                        </div>
                                    </div>
                                </div>

                                {/* Phase Schedule Cards */}
                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {phaseSchedules.map((schedule) => {
                                            const status = getStatusColor(schedule.current_students);
                                            const badge = getClassBadge(schedule.class?.name);
                                            return (
                                                <div key={schedule.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 ${status.border}`}>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-start gap-2">
                                                                <span className={`${badge.color} w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0`}>
                                                                    {badge.emoji}
                                                                </span>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-800">{schedule.class?.name || 'Unknown'}</h4>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{schedule.program} • {schedule.level}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`${status.bg} ${status.text} px-2.5 py-1 rounded-full text-xs font-bold`}>{schedule.current_students}/10</span>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="space-y-2 text-sm mb-4">
                                                            <div className="flex items-start gap-2 text-gray-600">
                                                                <Calendar size={14} className="text-[#F39C32] mt-0.5" />
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
                                                                <Clock size={14} className="text-[#F39C32]" />
                                                                <span>{getTimeLabel(schedule.time_slot)} • {getTimeHours(schedule.time_slot)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <GraduationCap size={14} className="text-[#F39C32]" />
                                                                <span>{schedule.teacher?.name || t('adminBooking.noTeacherYet')}</span>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleViewDetails(schedule)} className="flex-1 bg-[#F39C32] hover:bg-[#e08a1f] text-white py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2">
                                                                <Users size={14} />
                                                                {t('adminBooking.manage')} ({schedule.current_students})
                                                            </button>
                                                            <button onClick={() => handleDeleteSchedule(schedule)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-lg transition-all" title={t('adminBooking.deleteClass')}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedSchedule && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-[#F39C32] via-[#f5a847] to-[#F39C32] text-white p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-start gap-3">
                                    <span className={`${getClassBadge(selectedSchedule.class?.name).color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                                        {getClassBadge(selectedSchedule.class?.name).emoji}
                                    </span>
                                    <div>
                                        <p className="text-orange-100 text-xs font-medium uppercase tracking-wider mb-1">Admin Panel</p>
                                        <h3 className="text-xl font-bold">{selectedSchedule.class?.name}</h3>
                                        <p className="text-orange-100 text-sm mt-1">{selectedSchedule.program} • {selectedSchedule.level}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 mb-5 border border-orange-100">
                                <h4 className="font-bold text-[#F39C32] mb-4 flex items-center gap-2">
                                    <Calendar size={18} />
                                    {t('adminBooking.scheduleInfo')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-xl p-3 border border-orange-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('booking.phase')}</p>
                                        <p className="font-semibold text-gray-800">{getPhaseLabel(selectedSchedule.phase)}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-orange-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('adminBooking.day')}</p>
                                        <p className="font-semibold text-gray-800">
                                            {getDayLabel(selectedSchedule.day, selectedSchedule.phase)}
                                            {selectedSchedule.day && (
                                                <span className="text-gray-400 font-normal ml-1">
                                                    • {formatDateShort(getDateForDay(selectedSchedule.day, displayWeek, currentYear))}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-orange-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('adminBooking.time')}</p>
                                        <p className="font-semibold text-gray-800">{getTimeLabel(selectedSchedule.time_slot)}</p>
                                        <p className="text-xs text-gray-500">{getTimeHours(selectedSchedule.time_slot)}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-orange-100">
                                        <p className="text-xs text-gray-500 mb-1">{t('adminBooking.capacity')}</p>
                                        <p className="font-semibold text-gray-800">{selectedSchedule.current_students}/10 {t('booking.students')}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-orange-100 col-span-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">{t('adminBooking.instructor')}</p>
                                                <p className="font-semibold text-gray-800">{selectedSchedule.teacher?.name || t('adminBooking.noTeacherYet')}</p>
                                            </div>
                                            <button onClick={() => { setSelectedTeacher(selectedSchedule.teacher?.id || ''); setShowTeacherModal(true); }} className="p-2 bg-[#F39C32] hover:bg-[#e08a1f] text-white rounded-lg transition-colors" title={t('adminBooking.changeTeacher')}>
                                                <Edit3 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <button onClick={() => setShowAddModal(true)} disabled={selectedSchedule.current_students >= 10} className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white py-3 rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                                    <UserPlus size={16} />
                                    {t('adminBooking.addStudent')}
                                </button>
                                <button onClick={() => { setSelectedTeacher(selectedSchedule.teacher?.id || ''); setShowTeacherModal(true); }} className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                    <GraduationCap size={16} />
                                    {t('adminBooking.assignTeacher')}
                                </button>
                                <button onClick={() => handleDeleteSchedule(selectedSchedule)} className="bg-gradient-to-r from-red-500 to-red-400 text-white py-3 rounded-xl font-semibold text-sm hover:from-red-600 hover:to-red-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
                                    <Trash2 size={16} />
                                    {t('adminBooking.deleteClass')}
                                </button>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users size={18} className="text-[#F39C32]" />
                                    {t('adminBooking.studentList')} ({scheduleStudents.length})
                                </h4>
                                {scheduleStudents.length === 0 ? (
                                    <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
                                        <Users size={40} className="mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500 text-sm">{t('adminBooking.noStudentsYet')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {scheduleStudents.map((booking, index) => (
                                            <div key={booking.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-slate-50 hover:from-orange-50 hover:to-amber-50 rounded-xl p-4 transition-all group border border-gray-100 hover:border-orange-200">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#F39C32] to-[#f5a847] text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">{index + 1}</div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-800 truncate">{booking.user?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 font-mono truncate">{booking.user?.student_id || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                    <button onClick={() => { setSelectedStudent(booking); setShowMoveModal(true); }} className="p-2.5 bg-[#1F4E8C] hover:bg-[#183d6e] text-white rounded-lg transition-colors" title={t('adminBooking.moveToClass')}>
                                                        <ArrowRight size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteStudent(booking.id, booking.user?.full_name, booking.user?.student_id)} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors" title={t('common.delete')}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-5 border-t">
                            <button onClick={() => setSelectedSchedule(null)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm">{t('common.close')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Modal */}
            {showTeacherModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2"><GraduationCap size={20} />{t('adminBooking.assignTeacher')}</h3>
                                <button onClick={() => { setShowTeacherModal(false); setSelectedTeacher(''); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
                            </div>
                            <p className="text-blue-200 text-sm mt-1">{selectedSchedule?.class?.name}</p>
                        </div>
                        <div className="p-5">
                            <label className="block text-gray-700 font-semibold mb-3 text-sm">{t('adminBooking.selectTeacher')}:</label>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {allTeachers.map((teacher) => (
                                    <button key={teacher.id} onClick={() => setSelectedTeacher(teacher.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedTeacher === teacher.id ? 'border-[#1F4E8C] bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTeacher === teacher.id ? 'bg-[#1F4E8C] text-white' : 'bg-gray-100 text-gray-600'}`}><GraduationCap size={18} /></div>
                                        <div className="flex-1"><p className="font-semibold text-gray-800">{teacher.name}</p></div>
                                        {selectedTeacher === teacher.id && <div className="w-6 h-6 bg-[#1F4E8C] rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex gap-3">
                            <button onClick={handleAssignTeacher} disabled={!selectedTeacher || loading} className="flex-1 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all disabled:opacity-50">{loading ? t('adminBooking.saving') : t('common.save')}</button>
                            <button onClick={() => { setShowTeacherModal(false); setSelectedTeacher(''); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm">{t('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white p-5 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus size={20} />{t('adminBooking.addStudent')}</h3>
                                <button onClick={() => { setShowAddModal(false); setStudentSearchQuery(''); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-gray-100 flex-shrink-0">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={studentSearchQuery}
                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    placeholder="Search by name, ID, program, or level..."
                                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm"
                                />
                                {studentSearchQuery && (
                                    <button
                                        onClick={() => setStudentSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {getAvailableStudents().length} student{getAvailableStudents().length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1">
                            {getAvailableStudents().length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">
                                        {studentSearchQuery ? 'No students match your search' : t('adminBooking.allStudentsRegistered')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {getAvailableStudents().map((student) => (
                                        <button key={student.id} onClick={() => handleAddStudent(student.id)} className="w-full flex items-center justify-between bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-xl p-4 transition-all text-left">
                                            <div>
                                                <p className="font-semibold text-gray-800">{student.full_name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{student.student_id}</p>
                                                <p className="text-xs text-gray-400 mt-1">{student.program} • {student.level}</p>
                                            </div>
                                            <UserPlus className="text-emerald-500" size={18} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex-shrink-0">
                            <button onClick={() => { setShowAddModal(false); setStudentSearchQuery(''); }} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm">{t('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Student Modal */}
            {showMoveModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl">
                        <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2"><ArrowRight size={20} />{t('adminBooking.moveToClass')}</h3>
                                    <p className="text-blue-200 text-sm mt-1">{selectedStudent.user?.full_name}</p>
                                </div>
                                <button onClick={() => { setShowMoveModal(false); setSelectedStudent(null); setTargetSchedule(''); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="p-5">
                            <label className="block text-gray-700 font-semibold mb-3 text-sm">{t('adminBooking.selectTargetClass')}:</label>
                            <select value={targetSchedule} onChange={(e) => setTargetSchedule(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F4E8C] text-sm bg-gray-50">
                                <option value="">-- {t('adminBooking.selectClass')} --</option>
                                {schedules.filter(s => s.id !== selectedSchedule.id && s.current_students < 10).map((schedule) => (
                                    <option key={schedule.id} value={schedule.id}>{schedule.class?.name} - {getPhaseLabel(schedule.phase)} - {getDayLabel(schedule.day, schedule.phase)} - {getTimeLabel(schedule.time_slot)} ({schedule.current_students}/10)</option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex gap-3">
                            <button onClick={handleMoveStudent} disabled={!targetSchedule || loading} className="flex-1 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white py-3 rounded-xl font-semibold text-sm hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all disabled:opacity-50">{t('adminBooking.move')}</button>
                            <button onClick={() => { setShowMoveModal(false); setSelectedStudent(null); setTargetSchedule(''); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm">{t('common.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Notification Modal */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MessageCircle size={20} />
                                    Send WhatsApp Notification
                                </h3>
                                <button onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-green-100 text-sm mt-1">Share this update to your WhatsApp group</p>
                        </div>
                        <div className="p-5">
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{whatsAppMessage}</pre>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                💡 Click the button below to open WhatsApp with this message. Then select your group and send.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex gap-3">
                            <button
                                onClick={() => {
                                    openWhatsApp(whatsAppMessage);
                                    setShowWhatsAppModal(false);
                                }}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} />
                                Open WhatsApp
                            </button>
                            <button
                                onClick={() => setShowWhatsAppModal(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm"
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookingDashboard;
