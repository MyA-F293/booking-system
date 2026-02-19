import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Calendar, CheckCircle, BarChart3, Sparkles } from 'lucide-react';
import { showInstallPrompt } from '../utils/pwaHelpers';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';

const UserGuide = ({ onClose, userRole = 'student', userId }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const { isOpen, modalConfig, hideModal, showInfo } = useModal();

    // Detect iOS
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    };

    // Handle Install App action
    const handleInstallApp = async () => {
        // Check if iOS
        if (isIOS()) {
            showInfo(
                '1. Tap the Share button (⬆️) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nThe app icon will appear on your home screen!',
                '📱 Install on iOS'
            );
            return;
        }

        // For other browsers (Chrome, Edge, etc.)
        try {
            const accepted = await showInstallPrompt();
            if (accepted) {
                console.log('✅ App installed successfully');
            } else {
                // If prompt not available, show manual instructions
                showInfo(
                    '• Chrome/Edge: Look for the install icon (⊕) in the address bar\n• Or check browser menu for "Install app" option',
                    '📱 Install App'
                );
            }
        } catch (error) {
            console.error('❌ Install failed:', error);
            showInfo(
                '• Chrome/Edge: Look for the install icon (⊕) in the address bar\n• Or check browser menu for "Install app" option',
                '📱 Install App'
            );
        }
    };

    // Guide steps based on user role
    const studentGuideSteps = [
        {
            title: "Welcome to EYSA! 🎉",
            description: "Quick tour to help you book classes and track attendance.",
            image: "🎓",
            tips: [
                "This tour takes 2 minutes",
                "Skip anytime with X button",
                "Restart from profile menu"
            ]
        },
        {
            title: "📅 Book Your Classes",
            description: "Book language classes in just a few clicks!",
            image: "📚",
            steps: [
                { number: "1", text: "Click 'Book Class'", highlight: "On main dashboard" },
                { number: "2", text: "Select program & level", highlight: "Choose from options" },
                { number: "3", text: "Pick day and time", highlight: "Morning/Afternoon/Evening" },
                { number: "4", text: "Confirm booking", highlight: "Success message appears" }
            ],
            tips: [
                "💡 Book early for preferred slots",
                "⏰ Book up to 2 weeks ahead",
                "🔄 Cancel and rebook anytime"
            ]
        },
        {
            title: "✅ Track Attendance",
            description: "Monitor your class attendance easily!",
            image: "📊",
            features: [
                { icon: "📈", title: "Attendance Rate", description: "Overall percentage" },
                { icon: "📅", title: "Class History", description: "Past classes & status" },
                { icon: "🎯", title: "Performance Stats", description: "Present, Late, Absent" },
                { icon: "🏆", title: "Badges", description: "Perfect attendance rewards" }
            ],
            tips: [
                "🌟 Maintain 80%+ attendance",
                "📱 Check after each class",
                "💪 Consistency = Better learning"
            ]
        },
        {
            title: "📊 Dashboard Overview",
            description: "Everything in one place!",
            image: "🎯",
            sections: [
                { title: "Quick Stats", items: ["Total classes", "Attendance rate", "Upcoming classes"] },
                { title: "Recent Activity", items: ["Latest bookings", "Recent attendance", "Updates"] },
                { title: "Actions", items: ["Book class", "View attendance", "Update profile"] }
            ],
            tips: [
                "🔔 Enable notifications",
                "📧 Check email for updates",
                "❓ Click help button anytime"
            ]
        },
        {
            title: "🎉 You're Ready!",
            description: "Start your learning journey!",
            image: "🚀",
            quickActions: [
                { icon: "📅", title: "Book First Class", action: "Start now" },
                { icon: "👤", title: "Complete Profile", action: "Add details" },
                { icon: "📱", title: "Install App", action: "Add to home" }
            ],
            tips: [
                "💬 Join WhatsApp group",
                "📚 Check learning resources",
                "🤝 Connect with students"
            ]
        }
    ];

    const steps = studentGuideSteps;

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

    // Mark guide as seen in localStorage (per user)
    useEffect(() => {
        return () => {
            if (!isVisible && userId) {
                localStorage.setItem(`eysa_guide_seen_${userId}`, 'true');
            }
        };
    }, [isVisible, userId]);

    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className={`fixed inset-0 z-[60] flex items-start justify-center p-2 sm:p-4 pt-4 sm:pt-8 overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip}></div>

            {/* Smaller Modal */}
            <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-lg md:max-w-xl w-full max-h-[80vh] overflow-hidden transform transition-all duration-300 my-auto ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gray-200">
                    <div className="h-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Close Button */}
                <button onClick={handleSkip} className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110">
                    <X size={16} className="sm:w-5 sm:h-5 text-gray-600" />
                </button>

                {/* Content */}
                <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {/* Header */}
                    <div className="text-center mb-4 sm:mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 animate-bounce-slow">
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
                                    <div key={index} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg sm:rounded-xl hover:from-blue-100 transition-all">
                                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-[#1F4E8C] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg">{step.number}</div>
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
                                    <div key={index} className="p-2 sm:p-3 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg sm:rounded-xl hover:border-[#1F4E8C] hover:shadow-lg transition-all">
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
                                            <span className="w-1.5 h-1.5 bg-[#1F4E8C] rounded-full"></span>
                                            {section.title}
                                        </h4>
                                        <ul className="space-y-1 sm:space-y-1.5">
                                            {section.items.map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-1.5 text-gray-700">
                                                    <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0" />
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
                                        onClick={() => {
                                            if (action.title === "Install App") {
                                                handleInstallApp();
                                            }
                                        }}
                                        className="w-full p-2 sm:p-3 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white rounded-lg sm:rounded-xl flex items-center justify-between transition-all hover:shadow-lg group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg sm:text-xl">{action.icon}</span>
                                            <div className="text-left">
                                                <p className="font-bold text-xs sm:text-sm">{action.title}</p>
                                                <p className="text-[9px] sm:text-xs text-blue-100">{action.action}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tips */}
                        {currentStepData.tips && (
                            <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5 text-xs sm:text-sm">
                                    <Sparkles size={14} className="sm:w-4 sm:h-4 text-yellow-600" />
                                    Pro Tips
                                </h4>
                                <ul className="space-y-1 sm:space-y-1.5">
                                    {currentStepData.tips.map((tip, index) => (
                                        <li key={index} className="text-[10px] sm:text-xs text-gray-700 flex items-start gap-1.5">
                                            <span className="text-yellow-600 flex-shrink-0">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="p-3 sm:p-4 md:p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {steps.map((_, index) => (
                            <div key={index} className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentStep ? 'w-6 sm:w-8 bg-[#1F4E8C]' : 'w-1.5 sm:w-2 bg-gray-300'}`}></div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button onClick={handlePrev} className="px-2 py-1.5 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-1 transition-all text-xs sm:text-sm">
                                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}

                        <button onClick={handleNext} className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white rounded-lg sm:rounded-xl font-semibold flex items-center gap-1 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm">
                            <span>{currentStep === steps.length - 1 ? "Start" : "Next"}</span>
                            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for install instructions */}
            <Modal
                isOpen={isOpen}
                onClose={hideModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                actions={modalConfig.actions}
            />
        </div>
    );
};

export default UserGuide;
