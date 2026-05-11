import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../supabaseClient';

const StudentAttendanceHistory = ({ user }) => {
    const toast = useToast();
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMyAttendance();
    }, []);

    const fetchMyAttendance = async () => {
        setLoading(true);
        try {
            console.log('🔍 Fetching attendance for student:', user.student_id);

            // Fetch attendance from Supabase database
            const { data: attendanceRecords, error } = await supabase
                .from('attendance')
                .select(`
                    *,
                    schedules (
                        class_name,
                        day,
                        teacher_name
                    )
                `)
                .eq('student_id', user.student_id)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching attendance:', error);
                throw error;
            }

            console.log('📊 Found attendance records:', attendanceRecords?.length || 0);

            // Transform data to match old format
            const transformedData = (attendanceRecords || []).map(record => ({
                timestamp: record.date,
                className: record.schedules?.class_name || 'Unknown Class',
                day: record.schedules?.day || 'Unknown',
                teacherName: record.schedules?.teacher_name || 'TBA',
                status: record.status,
                studentId: record.student_id
            }));

            setAttendanceData(transformedData);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to load attendance history');
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: attendanceData.length,
        present: attendanceData.filter(r => r.status === 'present').length,
        late: attendanceData.filter(r => r.status === 'late').length,
        absent: attendanceData.filter(r => r.status === 'absent').length,
    };

    const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">My Attendance History</h2>
                <p className="text-xs sm:text-sm text-gray-600">Track your class attendance and performance</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-[#1F4E8C]">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-[#1F4E8C] w-5 h-5" />
                        <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-600 w-5 h-5" />
                        <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Present</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-5 shadow-md border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-yellow-600 w-5 h-5" />
                        <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Late</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <div className="bg-gradient-to-br from-[#1F4E8C] to-[#163a6b] rounded-xl p-3 sm:p-5 shadow-md text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <p className="text-[10px] sm:text-xs opacity-90 font-medium">Rate</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{attendanceRate}%</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-[#1F4E8C] to-[#163a6b] text-white">
                    <h3 className="text-base sm:text-lg font-bold">Attendance Records</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Class</th>
                                <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Teacher</th>
                                <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : attendanceData.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Calendar size={48} className="text-gray-300" />
                                            <p className="text-sm font-semibold">No attendance records found</p>
                                            <p className="text-xs">Your attendance will appear here after classes</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attendanceData.map((record, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-[10px] sm:text-sm text-gray-700">
                                            {new Date(record.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-[10px] sm:text-sm font-semibold text-gray-800">{record.className}</div>
                                            <div className="text-[9px] sm:text-xs text-gray-500">{record.day}</div>
                                        </td>
                                        <td className="px-3 py-2 text-[10px] sm:text-sm text-gray-700">{record.teacherName}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded-full text-[9px] sm:text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-700' :
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

            {stats.total > 0 && (
                <div className={`rounded-xl p-4 ${attendanceRate >= 80 ? 'bg-green-50 border-2 border-green-200' :
                        attendanceRate >= 60 ? 'bg-yellow-50 border-2 border-yellow-200' :
                            'bg-red-50 border-2 border-red-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">
                            {attendanceRate >= 80 ? '🎉' : attendanceRate >= 60 ? '💪' : '📚'}
                        </div>
                        <div>
                            <h4 className={`text-sm sm:text-base font-bold mb-1 ${attendanceRate >= 80 ? 'text-green-800' :
                                    attendanceRate >= 60 ? 'text-yellow-800' :
                                        'text-red-800'
                                }`}>
                                {attendanceRate >= 80 ? 'Excellent Attendance!' :
                                    attendanceRate >= 60 ? 'Good Job! Keep It Up!' :
                                        'Let\'s Improve Together!'}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-700">
                                {attendanceRate >= 80 ? 'You\'re doing amazing! Keep up the great work!' :
                                    attendanceRate >= 60 ? 'You\'re on the right track! Try to attend all classes.' :
                                        'Regular attendance is key to success. We believe in you!'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAttendanceHistory;
