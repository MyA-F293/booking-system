import { useState } from 'react';
import { Download, Upload, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabaseClient';

const FullBackupButton = () => {
    const toast = useToast();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);

    // List of all tables to backup
    const TABLES = ['users', 'classes', 'schedules', 'bookings', 'attendance', 'teachers'];

    /**
     * Escape SQL values
     */
    const escapeSQLValue = (value) => {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (typeof value === 'number') return value;
        if (typeof value === 'object') {
            return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        }
        return `'${String(value).replace(/'/g, "''")}'`;
    };

    /**
     * Backup single table
     */
    const backupTable = async (tableName) => {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*');

            if (error) throw error;

            return {
                tableName,
                data: data || [],
                rowCount: data?.length || 0
            };
        } catch (err) {
            console.error(`Error backing up ${tableName}:`, err);
            return {
                tableName,
                data: [],
                rowCount: 0,
                error: err.message
            };
        }
    };

    /**
     * Perform full database backup
     */
    const handleFullBackup = async () => {
        setIsBackingUp(true);

        try {
            toast.info('🚀 Starting full database backup...');

            // Backup all tables
            const backupPromises = TABLES.map(table => backupTable(table));
            const results = await Promise.all(backupPromises);

            // Create JSON backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const jsonBackup = {
                timestamp: new Date().toISOString(),
                database: 'supabase',
                version: '1.0.0',
                tables: {}
            };

            let totalRows = 0;
            results.forEach(result => {
                jsonBackup.tables[result.tableName] = result.data;
                totalRows += result.rowCount;
            });

            // Generate SQL backup
            let sqlBackup = `-- ============================================\n`;
            sqlBackup += `-- EYSA Booking System - Full Database Backup\n`;
            sqlBackup += `-- Backup Date: ${new Date().toISOString()}\n`;
            sqlBackup += `-- Total Tables: ${TABLES.length}\n`;
            sqlBackup += `-- Total Rows: ${totalRows}\n`;
            sqlBackup += `-- ============================================\n\n`;

            results.forEach(result => {
                if (result.data.length === 0) {
                    sqlBackup += `-- Table ${result.tableName} is empty\n\n`;
                    return;
                }

                sqlBackup += `-- Backup for table: ${result.tableName}\n`;
                sqlBackup += `-- Total rows: ${result.rowCount}\n\n`;

                const columns = Object.keys(result.data[0]);
                result.data.forEach(row => {
                    const values = columns.map(col => escapeSQLValue(row[col])).join(', ');
                    sqlBackup += `INSERT INTO ${result.tableName} (${columns.join(', ')}) VALUES (${values});\n`;
                });
                sqlBackup += '\n\n';
            });

            // Download JSON file
            const jsonBlob = new Blob([JSON.stringify(jsonBackup, null, 2)], { type: 'application/json' });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const jsonLink = document.createElement('a');
            jsonLink.href = jsonUrl;
            jsonLink.download = `eysa-full-backup-${timestamp}.json`;
            document.body.appendChild(jsonLink);
            jsonLink.click();
            document.body.removeChild(jsonLink);
            URL.revokeObjectURL(jsonUrl);

            // Download SQL file
            const sqlBlob = new Blob([sqlBackup], { type: 'text/plain' });
            const sqlUrl = URL.createObjectURL(sqlBlob);
            const sqlLink = document.createElement('a');
            sqlLink.href = sqlUrl;
            sqlLink.download = `eysa-full-backup-${timestamp}.sql`;
            document.body.appendChild(sqlLink);
            sqlLink.click();
            document.body.removeChild(sqlLink);
            URL.revokeObjectURL(sqlUrl);

            toast.success(`✅ Backup completed! ${totalRows} rows backed up from ${TABLES.length} tables`);

        } catch (err) {
            console.error('Backup error:', err);
            toast.error('❌ Backup failed: ' + err.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    /**
     * Handle file selection for restore
     */
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.json')) {
                toast.error('Please select a JSON backup file');
                return;
            }
            setRestoreFile(file);
        }
    };

    /**
     * Restore database from backup file
     */
    const handleRestore = async () => {
        if (!restoreFile) {
            toast.error('Please select a backup file first');
            return;
        }

        setIsRestoring(true);

        try {
            // Read file
            const fileContent = await restoreFile.text();
            const backupData = JSON.parse(fileContent);

            toast.info('🔄 Starting database restore...');

            let totalInserted = 0;
            let totalErrors = 0;

            // Restore each table
            for (const [tableName, rows] of Object.entries(backupData.tables)) {
                if (rows.length === 0) continue;

                // Insert in batches of 100
                const batchSize = 100;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);

                    try {
                        const { error } = await supabase
                            .from(tableName)
                            .insert(batch);

                        if (error) {
                            console.error(`Error inserting into ${tableName}:`, error);
                            totalErrors += batch.length;
                        } else {
                            totalInserted += batch.length;
                        }
                    } catch (err) {
                        console.error(`Error: ${err.message}`);
                        totalErrors += batch.length;
                    }
                }
            }

            if (totalErrors > 0) {
                toast.warning(`⚠️ Restore completed with errors: ${totalInserted} inserted, ${totalErrors} failed`);
            } else {
                toast.success(`✅ Restore completed! ${totalInserted} rows restored`);
            }

            setShowRestoreModal(false);
            setRestoreFile(null);

        } catch (err) {
            console.error('Restore error:', err);
            toast.error('❌ Restore failed: ' + err.message);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <>
            {/* Full Backup Button */}
            <button
                onClick={handleFullBackup}
                disabled={isBackingUp}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {isBackingUp ? (
                        <Loader2 size={16} className="text-blue-600 animate-spin" />
                    ) : (
                        <Download size={16} className="text-blue-600" />
                    )}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                        {isBackingUp ? 'Backing up...' : 'Full Backup'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate">All tables (SQL+JSON)</div>
                </div>
            </button>

            {/* Restore Button */}
            <button
                onClick={() => setShowRestoreModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-purple-50 transition-colors"
            >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">Restore DB</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate">Upload backup</div>
                </div>
            </button>

            {/* Restore Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mt-12 mb-4">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Database size={24} className="text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Restore Database</h3>
                                    <p className="text-sm text-gray-500">Upload backup file to restore</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Warning */}
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-semibold mb-1">⚠️ Warning!</p>
                                        <p>This will INSERT data into your database. Make sure you have backed up your current data first!</p>
                                    </div>
                                </div>
                            </div>

                            {/* File Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Backup File (JSON)
                                </label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                {restoreFile && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle size={16} />
                                        <span>{restoreFile.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <p className="font-semibold mb-1">💡 Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Only JSON backup files are supported</li>
                                    <li>Restore process may take several minutes</li>
                                    <li>Duplicate entries will be skipped</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRestoreModal(false);
                                    setRestoreFile(null);
                                }}
                                disabled={isRestoring}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={!restoreFile || isRestoring}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isRestoring ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Restoring...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        <span>Restore Now</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FullBackupButton;
