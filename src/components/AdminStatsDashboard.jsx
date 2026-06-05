import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp, Clock, RefreshCw, Loader2, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, X, Search, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getCurrentYear } from '../utils/dbHelpers';
import { useWeek } from '../contexts/WeekContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from './Toast';
import useModalScrollLock from '../hooks/useModalScrollLock';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminStatsDashboard = () => {
    const { t, language } = useLanguage();
    const toast = useToast();
    const { currentWeek } = useWeek(); // Use database week from context
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState('next'); // Default to 'next' week
    const dashboardRef = useRef(null);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalBookings: 0,
        totalClasses: 0,
        bookingsByPhase: [],
        bookingsByTime: [],
        bookingsByClass: [],
        weeklyTrend: [],
        classCapacity: []
    });
    const [rawBookings, setRawBookings] = useState([]);
    const [studentBookingStatus, setStudentBookingStatus] = useState({
        booked: [],
        notBooked: [],
        bookingRate: 0
    });
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [modalType, setModalType] = useState('booked'); // 'booked' or 'notBooked'

    const currentYear = getCurrentYear();
    const nextWeek = currentWeek + 1;
    const displayWeek = selectedWeek === 'current' ? currentWeek : nextWeek;

    const COLORS = ['#F39C32', '#1F4E8C', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

    // Lock body scroll when modal is open
    useModalScrollLock(showStudentModal);

    useEffect(() => {
        loadStats();
    }, [selectedWeek]);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Get all active students
            const { data: allStudents } = await supabase
                .from('users')
                .select('id, full_name, student_id, program, level')
                .eq('role', 'student')
                .eq('is_active', true)
                .order('full_name');

            const { count: studentCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('is_active', true);

            const { count: teacherCount } = await supabase
                .from('teachers')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: classCount } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true });

            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                    *,
                    user:users(id, full_name, student_id, program, level),
                    schedule:schedules(
                        phase,
                        time_slot,
                        week_number,
                        year,
                        current_students,
                        class:classes(name)
                    )
                `)
                .eq('status', 'confirmed');

            const currentWeekBookings = (bookings || []).filter(b =>
                b.schedule?.week_number === displayWeek &&
                b.schedule?.year === currentYear
            );

            setRawBookings(currentWeekBookings);

            // Calculate student booking status
            const bookedStudentIds = new Set(currentWeekBookings.map(b => b.user?.id).filter(Boolean));
            const bookedStudents = (allStudents || []).filter(s => bookedStudentIds.has(s.id));
            const notBookedStudents = (allStudents || []).filter(s => !bookedStudentIds.has(s.id));
            const bookingRate = allStudents?.length > 0 ? Math.round((bookedStudents.length / allStudents.length) * 100) : 0;

            setStudentBookingStatus({
                booked: bookedStudents,
                notBooked: notBookedStudents,
                bookingRate
            });

            const phaseData = [
                { name: 'Phase 1', value: currentWeekBookings.filter(b => b.schedule?.phase === 'phase1').length, fill: '#1F4E8C' },
                { name: 'Phase 2', value: currentWeekBookings.filter(b => b.schedule?.phase === 'phase2').length, fill: '#10B981' },
                { name: 'Recap', value: currentWeekBookings.filter(b => b.schedule?.phase === 'recap').length, fill: '#8B5CF6' }
            ];

            const timeData = [
                { name: 'Afternoon (16:00)', value: currentWeekBookings.filter(b => b.schedule?.time_slot === 'afternoon').length, fill: '#F39C32' },
                { name: 'Evening (19:00)', value: currentWeekBookings.filter(b => b.schedule?.time_slot === 'evening').length, fill: '#1F4E8C' }
            ];

            const classBookings = {};
            currentWeekBookings.forEach(b => {
                const className = b.schedule?.class?.name || 'Unknown';
                classBookings[className] = (classBookings[className] || 0) + 1;
            });
            const classData = Object.entries(classBookings).map(([name, value], idx) => ({
                name,
                value,
                fill: COLORS[idx % COLORS.length]
            }));

            const weeklyData = [];
            for (let i = 3; i >= 0; i--) {
                const week = currentWeek - i;
                const weekBookings = (bookings || []).filter(b =>
                    b.schedule?.week_number === week &&
                    b.schedule?.year === currentYear
                ).length;
                weeklyData.push({
                    name: `Week ${week}`,
                    bookings: weekBookings
                });
            }

            const { data: schedules } = await supabase
                .from('schedules')
                .select('*, class:classes(name)')
                .eq('week_number', displayWeek)
                .eq('year', currentYear);

            const capacityData = (schedules || []).map(s => ({
                name: s.class?.name || 'Unknown',
                filled: s.current_students,
                empty: 10 - s.current_students
            }));

            setStats({
                totalStudents: studentCount || 0,
                totalTeachers: teacherCount || 0,
                totalBookings: currentWeekBookings.length,
                totalClasses: classCount || 0,
                bookingsByPhase: phaseData,
                bookingsByTime: timeData,
                bookingsByClass: classData,
                weeklyTrend: weeklyData,
                classCapacity: capacityData
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        setExporting(true);
        try {
            const wb = XLSX.utils.book_new();

            const summaryData = [
                ['EYSA BOOKING STATISTICS REPORT'],
                [`Week ${currentWeek}, Year ${currentYear}`],
                [''],
                ['SUMMARY'],
                ['Total Active Students', stats.totalStudents],
                ['Total Active Teachers', stats.totalTeachers],
                ['Total Classes', stats.totalClasses],
                ['Bookings This Week', stats.totalBookings],
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

            const phaseSheetData = [['Booking per Phase'], ['Phase', 'Count'], ...stats.bookingsByPhase.map(p => [p.name, p.value])];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(phaseSheetData), 'Per Phase');

            const timeSheetData = [['Booking per Time'], ['Time', 'Count'], ...stats.bookingsByTime.map(t => [t.name, t.value])];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(timeSheetData), 'Per Time');

            const trendSheetData = [['4 Week Trend'], ['Week', 'Count'], ...stats.weeklyTrend.map(w => [w.name, w.bookings])];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trendSheetData), 'Weekly Trend');

            const capacitySheetData = [['Class Capacity'], ['Class', 'Filled', 'Empty'], ...stats.classCapacity.map(c => [c.name, c.filled, c.empty])];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(capacitySheetData), 'Capacity');

            const detailData = [
                ['Booking Details This Week'],
                ['No', 'Student ID', 'Name', 'Class', 'Phase', 'Time', 'Date'],
                ...rawBookings.map((b, idx) => [
                    idx + 1, b.user?.student_id || '-', b.user?.full_name || '-', b.schedule?.class?.name || '-',
                    b.schedule?.phase === 'phase1' ? 'Phase 1' : b.schedule?.phase === 'phase2' ? 'Phase 2' : 'Recap',
                    b.schedule?.time_slot === 'afternoon' ? 'Afternoon' : 'Evening',
                    new Date(b.created_at).toLocaleDateString('en-US')
                ])
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailData), 'Detail');

            XLSX.writeFile(wb, `EYSA_Report_Week${currentWeek}_${currentYear}.xlsx`);
        } catch (err) {
            console.error('Error exporting Excel:', err);
        } finally {
            setExporting(false);
        }
    };

    const exportToPDF = async () => {
        if (!dashboardRef.current) return;
        setExporting(true);

        try {
            // Use ignoreElements to skip problematic elements and set explicit background
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                // Ignore elements that might have oklch colors
                ignoreElements: (element) => {
                    return element.classList?.contains('ignore-pdf');
                },
                onclone: (clonedDoc, element) => {
                    // Force all backgrounds to safe colors
                    const allElements = element.querySelectorAll('*');
                    allElements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        // Replace any oklch colors with fallbacks
                        if (el.style) {
                            el.style.setProperty('--tw-bg-opacity', '1');
                            el.style.setProperty('--tw-text-opacity', '1');
                        }
                    });
                    // Set container background
                    element.style.backgroundColor = '#f9fafb';
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.setFontSize(16);
            pdf.setTextColor(31, 78, 140);
            pdf.text('EYSA BOOKING STATISTICS REPORT', pageWidth / 2, 15, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`Week ${currentWeek}, Year ${currentYear} | Printed: ${new Date().toLocaleDateString('en-US')}`, pageWidth / 2, 22, { align: 'center' });

            let yPosition = 28;
            let remainingHeight = imgHeight;
            let sourceY = 0;
            let pageNum = 1;

            while (remainingHeight > 0) {
                const availableHeight = pageNum === 1 ? pageHeight - 35 : pageHeight - 20;
                const sliceHeight = Math.min(remainingHeight, availableHeight);
                const sliceHeightInCanvas = (sliceHeight / imgHeight) * canvas.height;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = sliceHeightInCanvas;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightInCanvas, 0, 0, canvas.width, sliceHeightInCanvas);

                pdf.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 10, yPosition, imgWidth, sliceHeight);

                remainingHeight -= sliceHeight;
                sourceY += sliceHeightInCanvas;

                if (remainingHeight > 0) {
                    pdf.addPage();
                    pageNum++;
                    yPosition = 15;
                }
            }

            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(150);
                pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            }

            pdf.save(`EYSA_Report_Week${currentWeek}_${currentYear}.pdf`);
        } catch (err) {
            console.error('Error exporting PDF:', err);
            toast.error('Failed to export PDF: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={48} style={{ color: '#F39C32' }} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>{t('statsDashboard.title')}</h2>
                    <p className="text-sm" style={{ color: '#6b7280' }}>{t('statsDashboard.week')} {displayWeek}, {currentYear}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Week Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 mr-2">
                        <button
                            onClick={() => setSelectedWeek('current')}
                            className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all ${selectedWeek === 'current'
                                ? 'bg-white text-[#1F4E8C] shadow'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            W{currentWeek}
                        </button>
                        <button
                            onClick={() => setSelectedWeek('next')}
                            className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all ${selectedWeek === 'next'
                                ? 'bg-[#F39C32] text-white shadow'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            W{nextWeek}
                        </button>
                    </div>
                    <button onClick={exportToExcel} disabled={exporting} className="px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all disabled:opacity-50" style={{ backgroundColor: '#059669', color: 'white' }}>
                        <FileSpreadsheet size={16} />
                        <span className="hidden sm:inline">{t('statsDashboard.exportExcel')}</span>
                        <span className="sm:hidden">Excel</span>
                    </button>
                    <button onClick={exportToPDF} disabled={exporting} className="px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all disabled:opacity-50" style={{ backgroundColor: '#dc2626', color: 'white' }}>
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        <span className="hidden sm:inline">{exporting ? t('statsDashboard.generating') : t('statsDashboard.exportPdf')}</span>
                        <span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={loadStats} disabled={loading} className="px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all" style={{ backgroundColor: '#F39C32', color: 'white' }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('statsDashboard.refresh')}</span>
                    </button>
                </div>
            </div>

            {/* 🎨 QUICK INSIGHTS - BENTO BOX LAYOUT (TOP POSITION) */}
            <div className="space-y-3 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#1F4E8C] to-[#2a5fa3] rounded-xl shadow-lg">
                        <TrendingUp className="text-white" size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-base sm:text-lg">Quick Insights</h4>
                        <p className="text-xs text-gray-500">Week {displayWeek} overview at a glance</p>
                    </div>
                </div>

                {/* Bento Grid - Asymmetric 2x2 Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. TOTAL BOOKINGS - Large Blue Card (takes 2 cols on lg) */}
                    <div className="lg:col-span-2 group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        {/* Animated Background */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Calendar size={18} className="text-white" />
                                    </div>
                                    <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Total Bookings</span>
                                </div>
                                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-black text-white backdrop-blur-sm">
                                    Week {displayWeek}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <p className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                                    {stats.totalBookings}
                                </p>
                                <div>
                                    <p className="text-blue-100 text-sm font-bold">Active</p>
                                    <p className="text-blue-200 text-xs">Confirmed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. BOOKING RATE - Compact Orange Card */}
                    <div className="group relative bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-2xl p-4 sm:p-5 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-white rounded-full -translate-y-14 translate-x-14 group-hover:scale-125 transition-transform duration-500"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <UserCheck size={14} className="text-orange-100" />
                                <span className="text-orange-100 text-xs font-bold uppercase">Booking Rate</span>
                            </div>
                            <p className="text-3xl sm:text-4xl font-black text-white mb-1">
                                {studentBookingStatus.bookingRate}%
                            </p>
                            <p className="text-orange-100 text-xs font-medium">
                                {studentBookingStatus.booked.length}/{stats.totalStudents} Students
                            </p>
                        </div>
                    </div>

                    {/* 3. MOST POPULAR CLASS - Green Hero Card */}
                    <div className="group relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl p-4 sm:p-5 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-white rounded-full -translate-y-14 translate-x-14 group-hover:scale-125 transition-transform duration-500"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen size={14} className="text-teal-100" />
                                <span className="text-teal-100 text-xs font-bold uppercase">Top Class</span>
                            </div>
                            <p className="text-lg sm:text-xl font-black text-white mb-1 truncate">
                                {stats.bookingsByClass.length > 0
                                    ? stats.bookingsByClass.sort((a, b) => b.value - a.value)[0].name
                                    : 'N/A'}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-black text-white">
                                    {stats.bookingsByClass.length > 0
                                        ? stats.bookingsByClass.sort((a, b) => b.value - a.value)[0].value
                                        : 0}
                                </p>
                                <span className="text-teal-100 text-xs font-medium">bookings</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts Row - Side by Side Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* STUDENTS NOT BOOKED Alert */}
                    {studentBookingStatus.notBooked.length > 0 && (
                        <button
                            onClick={() => {
                                setModalType('notBooked');
                                setShowStudentModal(true);
                            }}
                            className="group relative bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-4 border-2 border-amber-300 hover:border-amber-400 hover:shadow-lg transition-all duration-300 overflow-hidden text-left"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10 flex items-start gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
                                    <UserX size={20} className="text-amber-700" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-black text-amber-900">⚠️ Not Booked Yet</p>
                                        <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold">
                                            {studentBookingStatus.notBooked.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-700 font-medium">Students haven't booked for W{displayWeek}</p>
                                </div>
                            </div>
                        </button>
                    )}

                    {/* ALL STUDENTS BOOKED Status */}
                    {studentBookingStatus.notBooked.length === 0 && stats.totalStudents > 0 && (
                        <div className="group relative bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-4 border-2 border-emerald-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <CheckCircle2 size={20} className="text-emerald-700" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-emerald-900">✨ All Students Booked!</p>
                                    <p className="text-xs text-emerald-700 font-medium">100% booking rate achieved</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div ref={dashboardRef} className="space-y-6" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '16px' }}>
                {/* Student Booking Status Tracker - REMOVED (data now in Quick Insights above) */}
                {/* The detailed booking status with progress bar was redundant since Quick Insights 
                    already shows: Booking Rate %, Total Bookings, and Not Booked alert with clickable action */}

                {/* Summary Cards - REMOVED (data now in Quick Insights above) */}
                {/* The 4 small summary cards were redundant:
                    - Total Students → Not critical for quick view
                    - Total Teachers → Not critical for quick view  
                    - Total Bookings → Already in Quick Insights (large blue card)
                    - Total Classes → Not critical for quick view
                   Quick Insights provides better, more visual overview. */}

                {/* Charts Row 1 with Animations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl p-6 border shadow-sm hover-lift animate-scaleIn stagger-1" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
                            <Clock size={20} style={{ color: '#F39C32' }} />
                            {t('statsDashboard.bookingPerPhase')}
                        </h3>
                        <div className="h-64">
                            {stats.bookingsByPhase.every(p => p.value === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Clock size={48} className="mb-3 opacity-30" />
                                    <p className="text-sm">{t('statsDashboard.noBookingYet')}</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.bookingsByPhase}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={false}
                                        >
                                            {stats.bookingsByPhase.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [value, name]} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value, entry) => {
                                                const item = stats.bookingsByPhase.find(p => p.name === value);
                                                return `${value}: ${item?.value || 0}`;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
                            <TrendingUp size={20} style={{ color: '#F39C32' }} />
                            {t('statsDashboard.bookingPerTime')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.bookingsByTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {stats.bookingsByTime.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
                            <TrendingUp size={20} style={{ color: '#F39C32' }} />
                            {t('statsDashboard.trendLastWeeks')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.weeklyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="bookings" stroke="#F39C32" strokeWidth={3} dot={{ fill: '#F39C32', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
                            <Users size={20} style={{ color: '#F39C32' }} />
                            {t('statsDashboard.classCapacity')} W{displayWeek}
                        </h3>
                        <div className="h-64">
                            {stats.classCapacity.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Users size={48} className="mb-3 opacity-30" />
                                    <p className="text-sm">{t('statsDashboard.noClassYet')}</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.classCapacity} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="filled" stackId="a" fill="#10B981" name={t('statsDashboard.filled')} />
                                        <Bar dataKey="empty" stackId="a" fill="#E5E7EB" name={t('statsDashboard.empty')} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking per Class chart - REMOVED (redundant with "Top Class" in Quick Insights) */}
                {/* Quick Insights already shows the most popular class with booking count,
                     which is the most important information. Full chart removed to reduce clutter. */}
            </div>

            {/* Student List Modal */}
            {
                showStudentModal && createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                            {/* Modal Header */}
                            <div className={`p-6 ${modalType === 'booked' ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gradient-to-r from-red-600 to-orange-600'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {modalType === 'booked' ? (
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <CheckCircle2 size={24} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <AlertCircle size={24} className="text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">
                                                {modalType === 'booked' ? 'Students Who Already Booked' : 'Students Who Haven\'t Booked'}
                                            </h3>
                                            <p className="text-white/80 text-sm">
                                                Week {displayWeek} • {modalType === 'booked' ? studentBookingStatus.booked.length : studentBookingStatus.notBooked.length} students
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowStudentModal(false)}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <X size={24} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                                {(modalType === 'booked' ? studentBookingStatus.booked : studentBookingStatus.notBooked).length === 0 ? (
                                    <div className="text-center py-12">
                                        {modalType === 'booked' ? (
                                            <UserCheck size={64} className="mx-auto mb-4 text-gray-300" />
                                        ) : (
                                            <UserX size={64} className="mx-auto mb-4 text-gray-300" />
                                        )}
                                        <p className="text-gray-500 text-lg">
                                            {modalType === 'booked' ? 'No students have booked yet' : 'All students have booked!'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(modalType === 'booked' ? studentBookingStatus.booked : studentBookingStatus.notBooked).map((student, idx) => (
                                            <div
                                                key={student.id}
                                                className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${modalType === 'booked'
                                                    ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-500'
                                                    : 'bg-red-50 border-red-300 hover:border-red-500'
                                                    }`}
                                                style={{
                                                    animation: `slideInUp 0.3s ease-out ${idx * 0.05}s both`
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${modalType === 'booked' ? 'bg-emerald-600' : 'bg-red-600'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 truncate">{student.full_name}</div>
                                                        <div className="text-sm text-gray-500 font-mono">{student.student_id}</div>
                                                        <div className="flex gap-2 mt-2">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                                                {student.program}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                                                {student.level}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {modalType === 'booked' ? (
                                                        <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Total: {modalType === 'booked' ? studentBookingStatus.booked.length : studentBookingStatus.notBooked.length} students
                                    </div>
                                    <button
                                        onClick={() => setShowStudentModal(false)}
                                        className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default AdminStatsDashboard;
