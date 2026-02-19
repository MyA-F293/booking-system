import { useState } from 'react';
import { Upload, Users, FileSpreadsheet, Download, CheckCircle, AlertCircle, Loader2, X, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from './Toast';
import { bulkCreateUsers, bulkAssignStudentsToClass, bulkUpdateAttendance, getAttendanceRecords, bulkCreateAttendance } from '../utils/dbHelpers';

const BulkOperations = ({ onClose }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('import-students');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    // Import Students State
    const [importFile, setImportFile] = useState(null);
    const [importPreview, setImportPreview] = useState([]);

    // Assign to Class State
    const [assignFile, setAssignFile] = useState(null);
    const [assignPreview, setAssignPreview] = useState([]);

    // Edit Attendance State
    const [attendanceFile, setAttendanceFile] = useState(null);
    const [attendancePreview, setAttendancePreview] = useState([]);

    // Import Attendance State (NEW)
    const [importAttendanceFile, setImportAttendanceFile] = useState(null);
    const [importAttendancePreview, setImportAttendancePreview] = useState([]);
    const [importAttendanceStats, setImportAttendanceStats] = useState(null);

    const tabs = [
        { id: 'import-students', label: 'Import Students', icon: Users },
        { id: 'assign-class', label: 'Assign to Class', icon: FileSpreadsheet },
        { id: 'import-attendance', label: 'Import Attendance', icon: Upload },
        { id: 'edit-attendance', label: 'Edit Attendance', icon: CheckCircle }
    ];

    // Handle file upload and preview
    const handleFileUpload = async (file, type) => {
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (type === 'import') {
                setImportFile(file);
                setImportPreview(jsonData.slice(0, 5));
            } else if (type === 'assign') {
                setAssignFile(file);
                setAssignPreview(jsonData.slice(0, 5));
            } else if (type === 'attendance') {
                setAttendanceFile(file);
                setAttendancePreview(jsonData.slice(0, 5));
            } else if (type === 'import-attendance') {
                setImportAttendanceFile(file);
                setImportAttendancePreview(jsonData.slice(0, 5));
            }

            toast.success(`File loaded: ${jsonData.length} rows found`);
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to read file. Please check format.');
        }
    };

    // Bulk Import Students
    const handleBulkImportStudents = async () => {
        if (!importFile) {
            toast.error('Please upload a file first');
            return;
        }

        try {
            setLoading(true);
            const data = await importFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const requiredFields = ['full_name', 'email', 'batch'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            const students = jsonData.map(row => ({
                full_name: row.full_name,
                email: row.email,
                batch: parseInt(row.batch),
                phone: row.phone || null,
                role: 'student'
            }));

            const result = await bulkCreateUsers(students);

            setResults({
                type: 'import',
                success: result.success,
                failed: result.failed,
                total: students.length
            });

            toast.success(`Imported ${result.success.length} students successfully!`);

            if (result.failed.length > 0) {
                toast.error(`${result.failed.length} students failed to import`);
            }

        } catch (error) {
            console.error('Bulk import error:', error);
            toast.error('Failed to import students: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Bulk Assign Students to Class
    const handleBulkAssignToClass = async () => {
        if (!assignFile) {
            toast.error('Please upload a file first');
            return;
        }

        try {
            setLoading(true);
            const data = await assignFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const requiredFields = ['student_id', 'class_name', 'program', 'level'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            const result = await bulkAssignStudentsToClass(jsonData);

            setResults({
                type: 'assign',
                success: result.success,
                failed: result.failed,
                total: jsonData.length
            });

            toast.success(`Assigned ${result.success.length} students successfully!`);

            if (result.failed.length > 0) {
                toast.error(`${result.failed.length} assignments failed`);
            }

        } catch (error) {
            console.error('Bulk assign error:', error);
            toast.error('Failed to assign students: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Bulk Edit Attendance
    const handleBulkEditAttendance = async () => {
        if (!attendanceFile) {
            toast.error('Please upload a file first');
            return;
        }

        try {
            setLoading(true);
            const data = await attendanceFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const requiredFields = ['id', 'status'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            const validStatuses = ['present', 'late', 'absent'];
            const invalidRows = jsonData.filter(row =>
                !validStatuses.includes(row.status.toLowerCase())
            );

            if (invalidRows.length > 0) {
                toast.error(`Invalid status values found. Use: present, late, or absent`);
                setLoading(false);
                return;
            }

            const result = await bulkUpdateAttendance(jsonData);

            setResults({
                type: 'attendance',
                success: result.success,
                failed: result.failed,
                total: jsonData.length
            });

            toast.success(`Updated ${result.success.length} attendance records!`);

            if (result.failed.length > 0) {
                toast.error(`${result.failed.length} updates failed`);
            }

        } catch (error) {
            console.error('Bulk edit error:', error);
            toast.error('Failed to update attendance: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Download Templates
    const downloadTemplate = (type) => {
        let template = [];
        let filename = '';

        if (type === 'import') {
            template = [
                { full_name: 'John Doe', email: 'john@example.com', batch: 1, phone: '081234567890' },
                { full_name: 'Jane Smith', email: 'jane@example.com', batch: 1, phone: '081234567891' }
            ];
            filename = 'template_import_students.xlsx';
        } else if (type === 'assign') {
            template = [
                { student_id: 'EYSA2601001', class_name: 'Class A', program: 'English', level: 'Beginner' },
                { student_id: 'EYSA2601002', class_name: 'Class B', program: 'English', level: 'Intermediate' }
            ];
            filename = 'template_assign_class.xlsx';
        } else if (type === 'attendance') {
            template = [
                { id: 'attendance-id-1', status: 'present', notes: 'Corrected from absent' },
                { id: 'attendance-id-2', status: 'late', notes: 'Arrived 10 minutes late' }
            ];
            filename = 'template_edit_attendance.xlsx';
        } else if (type === 'import-attendance') {
            template = [
                { date: 'Friday,Feb 6th 2026', time: 'afternoon', teacher: 'Sir Brian', class: 'Oxford', name: 'John Doe', 'present or absent': 'present', 'late or not': 'not' },
                { date: 'Friday,Feb 6th 2026', time: 'afternoon', teacher: 'Sir Brian', class: 'Oxford', name: 'Jane Smith', 'present or absent': 'late', 'late or not': 'late' }
            ];
            filename = 'template_import_attendance.xlsx';
        }

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, filename);

        toast.success('Template downloaded!');
    };

    // Helper functions for fuzzy matching
    const normalizeString = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase().trim()
            .replace(/\s+/g, ' ')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    };

    const calculateSimilarity = (str1, str2) => {
        const s1 = normalizeString(str1);
        const s2 = normalizeString(str2);

        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0;

        const matrix = [];
        for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
        for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const distance = matrix[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return 1 - (distance / maxLength);
    };

    const findBestMatch = (name, existingNames) => {
        let bestMatch = null;
        let bestScore = 0;

        for (const existing of existingNames) {
            const score = calculateSimilarity(name, existing);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = existing;
            }
        }

        return { match: bestMatch, score: bestScore };
    };

    const parseDate = (dateStr) => {
        try {
            if (typeof dateStr === 'number') {
                const date = new Date((dateStr - 25569) * 86400 * 1000);
                return date;
            }

            const parts = dateStr.toString().split(',');
            if (parts.length >= 2) {
                const datePart = parts[1].trim();
                const cleaned = datePart.replace(/(\d+)(st|nd|rd|th)/, '$1');
                const date = new Date(cleaned);
                if (!isNaN(date.getTime())) return date;
            }

            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;

            return null;
        } catch (error) {
            return null;
        }
    };

    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Bulk Import Attendance (NEW)
    const handleBulkImportAttendance = async () => {
        if (!importAttendanceFile) {
            toast.error('Please upload a file first');
            return;
        }

        try {
            setLoading(true);

            // Read file
            const data = await importAttendanceFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

            // Fetch existing data for matching
            const existingAttendance = await getAttendanceRecords();

            const students = new Set();
            const teachers = new Set();
            const classes = new Set();
            const studentMap = new Map();
            const teacherMap = new Map();
            const classMap = new Map();

            existingAttendance.forEach(record => {
                const studentNorm = normalizeString(record.student_name);
                const teacherNorm = normalizeString(record.teacher_name);
                const classNorm = normalizeString(record.class_name);

                students.add(studentNorm);
                teachers.add(teacherNorm);
                classes.add(classNorm);

                if (!studentMap.has(studentNorm)) studentMap.set(studentNorm, record.student_name);
                if (!teacherMap.has(teacherNorm)) teacherMap.set(teacherNorm, record.teacher_name);
                if (!classMap.has(classNorm)) classMap.set(classNorm, record.class_name);
            });

            // Process records
            const processedRecords = [];
            const warnings = [];
            const fuzzyMatches = [];
            const newStudents = new Set();
            const newTeachers = new Set();
            const newClasses = new Set();

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];

                const date = parseDate(row.date);
                if (!date) {
                    warnings.push(`Row ${i + 1}: Invalid date`);
                    continue;
                }

                const studentName = row.name?.trim();
                const teacherName = row.teacher?.trim();
                const className = row.class?.trim();
                const timeSlot = normalizeString(row.time);
                const status = normalizeString(row['present or absent']);

                if (!studentName || !teacherName || !className) {
                    warnings.push(`Row ${i + 1}: Missing required fields`);
                    continue;
                }

                let finalStudentName = studentName;
                let finalTeacherName = teacherName;
                let finalClassName = className;

                // Smart matching
                const studentNorm = normalizeString(studentName);
                if (students.has(studentNorm)) {
                    finalStudentName = studentMap.get(studentNorm);
                } else {
                    const match = findBestMatch(studentName, Array.from(studentMap.values()));
                    if (match.score >= 0.85) {
                        fuzzyMatches.push({ type: 'student', csv: studentName, database: match.match, score: match.score });
                        finalStudentName = match.match;
                    } else {
                        newStudents.add(studentName);
                    }
                }

                const teacherNorm = normalizeString(teacherName);
                if (teachers.has(teacherNorm)) {
                    finalTeacherName = teacherMap.get(teacherNorm);
                } else {
                    const match = findBestMatch(teacherName, Array.from(teacherMap.values()));
                    if (match.score >= 0.85) {
                        fuzzyMatches.push({ type: 'teacher', csv: teacherName, database: match.match, score: match.score });
                        finalTeacherName = match.match;
                    } else {
                        newTeachers.add(teacherName);
                    }
                }

                const classNorm = normalizeString(className);
                if (classes.has(classNorm)) {
                    finalClassName = classMap.get(classNorm);
                } else {
                    const match = findBestMatch(className, Array.from(classMap.values()));
                    if (match.score >= 0.85) {
                        fuzzyMatches.push({ type: 'class', csv: className, database: match.match, score: match.score });
                        finalClassName = match.match;
                    } else {
                        newClasses.add(className);
                    }
                }

                const statusMap = {
                    'present': 'present',
                    'late': 'late',
                    'absent': 'absent',
                    'hadir': 'present',
                    'terlambat': 'late',
                    'tidak hadir': 'absent'
                };

                const timeSlotMap = {
                    'afternoon': 'afternoon',
                    'evening': 'evening',
                    'sore': 'afternoon',
                    'malam': 'evening'
                };

                const mappedTimeSlot = timeSlotMap[timeSlot] || 'afternoon';
                const mappedStatus = statusMap[status] || 'present';

                const record = {
                    teacher_name: finalTeacherName,
                    class_name: finalClassName,
                    program: 'Campus & Career',
                    level: 'Starter',
                    phase: 'phase1',
                    day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()],
                    time_slot: mappedTimeSlot,
                    week_number: getWeekNumber(date),
                    year: date.getFullYear(),
                    student_id: `IMPORT_${String(i + 1).padStart(4, '0')}`,
                    student_name: finalStudentName,
                    status: mappedStatus,
                    created_at: date.toISOString()
                };

                processedRecords.push(record);
            }

            // Store stats for display
            setImportAttendanceStats({
                total: jsonData.length,
                valid: processedRecords.length,
                warnings: warnings.length,
                fuzzyMatches: fuzzyMatches.length,
                newStudents: newStudents.size,
                newTeachers: newTeachers.size,
                newClasses: newClasses.size
            });

            if (processedRecords.length === 0) {
                toast.error('No valid records to import');
                setLoading(false);
                return;
            }

            // Import to database
            const result = await bulkCreateAttendance(processedRecords);

            setResults({
                type: 'import-attendance',
                success: result.success,
                failed: result.failed,
                total: processedRecords.length,
                stats: {
                    fuzzyMatches: fuzzyMatches.length,
                    newStudents: newStudents.size,
                    newTeachers: newTeachers.size,
                    newClasses: newClasses.size
                }
            });

            toast.success(`Imported ${result.success.length} attendance records!`);

            if (result.failed.length > 0) {
                toast.error(`${result.failed.length} records failed to import`);
            }

        } catch (error) {
            console.error('Bulk import attendance error:', error);
            toast.error('Failed to import attendance: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mt-12 mb-4">
                {/* Simple Header */}
                <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Upload size={20} className="text-gray-700" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Bulk Operations</h2>
                            <p className="text-xs sm:text-sm text-gray-500">Import, assign, and manage data efficiently</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Clean Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex overflow-x-auto scrollbar-hide px-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setResults(null);
                                    }}
                                    className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap relative ${activeTab === tab.id
                                        ? 'text-gray-900 bg-white'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-140px)] bg-gray-50">
                    {/* Import Students Tab */}
                    {activeTab === 'import-students' && (
                        <div className="space-y-4">
                            {/* Info Card */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} className="text-blue-600" />
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div>• <strong>full_name</strong> - Student's full name</div>
                                    <div>• <strong>email</strong> - Unique email address</div>
                                    <div>• <strong>batch</strong> - Batch number (1, 2, 3...)</div>
                                    <div>• <strong>phone</strong> - Phone number (optional)</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('import')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 text-sm"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium cursor-pointer transition-colors text-sm">
                                    <Upload size={16} />
                                    Upload Excel File
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'import')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {importPreview.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-900 text-sm">Preview (First 5 rows)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Full Name</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Email</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Batch</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-3 sm:px-4 py-2">{row.full_name}</td>
                                                        <td className="px-3 sm:px-4 py-2 text-gray-600">{row.email}</td>
                                                        <td className="px-3 sm:px-4 py-2">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                                Batch {row.batch}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-gray-600">{row.phone || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <button
                                            onClick={handleBulkImportStudents}
                                            disabled={loading}
                                            className="w-full px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Import {importPreview.length}+ Students
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assign to Class Tab */}
                    {activeTab === 'assign-class' && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} className="text-orange-600" />
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div>• <strong>student_id</strong> - Student ID</div>
                                    <div>• <strong>class_name</strong> - Class name</div>
                                    <div>• <strong>program</strong> - Program name</div>
                                    <div>• <strong>level</strong> - Level</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('assign')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 text-sm"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium cursor-pointer transition-colors text-sm">
                                    <Upload size={16} />
                                    Upload Excel File
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'assign')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {assignPreview.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-900 text-sm">Preview (First 5 rows)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Student ID</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Class</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Program</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Level</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-3 sm:px-4 py-2 font-mono text-xs">{row.student_id}</td>
                                                        <td className="px-3 sm:px-4 py-2 font-medium">{row.class_name}</td>
                                                        <td className="px-3 sm:px-4 py-2 text-gray-600">{row.program}</td>
                                                        <td className="px-3 sm:px-4 py-2">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                                {row.level}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <button
                                            onClick={handleBulkAssignToClass}
                                            disabled={loading}
                                            className="w-full px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Assigning...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Assign {assignPreview.length}+ Students
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import Attendance Tab (NEW) */}
                    {activeTab === 'import-attendance' && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                    <Calendar size={16} className="text-blue-600" />
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div>• <strong>date</strong> - Date (e.g., "Friday,Feb 6th 2026")</div>
                                    <div>• <strong>time</strong> - afternoon or evening</div>
                                    <div>• <strong>teacher</strong> - Teacher name</div>
                                    <div>• <strong>class</strong> - Class name</div>
                                    <div>• <strong>name</strong> - Student name</div>
                                    <div>• <strong>present or absent</strong> - Status</div>
                                </div>
                                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                                    <p className="text-xs text-gray-700 font-medium mb-2">✨ Smart Features:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>• Auto-match similar names (85%+ similarity)</li>
                                        <li>• Support CSV with comma (,) or semicolon (;)</li>
                                        <li>• Detect and correct typos automatically</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('import-attendance')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 text-sm"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium cursor-pointer transition-colors text-sm">
                                    <Upload size={16} />
                                    Upload Excel/CSV File
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'import-attendance')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {importAttendancePreview.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-900 text-sm">Preview (First 5 rows)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Date</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Teacher</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Class</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Student</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importAttendancePreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-3 sm:px-4 py-2 text-xs">{row.date}</td>
                                                        <td className="px-3 sm:px-4 py-2">{row.teacher}</td>
                                                        <td className="px-3 sm:px-4 py-2 font-medium">{row.class}</td>
                                                        <td className="px-3 sm:px-4 py-2">{row.name}</td>
                                                        <td className="px-3 sm:px-4 py-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row['present or absent'] === 'present' ? 'bg-green-100 text-green-700' :
                                                                row['present or absent'] === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {row['present or absent']?.toUpperCase() || 'PRESENT'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {importAttendanceStats && (
                                        <div className="p-4 bg-blue-50 border-t border-blue-200">
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-blue-600">{importAttendanceStats.fuzzyMatches}</div>
                                                    <div className="text-xs text-gray-600">Auto-matched</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-600">{importAttendanceStats.newStudents}</div>
                                                    <div className="text-xs text-gray-600">New Students</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-orange-600">{importAttendanceStats.newTeachers}</div>
                                                    <div className="text-xs text-gray-600">New Teachers</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <button
                                            onClick={handleBulkImportAttendance}
                                            disabled={loading}
                                            className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Import {importAttendancePreview.length}+ Records
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Edit Attendance Tab */}
                    {activeTab === 'edit-attendance' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} className="text-amber-600" />
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                                    <div>• <strong>id</strong> - Attendance record ID</div>
                                    <div>• <strong>status</strong> - present, late, or absent</div>
                                    <div className="sm:col-span-2">• <strong>notes</strong> - Reason for change (optional)</div>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    💡 Tip: Export attendance report first to get the record IDs
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('attendance')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 text-sm"
                                >
                                    <Download size={16} />
                                    Download Template
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium cursor-pointer transition-colors text-sm">
                                    <Upload size={16} />
                                    Upload Excel File
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'attendance')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {attendancePreview.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                                        <h4 className="font-semibold text-gray-900 text-sm">Preview (First 5 rows)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Record ID</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                                    <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendancePreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-3 sm:px-4 py-2 font-mono text-xs text-gray-600">{row.id}</td>
                                                        <td className="px-3 sm:px-4 py-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                row.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {row.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 text-gray-600">{row.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <button
                                            onClick={handleBulkEditAttendance}
                                            disabled={loading}
                                            className="w-full px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Update {attendancePreview.length}+ Records
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                                <h4 className="font-semibold text-gray-900 text-sm">Operation Results</h4>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-2xl font-bold text-gray-800">{results.total}</div>
                                        <div className="text-xs text-gray-600 font-medium mt-1">Total</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="text-2xl font-bold text-green-600">{results.success.length}</div>
                                        <div className="text-xs text-green-700 font-medium mt-1">Success</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="text-2xl font-bold text-red-600">{results.failed.length}</div>
                                        <div className="text-xs text-red-700 font-medium mt-1">Failed</div>
                                    </div>
                                </div>

                                {results.failed.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <h5 className="font-semibold text-red-800 mb-2 text-sm">Failed Records</h5>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                            {results.failed.map((fail, idx) => (
                                                <div key={idx} className="text-xs text-red-700 bg-white p-2 rounded border border-red-100">
                                                    {fail.error || JSON.stringify(fail)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.success.length > 0 && results.failed.length === 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                        <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                                        <p className="text-green-800 font-medium text-sm">All operations completed successfully!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkOperations;
