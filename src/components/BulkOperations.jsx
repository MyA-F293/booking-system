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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#A1B2CD] to-[#8a9bb8] p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">Bulk Operations</h2>
                    <p className="text-white/80 text-sm">Import, assign, and manage data in bulk</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setResults(null);
                                    }}
                                    className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'text-[#A1B2CD] border-b-2 border-[#A1B2CD] bg-white'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Import Students Tab */}
                    {activeTab === 'import-students' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    Required Columns
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• <strong>full_name</strong> - Student's full name</li>
                                    <li>• <strong>email</strong> - Student's email (must be unique)</li>
                                    <li>• <strong>batch</strong> - Batch number (e.g., 1, 2, 3)</li>
                                    <li>• <strong>phone</strong> - Phone number (optional)</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => downloadTemplate('import')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    <Download size={18} />
                                    Download Template
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-[#A1B2CD] hover:bg-[#8a9bb8] text-white rounded-xl font-semibold cursor-pointer transition-colors">
                                    <Upload size={18} />
                                    Upload Excel
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'import')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {importPreview.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3">Preview (First 5 rows)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Full Name</th>
                                                    <th className="px-4 py-2 text-left">Email</th>
                                                    <th className="px-4 py-2 text-left">Batch</th>
                                                    <th className="px-4 py-2 text-left">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="px-4 py-2">{row.full_name}</td>
                                                        <td className="px-4 py-2">{row.email}</td>
                                                        <td className="px-4 py-2">{row.batch}</td>
                                                        <td className="px-4 py-2">{row.phone || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={handleBulkImportStudents}
                                        disabled={loading}
                                        className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Import Students
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assign to Class Tab */}
                    {activeTab === 'assign-class' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    Required Columns
                                </h3>
                                <ul className="text-sm text-purple-800 space-y-1">
                                    <li>• <strong>student_id</strong> - Student ID (e.g., EYSA2601001)</li>
                                    <li>• <strong>class_name</strong> - Class name</li>
                                    <li>• <strong>program</strong> - Program name (e.g., English)</li>
                                    <li>• <strong>level</strong> - Level (e.g., Beginner, Intermediate)</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => downloadTemplate('assign')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    <Download size={18} />
                                    Download Template
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-[#A1B2CD] hover:bg-[#8a9bb8] text-white rounded-xl font-semibold cursor-pointer transition-colors">
                                    <Upload size={18} />
                                    Upload Excel
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'assign')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {assignPreview.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3">Preview (First 5 rows)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Student ID</th>
                                                    <th className="px-4 py-2 text-left">Class</th>
                                                    <th className="px-4 py-2 text-left">Program</th>
                                                    <th className="px-4 py-2 text-left">Level</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignPreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="px-4 py-2">{row.student_id}</td>
                                                        <td className="px-4 py-2">{row.class_name}</td>
                                                        <td className="px-4 py-2">{row.program}</td>
                                                        <td className="px-4 py-2">{row.level}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={handleBulkAssignToClass}
                                        disabled={loading}
                                        className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Assign to Classes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Edit Attendance Tab */}
                    {activeTab === 'edit-attendance' && (
                        <div className="space-y-6">
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    Required Columns
                                </h3>
                                <ul className="text-sm text-orange-800 space-y-1">
                                    <li>• <strong>id</strong> - Attendance record ID (from export)</li>
                                    <li>• <strong>status</strong> - New status (present, late, or absent)</li>
                                    <li>• <strong>notes</strong> - Reason for change (optional)</li>
                                </ul>
                                <p className="text-xs text-orange-700 mt-2">
                                    💡 Tip: Export attendance report first to get the IDs
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => downloadTemplate('attendance')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    <Download size={18} />
                                    Download Template
                                </button>
                                <label className="flex items-center gap-2 px-4 py-2 bg-[#A1B2CD] hover:bg-[#8a9bb8] text-white rounded-xl font-semibold cursor-pointer transition-colors">
                                    <Upload size={18} />
                                    Upload Excel
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => handleFileUpload(e.target.files[0], 'attendance')}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {attendancePreview.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3">Preview (First 5 rows)</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">ID</th>
                                                    <th className="px-4 py-2 text-left">Status</th>
                                                    <th className="px-4 py-2 text-left">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendancePreview.map((row, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="px-4 py-2 font-mono text-xs">{row.id}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                    row.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                }`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2">{row.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={handleBulkEditAttendance}
                                        disabled={loading}
                                        className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Update Attendance
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-3">Results</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-white rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.total}</div>
                                    <div className="text-xs text-gray-600">Total</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{results.success.length}</div>
                                    <div className="text-xs text-green-700">Success</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{results.failed.length}</div>
                                    <div className="text-xs text-red-700">Failed</div>
                                </div>
                            </div>

                            {results.failed.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="font-semibold text-red-700 mb-2">Failed Records:</h5>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {results.failed.map((fail, idx) => (
                                            <div key={idx} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                                {fail.error || JSON.stringify(fail)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkOperations;
