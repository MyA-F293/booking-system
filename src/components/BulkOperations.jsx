import { useState } from 'react';
import { Upload, Users, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from './Toast';
import { bulkCreateUsers, bulkAssignStudentsToClass, bulkUpdateAttendance, getClasses } from '../utils/dbHelpers';

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

    const tabs = [
        { id: 'import-students', label: 'Import Students', icon: Users },
        { id: 'assign-class', label: 'Assign to Class', icon: FileSpreadsheet },
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
                setImportPreview(jsonData.slice(0, 5)); // Preview first 5 rows
            } else if (type === 'assign') {
                setAssignFile(file);
                setAssignPreview(jsonData.slice(0, 5));
            } else if (type === 'attendance') {
                setAttendanceFile(file);
                setAttendancePreview(jsonData.slice(0, 5));
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

            // Validate required fields
            const requiredFields = ['full_name', 'email', 'batch'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            // Transform data for database
            const students = jsonData.map(row => ({
                full_name: row.full_name,
                email: row.email,
                batch: parseInt(row.batch),
                phone: row.phone || null,
                role: 'student'
            }));

            // Bulk create users
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

            // Validate required fields
            const requiredFields = ['student_id', 'class_name', 'program', 'level'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            // Bulk assign
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

            // Validate required fields
            const requiredFields = ['id', 'status'];
            const missingFields = requiredFields.filter(field =>
                !jsonData[0] || !jsonData[0].hasOwnProperty(field)
            );

            if (missingFields.length > 0) {
                toast.error(`Missing required columns: ${missingFields.join(', ')}`);
                setLoading(false);
                return;
            }

            // Validate status values
            const validStatuses = ['present', 'late', 'absent'];
            const invalidRows = jsonData.filter(row =>
                !validStatuses.includes(row.status.toLowerCase())
            );

            if (invalidRows.length > 0) {
                toast.error(`Invalid status values found. Use: present, late, or absent`);
                setLoading(false);
                return;
            }

            // Bulk update
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
        }

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, filename);

        toast.success('Template downloaded!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border-2 border-orange-100 animate-slideUp">
                {/* Modern Header with Admin Theme */}
                <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-4 sm:p-6 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all hover:rotate-90 duration-300 group z-10"
                        title="Close"
                    >
                        <X size={20} className="text-white group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Upload size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white font-montserrat">Bulk Operations</h2>
                                <p className="text-white/90 text-xs sm:text-sm font-poppins">Import, assign, and manage data efficiently</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setResults(null);
                                    }}
                                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap relative group ${activeTab === tab.id
                                        ? 'text-orange-600 bg-white'
                                        : 'text-gray-600 hover:text-orange-500 hover:bg-white/50'
                                        }`}
                                >
                                    <Icon size={16} className={`sm:w-[18px] sm:h-[18px] transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-orange-600' : ''}`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                                    {/* Active indicator */}
                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-full"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30">
                    {/* Import Students Tab */}
                    {activeTab === 'import-students' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-3 sm:p-4 shadow-sm">
                                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <div className="p-1.5 bg-blue-200 rounded-lg">
                                        <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-800">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                        <div><strong>full_name</strong> - Student's full name</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                        <div><strong>email</strong> - Unique email address</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                        <div><strong>batch</strong> - Batch number (1, 2, 3...)</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                        <div><strong>phone</strong> - Phone number (optional)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('import')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow group"
                                >
                                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Download Template</span>
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg group">
                                    <Upload size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Upload Excel File</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'import')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {importPreview.length > 0 && (
                                <div className="bg-white rounded-xl border-2 border-orange-100 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
                                        <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                            <FileSpreadsheet size={18} />
                                            Preview (First 5 rows)
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-orange-50">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Full Name</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Email</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Batch</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-orange-100 hover:bg-orange-50/50 transition-colors">
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3">{row.full_name}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600">{row.email}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                                                Batch {row.batch}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600">{row.phone || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-orange-50/50">
                                        <button
                                            onClick={handleBulkImportStudents}
                                            disabled={loading}
                                            className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Importing Students...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={20} />
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
                        <div className="space-y-4 sm:space-y-6">
                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-3 sm:p-4 shadow-sm">
                                <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <div className="p-1.5 bg-purple-200 rounded-lg">
                                        <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-purple-800">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-purple-600" />
                                        <div><strong>student_id</strong> - Student ID (EYSA2601001)</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-purple-600" />
                                        <div><strong>class_name</strong> - Class name</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-purple-600" />
                                        <div><strong>program</strong> - Program name</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-purple-600" />
                                        <div><strong>level</strong> - Level (Beginner, etc.)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('assign')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow group"
                                >
                                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Download Template</span>
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg group">
                                    <Upload size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Upload Excel File</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'assign')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {assignPreview.length > 0 && (
                                <div className="bg-white rounded-xl border-2 border-purple-100 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                                        <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                            <Users size={18} />
                                            Preview (First 5 rows)
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-purple-50">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-purple-900">Student ID</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-purple-900">Class</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-purple-900">Program</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-purple-900">Level</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-purple-100 hover:bg-purple-50/50 transition-colors">
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs">{row.student_id}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold">{row.class_name}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600">{row.program}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                                                {row.level}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-purple-50/50">
                                        <button
                                            onClick={handleBulkAssignToClass}
                                            disabled={loading}
                                            className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Assigning Students...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={20} />
                                                    Assign {assignPreview.length}+ Students
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
                        <div className="space-y-4 sm:space-y-6">
                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-orange-200 rounded-xl p-3 sm:p-4 shadow-sm">
                                <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <div className="p-1.5 bg-orange-200 rounded-lg">
                                        <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    Required Columns
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-orange-800">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-600" />
                                        <div><strong>id</strong> - Attendance record ID</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-600" />
                                        <div><strong>status</strong> - present, late, or absent</div>
                                    </div>
                                    <div className="flex items-start gap-2 sm:col-span-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-600" />
                                        <div><strong>notes</strong> - Reason for change (optional)</div>
                                    </div>
                                </div>
                                <div className="mt-3 p-2 bg-orange-200/50 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-700" />
                                    <p className="text-xs text-orange-800">
                                        <strong>Tip:</strong> Export attendance report first to get the record IDs
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => downloadTemplate('attendance')}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow group"
                                >
                                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Download Template</span>
                                </button>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg group">
                                    <Upload size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">Upload Excel File</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'attendance')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {attendancePreview.length > 0 && (
                                <div className="bg-white rounded-xl border-2 border-orange-100 shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
                                        <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                            <CheckCircle size={18} />
                                            Preview (First 5 rows)
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs sm:text-sm">
                                            <thead className="bg-orange-50">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Record ID</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Status</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold text-orange-900">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendancePreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-orange-100 hover:bg-orange-50/50 transition-colors">
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-gray-600">{row.id}</td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${row.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                row.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {row.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600">{row.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-orange-50/50">
                                        <button
                                            onClick={handleBulkEditAttendance}
                                            disabled={loading}
                                            className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Updating Records...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={20} />
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
                        <div className="bg-white rounded-xl border-2 border-orange-200 shadow-lg overflow-hidden animate-slideUp">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 sm:px-6 py-3 sm:py-4">
                                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Operation Results
                                </h4>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                                        <div className="text-2xl sm:text-3xl font-bold text-gray-800">{results.total}</div>
                                        <div className="text-xs sm:text-sm text-gray-600 font-semibold mt-1">Total</div>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                                        <div className="text-2xl sm:text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                                            <CheckCircle size={20} className="hidden sm:inline" />
                                            {results.success.length}
                                        </div>
                                        <div className="text-xs sm:text-sm text-green-700 font-semibold mt-1">Success</div>
                                    </div>
                                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200">
                                        <div className="text-2xl sm:text-3xl font-bold text-red-600 flex items-center justify-center gap-1">
                                            <AlertCircle size={20} className="hidden sm:inline" />
                                            {results.failed.length}
                                        </div>
                                        <div className="text-xs sm:text-sm text-red-700 font-semibold mt-1">Failed</div>
                                    </div>
                                </div>

                                {results.failed.length > 0 && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4">
                                        <h5 className="font-bold text-red-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                                            <AlertCircle size={16} />
                                            Failed Records
                                        </h5>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {results.failed.map((fail, idx) => (
                                                <div key={idx} className="text-xs sm:text-sm text-red-700 bg-white p-2 sm:p-3 rounded-lg border border-red-200">
                                                    {fail.error || JSON.stringify(fail)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.success.length > 0 && results.failed.length === 0 && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 text-center">
                                        <CheckCircle size={32} className="mx-auto text-green-600 mb-2" />
                                        <p className="text-green-800 font-bold text-sm sm:text-base">All operations completed successfully!</p>
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
