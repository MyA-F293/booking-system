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

        // Fill in attendance data
        attendanceData.forEach(record => {
            // Find student by matching student_id (not user_id)
            const studentEntry = Object.entries(matrix).find(([_, student]) =>
                student.studentId === record.student_id
            );

            if (studentEntry) {
                const [userId, student] = studentEntry;
                const week = record.week_number;

                // Map phase names correctly
                let phaseKey = null;
                if (record.phase === 'phase1') phaseKey = 'phase1';
                else if (record.phase === 'phase2') phaseKey = 'phase2';
                else if (record.phase === 'recap') phaseKey = 'recap';

                if (student.weeks[week] && phaseKey) {
                    student.weeks[week][phaseKey] = record.status;
                }
            }
        });

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
                const status = week[phase];
                if (status === 'present') present++;
                else if (status === 'late') late++;
                else if (status === 'absent') absent++;
            });
        });

        return { present, late, absent };
    };

    // Get status color
    const getStatusColor = (status) => {
        if (status === 'present') return 'bg-green-500';
        if (status === 'late') return 'bg-yellow-500';
        if (status === 'absent') return 'bg-red-500';
        return 'bg-gray-200';
    };

    // Get status icon
    const getStatusIcon = (status) => {
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

            {/* Stats Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn">
                    <div className="text-sm text-gray-600 mb-1">Total Students</div>
                    <div className="text-3xl font-bold text-gray-800">{matrixData.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Active students loaded</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <div className="text-sm text-gray-600 mb-1">Total Records</div>
                    <div className="text-3xl font-bold text-blue-600">{attendanceData.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Attendance entries</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="text-sm text-gray-600 mb-1">Total Present</div>
                    <div className="text-3xl font-bold text-green-600">
                        {matrixData.reduce((sum, s) => sum + calculateTotals(s.weeks).present, 0)}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-yellow-100 transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="text-sm text-gray-600 mb-1">Total Late</div>
                    <div className="text-3xl font-bold text-yellow-600">
                        {matrixData.reduce((sum, s) => sum + calculateTotals(s.weeks).late, 0)}
                    </div>
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
                <div className="p-4 bg-gradient-to-r from-[#F39C32] to-[#e08a1f] text-white">
                    <h2 className="text-lg font-bold">Attendance Matrix</h2>
                    <p className="text-sm text-white/80">Excel-style view of all attendance records</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* Week Numbers Row */}
                            <tr className="bg-gradient-to-r from-[#F39C32] to-[#e08a1f] text-white">
                                <th className="border border-gray-300 px-2 py-2 text-xs font-bold sticky left-0 bg-[#F39C32] z-10" rowSpan="2">NO</th>
                                <th className="border border-gray-300 px-4 py-2 text-xs font-bold sticky left-[40px] bg-[#F39C32] z-10" rowSpan="2">NAME</th>
                                <th className="border border-gray-300 px-4 py-2 text-xs font-bold" rowSpan="2">LEVEL</th>
                                {weeks.map(week => (
                                    <th key={week} className="border border-gray-300 px-2 py-2 text-xs font-bold" colSpan="3">
                                        WEEK {week}
                                    </th>
                                ))}
                                <th className="border border-gray-300 px-2 py-2 text-xs font-bold bg-[#1F4E8C]" colSpan="3">TOTAL</th>
                            </tr>
                            {/* Phase Labels Row */}
                            <tr className="bg-gradient-to-r from-[#e08a1f] to-[#d17a15] text-white">
                                {weeks.map(week => (
                                    <React.Fragment key={week}>
                                        <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold">I 1</th>
                                        <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold">I 2</th>
                                        <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold">RC</th>
                                    </React.Fragment>
                                ))}
                                <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold bg-green-600">✓</th>
                                <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold bg-yellow-600">⏱</th>
                                <th className="border border-gray-300 px-2 py-1 text-[10px] font-semibold bg-red-600">✗</th>
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
                                            className="hover:bg-orange-50 transition-all duration-200 animate-fadeInRow"
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-center font-semibold sticky left-0 bg-white hover:bg-orange-50 transition-colors">
                                                {index + 1}
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs font-medium sticky left-[40px] bg-white hover:bg-orange-50 transition-colors">
                                                <div className="font-semibold text-gray-800">{student.studentName}</div>
                                                <div className="text-[10px] text-gray-500">{student.studentId}</div>
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-xs">
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-[10px] font-semibold">
                                                    {student.level || '-'}
                                                </span>
                                            </td>
                                            {weeks.map(week => {
                                                const weekData = student.weeks[week];
                                                return (
                                                    <React.Fragment key={week}>
                                                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs font-bold ${getStatusColor(weekData.phase1)} text-white transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer`}>
                                                            {getStatusIcon(weekData.phase1)}
                                                        </td>
                                                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs font-bold ${getStatusColor(weekData.phase2)} text-white transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer`}>
                                                            {getStatusIcon(weekData.phase2)}
                                                        </td>
                                                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs font-bold ${getStatusColor(weekData.recap)} text-white transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer`}>
                                                            {getStatusIcon(weekData.recap)}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm font-bold bg-green-50 text-green-700 transition-all duration-200 hover:bg-green-100">
                                                {totals.present}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm font-bold bg-yellow-50 text-yellow-700 transition-all duration-200 hover:bg-yellow-100">
                                                {totals.late}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-center text-sm font-bold bg-red-50 text-red-700 transition-all duration-200 hover:bg-red-100">
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
