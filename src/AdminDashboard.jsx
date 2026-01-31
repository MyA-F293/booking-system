import { useState, useEffect } from 'react';
import { UserPlus, Users, LogOut, RefreshCw, Eye, EyeOff, Trash2, Edit2, Plus, X, Check, RotateCcw, GraduationCap, Pencil, BarChart3, CalendarDays, Key, Search, Copy, CheckCircle, ClipboardList, Upload } from 'lucide-react';
import { logout, getAllStudents, createStudentAccount, generateStudentId, updateStudent, deleteStudent, restoreStudent, permanentDeleteStudent, adminResetPassword, getUserPassword } from './utils/authHelpers';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, restoreTeacher, permanentDeleteTeacher, getCurrentWeek } from './utils/dbHelpers';
import AdminBookingDashboard from './components/AdminBookingDashboard';
import AdminStatsDashboard from './components/AdminStatsDashboard';
import AttendanceReport from './components/AttendanceReport';
import BulkOperations from './components/BulkOperations';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { useToast } from './components/Toast';

const AdminDashboard = ({ user }) => {
    const { t } = useLanguage();
    const { settings, updateSettings } = useSettings();
    const toast = useToast();

    // Settings edit state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editBatch, setEditBatch] = useState(1);

    // Students state
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [editStudentData, setEditStudentData] = useState({
        full_name: '',
        program: '',
        level: '',
        batch_number: 1
    });

    // Search state for students
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    // Password view/reset state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedStudentForPassword, setSelectedStudentForPassword] = useState(null);
    const [studentPassword, setStudentPassword] = useState('');
    const [newPasswordForReset, setNewPasswordForReset] = useState('');
    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Teachers state
    const [teachers, setTeachers] = useState([]);
    const [teacherLoading, setTeacherLoading] = useState(false);
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [teacherFormData, setTeacherFormData] = useState({
        name: ''
    });

    // Teacher ID modal state
    const [showTeacherIdModal, setShowTeacherIdModal] = useState(false);
    const [selectedTeacherForId, setSelectedTeacherForId] = useState(null);
    const [teacherIdCopied, setTeacherIdCopied] = useState(false);

    // Form state for students
    const [formData, setFormData] = useState({
        full_name: '',
        batch_number: 1,
        program: 'Campus & Career',
        level: 'Starter',
        password: 'student123'
    });
    const [generatedId, setGeneratedId] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Refresh cooldowns (3 seconds) - will be initialized after functions are defined
    const [studentsOnCooldown, setStudentsOnCooldown] = useState(false);
    const [studentsRemainingTime, setStudentsRemainingTime] = useState(0);
    const [teachersOnCooldown, setTeachersOnCooldown] = useState(false);
    const [teachersRemainingTime, setTeachersRemainingTime] = useState(0);

    const programs = ['Campus & Career', 'English for Teens'];
    const levels = ['Starter', 'Upper Starter', 'Pre-Intermediate', 'Intermediate'];

    const [activeTab, setActiveTab] = useState('stats');
    const [showBulkOperations, setShowBulkOperations] = useState(false);

    // Filter students based on search query
    const getFilteredStudents = () => {
        if (!studentSearchQuery.trim()) {
            return students;
        }

        const query = studentSearchQuery.toLowerCase().trim();
        return students.filter(student =>
            student.full_name?.toLowerCase().includes(query) ||
            student.student_id?.toLowerCase().includes(query) ||
            student.program?.toLowerCase().includes(query) ||
            student.level?.toLowerCase().includes(query) ||
            student.batch?.toString().includes(query)
        );
    };

    // ========== STUDENT FUNCTIONS ==========
    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await getAllStudents();
            setStudents(data);
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error(t('admin.loadStudentsFailed'));
        } finally {
            setLoading(false);
        }
    };

    // ========== TEACHER FUNCTIONS ==========
    const loadTeachers = async () => {
        try {
            setTeacherLoading(true);
            const data = await getAllTeachers();
            setTeachers(data);
        } catch (err) {
            console.error('Error loading teachers:', err);
            toast.error('Failed to load teachers');
        } finally {
            setTeacherLoading(false);
        }
    };

    // Refresh with cooldown handlers
    const refreshStudentsWithCooldown = async () => {
        if (studentsOnCooldown) return;
        setStudentsOnCooldown(true);
        setStudentsRemainingTime(3);
        await loadStudents();

        const interval = setInterval(() => {
            setStudentsRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setStudentsOnCooldown(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const refreshTeachersWithCooldown = async () => {
        if (teachersOnCooldown) return;
        setTeachersOnCooldown(true);
        setTeachersRemainingTime(3);
        await loadTeachers();

        const interval = setInterval(() => {
            setTeachersRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTeachersOnCooldown(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        loadStudents();
        loadTeachers();
    }, []);

    const handleGenerateId = async () => {
        try {
            const id = await generateStudentId(formData.batch_number);
            setGeneratedId(id);
        } catch (err) {
            console.error('Error generating ID:', err);
            toast.error(t('admin.generateIdFailed'));
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();

        if (!generatedId) {
            toast.warning(t('admin.pleaseGenerateId') || 'Please generate Student ID first');
            return;
        }

        try {
            setLoading(true);

            const studentData = {
                student_id: generatedId,
                full_name: formData.full_name,
                batch: `Batch ${formData.batch_number}`,
                program: formData.program,
                level: formData.level,
                password: formData.password
            };

            await createStudentAccount(studentData);

            toast.success(`${t('admin.studentCreated')} - ID: ${generatedId}`);

            // Reset form
            setFormData({
                full_name: '',
                batch_number: 1,
                program: 'Campus & Career',
                level: 'Starter',
                password: 'student123'
            });
            setGeneratedId('');
            setShowCreateForm(false);

            await loadStudents();
        } catch (err) {
            console.error('Error creating student:', err);
            toast.error(t('admin.createStudentFailed') + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        try {
            setTeacherLoading(true);
            await createTeacher({
                ...teacherFormData,
                is_active: true
            });
            toast.success(t('admin.teacherCreated'));
            resetTeacherForm();
            await loadTeachers();
        } catch (err) {
            console.error('Error creating teacher:', err);
            toast.error(t('admin.createTeacherFailed') + err.message);
        } finally {
            setTeacherLoading(false);
        }
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        try {
            setTeacherLoading(true);
            await updateTeacher(editingTeacher.id, teacherFormData);
            toast.success(t('admin.teacherUpdated'));
            resetTeacherForm();
            await loadTeachers();
        } catch (err) {
            console.error('Error updating teacher:', err);
            toast.error(t('admin.updateTeacherFailed') + err.message);
        } finally {
            setTeacherLoading(false);
        }
    };

    const handleDeleteTeacher = async (teacher) => {
        toast.confirm(
            `${t('admin.confirmDeleteTeacher')} "${teacher.name}"?`,
            async () => {
                try {
                    setTeacherLoading(true);
                    await deleteTeacher(teacher.id);
                    toast.success(t('admin.teacherDeleted'));
                    await loadTeachers();
                } catch (err) {
                    console.error('Error deleting teacher:', err);
                    toast.error(t('admin.deleteTeacherFailed') + err.message);
                } finally {
                    setTeacherLoading(false);
                }
            }
        );
    };

    const handleRestoreTeacher = async (teacher) => {
        try {
            setTeacherLoading(true);
            await restoreTeacher(teacher.id);
            toast.success(t('admin.teacherRestored'));
            await loadTeachers();
        } catch (err) {
            console.error('Error restoring teacher:', err);
            toast.error(t('admin.restoreTeacherFailed') + err.message);
        } finally {
            setTeacherLoading(false);
        }
    };

    const handlePermanentDeleteTeacher = async (teacher) => {
        toast.confirm(
            `Permanently delete "${teacher.name}"? This cannot be undone!`,
            async () => {
                try {
                    setTeacherLoading(true);
                    await permanentDeleteTeacher(teacher.id);
                    toast.success('Teacher permanently deleted');
                    await loadTeachers();
                } catch (err) {
                    console.error('Error permanently deleting teacher:', err);
                    toast.error('Failed to delete: ' + err.message);
                } finally {
                    setTeacherLoading(false);
                }
            }
        );
    };

    const startEditTeacher = (teacher) => {
        setEditingTeacher(teacher);
        setTeacherFormData({
            name: teacher.name
        });
        setShowTeacherForm(true);
    };

    const resetTeacherForm = () => {
        setShowTeacherForm(false);
        setEditingTeacher(null);
        setTeacherFormData({ name: '' });
    };

    // Teacher ID functions
    const handleShowTeacherId = (teacher) => {
        setSelectedTeacherForId(teacher);
        setShowTeacherIdModal(true);
        setTeacherIdCopied(false);
    };

    const handleCopyTeacherId = async (teacherId) => {
        try {
            await navigator.clipboard.writeText(teacherId);
            setTeacherIdCopied(true);
            toast.success('Teacher ID copied to clipboard!');
            setTimeout(() => setTeacherIdCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy Teacher ID');
        }
    };

    const closeTeacherIdModal = () => {
        setShowTeacherIdModal(false);
        setSelectedTeacherForId(null);
        setTeacherIdCopied(false);
    };

    // ========== STUDENT EDIT/DELETE FUNCTIONS ==========
    const startEditStudent = (student) => {
        setEditingStudent(student);
        // Extract batch number from "Batch X" format
        const batchNum = parseInt(student.batch?.replace(/\D/g, '')) || 1;
        setEditStudentData({
            full_name: student.full_name,
            program: student.program,
            level: student.level,
            batch_number: batchNum
        });
        setShowEditStudentModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const updateData = {
                full_name: editStudentData.full_name,
                program: editStudentData.program,
                level: editStudentData.level,
                batch: `Batch ${editStudentData.batch_number}`
            };
            await updateStudent(editingStudent.id, updateData);
            toast.success('Student data updated successfully!');
            setShowEditStudentModal(false);
            setEditingStudent(null);
            await loadStudents();
        } catch (err) {
            console.error('Error updating student:', err);
            toast.error('Failed to update student: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (student) => {
        toast.confirm(
            `Are you sure you want to deactivate student "${student.full_name}"?`,
            async () => {
                try {
                    setLoading(true);
                    await deleteStudent(student.id);
                    toast.success('Student deactivated successfully!');
                    await loadStudents();
                } catch (err) {
                    console.error('Error deleting student:', err);
                    toast.error('Failed to deactivate student: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const handleRestoreStudent = async (student) => {
        try {
            setLoading(true);
            await restoreStudent(student.id);
            toast.success('Student restored successfully!');
            await loadStudents();
        } catch (err) {
            console.error('Error restoring student:', err);
            toast.error('Failed to restore student: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePermanentDeleteStudent = async (student) => {
        toast.confirm(
            `Permanently delete "${student.full_name}"? This cannot be undone!`,
            async () => {
                try {
                    setLoading(true);
                    await permanentDeleteStudent(student.id);
                    toast.success('Student permanently deleted');
                    await loadStudents();
                } catch (err) {
                    console.error('Error permanently deleting student:', err);
                    toast.error('Failed to delete: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // ========== PASSWORD FUNCTIONS ==========
    const handleViewPassword = async (student) => {
        try {
            setPasswordLoading(true);
            setSelectedStudentForPassword(student);
            const data = await getUserPassword(student.id);
            setStudentPassword(data.password);
            setNewPasswordForReset('');
            setShowStudentPassword(false);
            setShowPasswordModal(true);
        } catch (err) {
            console.error('Error getting password:', err);
            toast.error(t('password.viewFailed') + err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPasswordForReset || newPasswordForReset.length < 6) {
            toast.error(t('password.tooShort') || 'Password must be at least 6 characters!');
            return;
        }

        try {
            setPasswordLoading(true);
            await adminResetPassword(selectedStudentForPassword.id, newPasswordForReset);
            toast.success(t('password.resetSuccess'));
            setStudentPassword(newPasswordForReset);
            setNewPasswordForReset('');
            await loadStudents();
        } catch (err) {
            console.error('Error resetting password:', err);
            toast.error(t('password.resetFailed') + err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden">
            {/* Background Decorations - Admin Theme */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>

            {/* Header - Same as Student but with Admin Badge */}
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
                            <div className="min-w-0 relative">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-[11px] sm:text-base lg:text-xl font-bold text-[#1F4E8C] leading-tight">
                                        {t('login.title')}
                                    </h1>
                                    {/* Admin Badge - Ribbon Style */}
                                    <div className="relative">
                                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[6px] sm:text-[10px] font-bold px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-sm transform -rotate-12 shadow-md inline-block uppercase tracking-wider">
                                            Admin
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <p className="text-[8px] sm:text-[10px] lg:text-xs text-gray-500">
                                        Batch {settings.batch} | {t('common.week')} {getCurrentWeek()}
                                    </p>
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
                                </div>
                            </div>
                        </div>

                        {/* Right: User Info & Logout */}
                        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-semibold text-gray-800 truncate max-w-[120px] lg:max-w-none">
                                    {user.full_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {user.student_id}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowBulkOperations(true)}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all font-semibold text-[10px] sm:text-sm shadow-md hover:shadow-lg"
                                    title="Bulk Operations"
                                >
                                    <Upload size={12} className="sm:w-4 sm:h-4" />
                                    <span className="hidden lg:inline">Bulk Ops</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all font-semibold text-[10px] sm:text-sm shadow-md hover:shadow-lg"
                                >
                                    <LogOut size={12} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t('common.logout')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
                {/* Tab Navigation - Modern Style */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {[
                            { id: 'stats', icon: BarChart3, label: 'Dashboard', shortLabel: 'Stats' },
                            { id: 'students', icon: Users, label: t('admin.manageStudents'), shortLabel: 'Students' },
                            { id: 'teachers', icon: GraduationCap, label: t('admin.manageTeachers'), shortLabel: 'Teachers' },
                            { id: 'bookings', icon: CalendarDays, label: t('admin.manageBookings'), shortLabel: 'Booking' },
                            { id: 'attendance', icon: ClipboardList, label: 'Attendance Report', shortLabel: 'Attendance' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 relative py-2.5 sm:py-3 lg:py-4 px-1 sm:px-3 lg:px-6 font-poppins transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 group ${activeTab === tab.id
                                    ? 'text-[#F39C32]'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon size={16} className={`sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-[#F39C32]' : ''}`} />
                                <span className="hidden sm:inline font-semibold text-xs lg:text-sm">{tab.shortLabel}</span>

                                {/* Active indicator */}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 lg:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-[#F39C32] to-[#f5a847] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ========== STUDENTS TAB ========== */}
                {activeTab === 'students' && (
                    <>
                        {/* Actions Bar */}
                        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-4 mb-4">
                                <div>
                                    <h2 className="text-base sm:text-2xl font-bold text-gray-800 font-montserrat">{t('admin.studentManagement')}</h2>
                                    <p className="text-gray-600 mt-0.5 sm:mt-1 font-poppins text-xs sm:text-base">
                                        {t('admin.totalStudents')}: {students.length}
                                        {studentSearchQuery && ` • Showing: ${getFilteredStudents().length}`}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 sm:gap-3">
                                    <button
                                        onClick={refreshStudentsWithCooldown}
                                        disabled={loading || studentsOnCooldown}
                                        className="bg-blue-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-semibold disabled:opacity-50 text-xs sm:text-base relative"
                                        title={studentsOnCooldown ? `Wait ${studentsRemainingTime}s` : 'Refresh'}
                                    >
                                        <RefreshCw size={14} className={`sm:w-[18px] sm:h-[18px] ${loading ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                                        {studentsOnCooldown && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                                                {studentsRemainingTime}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowCreateForm(!showCreateForm)}
                                        className="bg-green-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-base"
                                    >
                                        <UserPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden sm:inline">{t('admin.createStudent')}</span>
                                        <span className="sm:hidden">{t('common.add')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={studentSearchQuery}
                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    placeholder="Search by name, ID, program, level, or batch..."
                                    className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                />
                                {studentSearchQuery && (
                                    <button
                                        onClick={() => setStudentSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Create Student Form */}
                        {showCreateForm && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 font-montserrat">
                                    📝 {t('admin.createStudent')}
                                </h3>
                                <form onSubmit={handleCreateStudent} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.fullName')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                placeholder={t('admin.fullNamePlaceholder') || 'Enter full name'}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.batchNumber')} *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={formData.batch_number}
                                                onChange={(e) => setFormData({ ...formData, batch_number: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.program')} *
                                            </label>
                                            <select
                                                value={formData.program}
                                                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins"
                                            >
                                                {programs.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.level')} *
                                            </label>
                                            <select
                                                value={formData.level}
                                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins"
                                            >
                                                {levels.map(l => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.password')} *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins pr-10"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                Student ID
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={generatedId}
                                                    readOnly
                                                    placeholder={t('admin.clickGenerateId') || 'Klik Generate ID'}
                                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono font-bold text-blue-900"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateId}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-semibold text-sm sm:text-base"
                                                >
                                                    {t('admin.generateId')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading || !generatedId}
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                        >
                                            {loading ? t('common.loading') : `✅ ${t('admin.createStudentButton')}`}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setGeneratedId('');
                                            }}
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Students Table */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                Student ID
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.fullName')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat hidden md:table-cell">
                                                {t('admin.batch')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat hidden lg:table-cell">
                                                {t('admin.program')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat hidden lg:table-cell">
                                                {t('admin.level')}
                                            </th>
                                            <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.status')}
                                            </th>
                                            <th className="px-2 sm:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.actions') || 'Aksi'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center">
                                                    <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                                                    <p className="text-gray-500">{t('common.loading')}</p>
                                                </td>
                                            </tr>
                                        ) : students.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center">
                                                    <Users size={48} className="mx-auto mb-2 text-gray-300" />
                                                    <p className="text-gray-500 font-semibold">{t('admin.noStudents')}</p>
                                                    <p className="text-sm text-gray-400">{t('admin.noStudentsDesc')}</p>
                                                </td>
                                            </tr>
                                        ) : getFilteredStudents().length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center">
                                                    <Search size={48} className="mx-auto mb-2 text-gray-300" />
                                                    <p className="text-gray-500 font-semibold">No students match your search</p>
                                                    <p className="text-sm text-gray-400">Try different keywords</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            getFilteredStudents().map((student) => (
                                                <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${!student.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 font-mono font-bold text-blue-900 text-[10px] sm:text-sm">
                                                        {student.student_id}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-800 font-poppins text-xs sm:text-sm">
                                                        {student.full_name}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 font-poppins hidden md:table-cell text-sm">
                                                        {student.batch}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 font-poppins hidden lg:table-cell text-sm">
                                                        {student.program}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 font-poppins hidden lg:table-cell text-sm">
                                                        {student.level}
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-2 sm:py-4">
                                                        <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold ${student.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            <span className="hidden sm:inline">{student.is_active ? `✓ ${t('admin.active')}` : `✗ ${t('admin.inactive')}`}</span>
                                                            <span className="sm:hidden">{student.is_active ? '✓' : '✗'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-2 sm:py-4">
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            {student.is_active ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEditStudent(student)}
                                                                        className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                                        title={t('common.edit')}
                                                                    >
                                                                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleViewPassword(student)}
                                                                        className="p-1.5 sm:p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                                                                        title={t('password.viewReset') || 'Lihat/Reset Password'}
                                                                    >
                                                                        <Key size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteStudent(student)}
                                                                        className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleRestoreStudent(student)}
                                                                        className="p-1.5 sm:p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                                        title={t('admin.restore') || 'Restore'}
                                                                    >
                                                                        <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePermanentDeleteStudent(student)}
                                                                        className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Edit Student Modal */}
                        {showEditStudentModal && editingStudent && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Edit2 size={20} />
                                                Edit Student
                                            </h3>
                                            <button onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <p className="text-blue-200 text-sm mt-1">{editingStudent.student_id}</p>
                                    </div>

                                    <form onSubmit={handleUpdateStudent} className="p-5 space-y-4">
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                {t('admin.fullName')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={editStudentData.full_name}
                                                onChange={(e) => setEditStudentData({ ...editStudentData, full_name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                {t('admin.batchNumber')} *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={editStudentData.batch_number}
                                                onChange={(e) => setEditStudentData({ ...editStudentData, batch_number: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                {t('admin.program')} *
                                            </label>
                                            <select
                                                value={editStudentData.program}
                                                onChange={(e) => setEditStudentData({ ...editStudentData, program: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                            >
                                                {programs.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                                {t('admin.level')} *
                                            </label>
                                            <select
                                                value={editStudentData.level}
                                                onChange={(e) => setEditStudentData({ ...editStudentData, level: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                                            >
                                                {levels.map(l => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Password View/Reset Modal */}
                {showPasswordModal && selectedStudentForPassword && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white p-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Key size={20} />
                                        {t('password.viewReset') || 'Lihat/Reset Password'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setSelectedStudentForPassword(null);
                                            setStudentPassword('');
                                            setNewPasswordForReset('');
                                        }}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <p className="text-amber-100 text-sm mt-1">
                                    {selectedStudentForPassword.full_name} ({selectedStudentForPassword.student_id})
                                </p>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        {t('password.currentPassword') || 'Password Saat Ini'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showStudentPassword ? 'text' : 'password'}
                                            value={studentPassword}
                                            readOnly
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 font-mono text-sm pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Reset Password Section */}
                                <div className="border-t pt-4">
                                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                                        {t('password.resetNew') || 'Reset ke Password Baru'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newPasswordForReset}
                                            onChange={(e) => setNewPasswordForReset(e.target.value)}
                                            placeholder={t('password.newPlaceholder') || 'Enter new password (min. 6 characters)'}
                                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                                        />
                                        <button
                                            onClick={handleResetPassword}
                                            disabled={passwordLoading || !newPasswordForReset || newPasswordForReset.length < 6}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {passwordLoading ? '...' : (t('password.reset') || 'Reset')}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('password.resetHint') || 'Password will change immediately after reset'}
                                    </p>
                                </div>

                                {/* Quick Reset to Default */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-sm text-blue-700 mb-2">
                                        {t('password.quickReset') || 'Reset cepat ke password default:'}
                                    </p>
                                    <button
                                        onClick={() => setNewPasswordForReset('student123')}
                                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-mono transition-colors"
                                    >
                                        student123
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 border-t">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setSelectedStudentForPassword(null);
                                        setStudentPassword('');
                                        setNewPasswordForReset('');
                                    }}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold transition-colors text-sm"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== TEACHERS TAB ========== */}
                {activeTab === 'teachers' && (
                    <>
                        {/* Actions Bar */}
                        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-4">
                                <div>
                                    <h2 className="text-base sm:text-2xl font-bold text-gray-800 font-montserrat">{t('admin.teacherManagement')}</h2>
                                    <p className="text-gray-600 mt-0.5 sm:mt-1 font-poppins text-xs sm:text-base">{t('admin.totalTeachers')}: {teachers.filter(t => t.is_active).length} {t('admin.active').toLowerCase()}</p>
                                </div>
                                <div className="flex gap-1.5 sm:gap-3">
                                    <button
                                        onClick={refreshTeachersWithCooldown}
                                        disabled={teacherLoading || teachersOnCooldown}
                                        className="bg-blue-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-semibold disabled:opacity-50 text-xs sm:text-base relative"
                                        title={teachersOnCooldown ? `Wait ${teachersRemainingTime}s` : 'Refresh'}
                                    >
                                        <RefreshCw size={14} className={`sm:w-[18px] sm:h-[18px] ${teacherLoading ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                                        {teachersOnCooldown && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                                                {teachersRemainingTime}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            resetTeacherForm();
                                            setShowTeacherForm(true);
                                        }}
                                        className="bg-green-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-base"
                                    >
                                        <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden sm:inline">{t('admin.addTeacher')}</span>
                                        <span className="sm:hidden">{t('common.add')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Create/Edit Teacher Form */}
                        {showTeacherForm && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 font-montserrat">
                                    {editingTeacher
                                        ? `✏️ ${t('admin.editTeacher')}`
                                        : `📝 ${t('admin.addTeacher')}`}
                                </h3>
                                <form onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-gray-700 font-semibold mb-2 font-poppins">
                                                {t('admin.teacherName')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={teacherFormData.name}
                                                onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                                                placeholder={t('admin.teacherNamePlaceholder')}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 font-poppins"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={teacherLoading || !teacherFormData.name}
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <Check size={18} />
                                            {teacherLoading
                                                ? t('common.loading')
                                                : editingTeacher
                                                    ? t('common.save')
                                                    : t('common.add')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetTeacherForm}
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold flex items-center gap-2"
                                        >
                                            <X size={18} />
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Teachers Table */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.teacherName')}
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat hidden md:table-cell">
                                                Email
                                            </th>
                                            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat hidden md:table-cell">
                                                {t('admin.phone') || 'No. Telepon'}
                                            </th>
                                            <th className="px-2 sm:px-6 py-2 sm:py-4 text-left text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.status')}
                                            </th>
                                            <th className="px-2 sm:px-6 py-2 sm:py-4 text-center text-[10px] sm:text-sm font-bold text-gray-700 uppercase font-montserrat">
                                                {t('admin.actions') || 'Aksi'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {teacherLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                                                    <p className="text-gray-500">{t('common.loading')}</p>
                                                </td>
                                            </tr>
                                        ) : teachers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <GraduationCap size={48} className="mx-auto mb-2 text-gray-300" />
                                                    <p className="text-gray-500 font-semibold">{t('admin.noTeachers')}</p>
                                                    <p className="text-sm text-gray-400">{t('admin.noTeachersDesc')}</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            teachers.map((teacher) => (
                                                <tr key={teacher.id} className={`hover:bg-gray-50 transition-colors ${!teacher.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold text-gray-800 font-poppins text-xs sm:text-sm">
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <GraduationCap size={14} className="sm:w-[18px] sm:h-[18px] text-orange-500" />
                                                            <div className="flex-1">
                                                                <div>{teacher.name}</div>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[9px] text-gray-500 font-mono">
                                                                        ID: {teacher.teacher_id || teacher.id.substring(0, 8) + '...'}
                                                                    </span>
                                                                    {!teacher.teacher_id && (
                                                                        <button
                                                                            onClick={() => handleShowTeacherId(teacher)}
                                                                            className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold underline"
                                                                            title="View Full ID"
                                                                        >
                                                                            View ID
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 font-poppins hidden md:table-cell text-sm">
                                                        {teacher.email || '-'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-gray-600 font-poppins hidden md:table-cell text-sm">
                                                        {teacher.phone || '-'}
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-2 sm:py-4">
                                                        <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold ${teacher.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            <span className="hidden sm:inline">{teacher.is_active ? `✓ ${t('admin.active')}` : `✗ ${t('admin.inactive')}`}</span>
                                                            <span className="sm:hidden">{teacher.is_active ? '✓' : '✗'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-2 sm:px-6 py-2 sm:py-4">
                                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                            {teacher.is_active ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEditTeacher(teacher)}
                                                                        className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                                        title={t('common.edit')}
                                                                    >
                                                                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTeacher(teacher)}
                                                                        className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleRestoreTeacher(teacher)}
                                                                        className="p-1.5 sm:p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                                        title={t('admin.restore') || 'Restore'}
                                                                    >
                                                                        <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handlePermanentDeleteTeacher(teacher)}
                                                                        className="p-1.5 sm:p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ========== BOOKINGS TAB ========== */}
                {activeTab === 'bookings' && (
                    <AdminBookingDashboard />
                )}

                {/* ========== STATS TAB ========== */}
                {activeTab === 'stats' && (
                    <AdminStatsDashboard />
                )}

                {/* ========== ATTENDANCE TAB ========== */}
                {activeTab === 'attendance' && (
                    <AttendanceReport />
                )}

                {/* Info Box - Modern Design */}
                <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-3 flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                        </div>
                        <h4 className="font-bold text-white text-sm">{t('admin.notes')}</h4>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                        {/* Student ID Format */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-slate-600 font-bold text-xs">#</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">{t('admin.studentIdFormat')}</p>
                                <code className="inline-block bg-slate-700 text-white px-3 py-1.5 rounded-lg font-mono text-sm font-semibold">EYSA-YY-BA-SEQ</code>
                            </div>
                        </div>

                        {/* Format Details */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-10 font-mono font-bold text-slate-700">YY</span>
                                <span className="text-gray-400">=</span>
                                <span className="text-gray-600">2 digit {t('common.year').toLowerCase()} <span className="text-gray-400">(e.g. 26 for 2026)</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-10 font-mono font-bold text-slate-700">BA</span>
                                <span className="text-gray-400">=</span>
                                <span className="text-gray-600">Batch number <span className="text-gray-400">(01, 02, 03...)</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-10 font-mono font-bold text-slate-700">SEQ</span>
                                <span className="text-gray-400">=</span>
                                <span className="text-gray-600">Auto sequence <span className="text-gray-400">(0001, 0002...)</span></span>
                            </div>
                        </div>

                        {/* Default Password */}
                        <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-emerald-700">{t('admin.defaultPassword')}</p>
                                <code className="font-mono font-bold text-emerald-800">student123</code>
                            </div>
                        </div>

                        {/* Reminder */}
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            {t('admin.provideCredentials')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Edit Modal */}
            {showSettingsModal && (
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

            {/* Teacher ID Modal */}
            {showTeacherIdModal && selectedTeacherForId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <GraduationCap className="text-orange-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Teacher Login ID</h3>
                                    <p className="text-sm text-gray-500">{selectedTeacherForId.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeTeacherIdModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Teacher ID Display */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Teacher ID
                                </label>
                                <div className="relative">
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 font-mono text-sm text-gray-800 text-center font-bold">
                                        {selectedTeacherForId.teacher_id || selectedTeacherForId.id}
                                    </div>
                                    <button
                                        onClick={() => handleCopyTeacherId(selectedTeacherForId.teacher_id || selectedTeacherForId.id)}
                                        className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${teacherIdCopied
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-white hover:bg-gray-100 text-gray-600'
                                            }`}
                                        title="Copy to clipboard"
                                    >
                                        {teacherIdCopied ? (
                                            <CheckCircle size={18} />
                                        ) : (
                                            <Copy size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Default Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Default Password
                                </label>
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm text-blue-800 font-semibold">
                                            teacher123
                                        </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText('teacher123');
                                                toast.success('Password copied!');
                                            }}
                                            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                            title="Copy password"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <h4 className="font-semibold text-orange-800 text-sm mb-2 flex items-center gap-2">
                                    <Key size={16} />
                                    Login Instructions
                                </h4>
                                <ol className="text-xs text-orange-700 space-y-1 ml-5 list-decimal">
                                    <li>Share the Teacher ID with the teacher</li>
                                    <li>Share the default password: <code className="bg-orange-100 px-1 py-0.5 rounded">teacher123</code></li>
                                    <li>Teacher logs in by entering their ID</li>
                                    <li>After first login, teacher won't need to login again (auto-remember)</li>
                                </ol>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleCopyTeacherId(selectedTeacherForId.teacher_id || selectedTeacherForId.id)}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {teacherIdCopied ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={18} />
                                            Copy Teacher ID
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={closeTeacherIdModal}
                                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Operations Modal */}
            {showBulkOperations && (
                <BulkOperations onClose={() => setShowBulkOperations(false)} />
            )}
        </div>
    );
};

export default AdminDashboard;
