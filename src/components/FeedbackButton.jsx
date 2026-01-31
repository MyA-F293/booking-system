import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Send, Star, Loader2, EyeOff, CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';
import { useToast } from './Toast';
import { getTeachers } from '../utils/dbHelpers';

const FeedbackButton = ({ user }) => {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [formData, setFormData] = useState({
        category: 'suggestion',
        message: '',
        rating: 0,
        isAnonymous: false,
        teacherId: '',
        teacherName: ''
    });

    const categories = [
        { id: 'suggestion', label: '💡 Suggestion', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { id: 'teacher_feedback', label: '👨‍🏫 Teacher Feedback', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        { id: 'bug', label: '🐛 Bug Report', color: 'bg-red-100 text-red-700 border-red-200' },
        { id: 'other', label: '📝 Other', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    ];

    useEffect(() => {
        if (isOpen) {
            loadTeachers();
        }
    }, [isOpen]);

    const loadTeachers = async () => {
        try {
            setLoadingTeachers(true);
            const data = await getTeachers();
            setTeachers(data);
        } catch (err) {
            console.error('Error loading teachers:', err);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.message.trim()) {
            toast.warning('Please enter your feedback message');
            return;
        }

        if (formData.category === 'teacher_feedback' && !formData.teacherId) {
            toast.warning('Please select a teacher');
            return;
        }

        setLoading(true);

        try {
            const feedbackData = {
                timestamp: new Date().toISOString(),
                studentId: formData.isAnonymous ? 'Anonymous' : (user?.student_id || 'Anonymous'),
                studentName: formData.isAnonymous ? 'Anonymous' : (user?.full_name || 'Anonymous'),
                batch: formData.isAnonymous ? '-' : (user?.batch || '-'),
                category: formData.category,
                teacher: formData.category === 'teacher_feedback' ? formData.teacherName : '-',
                message: formData.message,
                rating: formData.rating || '-',
                isAnonymous: formData.isAnonymous ? 'Yes' : 'No'
            };

            const GOOGLE_SCRIPT_URL = import.meta.env.VITE_FEEDBACK_SHEET_URL;

            if (GOOGLE_SCRIPT_URL) {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(feedbackData)
                });
            }

            setFormData({ category: 'suggestion', message: '', rating: 0, isAnonymous: false, teacherId: '', teacherName: '' });
            setIsOpen(false);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error submitting feedback:', err);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRating = (value) => {
        setFormData({ ...formData, rating: value === formData.rating ? 0 : value });
    };

    return (
        <>
            <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
                {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg whitespace-nowrap animate-fade-in">
                        Feedback & Suggestions
                        <div className="absolute top-full right-3 sm:right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                )}
                <button
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <MessageSquarePlus size={20} className="sm:w-6 sm:h-6" />
                    <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-[#F39C32] rounded-full animate-ping"></span>
                    <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-[#F39C32] rounded-full"></span>
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-xs sm:max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white p-4 sm:p-5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                                        <MessageSquarePlus size={16} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm sm:text-lg">Feedback & Suggestions</h3>
                                        <p className="text-blue-200 text-[10px] sm:text-xs">Help us improve!</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm">Category</label>
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id, teacherId: '', teacherName: '' })}
                                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border-2 text-[10px] sm:text-xs font-medium transition-all ${formData.category === cat.id ? `${cat.color} border-current` : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.category === 'teacher_feedback' && (
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm">
                                        Select Teacher *
                                    </label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={formData.teacherId}
                                            onChange={(e) => {
                                                const selectedTeacher = teachers.find(t => t.id === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    teacherId: e.target.value,
                                                    teacherName: selectedTeacher?.name || ''
                                                });
                                            }}
                                            className="w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-purple-500 text-xs sm:text-sm appearance-none bg-white"
                                            disabled={loadingTeachers}
                                        >
                                            <option value="">
                                                {loadingTeachers ? 'Loading teachers...' : 'Choose a teacher...'}
                                            </option>
                                            {teachers.map(teacher => (
                                                <option key={teacher.id} value={teacher.id}>
                                                    {teacher.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {formData.teacherId && (
                                        <p className="text-[10px] sm:text-xs text-purple-600 mt-1.5">
                                            ✓ Selected: {formData.teacherName}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm">Your Feedback *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder={formData.category === 'teacher_feedback' ? 'Share your experience with this teacher...' : 'Tell us what you think...'}
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-[#1F4E8C] resize-none text-xs sm:text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm">
                                    {formData.category === 'teacher_feedback' ? 'Rate the teacher (optional)' : 'Rate your experience (optional)'}
                                </label>
                                <div className="flex gap-0.5 sm:gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => handleRating(star)} className="p-0.5 sm:p-1 transition-transform hover:scale-110">
                                            <Star size={24} className={`sm:w-7 sm:h-7 transition-colors ${star <= formData.rating ? 'fill-[#F39C32] text-[#F39C32]' : 'text-gray-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div
                                className={`rounded-lg sm:rounded-xl p-2.5 sm:p-3 border-2 transition-all cursor-pointer ${formData.isAnonymous ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setFormData({ ...formData, isAnonymous: !formData.isAnonymous })}
                            >
                                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                                    <div className={`w-4 sm:w-5 h-4 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${formData.isAnonymous ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'}`}>
                                        {formData.isAnonymous && (
                                            <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <EyeOff size={14} className={`sm:w-4 sm:h-4 ${formData.isAnonymous ? 'text-purple-600' : 'text-gray-400'}`} />
                                        <span className={`text-xs sm:text-sm font-medium ${formData.isAnonymous ? 'text-purple-700' : 'text-gray-600'}`}>Submit as Anonymous</span>
                                    </div>
                                </label>
                                {formData.isAnonymous && <p className="text-[10px] sm:text-xs text-purple-600 mt-1.5 sm:mt-2 ml-6 sm:ml-8">Your identity will not be recorded</p>}
                            </div>

                            {user && !formData.isAnonymous && (
                                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-[10px] sm:text-xs text-gray-500">
                                    <p>Submitting as: <span className="font-medium text-gray-700">{user.full_name}</span></p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !formData.message.trim()}
                                className="w-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-[#1F4E8C] via-[#2a5fa3] to-[#1F4E8C] p-5 sm:p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full">
                                <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                                <div className="absolute top-8 right-8 w-3 h-3 bg-[#F39C32]/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                <div className="absolute bottom-6 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                            </div>

                            <div className="relative z-10">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <div className="w-11 h-11 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={28} className="sm:w-10 sm:h-10 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                                    <Sparkles size={12} className="sm:w-4 sm:h-4 text-[#F39C32]" />
                                    <h3 className="text-base sm:text-xl font-bold text-white">Thank You!</h3>
                                    <Sparkles size={12} className="sm:w-4 sm:h-4 text-[#F39C32]" />
                                </div>
                                <p className="text-blue-200 text-xs sm:text-sm">Your feedback has been submitted</p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 text-center">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 border border-blue-100">
                                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                                    We truly appreciate you taking the time to share your thoughts with us.
                                    Your feedback helps us improve! 💙
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white py-2.5 sm:py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackButton;
