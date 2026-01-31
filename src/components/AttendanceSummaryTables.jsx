import React from 'react';

// Student Summary Table
export const StudentSummaryTable = ({ data, loading }) => (
    <table className="w-full">
        <thead className="bg-gray-50">
            <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Student</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Class</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Present</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Late</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Absent</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Rate</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {loading ? (
                <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Loading...
                    </td>
                </tr>
            ) : data.length === 0 ? (
                <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No student data found
                    </td>
                </tr>
            ) : (
                data.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#A1B2CD] to-[#8a9bb8] flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-800 leading-tight">{student.studentName}</div>
                                    <div className="text-[8px] sm:text-xs text-gray-500">{student.studentId}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                            <span className="text-[9px] sm:text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{student.className}</span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="text-[11px] sm:text-sm font-bold text-[#A1B2CD]">{student.total}</span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {student.present}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {student.late}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {student.absent}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                                <span className="text-[11px] sm:text-sm font-bold text-gray-800">{student.attendanceRate}%</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 max-w-[70px]">
                                    <div
                                        className={`h-full rounded-full transition-all ${student.attendanceRate >= 80 ? 'bg-green-500' :
                                            student.attendanceRate >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${student.attendanceRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
);

// Class Summary Table
export const ClassSummaryTable = ({ data, loading }) => (
    <table className="w-full">
        <thead className="bg-gray-50">
            <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Class</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Students</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Total Records</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Present</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Late</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Absent</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Rate</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {loading ? (
                <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Loading...
                    </td>
                </tr>
            ) : data.length === 0 ? (
                <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No class data found
                    </td>
                </tr>
            ) : (
                data.map((cls, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0">
                                    🏫
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-800 leading-tight">{cls.className}</div>
                                    <div className="text-[8px] sm:text-xs text-gray-500">{cls.program} • {cls.level}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] sm:text-xs font-semibold">
                                {cls.studentCount}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="text-[11px] sm:text-sm font-bold text-[#A1B2CD]">{cls.total}</span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {cls.present}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {cls.late}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {cls.absent}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                                <span className="text-[11px] sm:text-sm font-bold text-gray-800">{cls.attendanceRate}%</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 max-w-[70px]">
                                    <div
                                        className={`h-full rounded-full transition-all ${cls.attendanceRate >= 80 ? 'bg-green-500' :
                                            cls.attendanceRate >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${cls.attendanceRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
);

// Date Summary Table
export const DateSummaryTable = ({ data, loading }) => (
    <table className="w-full">
        <thead className="bg-gray-50">
            <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Classes</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Students</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Present</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Late</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Absent</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase">Rate</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
            {loading ? (
                <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        Loading...
                    </td>
                </tr>
            ) : data.length === 0 ? (
                <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        No date data found
                    </td>
                </tr>
            ) : (
                data.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl flex-shrink-0">
                                    📅
                                </div>
                                <div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-800 leading-tight">{day.date}</div>
                                    <div className="text-[8px] sm:text-xs text-gray-500">{new Date(day.rawDate).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] sm:text-xs font-semibold">
                                {day.classCount}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-[9px] sm:text-xs font-semibold">
                                {day.studentCount}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="text-[11px] sm:text-sm font-bold text-[#A1B2CD]">{day.total}</span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {day.present}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {day.late}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] sm:text-xs font-semibold inline-block min-w-[35px]">
                                {day.absent}
                            </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                                <span className="text-[11px] sm:text-sm font-bold text-gray-800">{day.attendanceRate}%</span>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 max-w-[70px]">
                                    <div
                                        className={`h-full rounded-full transition-all ${day.attendanceRate >= 80 ? 'bg-green-500' :
                                            day.attendanceRate >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${day.attendanceRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))
            )}
        </tbody>
    </table>
);
