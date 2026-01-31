import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Calendar, CheckCircle, BarChart3, Sparkles } from 'lucide-react';

const UserGuide = ({ onClose, userRole = 'student' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Guide steps based on user role
    const studentGuideSteps = [
        {
            title: "Welcome to EYSA Language Center! 🎉",
            description: "Let's take a quick tour to help you get started with booking classes and tracking your attendance.",
            icon: <Sparkles className="w-12 h-12 text-[#1F4E8C]" />,
            image: "🎓",
            tips: [
                "This tour will only take 2 minutes",
                "You can skip anytime by clicking the X button",
                "You can restart this tour from your profile menu"
            ]
        },
        {
            title: "📅 Book Your Classes",
            description: "Easily book your language classes in just a few clicks!",
            icon: <Calendar className="w-12 h-12 text-[#1F4E8C]" />,
            image: "📚",
            steps: [
                {
                    number: "1",
                    text: "Click on 'Book Class' button",
                    highlight: "On the main dashboard"
                },
                {
                    number: "2",
                    text: "Select your program and level",
                    highlight: "Choose from available options"
                },
                {
                    number: "3",
                    text: "Pick your preferred day and time",
                    highlight: "Morning, Afternoon, or Evening"
                },
                {
                    number: "4",
                    text: "Confirm your booking",
                    highlight: "You'll see a success message"
                }
            ],
            tips: [
                "💡 Book early to get your preferred time slot",
                "⏰ You can book up to 2 weeks in advance",
                "🔄 Need to change? Cancel and rebook anytime"
            ]
        },
        {
            title: "✅ Track Your Attendance",
            description: "Monitor your class attendance and performance easily!",
            icon: <CheckCircle className="w-12 h-12 text-green-600" />,
            image: "📊",
            features: [
                {
                    icon: "📈",
                    title: "Attendance Rate",
                    description: "See your overall attendance percentage"
                },
                {
                    icon: "📅",
                    title: "Class History",
                    description: "View all your past classes and status"
                },
                {
                    icon: "🎯",
                    title: "Performance Stats",
                    description: "Track Present, Late, and Absent records"
                },
                {
                    icon: "🏆",
                    title: "Achievement Badges",
                    description: "Earn badges for perfect attendance"
                }
            ],
            tips: [
                "🌟 Maintain 80%+ attendance for best results",
                "📱 Check your attendance after each class",
                "💪 Consistent attendance = Better learning"
            ]
        },
        {
            title: "📊 Your Dashboard Overview",
            description: "Everything you need in one place!",
            icon: <BarChart3 className="w-12 h-12 text-[#1F4E8C]" />,
            image: "🎯",
            sections: [
                {
                    title: "Quick Stats",
                    items: ["Total classes booked", "Attendance rate", "Upcoming classes"]
                },
                {
                    title: "Recent Activity",
                    items: ["Latest bookings", "Recent attendance", "Class updates"]
                },
                {
                    title: "Actions",
                    items: ["Book new class", "View attendance", "Update profile"]
                }
            ],
            tips: [
                "🔔 Enable notifications for class reminders",
                "📧 Check your email for important updates",
                "❓ Need help? Click the help button anytime"
            ]
        },
        {
            title: "🎉 You're All Set!",
            description: "Ready to start your learning journey with EYSA!",
            icon: <BookOpen className="w-12 h-12 text-[#1F4E8C]" />,
            image: "🚀",
            quickActions: [
                {
                    icon: "📅",
                    title: "Book Your First Class",
                    action: "Start booking now"
                },
                {
                    icon: "👤",
                    title: "Complete Your Profile",
                    action: "Add your details"
                },
                {
                    icon: "📱",
                    title: "Download Mobile App",
                    action: "Install PWA"
                }
            ],
            tips: [
                "💬 Join our WhatsApp group for updates",
                "📚 Check out learning resources in the library",
                "🤝 Connect with other students"
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

    // Mark guide as seen in localStorage
    useEffect(() => {
        return () => {
            if (!isVisible) {
                localStorage.setItem('eysa_guide_seen', 'true');
            }
        };
    }, [isVisible]);

    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleSkip}
            ></div>

            {/* Modal */}
            <div className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                >
                    <X size={20} className="text-gray-600" />
                </button>

                {/* Content */}
                <div className="p-8 sm:p-10 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-4 animate-bounce-slow">
                            <span className="text-5xl">{currentStepData.image}</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                            {currentStepData.title}
                        </h2>
                        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
                            {currentStepData.description}
                        </p>
                    </div>

                    {/* Step Content */}
                    <div className="space-y-6">
                        {/* Steps List */}
                        {currentStepData.steps && (
                            <div className="space-y-4">
                                {currentStepData.steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:from-blue-100 transition-all"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 bg-[#1F4E8C] text-white rounded-full flex items-center justify-center font-bold text-lg">
                                            {step.number}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 mb-1">{step.text}</p>
                                            <p className="text-sm text-gray-600">{step.highlight}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Features Grid */}
                        {currentStepData.features && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {currentStepData.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-xl hover:border-[#1F4E8C] hover:shadow-lg transition-all"
                                    >
                                        <div className="text-3xl mb-2">{feature.icon}</div>
                                        <h4 className="font-bold text-gray-800 mb-1">{feature.title}</h4>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sections */}
                        {currentStepData.sections && (
                            <div className="space-y-4">
                                {currentStepData.sections.map((section, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-[#1F4E8C] rounded-full"></span>
                                            {section.title}
                                        </h4>
                                        <ul className="space-y-2">
                                            {section.items.map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-gray-700">
                                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                                    <span className="text-sm">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick Actions */}
                        {currentStepData.quickActions && (
                            <div className="space-y-3">
                                {currentStepData.quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="w-full p-4 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white rounded-xl flex items-center justify-between transition-all hover:shadow-lg group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{action.icon}</span>
                                            <div className="text-left">
                                                <p className="font-bold">{action.title}</p>
                                                <p className="text-sm text-blue-100">{action.action}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tips */}
                        {currentStepData.tips && (
                            <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Sparkles size={18} className="text-yellow-600" />
                                    Pro Tips
                                </h4>
                                <ul className="space-y-2">
                                    {currentStepData.tips.map((tip, index) => (
                                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
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
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-8 bg-[#1F4E8C]'
                                        : 'w-2 bg-gray-300'
                                    }`}
                            ></div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2 transition-all"
                            >
                                <ChevronLeft size={20} />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
