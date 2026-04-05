import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Users, LogOut, RefreshCw, Eye, EyeOff, Trash2, Edit2, Plus, X, Check, RotateCcw, GraduationCap, Pencil, BarChart3, CalendarDays, Calendar, Key, Search, Copy, CheckCircle, ClipboardList, Upload, UserCheck, BookOpen, Cloud, FileText, ChevronRight } from 'lucide-react';
import { logout, getAllStudents, createStudentAccount, generateStudentId, getLatestBatch, updateStudent, deleteStudent, restoreStudent, permanentDeleteStudent, adminResetPassword, getUserPassword } from './utils/authHelpers';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, restoreTeacher, permanentDeleteTeacher } from './utils/dbHelpers';
import { supabase } from './supabaseClient';
import useModalScrollLock from './hooks/useModalScrollLock';
import AdminBookingDashboard from './components/AdminBookingDashboard';
import AdminStatsDashboard from './components/AdminStatsDashboard';
import AttendanceReport from './components/AttendanceReport';
import AttendanceReportExcel from './components/AttendanceReportExcel';
import AdminAttendanceManager from './components/AdminAttendanceManager';
import AdminGuide from './components/AdminGuide';
import BulkOperations from './components/BulkOperations';
import BackupButton from './components/BackupButton';
import FullBackupButton from './components/FullBackupButton';
import { useLanguage } from './contexts/LanguageContext';
import { useSettings } from './contexts/SettingsContext';
import { useWeek } from './contexts/WeekContext';
import { useToast } from './components/Toast';
import jsPDF from 'jspdf';

const AdminDashboard = ({ user }) => {
    const { t } = useLanguage();
    const { settings, updateSettings } = useSettings();
    const { currentWeek, incrementWeek, refreshWeek } = useWeek();
    const toast = useToast();

    // Settings edit state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editBatch, setEditBatch] = useState(1);

    // Students state
    const [students, setStudents] = useState([]);
    const [schedules, setSchedules] = useState([]);
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
        program: 'English Campus & Career',
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

    const programs = ['English Campus & Career', 'English for Teens'];
    const levels = ['Starter', 'Upper Starter', 'Pre-Intermediate', 'Intermediate'];

    const [activeTab, setActiveTab] = useState('stats');
    const [showBulkOperations, setShowBulkOperations] = useState(false);
    const [showAdminGuide, setShowAdminGuide] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Reset Batch state
    const [showResetBatchModal, setShowResetBatchModal] = useState(false);
    const [resetBatchNumber, setResetBatchNumber] = useState('1');
    const [resetBatchLoading, setResetBatchLoading] = useState(false);

    // Lock body scroll when any modal is open
    useModalScrollLock(
        showEditStudentModal ||
        showPasswordModal ||
        showTeacherIdModal ||
        showSettingsModal ||
        showBulkOperations ||
        showAdminGuide ||
        showResetBatchModal
    );

    // Check if admin has seen the guide
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem(`eysa_admin_guide_seen_${user.id}`);
        if (!hasSeenGuide) {
            // Show guide on first visit
            setShowAdminGuide(true);
        }
    }, [user.id]);

    // Filter students based on search query
    const getFilteredStudents = () => {
        if (!studentSearchQuery.trim()) {
            return students;
        }

        const query = studentSearchQuery.toLowerCase().trim();
        return students.filter(student => {
            // Convert batch to string safely (handle null/undefined)
            const batchStr = student.batch ? student.batch.toString() : '';

            return (
                student.full_name?.toLowerCase().includes(query) ||
                student.student_id?.toLowerCase().includes(query) ||
                student.program?.toLowerCase().includes(query) ||
                student.level?.toLowerCase().includes(query) ||
                batchStr.includes(query)  // Search batch as plain string (works for "1", "2", "3")
            );
        });
    };

    // ========== STUDENT FUNCTIONS ==========
    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await getAllStudents();
            setStudents(data);
            await loadSchedules(); // Load schedules for stats
        } catch (err) {
            console.error('Error loading students:', err);
            toast.error(t('admin.loadStudentsFailed'));
        } finally {
            setLoading(false);
        }
    };

    const loadSchedules = async () => {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*, class:classes(*)')
                .order('week_number', { ascending: false });

            if (!error) setSchedules(data || []);
        } catch (err) {
            console.error('Error loading schedules:', err);
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
                batch: formData.batch_number.toString(),
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
                program: 'English Campus & Career',
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
                batch: editStudentData.batch_number.toString()
            };

            console.log('📝 Updating student with data:', updateData);
            const updatedStudent = await updateStudent(editingStudent.id, updateData);
            console.log('✅ Student updated:', updatedStudent);

            toast.success('Student data updated successfully!');
            setShowEditStudentModal(false);
            setEditingStudent(null);

            // Force reload students to ensure fresh data
            await loadStudents();

            // Force re-render by updating a dummy state
            setStudentSearchQuery(prev => prev);
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

    const handleResetBatch = async () => {
        if (!resetBatchNumber) {
            toast.error('Please select a batch number');
            return;
        }

        // Store batch number before closing modal
        const batchToReset = resetBatchNumber;

        // Close modal FIRST to avoid z-index conflict with confirmation dialog
        setShowResetBatchModal(false);

        // Small delay to ensure modal closes before showing confirmation
        setTimeout(() => {
            toast.confirm(
                `⚠️ DANGER: Reset Batch ${batchToReset}?

This will permanently delete:
• All students in Batch ${batchToReset}
• All their bookings
• All their attendance records
• All orphan attendance data
• ALL schedules (all weeks)
• Current week → Reset to Week 1

This action CANNOT be undone!`,
                async () => {
                    try {
                        setResetBatchLoading(true);

                        // Call RPC function
                        const { data, error } = await supabase.rpc('reset_batch', {
                            batch_number_param: batchToReset
                        });

                        if (error) throw error;

                        toast.success(`✅ ${data.message}`);

                        setResetBatchNumber('1');

                        // Reload data
                        await loadStudents();
                    } catch (err) {
                        console.error('Error resetting batch:', err);
                        toast.error('❌ Failed to reset batch: ' + err.message);
                    } finally {
                        setResetBatchLoading(false);
                    }
                },
                () => {
                    // If user cancels, reopen the modal
                    setShowResetBatchModal(true);
                }
            );
        }, 100);
    };

    const handleCleanEmptySchedules = async () => {
        console.log('🔍 handleCleanEmptySchedules CALLED');
        console.log('📊 Schedules array:', schedules);
        console.log('📊 Schedules length:', schedules?.length);

        const emptyCount = schedules.filter(s => s.current_students === 0).length;
        console.log('📊 Empty schedules count:', emptyCount);

        if (emptyCount === 0) {
            console.log('⚠️ No empty schedules found');
            toast.info('No empty schedules to clean');
            return;
        }

        console.log('✅ About to show confirmation dialog');
        console.log('🔧 Toast object:', toast);
        console.log('🔧 Toast.confirm function:', toast.confirm);

        toast.confirm(
            `Delete ${emptyCount} empty schedule(s) with 0 students? This cannot be undone.`,
            async () => {
                console.log('✅ User confirmed deletion');
                try {
                    setLoading(true);
                    console.log('🔄 Loading state set to true');

                    // Delete schedules with 0 students
                    console.log('🗑️ Attempting to delete empty schedules...');
                    const { data, error } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('current_students', 0)
                        .select();

                    console.log('📥 Delete response - data:', data);
                    console.log('📥 Delete response - error:', error);

                    if (error) {
                        console.error('❌ Supabase error:', error);
                        throw error;
                    }

                    const deletedCount = data?.length || 0;
                    console.log('✅ Deleted count:', deletedCount);

                    if (deletedCount > 0) {
                        toast.success(`✅ Successfully deleted ${deletedCount} empty schedule(s)!`);
                        console.log('🔄 Reloading students...');
                        // Reload students to refresh the stats
                        await loadStudents();
                        console.log('✅ Students reloaded');
                    } else {
                        toast.info('No schedules were deleted');
                        console.log('⚠️ No schedules were deleted');
                    }
                } catch (err) {
                    console.error('❌ Error cleaning empty schedules:', err);
                    toast.error('❌ Failed to clean schedules: ' + (err.message || 'Unknown error'));
                } finally {
                    setLoading(false);
                    console.log('✅ Loading state set to false');
                }
            },
            () => {
                console.log('❌ User cancelled deletion');
            }
        );
        console.log('✅ toast.confirm called');
    };

    // Export Students to PDF
    const exportStudentsPDF = async () => {
        try {
            const doc = new jsPDF();
            const filteredStudents = getFilteredStudents();

            // Set font to Helvetica
            doc.setFont('helvetica');

            // Load and add PNG logo (rectangular - wider)
            try {
                const logoImg = new Image();
                logoImg.src = '/eysa-logo.png';
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                    setTimeout(reject, 2000);
                });
                doc.addImage(logoImg, 'PNG', 14, 10, 40, 15);
            } catch (error) {
                console.log('Logo not loaded, continuing without it');
                // Fallback: Draw EYSA logo box (rectangular - wider)
                doc.setFillColor(243, 156, 50);
                doc.roundedRect(14, 10, 19, 7, 1, 1, 'F');
                doc.setFillColor(31, 78, 140);
                doc.roundedRect(33, 10, 19, 7, 1, 1, 'F');
                doc.setFontSize(6);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('EY', 21, 15);
                doc.text('SA', 40, 15);
            }

            // Add title next to logo (aligned with top of logo, with reduced letter spacing)
            doc.setFontSize(20);
            doc.setTextColor(31, 78, 140);
            doc.setFont('helvetica', 'bold');
            // Add letter spacing by drawing each character separately
            const title = 'Language Center';
            const letterSpacing = 0.2;
            let xOffset = 57;
            for (let i = 0; i < title.length; i++) {
                doc.text(title[i], xOffset, 17);
                xOffset += doc.getTextWidth(title[i]) + letterSpacing;
            }

            doc.setFontSize(11);
            doc.setTextColor(243, 156, 50);
            doc.setFont('helvetica', 'normal');
            doc.text('Student List Report', 57, 24);

            // Add modern decorative line (navy blue only, stops before QR code)
            doc.setDrawColor(31, 78, 140);
            doc.setLineWidth(0.8);
            doc.line(14, 30, 165, 30); // Stops at x:165 to avoid QR code at x:169

            // Add QR Code on the right side with border (bigger size)
            try {
                const qrImg = new Image();
                qrImg.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    qrImg.onload = () => resolve();
                    qrImg.onerror = (e) => reject(e);
                    qrImg.src = '/portal-qr.png';
                    setTimeout(() => reject(new Error('Timeout')), 3000);
                });

                // Resize image using canvas to reduce size
                const canvas = document.createElement('canvas');
                const maxSize = 250; // Increased from 200
                const scale = Math.min(maxSize / qrImg.width, maxSize / qrImg.height);
                canvas.width = qrImg.width * scale;
                canvas.height = qrImg.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);

                // Convert to base64 with lower quality
                const resizedImage = canvas.toDataURL('image/jpeg', 0.7);

                // Draw border around QR code
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.roundedRect(169, 8, 28, 28, 2, 2, 'S');

                // Add QR code (bigger: 26x26)
                doc.addImage(resizedImage, 'JPEG', 170, 9, 26, 26);

                // Add small text below QR code with margin
                doc.setFontSize(6.5);
                doc.setTextColor(100, 100, 100);
                doc.setFont('helvetica', 'italic');
                doc.text('Scan for Portal', 183, 40, { align: 'center' }); // Changed from 38 to 40 for more margin

                console.log('QR code added successfully');
            } catch (error) {
                console.log('QR code not loaded:', error.message);
            }

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 36);
            doc.text(`Total Students: ${filteredStudents.length}`, 14, 41);

            // Table settings (smaller fonts)
            const startY = 50;
            const rowHeight = 7;
            const colWidths = [10, 35, 52, 15, 40, 33];
            const headers = ['No', 'Student ID', 'Full Name', 'Batch', 'Program', 'Level'];

            // Draw header
            doc.setFillColor(31, 78, 140);
            doc.rect(14, startY, 185, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');

            let xPos = 14;
            headers.forEach((header, i) => {
                doc.text(header, xPos + 2, startY + 4.5);
                xPos += colWidths[i];
            });

            // Draw rows
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            let yPos = startY + rowHeight;

            filteredStudents.forEach((student, index) => {
                // Alternate row colors
                if (index % 2 === 1) {
                    doc.setFillColor(249, 250, 251);
                    doc.rect(14, yPos, 185, rowHeight, 'F');
                }

                doc.setTextColor(0, 0, 0);
                xPos = 14;

                const rowData = [
                    (index + 1).toString(),
                    student.student_id || '-',
                    student.full_name || '-',
                    student.batch || '-',
                    student.program || '-',
                    student.level || '-'
                ];

                rowData.forEach((data, i) => {
                    // Truncate long text
                    let text = data;
                    if (i === 2 && text.length > 30) { // Full Name
                        text = text.substring(0, 27) + '...';
                    }
                    doc.text(text, xPos + 2, yPos + 4.5);
                    xPos += colWidths[i];
                });

                yPos += rowHeight;

                // Add new page if needed
                if (yPos > 275) {
                    doc.addPage();
                    yPos = 20;

                    // Redraw header on new page
                    doc.setFillColor(31, 78, 140);
                    doc.rect(14, yPos, 185, rowHeight, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    xPos = 14;
                    headers.forEach((header, i) => {
                        doc.text(header, xPos + 2, yPos + 4.5);
                        xPos += colWidths[i];
                    });
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(0, 0, 0);
                    yPos += rowHeight;
                }
            });

            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 14, 287);
                doc.text('EYSA Language Center © 2026', 150, 287);
            }

            // Save PDF
            doc.save(`EYSA_Students_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Failed to export PDF: ' + error.message);
        }
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
                                    src="/eysa-logo.svg"
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
                                        Batch {settings.batch} | {t('common.week')} {currentWeek}
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
                                    <button
                                        onClick={async () => {
                                            try {
                                                const newWeek = await incrementWeek();
                                                toast.success(`Week incremented to ${newWeek}`);
                                                await refreshWeek();
                                            } catch (err) {
                                                toast.error('Failed to increment week');
                                            }
                                        }}
                                        className="ml-1 p-0.5 hover:bg-blue-100 rounded transition-colors group"
                                        title="Next Week"
                                    >
                                        <ChevronRight size={10} className="sm:w-3 sm:h-3 text-blue-500 group-hover:text-blue-700" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: User Info & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-semibold text-gray-800 truncate max-w-[120px] lg:max-w-none">
                                    {user.full_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {user.student_id}
                                </div>
                            </div>

                            {/* Actions Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                                    className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg"
                                >
                                    <ClipboardList size={16} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Actions</span>
                                    <svg className={`w-4 h-4 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showActionsMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)}></div>
                                        <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-lg sm:rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="py-1.5">
                                                <button
                                                    onClick={() => {
                                                        setShowAdminGuide(true);
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5 group"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                                        <BookOpen size={16} className="text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Admin Guide</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">View docs</div>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setShowActionsMenu(false);
                                                        // Trigger backup
                                                        document.querySelector('[title="Backup Database to Google Drive"]')?.click();
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5 group"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                                                        <Cloud size={16} className="text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Quick Backup</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">To Google Drive</div>
                                                    </div>
                                                </button>

                                                {/* Full Database Backup & Restore */}
                                                <FullBackupButton />

                                                <button
                                                    onClick={() => {
                                                        setShowBulkOperations(true);
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors flex items-center gap-2.5 group"
                                                >
                                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                                                        <Upload size={16} className="text-purple-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Bulk Operations</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">Import & manage</div>
                                                    </div>
                                                </button>

                                                <div className="border-t border-gray-200 my-1"></div>

                                                <button
                                                    onClick={() => {
                                                        setShowResetBatchModal(true);
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-2.5 group"
                                                >
                                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors flex-shrink-0">
                                                        <Trash2 size={16} className="text-red-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Reset Batch</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">Delete batch data</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Hidden BackupButton for triggering */}
                            <div className="hidden">
                                <BackupButton />
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg"
                            >
                                <LogOut size={16} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t('common.logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
                {/* Tab Navigation - Modern Style with Animations */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-100 relative">
                        {/* Animated background slider */}
                        <div
                            className="absolute bottom-0 h-full bg-gradient-to-r from-orange-50 to-amber-50 transition-all duration-300 ease-out"
                            style={{
                                left: `${(['stats', 'students', 'teachers', 'bookings', 'fillAttendance', 'attendance'].indexOf(activeTab) / 6) * 100}%`,
                                width: `${100 / 6}%`
                            }}
                        />

                        {[
                            { id: 'stats', icon: BarChart3, label: 'Dashboard', shortLabel: 'Stats' },
                            { id: 'students', icon: Users, label: t('admin.manageStudents'), shortLabel: 'Students' },
                            { id: 'teachers', icon: GraduationCap, label: t('admin.manageTeachers'), shortLabel: 'Teachers' },
                            { id: 'bookings', icon: CalendarDays, label: t('admin.manageBookings'), shortLabel: 'Booking' },
                            { id: 'fillAttendance', icon: UserCheck, label: 'Fill Attendance', shortLabel: 'Fill' },
                            { id: 'attendance', icon: ClipboardList, label: 'Attendance Report', shortLabel: 'Report' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 relative py-2.5 sm:py-3 lg:py-4 px-1 sm:px-3 lg:px-6 font-poppins transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 group z-10 ${activeTab === tab.id
                                    ? 'text-[#F39C32]'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                    }`}
                            >
                                <tab.icon
                                    size={16}
                                    className={`sm:w-[18px] sm:h-[18px] transition-all duration-300 ${activeTab === tab.id
                                        ? 'text-[#F39C32] scale-110 drop-shadow-md'
                                        : 'group-hover:scale-110'
                                        }`}
                                />
                                <span className={`hidden sm:inline font-semibold text-xs lg:text-sm transition-all duration-300 ${activeTab === tab.id ? 'scale-105' : ''
                                    }`}>
                                    {tab.shortLabel}
                                </span>

                                {/* Active indicator with animation */}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 lg:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-[#F39C32] to-[#f5a847] rounded-t-full animate-slideUp shadow-lg shadow-orange-300/50" />
                                )}

                                {/* Glow effect on active */}
                                {activeTab === tab.id && (
                                    <span className="absolute inset-0 bg-gradient-to-b from-orange-100/20 to-transparent rounded-t-xl animate-fadeIn" />
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
                                        onClick={exportStudentsPDF}
                                        disabled={loading || students.length === 0}
                                        className="bg-red-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-semibold disabled:opacity-50 text-xs sm:text-base"
                                        title="Export to PDF"
                                    >
                                        <FileText size={14} className="sm:w-[18px] sm:h-[18px]" />
                                        <span className="hidden sm:inline">Export PDF</span>
                                        <span className="sm:hidden">PDF</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!showCreateForm) {
                                                // Auto-load latest batch when opening form
                                                const latestBatch = await getLatestBatch();
                                                setFormData({
                                                    ...formData,
                                                    batch_number: latestBatch
                                                });
                                            }
                                            setShowCreateForm(!showCreateForm);
                                        }}
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
                        {showEditStudentModal && editingStudent && createPortal(
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                                <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 sm:p-5 flex-shrink-0">
                                        <div className="flex justify-between items-center">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                                                    <Edit2 size={16} className="sm:w-5 sm:h-5" />
                                                    Edit Student
                                                </h3>
                                                <p className="text-blue-200 text-xs sm:text-sm mt-1 truncate">{editingStudent.student_id}</p>
                                            </div>
                                            <button onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
                                                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleUpdateStudent} className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
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
                            </div>,
                            document.body
                        )}
                    </>
                )}

                {/* Password View/Reset Modal */}
                {showPasswordModal && selectedStudentForPassword && createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                            <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white p-3 sm:p-5 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                                            <Key size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
                                            <span className="truncate">{t('password.viewReset') || 'Lihat/Reset Password'}</span>
                                        </h3>
                                        <p className="text-amber-100 text-xs sm:text-sm mt-1 truncate">
                                            {selectedStudentForPassword.full_name} ({selectedStudentForPassword.student_id})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setSelectedStudentForPassword(null);
                                            setStudentPassword('');
                                            setNewPasswordForReset('');
                                        }}
                                        className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
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
                    </div>,
                    document.body
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

                {/* ========== FILL ATTENDANCE TAB ========== */}
                {activeTab === 'fillAttendance' && (
                    <AdminAttendanceManager user={user} />
                )}

                {/* ========== ATTENDANCE TAB ========== */}
                {activeTab === 'attendance' && (
                    <AttendanceReportExcel />
                )}

                {/* Quick Stats & Alerts - Modern Design with Contained Hover */}
                <div className="mt-4 sm:mt-6 bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] px-3 sm:px-5 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg animate-pulse-slow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px] text-white"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">Quick Insights</h4>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {/* Current Week Bookings */}
                            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border-2 border-blue-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 animate-slide-in-left overflow-hidden">
                                {/* Decorative circle */}
                                <div className="absolute -top-8 -right-8 w-16 sm:w-24 h-16 sm:h-24 bg-blue-200/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <div className="p-1 sm:p-1.5 bg-blue-500/10 rounded-lg">
                                            <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-blue-600" />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-blue-700 font-semibold">This Week</p>
                                    </div>
                                    <p className="text-xl sm:text-3xl font-bold text-blue-900 mb-0.5 sm:mb-1 animate-count-up">
                                        {schedules.filter(s => s.week_number === currentWeek).reduce((sum, s) => sum + s.current_students, 0)}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-blue-600 font-medium">W{currentWeek} bookings</p>
                                </div>
                            </div>

                            {/* Next Week Bookings */}
                            <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border-2 border-orange-200/50 hover:border-orange-300 hover:shadow-lg transition-all duration-300 animate-slide-in-right overflow-hidden">
                                {/* Decorative circle */}
                                <div className="absolute -top-8 -right-8 w-16 sm:w-24 h-16 sm:h-24 bg-orange-200/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <div className="p-1 sm:p-1.5 bg-orange-500/10 rounded-lg">
                                            <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-orange-600" />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-orange-700 font-semibold">Next Week</p>
                                    </div>
                                    <p className="text-xl sm:text-3xl font-bold text-orange-900 mb-0.5 sm:mb-1 animate-count-up">
                                        {schedules.filter(s => s.week_number === currentWeek + 1).reduce((sum, s) => sum + s.current_students, 0)}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-orange-600 font-medium">W{currentWeek + 1} bookings</p>
                                </div>
                            </div>
                        </div>

                        {/* Most Popular Class */}
                        <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border-2 border-emerald-200/50 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 animate-slide-in-up overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute -top-8 -right-8 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-200/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="absolute -bottom-8 -left-8 w-16 sm:w-24 h-16 sm:h-24 bg-teal-200/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <div className="p-1 sm:p-1.5 bg-emerald-500/10 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[14px] sm:h-[14px] text-emerald-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold">Most Popular</p>
                                    </div>
                                    <p className="text-sm sm:text-lg font-bold text-emerald-900 truncate">
                                        {(() => {
                                            const classCounts = {};
                                            schedules.forEach(s => {
                                                const className = s.class?.name || 'Unknown';
                                                classCounts[className] = (classCounts[className] || 0) + s.current_students;
                                            });
                                            const mostPopular = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
                                            return mostPopular ? mostPopular[0] : 'N/A';
                                        })()}
                                    </p>
                                </div>
                                <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                                    <p className="text-xl sm:text-3xl font-bold text-emerald-900 animate-count-up">
                                        {(() => {
                                            const classCounts = {};
                                            schedules.forEach(s => {
                                                const className = s.class?.name || 'Unknown';
                                                classCounts[className] = (classCounts[className] || 0) + s.current_students;
                                            });
                                            const mostPopular = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
                                            return mostPopular ? mostPopular[1] : 0;
                                        })()}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-emerald-600 font-medium">students</p>
                                </div>
                            </div>
                        </div>

                        {/* Alerts Section */}
                        <div className="space-y-1.5 sm:space-y-2">
                            {/* Near Capacity Alert */}
                            {schedules.filter(s => s.current_students >= 8 && s.current_students < 10).length > 0 && (
                                <div className="group flex items-start gap-2 sm:gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 border-amber-200/50 hover:border-amber-300 hover:shadow-md transition-all duration-300 animate-slide-in-left">
                                    <div className="p-1 sm:p-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4 text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-amber-900">Near Capacity</p>
                                        <p className="text-[10px] sm:text-xs text-amber-700">
                                            {schedules.filter(s => s.current_students >= 8 && s.current_students < 10).length} class(es) almost full (8-9/10)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Empty Schedules Alert */}
                            {schedules.filter(s => s.current_students === 0).length > 0 && (
                                <div className="group flex items-start gap-2 sm:gap-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 border-gray-200/50 hover:border-gray-300 hover:shadow-md transition-all duration-300 animate-slide-in-right">
                                    <div className="p-1 sm:p-1.5 bg-gray-500/10 rounded-lg flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4 text-gray-600"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-900">Empty Schedules</p>
                                        <p className="text-[10px] sm:text-xs text-gray-600">
                                            {schedules.filter(s => s.current_students === 0).length} schedule(s) with no students
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            console.log('🖱️ Clean button CLICKED!');
                                            handleCleanEmptySchedules();
                                        }}
                                        className="text-[10px] sm:text-xs bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all hover:shadow-md flex-shrink-0"
                                    >
                                        Clean
                                    </button>
                                </div>
                            )}

                            {/* All Good */}
                            {schedules.filter(s => s.current_students >= 8 && s.current_students < 10).length === 0 &&
                                schedules.filter(s => s.current_students === 0).length === 0 && (
                                    <div className="group flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border-2 border-emerald-200/50 hover:border-emerald-300 hover:shadow-md transition-all duration-300 animate-slide-in-up">
                                        <div className="p-1 sm:p-1.5 bg-emerald-500/10 rounded-lg flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4 text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-emerald-800 font-bold">All systems normal</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Edit Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col my-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                        <div className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] text-white p-3 sm:p-5 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    <Pencil size={16} className="sm:w-5 sm:h-5" />
                                    Edit Info Header
                                </h3>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-fadeIn my-4" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
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

            {/* Admin Guide Modal */}
            {showAdminGuide && (
                <AdminGuide onClose={() => setShowAdminGuide(false)} userId={user.id} />
            )}

            {/* Reset Batch Modal */}
            {showResetBatchModal && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Trash2 size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold">Reset Batch</h2>
                                        <p className="text-red-100 text-xs">Delete all batch data</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowResetBatchModal(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <div className="text-red-600 text-sm mt-0.5">⚠️</div>
                                    <div>
                                        <h3 className="font-bold text-red-800 text-sm mb-1">Danger Zone</h3>
                                        <p className="text-xs text-red-700">
                                            This will permanently delete ALL data from the selected batch. This action cannot be undone!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Batch to Reset
                                </label>
                                <select
                                    value={resetBatchNumber}
                                    onChange={(e) => setResetBatchNumber(e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm"
                                    disabled={resetBatchLoading}
                                >
                                    <option value="1">Batch 1</option>
                                    <option value="2">Batch 2</option>
                                    <option value="3">Batch 3</option>
                                    <option value="4">Batch 4</option>
                                    <option value="5">Batch 5</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-800 mb-2 text-xs">What will be deleted:</h4>
                                <ul className="space-y-1 text-xs text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                        All students in Batch {resetBatchNumber}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                        All bookings from these students
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                        All attendance records
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                        All orphan attendance data
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                                        ALL schedules (all weeks)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                        Current week → Reset to Week 1
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowResetBatchModal(false)}
                                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all text-sm"
                                    disabled={resetBatchLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetBatch}
                                    disabled={resetBatchLoading}
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    {resetBatchLoading ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            Reset Batch {resetBatchNumber}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminDashboard;
