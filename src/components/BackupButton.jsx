import { useState } from 'react';
import { Cloud, CheckCircle, Loader2, AlertCircle, Database, FileSpreadsheet, X, ExternalLink } from 'lucide-react';
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

        Object.keys(data).forEach(tableName => {
            const tableData = data[tableName];

            if (tableData.length > 0) {
                const ws = XLSX.utils.json_to_sheet(tableData);
                XLSX.utils.book_append_sheet(wb, ws, tableName);
            }
        });

        const metadata = [{
            backup_date: new Date().toISOString(),
            backup_type: 'Full Database Backup',
            tables_included: Object.keys(data).join(', '),
            total_records: Object.values(data).reduce((sum, table) => sum + table.length, 0),
            backup_by: 'Admin Dashboard'
        }];

        const metaWs = XLSX.utils.json_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Backup Info');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `EYSA_Backup_${timestamp}.xlsx`;

        XLSX.writeFile(wb, filename);

        return {
            filename,
            totalRecords: Object.values(data).reduce((sum, table) => sum + table.length, 0),
            tables: Object.keys(data).length,
            tableDetails: Object.keys(data).map(name => ({
                name,
                records: data[name].length
            }))
        };
    };

    const handleBackup = async () => {
        setLoading(true);
        setShowModal(true);

        try {
            toast.info('Starting backup...');

            const data = await fetchAllData();
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
                className="relative group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all font-semibold text-[10px] sm:text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                title="Backup Database to Google Drive"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative flex items-center gap-1 sm:gap-2">
                    {loading ? (
                        <>
                            <Loader2 size={12} className="sm:w-4 sm:h-4 animate-spin" />
                            <span className="hidden lg:inline">Backing up...</span>
                        </>
                    ) : (
                        <>
                            <Cloud size={12} className="sm:w-4 sm:h-4" />
                            <span className="hidden lg:inline">Backup</span>
                        </>
                    )}
                </div>
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                        {loading ? (
                            <div className="p-8">
                                <div className="text-center">
                                    <div className="relative w-20 h-20 mx-auto mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-ping opacity-20"></div>
                                        <div className="relative w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <Database size={32} className="text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Creating Backup</h3>
                                    <p className="text-gray-600">Fetching data from database...</p>
                                    <div className="mt-6 flex justify-center">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : backupResult?.success ? (
                            <div>
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <CheckCircle size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Backup Successful!</h3>
                                                <p className="text-green-100 text-sm">Database backed up successfully</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FileSpreadsheet size={20} className="text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-500 font-medium">Backup File</p>
                                                <p className="text-sm font-semibold text-gray-800 truncate">{backupResult.filename}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <p className="text-xs text-gray-500 mb-1">Total Tables</p>
                                                <p className="text-2xl font-bold text-gray-800">{backupResult.tables}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <p className="text-xs text-gray-500 mb-1">Total Records</p>
                                                <p className="text-2xl font-bold text-blue-600">{backupResult.totalRecords}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                            <p className="text-xs font-semibold text-gray-700">Backup Contents</p>
                                        </div>
                                        <div className="p-3 max-h-40 overflow-y-auto">
                                            <div className="space-y-2">
                                                {backupResult.tableDetails?.map((table, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                        <span className="text-sm text-gray-700 font-medium">{table.name}</span>
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                                                            {table.records} rows
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Cloud size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-1">Upload to Google Drive</h4>
                                                <p className="text-xs text-gray-600">
                                                    File downloaded successfully. Upload it to Google Drive for safe storage.
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={backupResult.driveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg group"
                                        >
                                            <span>Open Google Drive Folder</span>
                                            <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </div>

                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <AlertCircle size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Backup Failed</h3>
                                                <p className="text-red-100 text-sm">Something went wrong</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-red-800">{backupResult?.error || 'Unknown error occurred'}</p>
                                    </div>

                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default BackupButton;
