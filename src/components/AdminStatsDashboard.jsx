import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp, Clock, RefreshCw, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getCurrentWeek, getCurrentYear } from '../utils/dbHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminStatsDashboard = () => {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState('current'); // 'current' or 'next'
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

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const nextWeek = currentWeek + 1;
    const displayWeek = selectedWeek === 'current' ? currentWeek : nextWeek;

    const COLORS = ['#F39C32', '#1F4E8C', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        loadStats();
    }, [selectedWeek]);

    const loadStats = async () => {
        setLoading(true);
        try {
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
                    user:users(full_name, student_id),
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
            alert('Failed to export PDF: ' + err.message);
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

            <div ref={dashboardRef} className="space-y-6" style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '16px' }}>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
                                <Users size={24} style={{ color: '#1F4E8C' }} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold" style={{ color: '#1f2937' }}>{stats.totalStudents}</p>
                                <p className="text-sm" style={{ color: '#6b7280' }}>{t('statsDashboard.totalStudents')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: '#d1fae5' }}>
                                <GraduationCap size={24} style={{ color: '#059669' }} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold" style={{ color: '#1f2937' }}>{stats.totalTeachers}</p>
                                <p className="text-sm" style={{ color: '#6b7280' }}>{t('statsDashboard.totalTeachers')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: '#ffedd5' }}>
                                <Calendar size={24} style={{ color: '#F39C32' }} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold" style={{ color: '#1f2937' }}>{stats.totalBookings}</p>
                                <p className="text-sm" style={{ color: '#6b7280' }}>{t('statsDashboard.bookingWeek')} W{displayWeek}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: '#ede9fe' }}>
                                <BookOpen size={24} style={{ color: '#7c3aed' }} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold" style={{ color: '#1f2937' }}>{stats.totalClasses}</p>
                                <p className="text-sm" style={{ color: '#6b7280' }}>{t('statsDashboard.totalClasses')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
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

                {stats.bookingsByClass.length > 0 && (
                    <div className="rounded-2xl p-6 border shadow-sm" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
                            <BookOpen size={20} style={{ color: '#F39C32' }} />
                            {t('statsDashboard.bookingPerClass')}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.bookingsByClass}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Booking">
                                        {stats.bookingsByClass.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStatsDashboard;
