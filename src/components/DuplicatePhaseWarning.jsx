import { AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const DuplicatePhaseWarning = ({ schedules, currentWeek }) => {
    const [duplicates, setDuplicates] = useState([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        detectDuplicates();
    }, [schedules, currentWeek]);

    const detectDuplicates = () => {
        // Map to track student bookings: studentId_phase -> classes
        const studentPhaseMap = {};
        const foundDuplicates = [];

        // Filter schedules for current week only
        const weekSchedules = schedules.filter(s => s.week_number === currentWeek);

        weekSchedules.forEach(schedule => {
            // Skip if no students
            if (!schedule.students || schedule.students.length === 0) return;

            schedule.students.forEach(student => {
                const key = `${student.id}_${schedule.phase}`;

                if (!studentPhaseMap[key]) {
                    studentPhaseMap[key] = {
                        studentId: student.id,
                        studentName: student.name || student.student_name,
                        phase: schedule.phase,
                        classes: []
                    };
                }

                studentPhaseMap[key].classes.push({
                    className: schedule.class?.name || schedule.class_name,
                    day: schedule.day,
                    timeSlot: schedule.time_slot
                });
            });
        });

        // Find duplicates (students with >1 class in same phase)
        Object.values(studentPhaseMap).forEach(entry => {
            if (entry.classes.length > 1) {
                foundDuplicates.push(entry);
            }
        });

        setDuplicates(foundDuplicates);
    };

    if (!isVisible || duplicates.length === 0) return null;

    return (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <h3 className="font-bold text-red-800">
                        ⚠️ Duplicate Phase Booking Detected!
                    </h3>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-red-200 rounded transition-colors"
                    title="Dismiss warning"
                >
                    <X size={16} className="text-red-600" />
                </button>
            </div>

            <p className="text-sm text-red-700 mb-3">
                The following students are booked in multiple classes for the same phase in Week {currentWeek}:
            </p>

            <div className="space-y-2">
                {duplicates.map((dup, index) => (
                    <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <p className="font-semibold text-red-900">
                                    {dup.studentName}
                                </p>
                                <p className="text-xs text-red-600 mb-1">
                                    Phase: {dup.phase}
                                </p>
                                <div className="text-sm text-red-700">
                                    {dup.classes.map((cls, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <span className="text-red-500">•</span>
                                            <span className="font-medium">{cls.className}</span>
                                            <span className="text-red-500">-</span>
                                            <span className="text-xs">
                                                {cls.day} {cls.timeSlot}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-600">
                    <strong>Action needed:</strong> Students can only attend one class per phase.
                    Please remove the duplicate booking(s) to avoid conflicts.
                </p>
            </div>
        </div>
    );
};

export default DuplicatePhaseWarning;
