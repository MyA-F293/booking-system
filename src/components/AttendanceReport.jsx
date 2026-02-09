import { useState, useEffect } from 'react';
import { Calendar, Users, Download, Filter, Search, FileSpreadsheet } from 'lucide-react';
import { useToast } from './Toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { SkeletonStats, SkeletonTable, SkeletonChart, FadeIn } from './SkeletonLoader';
import { getAttendanceRecords } from '../utils/dbHelpers';
import { StudentSummaryTable, ClassSummaryTable, DateSummaryTable } from './AttendanceSummaryTables';

const AttendanceReport = () => {
    console.log('📊 AttendanceReport: Component rendering');

    const toast = useToast();
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('week');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('summary'); // 'records' or 'summary' - Default to summary for better UX
    const [groupBy, setGroupBy] = useState('student'); // 'student', 'class', 'date'
    const [chartError, setChartError] = useState(null);

    useEffect(() => {
        console.log('📊 AttendanceReport: useEffect - Setting initial dates');
        try {
            const now = new Date();
            const currentWeek = getWeekNumber(now);
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            setSelectedWeek(currentWeek.toString());
            setSelectedMonth(currentMonth);
            console.log('✅ AttendanceReport: Initial dates set', { currentWeek, currentMonth });
        } catch (error) {
            console.error('❌ AttendanceReport: Error in useEffect', error);
            setChartError(error);
        }
    }, []);

    const getWeekNumber = (date) => {
        try {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        } catch (error) {
            console.error('❌ getWeekNumber error:', error);
            return 1;
        }
    };

    const fetchAttendanceData = async () => {
        console.log('📊 AttendanceReport: Fetching attendance data');
        setLoading(true);
        try {
            // Fetch from Supabase instead of Google Sheets
            const data = await getAttendanceRecords();
            console.log('✅ AttendanceReport: Data fetched', { count: data.length });
            setAttendanceData(data);
            toast.success(`Loaded ${data.length} attendance records`);
        } catch (error) {
            console.error('❌ AttendanceReport: Error fetching attendance:', error);
            toast.error('Failed to fetch attendance data');
            setAttendanceData([]);
            setChartError(error);
        } finally {
            setLoading(false);
        }
    };

    // Show error if chart rendering fails
    if (chartError) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                <h2 className="text-xl font-bold text-red-800 mb-2">
                    ⚠️ Chart Error
                </h2>
                <p className="text-red-600 mb-4">
                    {chartError.message || 'Failed to render charts'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    useEffect(() => {
        fetchAttendanceData();
    }, [filterType, selectedWeek, selectedMonth]);

    const filteredData = attendanceData.filter(record => {
        if (filterType === 'week' && record.week_number !== parseInt(selectedWeek)) return false;
        if (filterType === 'month') {
            const recordDate = new Date(record.created_at);
            const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
            if (recordMonth !== selectedMonth) return false;
        }
        if (selectedClass !== 'all' && record.class_name !== selectedClass) return false;
        if (searchTerm && !record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !record.student_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: filteredData.length,
        present: filteredData.filter(r => r.status === 'present').length,
        late: filteredData.filter(r => r.status === 'late').length,
        absent: filteredData.filter(r => r.status === 'absent').length,
    };

    const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;
    const uniqueClasses = [...new Set(attendanceData.map(r => r.class_name))];

    // Calculate student summary (cumulative per person)
    const getStudentSummary = () => {
        const summaryMap = {};

        filteredData.forEach(record => {
            const key = record.student_id;
            if (!summaryMap[key]) {
                summaryMap[key] = {
                    studentId: record.student_id,
                    studentName: record.student_name,
                    className: record.class_name,
                    present: 0,
                    late: 0,
                    absent: 0,
                    total: 0,
                    lastAttendance: record.created_at
                };
            }

            summaryMap[key].total++;
            if (record.status === 'present') summaryMap[key].present++;
            else if (record.status === 'late') summaryMap[key].late++;
            else if (record.status === 'absent') summaryMap[key].absent++;

            // Track most recent attendance
            if (new Date(record.created_at) > new Date(summaryMap[key].lastAttendance)) {
                summaryMap[key].lastAttendance = record.created_at;
            }
        });

        return Object.values(summaryMap).map(student => ({
            ...student,
            attendanceRate: student.total > 0 ? ((student.present / student.total) * 100).toFixed(1) : 0
        })).sort((a, b) => b.attendanceRate - a.attendanceRate);
    };

    // Calculate class summary (grouped by class)
    const getClassSummary = () => {
        const summaryMap = {};

        filteredData.forEach(record => {
            const key = record.class_name;
            if (!summaryMap[key]) {
                summaryMap[key] = {
                    className: record.class_name,
                    program: record.program,
                    level: record.level,
                    uniqueStudents: new Set(),
                    present: 0,
                    late: 0,
                    absent: 0,
                    total: 0
                };
            }

            summaryMap[key].total++;
            summaryMap[key].uniqueStudents.add(record.student_id);
            if (record.status === 'present') summaryMap[key].present++;
            else if (record.status === 'late') summaryMap[key].late++;
            else if (record.status === 'absent') summaryMap[key].absent++;
        });

        return Object.values(summaryMap).map(cls => ({
            ...cls,
            studentCount: cls.uniqueStudents.size,
            attendanceRate: cls.total > 0 ? ((cls.present / cls.total) * 100).toFixed(1) : 0
        })).sort((a, b) => b.attendanceRate - a.attendanceRate);
    };

    // Calculate date summary (grouped by date)
    const getDateSummary = () => {
        const summaryMap = {};

        filteredData.forEach(record => {
            const date = new Date(record.created_at).toLocaleDateString();
            if (!summaryMap[date]) {
                summaryMap[date] = {
                    date: date,
                    rawDate: record.created_at,
                    uniqueStudents: new Set(),
                    uniqueClasses: new Set(),
                    present: 0,
                    late: 0,
                    absent: 0,
                    total: 0
                };
            }

            summaryMap[date].total++;
            summaryMap[date].uniqueStudents.add(record.student_id);
            summaryMap[date].uniqueClasses.add(record.class_name);
            if (record.status === 'present') summaryMap[date].present++;
            else if (record.status === 'late') summaryMap[date].late++;
            else if (record.status === 'absent') summaryMap[date].absent++;
        });

        return Object.values(summaryMap).map(day => ({
            ...day,
            studentCount: day.uniqueStudents.size,
            classCount: day.uniqueClasses.size,
            attendanceRate: day.total > 0 ? ((day.present / day.total) * 100).toFixed(1) : 0
        })).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    };

    const studentSummary = getStudentSummary();
    const classSummary = getClassSummary();
    const dateSummary = getDateSummary();

    const handleExportCSV = () => {
        if (viewMode === 'records' && filteredData.length === 0) {
            toast.error('No data to export');
            return;
        }
        if (viewMode === 'summary' && studentSummary.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            let csvContent;

            if (viewMode === 'records') {
                const headers = ['Date', 'Time', 'Teacher', 'Class', 'Program', 'Level', 'Day', 'Time Slot', 'Week', 'Year', 'Student ID', 'Student Name', 'Status'];
                const csvRows = [headers.join(',')];

                filteredData.forEach(record => {
                    const date = new Date(record.created_at);
                    const row = [
                        date.toLocaleDateString(),
                        date.toLocaleTimeString(),
                        `"${record.teacher_name}"`,
                        `"${record.class_name}"`,
                        `"${record.program}"`,
                        `"${record.level}"`,
                        record.day,
                        `"${record.time_slot}"`,
                        record.week_number,
                        record.year,
                        record.student_id,
                        `"${record.student_name}"`,
                        record.status
                    ];
                    csvRows.push(row.join(','));
                });

                csvContent = csvRows.join('\n');
            } else {
                // Summary export
                const headers = ['Student ID', 'Student Name', 'Total Classes', 'Present', 'Late', 'Absent', 'Attendance Rate (%)'];
                const csvRows = [headers.join(',')];

                studentSummary.forEach(student => {
                    const row = [
                        student.studentId,
                        `"${student.studentName}"`,
                        student.total,
                        student.present,
                        student.late,
                        student.absent,
                        student.attendanceRate
                    ];
                    csvRows.push(row.join(','));
                });

                csvContent = csvRows.join('\n');
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            const filename = viewMode === 'records'
                ? `attendance_records_${new Date().toISOString().split('T')[0]}.csv`
                : `attendance_summary_${new Date().toISOString().split('T')[0]}.csv`;

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('CSV exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data');
        }
    };

    const handleExportExcel = () => {
        if (viewMode === 'records' && filteredData.length === 0) {
            toast.error('No data to export');
            return;
        }
        if (viewMode === 'summary' && studentSummary.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const timestamp = new Date().toISOString().split('T')[0];

            if (viewMode === 'records') {
                // Records Sheet
                const recordsData = filteredData.map(record => {
                    const date = new Date(record.created_at);
                    return {
                        'Date': date.toLocaleDateString(),
                        'Time': date.toLocaleTimeString(),
                        'Teacher': record.teacher_name,
                        'Class': record.class_name,
                        'Program': record.program,
                        'Level': record.level,
                        'Day': record.day,
                        'Time Slot': record.time_slot,
                        'Week': record.week_number,
                        'Year': record.year,
                        'Student ID': record.student_id,
                        'Student Name': record.student_name,
                        'Status': record.status.toUpperCase()
                    };
                });

                const ws = XLSX.utils.json_to_sheet(recordsData);

                // Set column widths
                ws['!cols'] = [
                    { wch: 12 }, // Date
                    { wch: 12 }, // Time
                    { wch: 20 }, // Teacher
                    { wch: 20 }, // Class
                    { wch: 18 }, // Program
                    { wch: 18 }, // Level
                    { wch: 12 }, // Day
                    { wch: 15 }, // Time Slot
                    { wch: 8 },  // Week
                    { wch: 8 },  // Year
                    { wch: 15 }, // Student ID
                    { wch: 25 }, // Student Name
                    { wch: 10 }  // Status
                ];

                XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

                // Statistics Sheet
                const statsData = [
                    { 'Metric': 'Total Records', 'Value': stats.total },
                    { 'Metric': 'Present', 'Value': stats.present },
                    { 'Metric': 'Late', 'Value': stats.late },
                    { 'Metric': 'Absent', 'Value': stats.absent },
                    { 'Metric': 'Attendance Rate', 'Value': `${attendanceRate}%` }
                ];
                const statsWs = XLSX.utils.json_to_sheet(statsData);
                statsWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');

            } else {
                // Summary Sheet
                const summaryData = studentSummary.map(student => ({
                    'Student ID': student.studentId,
                    'Student Name': student.studentName,
                    'Total Classes': student.total,
                    'Present': student.present,
                    'Late': student.late,
                    'Absent': student.absent,
                    'Attendance Rate': `${student.attendanceRate}%`
                }));

                const ws = XLSX.utils.json_to_sheet(summaryData);

                // Set column widths
                ws['!cols'] = [
                    { wch: 15 }, // Student ID
                    { wch: 25 }, // Student Name
                    { wch: 15 }, // Total Classes
                    { wch: 10 }, // Present
                    { wch: 10 }, // Late
                    { wch: 10 }, // Absent
                    { wch: 18 }  // Attendance Rate
                ];

                XLSX.utils.book_append_sheet(wb, ws, 'Student Summary');

                // Statistics Sheet
                const statsData = [
                    { 'Metric': 'Total Students', 'Value': studentSummary.length },
                    { 'Metric': 'Total Records', 'Value': stats.total },
                    { 'Metric': 'Average Attendance Rate', 'Value': `${attendanceRate}%` },
                    { 'Metric': 'Total Present', 'Value': stats.present },
                    { 'Metric': 'Total Late', 'Value': stats.late },
                    { 'Metric': 'Total Absent', 'Value': stats.absent }
                ];
                const statsWs = XLSX.utils.json_to_sheet(statsData);
                statsWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
            }

            // Export file
            const filename = viewMode === 'records'
                ? `EYSA_Attendance_Records_${timestamp}.xlsx`
                : `EYSA_Student_Summary_${timestamp}.xlsx`;

            XLSX.writeFile(wb, filename);
            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export Excel file');
        }
    };

    return (
        <div className="space-y-3 sm:space-y-6">
            <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1">Attendance Report</h1>
                <p className="text-xs sm:text-sm text-gray-600">Analyze student attendance data</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                            <Filter size={14} className="inline mr-1 sm:w-4 sm:h-4" />
                            Filter By
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#A1B2CD]"
                        >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                        </select>
                    </div>

                    {filterType === 'week' ? (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                <Calendar size={14} className="inline mr-1 sm:w-4 sm:h-4" />
                                Week Number
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="53"
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#A1B2CD]"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                <Calendar size={14} className="inline mr-1 sm:w-4 sm:h-4" />
                                Month
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#A1B2CD]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                            <Users size={14} className="inline mr-1 sm:w-4 sm:h-4" />
                            Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#A1B2CD]"
                        >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(className => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                            <Search size={14} className="inline mr-1 sm:w-4 sm:h-4" />
                            Search Student
                        </label>
                        <input
                            type="text"
                            placeholder="Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#A1B2CD]"
                        />
                    </div>
                </div>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Total Records */}
                <div className="group bg-white rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#A1B2CD]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#A1B2CD]/5 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#A1B2CD]/10 flex items-center justify-center">
                                <Calendar size={18} className="sm:w-6 sm:h-6 text-[#A1B2CD]" />
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Total Records</p>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                </div>

                {/* Present */}
                <div className="group bg-white rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl">✓</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Present</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.present}</p>
                    </div>
                </div>

                {/* Late */}
                <div className="group bg-white rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-yellow-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-50 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl">⏱</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Late</p>
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.late}</p>
                    </div>
                </div>

                {/* Absent */}
                <div className="group bg-white rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl">✗</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">Absent</p>
                        <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.absent}</p>
                    </div>
                </div>

                {/* Attendance Rate - Special Card */}
                <div className="group bg-gradient-to-br from-[#A1B2CD] to-[#8a9bb8] rounded-2xl p-3 sm:p-5 shadow-md hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl">📊</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium mb-1">Attendance Rate</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white">{attendanceRate}%</p>
                    </div>
                </div>
            </div>

            {/* Modern View Mode Toggle with Grouping */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* View Mode Toggle */}
                <div className="bg-gray-50/50 rounded-2xl p-1.5 sm:p-2 inline-flex gap-1 sm:gap-2 flex-1 sm:flex-none">
                    <button
                        onClick={() => setViewMode('summary')}
                        className={`flex-1 sm:flex-none relative px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${viewMode === 'summary'
                            ? 'bg-white text-[#A1B2CD] shadow-md'
                            : 'bg-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base">📊</span>
                            <span>Summary</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('records')}
                        className={`flex-1 sm:flex-none relative px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${viewMode === 'records'
                            ? 'bg-white text-[#A1B2CD] shadow-md'
                            : 'bg-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base">📋</span>
                            <span>All Records</span>
                        </div>
                    </button>
                </div>

                {/* Group By Options (only show in summary mode) */}
                {viewMode === 'summary' && (
                    <div className="bg-gray-50/50 rounded-2xl p-1.5 sm:p-2 inline-flex gap-1 sm:gap-2 flex-1 sm:flex-none">
                        <button
                            onClick={() => setGroupBy('student')}
                            className={`flex-1 sm:flex-none relative px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${groupBy === 'student'
                                ? 'bg-white text-[#A1B2CD] shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <span className="text-sm sm:text-base">👤</span>
                                <span>By Student</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setGroupBy('class')}
                            className={`flex-1 sm:flex-none relative px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${groupBy === 'class'
                                ? 'bg-white text-[#A1B2CD] shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <span className="text-sm sm:text-base">🏫</span>
                                <span>By Class</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setGroupBy('date')}
                            className={`flex-1 sm:flex-none relative px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${groupBy === 'date'
                                ? 'bg-white text-[#A1B2CD] shadow-md'
                                : 'bg-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <span className="text-sm sm:text-base">📅</span>
                                <span>By Date</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Status Distribution Pie Chart */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Present', value: stats.present, color: '#10b981' },
                                    { name: 'Late', value: stats.late, color: '#f59e0b' },
                                    { name: 'Absent', value: stats.absent, color: '#ef4444' }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {[
                                    { name: 'Present', value: stats.present, color: '#10b981' },
                                    { name: 'Late', value: stats.late, color: '#f59e0b' },
                                    { name: 'Absent', value: stats.absent, color: '#ef4444' }
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Attendance by Class Bar Chart */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Attendance by Class</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={uniqueClasses.map(className => {
                                const classData = filteredData.filter(r => r.class_name === className);
                                return {
                                    name: className,
                                    Present: classData.filter(r => r.status === 'present').length,
                                    Late: classData.filter(r => r.status === 'late').length,
                                    Absent: classData.filter(r => r.status === 'absent').length
                                };
                            })}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Present" fill="#10b981" />
                            <Bar dataKey="Late" fill="#f59e0b" />
                            <Bar dataKey="Absent" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Records View */}
            {viewMode === 'records' && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#A1B2CD] to-[#8a9bb8] text-white flex items-center justify-between">
                        <h2 className="text-sm sm:text-lg md:text-xl font-bold">Attendance Records</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                                title="Export to Excel"
                            >
                                <FileSpreadsheet size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                                title="Export to CSV"
                            >
                                <Download size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Student</th>
                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Class</th>
                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            No attendance records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm text-gray-700">
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                <div className="text-[9px] sm:text-sm font-semibold text-gray-800 leading-tight">{record.student_name}</div>
                                                <div className="text-[8px] sm:text-xs text-gray-500">{record.student_id}</div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm text-gray-700">{record.class_name}</td>
                                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-sm text-gray-700">{record.teacher_name}</td>
                                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary View */}
            {viewMode === 'summary' && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-[#A1B2CD] to-[#8a9bb8] text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-sm sm:text-lg md:text-xl font-bold">
                                {groupBy === 'student' && 'Student Attendance Summary'}
                                {groupBy === 'class' && 'Class Attendance Summary'}
                                {groupBy === 'date' && 'Daily Attendance Summary'}
                            </h2>
                            <p className="text-xs sm:text-sm text-white/80 mt-1">
                                {groupBy === 'student' && `${studentSummary.length} students`}
                                {groupBy === 'class' && `${classSummary.length} classes`}
                                {groupBy === 'date' && `${dateSummary.length} days`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                                title="Export to Excel"
                            >
                                <FileSpreadsheet size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                                title="Export to CSV"
                            >
                                <Download size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {groupBy === 'student' && <StudentSummaryTable data={studentSummary} loading={loading} />}
                        {groupBy === 'class' && <ClassSummaryTable data={classSummary} loading={loading} />}
                        {groupBy === 'date' && <DateSummaryTable data={dateSummary} loading={loading} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReport;
