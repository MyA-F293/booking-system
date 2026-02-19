import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Shield, Users, Calendar, BarChart3, Sparkles, UserCheck, ClipboardList, Upload } from 'lucide-react';

const AdminGuide = ({ onClose, userId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Admin guide steps with orange/amber theme
    const adminGuideSteps = [
        {
            title: "Welcome Admin! 👑",
            description: "Quick tour of admin features to manage students, teachers, and attendance.",
            image: "🛡️",
            tips: [
                "Complete admin control panel",
                "Skip anytime with X button",
                "Restart from profile menu"
            ]
        },
        {
            title: "👥 Manage Students",
            description: "Create, edit, and manage student accounts easily!",
            image: "🎓",
            steps: [
                { number: "1", text: "Click 'Students' tab", highlight: "View all students" },
                { number: "2", text: "Create new student", highlight: "Generate ID automatically" },
                { number: "3", text: "Edit student info", highlight: "Update program & level" },
                { number: "4", text: "View/Reset password", highlight: "Help students login" }
            ],
            tips: [
                "🔑 Default password: student123",
                "🆔 Student ID auto-generated",
                "✏️ Edit anytime without limits"
            ]
        },
        {
            title: "👨‍🏫 Manage Teachers",
            description: "Add and manage teacher accounts!",
            image: "📚",
            features: [
                { icon: "➕", title: "Add Teacher", description: "Create new teacher account" },
                { icon: "🆔", title: "Teacher ID", description: "Auto-generated login ID" },
                { icon: "✏️", title: "Edit Info", description: "Update teacher details" },
                { icon: "🔄", title: "Activate/Deactivate", description: "Manage teacher status" }
            ],
            tips: [
                "🔑 Default password: teacher123",
                "📋 Share Teacher ID for login",
                "👁️ View ID anytime from list"
            ]
        },
        {
            title: "📅 Manage Bookings",
            description: "View and manage all class bookings!",
            image: "🗓️",
            sections: [
                { title: "View Bookings", items: ["See all student bookings", "Filter by week/class", "Check class capacity"] },
                { title: "Manage Classes", items: ["Monitor class occupancy", "View student lists", "Track booking trends"] },
                { title: "Week Control", items: ["Switch between weeks", "Plan ahead", "Review past bookings"] }
            ],
            tips: [
                "📊 Max 10 students per class",
                "🔍 Use filters to find bookings",
                "📈 Track booking patterns"
            ]
        },
        {
            title: "✅ Fill Attendance",
            description: "Fill attendance for any class, anytime!",
            image: "📝",
            steps: [
                { number: "1", text: "Click 'Fill' tab", highlight: "Access attendance manager" },
                { number: "2", text: "Select week", highlight: "Any week, no time limit" },
                { number: "3", text: "Filter classes", highlight: "Pending or Completed" },
                { number: "4", text: "Mark attendance", highlight: "Present, Late, or Absent" }
            ],
            tips: [
                "⏰ No time restrictions for admin",
                "🔙 Fill past week attendance",
                "🎯 Visual indicators (red/green)"
            ]
        },
        {
            title: "📊 Attendance Report",
            description: "View comprehensive attendance statistics!",
            image: "📈",
            features: [
                { icon: "📊", title: "Statistics", description: "Overall attendance rates" },
                { icon: "👥", title: "Per Student", description: "Individual performance" },
                { icon: "📅", title: "Per Week", description: "Weekly breakdown" },
                { icon: "🏆", title: "Rankings", description: "Top performers" }
            ],
            tips: [
                "📥 Export to Excel/CSV",
                "🔍 Filter by program/level",
                "📈 Track trends over time"
            ]
        },
        {
            title: "⚡ Bulk Operations",
            description: "Import/export data in bulk!",
            image: "📦",
            sections: [
                { title: "Import Students", items: ["Upload CSV file", "Bulk create accounts", "Auto-generate IDs"] },
                { title: "Export Data", items: ["Download student list", "Export attendance", "Backup data"] },
                { title: "Templates", items: ["Download CSV template", "Follow format guide", "Easy bulk operations"] }
            ],
            tips: [
                "📄 Use provided templates",
                "✅ Validate data before import",
                "💾 Regular backups recommended"
            ]
        },
        {
            title: "🎉 You're All Set!",
            description: "Start managing your language center!",
            image: "🚀",
            quickActions: [
                { icon: "👥", title: "Add Students", action: "Create accounts" },
                { icon: "👨‍🏫", title: "Add Teachers", action: "Setup teachers" },
                { icon: "✅", title: "Fill Attendance", action: "Mark attendance" },
                { icon: "📊", title: "View Reports", action: "Check statistics" }
            ],
            tips: [
                "🔐 Keep admin credentials safe",
                "📱 Bookmark for quick access",
                "❓ Help button always available"
            ]
        }
    ];

    const steps = adminGuideSteps;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleSkip = () => {
        handleClose();
    };

    // Scroll modal content to top when step changes
    useEffect(() => {
        if (isVisible) {
            // Only scroll modal content to top, not the page
            const modalContent = document.querySelector('.admin-guide-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }
    }, [currentStep, isVisible]);

    // Mark guide as seen in localStorage (per user)
    useEffect(() => {
        return () => {
            if (!isVisible && userId) {
                localStorage.setItem(`eysa_admin_guide_seen_${userId}`, 'true');
            }
        };
    }, [isVisible, userId]);

    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip}></div>

            {/* Modal with Admin Theme (Orange/Amber) */}
            <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-lg md:max-w-xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden transform transition-all duration-300 my-auto ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Progress Bar - Orange Theme */}
                <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-200">
                    <div className="h-full bg-gradient-to-r from-[#F39C32] to-[#f5a847] transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Close Button */}
                <button onClick={handleSkip} className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110">
                    <X size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                </button>

                {/* Content */}
                <div className="admin-guide-content p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-100px)]">
                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 animate-bounce-slow">
                            <span className="text-3xl sm:text-4xl md:text-5xl">{currentStepData.image}</span>
                        </div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">{currentStepData.title}</h2>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-md mx-auto px-2">{currentStepData.description}</p>
                    </div>

                    {/* Step Content */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-6">
                        {/* Steps List */}
                        {currentStepData.steps && (
                            <div className="space-y-2 sm:space-y-3">
                                {currentStepData.steps.map((step, index) => (
                                    <div key={index} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-lg sm:rounded-xl hover:from-orange-100 transition-all">
                                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#F39C32] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg">{step.number}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 mb-0.5 text-xs sm:text-sm">{step.text}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-600">{step.highlight}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Features Grid */}
                        {currentStepData.features && (
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {currentStepData.features.map((feature, index) => (
                                    <div key={index} className="p-2 sm:p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg sm:rounded-xl hover:border-[#F39C32] hover:shadow-lg transition-all">
                                        <div className="text-xl sm:text-2xl mb-1">{feature.icon}</div>
                                        <h4 className="font-bold text-gray-800 mb-0.5 text-[10px] sm:text-xs">{feature.title}</h4>
                                        <p className="text-[9px] sm:text-[10px] text-gray-600 leading-tight">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sections */}
                        {currentStepData.sections && (
                            <div className="space-y-2 sm:space-y-3">
                                {currentStepData.sections.map((section, index) => (
                                    <div key={index} className="p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
                                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
                                            <span className="w-1.5 h-1.5 bg-[#F39C32] rounded-full"></span>
                                            {section.title}
                                        </h4>
                                        <ul className="space-y-1 sm:space-y-1.5">
                                            {section.items.map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-1.5 text-gray-700">
                                                    <Shield size={12} className="sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" />
                                                    <span className="text-[10px] sm:text-xs">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick Actions */}
                        {currentStepData.quickActions && (
                            <div className="space-y-2">
                                {currentStepData.quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="w-full p-2 sm:p-3 bg-gradient-to-r from-[#F39C32] to-[#f5a847] hover:from-[#e08a1f] hover:to-[#F39C32] text-white rounded-lg sm:rounded-xl flex items-center justify-between transition-all hover:shadow-lg group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg sm:text-xl">{action.icon}</span>
                                            <div className="text-left">
                                                <p className="font-bold text-xs sm:text-sm">{action.title}</p>
                                                <p className="text-[9px] sm:text-xs text-orange-100">{action.action}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tips */}
                        {currentStepData.tips && (
                            <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200 rounded-lg sm:rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
                                    <Sparkles size={14} className="sm:w-4 sm:h-4 text-orange-600" />
                                    Admin Tips
                                </h4>
                                <ul className="space-y-1 sm:space-y-1.5">
                                    {currentStepData.tips.map((tip, index) => (
                                        <li key={index} className="text-[10px] sm:text-xs text-gray-700 flex items-start gap-1.5">
                                            <span className="text-orange-600 flex-shrink-0">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Navigation - Orange Theme */}
                <div className="p-3 sm:p-4 md:p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {steps.map((_, index) => (
                            <div key={index} className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentStep ? 'w-6 sm:w-8 bg-[#F39C32]' : 'w-1.5 sm:w-2 bg-gray-300'}`}></div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button onClick={handlePrev} className="px-2 py-1.5 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-1 transition-all text-xs sm:text-sm">
                                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}

                        <button onClick={handleNext} className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#F39C32] to-[#f5a847] hover:from-[#e08a1f] hover:to-[#F39C32] text-white rounded-lg sm:rounded-xl font-semibold flex items-center gap-1 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm">
                            <span>{currentStep === steps.length - 1 ? "Start Managing" : "Next"}</span>
                            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGuide;
