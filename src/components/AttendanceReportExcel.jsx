import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Search, Filter, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import * as XLSX from 'xlsx';
import { getAttendanceRecords, getAllStudents, getCurrentWeek, getCurrentYear } from '../utils/dbHelpers';

const AttendanceReportExcel = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('all');
    const [selectedClass, setSelectedClass] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCell, setHoveredCell] = useState(null); // For tooltip

    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [attendanceRecords, studentsList] = await Promise.all([
                getAttendanceRecords(),
                getAllStudents()
            ]);

            console.log('📊 Loaded attendance records:', attendanceRecords.length);
            console.log('📊 Loaded students:', studentsList.length);
            console.log('📊 Sample attendance:', attendanceRecords[0]);
            console.log('📊 Sample student:', studentsList[0]);

            // Enrich students with class info from attendance records
            const studentsWithClass = studentsList.map(student => {
                // Find most recent attendance record for this student to get their class
                // Match by student_id field, not user_id
                const studentAttendance = attendanceRecords
                    .filter(r => r.student_id === student.student_id)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                return {
                    ...student,
                    class_name: studentAttendance[0]?.class_name || null
                };
            });

            console.log('📊 Students with class:', studentsWithClass.filter(s => s.class_name).length);

            setAttendanceData(attendanceRecords);
            // Show all active students, even if they don't have class yet
            setStudents(studentsWithClass.filter(s => s.is_active));

            if (studentsWithClass.filter(s => s.is_active).length === 0) {
                toast.warning('No active students found');
            } else {
                toast.success(`Loaded ${attendanceRecords.length} attendance records for ${studentsWithClass.filter(s => s.is_active).length} students`);
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            toast.error('Failed to load data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Get unique classes
    const uniqueClasses = [...new Set(students.map(s => s.class_name).filter(Boolean))];

    // Get weeks range - EYSA starts from week 2 in 2026
    // Dynamically determine max week from attendance data
    const maxWeekInData = attendanceData.length > 0
        ? Math.max(...attendanceData.map(r => r.week_number || 2))
        : currentWeek;

    // Show from week 2 to current week + 2 (or at least 8 weeks)
    const endWeek = Math.max(maxWeekInData + 2, 9);
    const weeks = Array.from({ length: endWeek - 1 }, (_, i) => i + 2); // Start from week 2

    // Build attendance matrix
    const buildAttendanceMatrix = () => {
        console.log('\n🏗️ Building attendance matrix...');
        console.log(`📊 Total attendance records: ${attendanceData.length}`);
        console.log(`👥 Total students: ${students.length}`);

        const matrix = {};

        // Filter students
        let filteredStudents = students;
        if (selectedClass !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.class_name === selectedClass);
        }
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            filteredStudents = filteredStudents.filter(s =>
                s.full_name?.toLowerCase().includes(query) ||
                s.student_id?.toLowerCase().includes(query) ||
                s.level?.toLowerCase().includes(query)
            );
        }

        console.log(`👥 Filtered students: ${filteredStudents.length}`);
        if (filteredStudents.length > 0) {
            console.log('📋 Sample student:', filteredStudents[0]);
        }

        // Initialize matrix for each student
        filteredStudents.forEach(student => {
            matrix[student.id] = {
                studentId: student.student_id,
                studentName: student.full_name,
                level: student.level,
                weeks: {}
            };

            // Initialize each week with phases
            weeks.forEach(week => {
                matrix[student.id].weeks[week] = {
                    phase1: null,
                    phase2: null,
                    recap: null
                };
            });
        });

        console.log(`📊 Matrix initialized for ${Object.keys(matrix).length} students`);

        // Fill in attendance data
        console.log('\n🔍 Matching attendance records to students...');
        let matchedCount = 0;
        let unmatchedCount = 0;
        attendanceData.forEach(record => {
            // Find student by matching student_id (not user_id)
            const studentEntry = Object.entries(matrix).find(([_, student]) =>
                student.studentId === record.student_id
            );

            if (studentEntry) {
                matchedCount++;
                const [userId, student] = studentEntry;
                const week = record.week_number;

                // Map phase names correctly
                let phaseKey = null;
                if (record.phase === 'phase1') phaseKey = 'phase1';
                else if (record.phase === 'phase2') phaseKey = 'phase2';
                else if (record.phase === 'recap') phaseKey = 'recap';

                if (student.weeks[week] && phaseKey) {
                    // Store both status and full record for tooltip
                    student.weeks[week][phaseKey] = {
                        status: record.status,
                        date: record.created_at,
                        className: record.class_name,
                        teacher: record.teacher_name,
                        timeSlot: record.time_slot,
                        day: record.day
                    };
                }
            } else {
                unmatchedCount++;
                if (unmatchedCount <= 5) {
                    console.log(`❌ Unmatched record:`, {
                        student_id: record.student_id,
                        student_name: record.student_name,
                        week: record.week_number,
                        phase: record.phase
                    });
                }
            }
        });

        console.log(`\n📊 Matching results:`);
        console.log(`   ✅ Matched: ${matchedCount}`);
        console.log(`   ❌ Unmatched: ${unmatchedCount}`);

        if (unmatchedCount > 0) {
            console.log(`\n⚠️ ${unmatchedCount} attendance records couldn't be matched to students!`);
            console.log('   Possible reasons:');
            console.log('   1. student_id in attendance doesn\'t match student_id in users table');
            console.log('   2. Student is not active (is_active = false)');
            console.log('   3. Student_id has IMPORT_ prefix (dummy ID)');
        }

        return Object.values(matrix);
    };

    const matrixData = buildAttendanceMatrix();

    // Calculate totals for each student
    const calculateTotals = (studentWeeks) => {
        let present = 0;
        let late = 0;
        let absent = 0;

        Object.values(studentWeeks).forEach(week => {
            ['phase1', 'phase2', 'recap'].forEach(phase => {
                const data = week[phase];
                const status = typeof data === 'object' ? data?.status : data;
                if (status === 'present') present++;
                else if (status === 'late') late++;
                else if (status === 'absent') absent++;
            });
        });

        return { present, late, absent };
    };

    // Get status color
    const getStatusColor = (data) => {
        const status = typeof data === 'object' ? data?.status : data;
        if (status === 'present') return 'bg-green-500';
        if (status === 'late') return 'bg-yellow-500';
        if (status === 'absent') return 'bg-red-500';
        return 'bg-gray-200';
    };

    // Get status icon
    const getStatusIcon = (data) => {
        const status = typeof data === 'object' ? data?.status : data;
        if (status === 'present') return '✓';
        if (status === 'late') return '⏱';
        if (status === 'absent') return '✗';
        return '-';
    };

    // Export to Excel
    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // Prepare data for Excel
            const excelData = [];

            // Header row 1: Week numbers
            const headerRow1 = ['NO', 'NAME', 'LEVEL'];
            weeks.forEach(week => {
                headerRow1.push(`WEEK ${week}`, '', '');
            });
            headerRow1.push('TOTAL', '', '');
            excelData.push(headerRow1);

            // Header row 2: Phase labels
            const headerRow2 = ['', '', ''];
            weeks.forEach(() => {
                headerRow2.push('I 1', 'I 2', 'RC');
            });
            headerRow2.push('✓', '⏱', '✗');
            excelData.push(headerRow2);

            // Data rows
            matrixData.forEach((student, index) => {
                const row = [
                    index + 1,
                    student.studentName,
                    student.level || '-'
                ];

                weeks.forEach(week => {
                    const weekData = student.weeks[week];
                    row.push(
                        getStatusIcon(weekData.phase1),
                        getStatusIcon(weekData.phase2),
                        getStatusIcon(weekData.recap)
                    );
                });

                const totals = calculateTotals(student.weeks);
                row.push(totals.present, totals.late, totals.absent);

                excelData.push(row);
            });

            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Set column widths
            ws['!cols'] = [
                { wch: 5 },  // NO
                { wch: 25 }, // NAME
                { wch: 15 }, // LEVEL
                ...Array(weeks.length * 3).fill({ wch: 5 }), // Week columns
                { wch: 8 }, { wch: 8 }, { wch: 8 } // Totals
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
            XLSX.writeFile(wb, `EYSA_Attendance_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export Excel');
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
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Attendance Report</h1>
                <p className="text-sm text-gray-600">Analyze student attendance data</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Filter size={16} className="inline mr-1" />
                            Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F39C32]"
                        >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(className => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Search size={16} className="inline mr-1" />
                            Search Student
                        </label>
                        <input
                            type="text"
                            placeholder="Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F39C32]"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-[#1F4E8C] hover:bg-[#163a6b] text-white rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleExportExcel}
                            className="w-full px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <FileSpreadsheet size={16} />
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary - Modern 5 Column Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-md border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Students</div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">👥</span>
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800">{matrixData.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Active loaded</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-md border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn" style={{ animationDelay: '0.05s' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Records</div>
                        <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📋</span>
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">{attendanceData.length}</div>
                    <div className="text-xs text-blue-500 mt-1">Total entries</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-md border border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">Present</div>
                        <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">✓</span>
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                        {matrixData.reduce((sum, s) => sum + calculateTotals(s.weeks).present, 0)}
                    </div>
                    <div className="text-xs text-green-500 mt-1">On time</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 shadow-md border border-yellow-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Late</div>
                        <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">⏱</span>
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                        {matrixData.reduce((sum, s) => sum + calculateTotals(s.weeks).late, 0)}
                    </div>
                    <div className="text-xs text-yellow-500 mt-1">Delayed</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-md border border-red-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Absent</div>
                        <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">✗</span>
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">
                        {matrixData.reduce((sum, s) => sum + calculateTotals(s.weeks).absent, 0)}
                    </div>
                    <div className="text-xs text-red-500 mt-1">Not present</div>
                </div>
            </div>

            {/* Debug Info */}
            {matrixData.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <h3 className="font-bold text-yellow-900 mb-2">No Data Found</h3>
                            <div className="text-sm text-yellow-800 space-y-1">
                                <p>• Total students in database: {students.length}</p>
                                <p>• Total attendance records: {attendanceData.length}</p>
                                <p>• Selected class filter: {selectedClass}</p>
                                <p>• Search term: {searchTerm || '(none)'}</p>
                            </div>
                            <p className="text-sm text-yellow-700 mt-3">
                                Try: Remove filters, check if students are marked as active, or verify attendance data exists.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel-style Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slideUp">
                <div className="p-4 bg-gradient-to-r from-[#1F4E8C] to-[#163a6b] text-white">
                    <h2 className="text-lg font-bold">Attendance Matrix</h2>
                    <p className="text-sm text-white/80">Excel-style view of all attendance records</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Week Numbers Row */}
                            <tr className="bg-gradient-to-r from-[#1F4E8C] to-[#163a6b] text-white">
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold sticky left-0 z-10 whitespace-nowrap" rowSpan="2" style={{ backgroundColor: '#1F4E8C', zIndex: 20 }}>NO</th>
                                <th className="border border-gray-400 px-4 py-2 text-xs font-bold sticky left-[40px] z-10 whitespace-nowrap" rowSpan="2" style={{ backgroundColor: '#1F4E8C', zIndex: 20, boxShadow: '3px 0 8px rgba(0,0,0,0.1)' }}>NAME</th>
                                <th className="border border-gray-400 border-l-2 border-l-gray-500 px-4 py-2 text-xs font-bold whitespace-nowrap" rowSpan="2">LEVEL</th>
                                {weeks.map(week => (
                                    <th key={week} className="border border-gray-400 px-2 py-2 text-xs font-bold whitespace-nowrap" colSpan="3">
                                        WEEK {week}
                                    </th>
                                ))}
                                <th className="border border-gray-400 px-2 py-2 text-xs font-bold bg-[#0d2847] whitespace-nowrap" colSpan="3">TOTAL</th>
                            </tr>
                            {/* Phase Labels Row */}
                            <tr className="bg-gradient-to-r from-[#c56a0f] to-[#a85a0d] text-white">
                                {weeks.map(week => (
                                    <React.Fragment key={week}>
                                        <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold whitespace-nowrap">I1</th>
                                        <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold whitespace-nowrap">I2</th>
                                        <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold whitespace-nowrap">RC</th>
                                    </React.Fragment>
                                ))}
                                <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold bg-green-600 whitespace-nowrap">✓</th>
                                <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold bg-yellow-600 whitespace-nowrap">⏱</th>
                                <th className="border border-gray-400 px-1.5 py-1.5 text-[10px] font-semibold bg-red-600 whitespace-nowrap">✗</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrixData.length === 0 ? (
                                <tr>
                                    <td colSpan={3 + (weeks.length * 3) + 3} className="text-center py-8 text-gray-500">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                matrixData.map((student, index) => {
                                    const totals = calculateTotals(student.weeks);
                                    return (
                                        <tr
                                            key={student.studentId}
                                            className="hover:bg-orange-50/50 transition-all duration-200 animate-fadeInRow border-b border-gray-200"
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
                                            <td className="border-r border-gray-200 px-2 py-3 text-xs text-center font-semibold sticky left-0 bg-white hover:bg-orange-50/50 transition-colors" style={{ zIndex: 15, backgroundColor: 'white' }}>
                                                {index + 1}
                                            </td>
                                            <td className="border-r-2 border-gray-300 px-3 py-3 text-xs font-medium sticky left-[40px] bg-white hover:bg-orange-50/50 transition-colors" style={{ zIndex: 15, backgroundColor: 'white', boxShadow: '3px 0 8px rgba(0,0,0,0.08)' }}>
                                                <div className="font-semibold text-gray-800">{student.studentName}</div>
                                                <div className="text-[10px] text-gray-500">{student.studentId}</div>
                                            </td>
                                            <td className="border-r-2 border-l-2 border-l-gray-500 border-gray-300 px-3 py-3 text-xs" style={{ position: 'relative', zIndex: 1 }}>
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-[10px] font-semibold">
                                                    {student.level || '-'}
                                                </span>
                                            </td>
                                            {weeks.map(week => {
                                                const weekData = student.weeks[week];
                                                return (
                                                    <React.Fragment key={week}>
                                                        <td
                                                            className={`border-r border-gray-200 px-2 py-3 text-center text-xs font-bold ${getStatusColor(weekData.phase1)} text-white transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer relative`}
                                                            style={{ position: 'relative', zIndex: 1 }}
                                                            onMouseEnter={() => weekData.phase1 && typeof weekData.phase1 === 'object' && setHoveredCell({ student: student.studentName, week, phase: 'Phase 1', data: weekData.phase1 })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                        >
                                                            {getStatusIcon(weekData.phase1)}
                                                            {hoveredCell?.student === student.studentName && hoveredCell?.week === week && hoveredCell?.phase === 'Phase 1' && weekData.phase1 && typeof weekData.phase1 === 'object' && (
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-fadeIn">
                                                                    <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 whitespace-nowrap">
                                                                        <div className="font-bold mb-1.5 text-orange-300">{student.studentName}</div>
                                                                        <div className="space-y-0.5 text-[10px]">
                                                                            <div>📅 {new Date(weekData.phase1.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                            <div>🏫 {weekData.phase1.className}</div>
                                                                            <div>👨‍🏫 {weekData.phase1.teacher || 'No teacher'}</div>
                                                                            <div>🕐 {weekData.phase1.timeSlot === 'afternoon' ? '16:00' : '19:00'} - {weekData.phase1.day}</div>
                                                                            <div className={`font-bold mt-1 ${weekData.phase1.status === 'present' ? 'text-green-400' : weekData.phase1.status === 'late' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                                {weekData.phase1.status === 'present' ? '✓ Present' : weekData.phase1.status === 'late' ? '⏱ Late' : '✗ Absent'}
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td
                                                            className={`border-r border-gray-200 px-2 py-3 text-center text-xs font-bold ${getStatusColor(weekData.phase2)} text-white transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer relative`}
                                                            style={{ position: 'relative', zIndex: 1 }}
                                                            onMouseEnter={() => weekData.phase2 && typeof weekData.phase2 === 'object' && setHoveredCell({ student: student.studentName, week, phase: 'Phase 2', data: weekData.phase2 })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                        >
                                                            {getStatusIcon(weekData.phase2)}
                                                            {hoveredCell?.student === student.studentName && hoveredCell?.week === week && hoveredCell?.phase === 'Phase 2' && weekData.phase2 && typeof weekData.phase2 === 'object' && (
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-fadeIn">
                                                                    <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 whitespace-nowrap">
                                                                        <div className="font-bold mb-1.5 text-orange-300">{student.studentName}</div>
                                                                        <div className="space-y-0.5 text-[10px]">
                                                                            <div>📅 {new Date(weekData.phase2.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                            <div>🏫 {weekData.phase2.className}</div>
                                                                            <div>👨‍🏫 {weekData.phase2.teacher || 'No teacher'}</div>
                                                                            <div>🕐 {weekData.phase2.timeSlot === 'afternoon' ? '16:00' : '19:00'} - {weekData.phase2.day}</div>
                                                                            <div className={`font-bold mt-1 ${weekData.phase2.status === 'present' ? 'text-green-400' : weekData.phase2.status === 'late' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                                {weekData.phase2.status === 'present' ? '✓ Present' : weekData.phase2.status === 'late' ? '⏱ Late' : '✗ Absent'}
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td
                                                            className={`border-r-2 border-gray-300 px-2 py-3 text-center text-xs font-bold ${getStatusColor(weekData.recap)} text-white transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer relative`}
                                                            style={{ position: 'relative', zIndex: 1 }}
                                                            onMouseEnter={() => weekData.recap && typeof weekData.recap === 'object' && setHoveredCell({ student: student.studentName, week, phase: 'Recap', data: weekData.recap })}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                        >
                                                            {getStatusIcon(weekData.recap)}
                                                            {hoveredCell?.student === student.studentName && hoveredCell?.week === week && hoveredCell?.phase === 'Recap' && weekData.recap && typeof weekData.recap === 'object' && (
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-fadeIn">
                                                                    <div className="bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 whitespace-nowrap">
                                                                        <div className="font-bold mb-1.5 text-orange-300">{student.studentName}</div>
                                                                        <div className="space-y-0.5 text-[10px]">
                                                                            <div>📅 {new Date(weekData.recap.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                                            <div>🏫 {weekData.recap.className}</div>
                                                                            <div>👨‍🏫 {weekData.recap.teacher || 'No teacher'}</div>
                                                                            <div>🕐 {weekData.recap.timeSlot === 'afternoon' ? '16:00' : '19:00'} - {weekData.recap.day}</div>
                                                                            <div className={`font-bold mt-1 ${weekData.recap.status === 'present' ? 'text-green-400' : weekData.recap.status === 'late' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                                {weekData.recap.status === 'present' ? '✓ Present' : weekData.recap.status === 'late' ? '⏱ Late' : '✗ Absent'}
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td className="border-r border-gray-200 px-2 py-3 text-center text-sm font-bold bg-green-50 text-green-700 transition-all duration-200 hover:bg-green-100" style={{ position: 'relative', zIndex: 1 }}>
                                                {totals.present}
                                            </td>
                                            <td className="border-r border-gray-200 px-2 py-3 text-center text-sm font-bold bg-yellow-50 text-yellow-700 transition-all duration-200 hover:bg-yellow-100" style={{ position: 'relative', zIndex: 1 }}>
                                                {totals.late}
                                            </td>
                                            <td className="px-2 py-3 text-center text-sm font-bold bg-red-50 text-red-700 transition-all duration-200 hover:bg-red-100" style={{ position: 'relative', zIndex: 1 }}>
                                                {totals.absent}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-sm font-semibold text-gray-700">Legend:</div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">✓</div>
                        <span className="text-sm text-gray-700">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">⏱</div>
                        <span className="text-sm text-gray-700">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">✗</div>
                        <span className="text-sm text-gray-700">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">-</div>
                        <span className="text-sm text-gray-700">No Record</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReportExcel;
