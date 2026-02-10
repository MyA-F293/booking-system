import { useState } from 'react';
import { Download, Cloud, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const BackupButton = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [backupResult, setBackupResult] = useState(null);

    const fetchAllData = async () => {
        const tables = ['users', 'teachers', 'schedules', 'bookings', 'attendance', 'classes'];
        const data = {};

        for (const table of tables) {
            try {
                const { data: tableData, error } = await supabase
                    .from(table)
                    .select('*');

                if (error) {
                    console.error(`Error fetching ${table}:`, error);
                    data[table] = [];
                } else {
                    data[table] = tableData || [];
                }
            } catch (error) {
                console.error(`Exception fetching ${table}:`, error);
                data[table] = [];
            }
        }

        return data;
    };

    const createExcelBackup = (data) => {
        const wb = XLSX.utils.book_new();

        // Add each table as a sheet
        Object.keys(data).forEach(tableName => {
            const tableData = data[tableName];

            if (tableData.length > 0) {
                const ws = XLSX.utils.json_to_sheet(tableData);
                XLSX.utils.book_append_sheet(wb, ws, tableName);
            }
        });

        // Add metadata sheet
        const metadata = [{
            backup_date: new Date().toISOString(),
            backup_type: 'Full Database Backup',
            tables_included: Object.keys(data).join(', '),
            total_records: Object.values(data).reduce((sum, table) => sum + table.length, 0),
            backup_by: 'Admin Dashboard'
        }];

        const metaWs = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Backup Info');

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `EYSA_Backup_${timestamp}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);

        return {
            filename,
            totalRecords: Object.values(data).reduce((sum, table) => sum + table.length, 0),
            tables: Object.keys(data).length
        };
    };

    const handleBackup = async () => {
        setLoading(true);
        setShowModal(true);

        try {
            toast.info('Starting backup...');

            // Fetch all data
            const data = await fetchAllData();

            // Create Excel file
            const result = createExcelBackup(data);

            setBackupResult({
                success: true,
                ...result,
                driveUrl: 'https://drive.google.com/drive/folders/1AGBa-LlJD1K-HBsiIhCpj83_Ui07UsFw'
            });

            toast.success('Backup created successfully!');

        } catch (error) {
            console.error('Backup error:', error);
            setBackupResult({
                success: false,
                error: error.message
            });
            toast.error('Backup failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleBackup}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                title="Backup Database to Google Drive"
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Backing up...</span>
                    </>
                ) : (
                    <>
                        <Cloud size={16} />
                        <span className="hidden sm:inline">Backup to Drive</span>
                        <span className="sm:hidden">Backup</span>
                    </>
                )}
            </button>

            {/* Backup Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        {loading ? (
                            <div className="text-center">
                                <Loader2 size={48} className="mx-auto text-blue-500 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Creating Backup...</h3>
                                <p className="text-sm text-gray-600">Please wait while we backup your data</p>
                            </div>
                        ) : backupResult?.success ? (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle size={32} className="text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Backup Successful!</h3>
                                    <p className="text-sm text-gray-600">Your database has been backed up</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">File:</span>
                                        <span className="font-medium text-gray-800">{backupResult.filename}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tables:</span>
                                        <span className="font-medium text-gray-800">{backupResult.tables}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Records:</span>
                                        <span className="font-medium text-gray-800">{backupResult.totalRecords}</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h4 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">
                                        <Cloud size={16} />
                                        Upload to Google Drive
                                    </h4>
                                    <p className="text-xs text-blue-800 mb-3">
                                        File has been downloaded. Please upload it to Google Drive:
                                    </p>
                                    <a
                                        href={backupResult.driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-center transition-colors text-sm"
                                    >
                                        Open Google Drive Folder
                                    </a>
                                </div>

                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <AlertCircle size={32} className="text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Backup Failed</h3>
                                    <p className="text-sm text-gray-600">{backupResult?.error || 'Unknown error'}</p>
                                </div>

                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BackupButton;
