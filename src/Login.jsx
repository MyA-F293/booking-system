import { useState } from 'react';
import { User, Lock, LogIn, Loader2, Crown } from 'lucide-react';
import { login, teacherLogin } from './utils/authHelpers';
import { useLanguage } from './contexts/LanguageContext';

const Login = ({ onLoginSuccess }) => {
    const { t } = useLanguage();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Detect login type based on ID format
    const detectLoginType = (id) => {
        if (!id) return 'student';

        // Teacher format: TCHR + 4 digits (e.g., TCHR0001)
        if (id.startsWith('TCHR') && id.length === 8) {
            return 'teacher';
        }

        // Teacher format (old): UUID with dashes (backward compatible)
        if (id.includes('-') && id.length >= 32) {
            return 'teacher';
        }

        // Admin format: EYSA + 4 digits (e.g., EYSA2601)
        // Student format: EYSA + 8 digits (e.g., EYSA26010001)
        if (id.startsWith('EYSA')) {
            const digits = id.replace('EYSA', '');
            if (digits.length === 4) {
                return 'admin';
            }
        }

        return 'student';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginType = detectLoginType(userId);
            let user;

            if (loginType === 'teacher') {
                user = await teacherLogin(userId, password);
            } else {
                user = await login(userId, password);
            }

            onLoginSuccess(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleIdChange = (e) => {
        const value = e.target.value;
        // Uppercase for EYSA and TCHR formats, keep original case for UUIDs
        if (value.startsWith('EYSA') || value.startsWith('TCHR') || value.startsWith('eysa') || value.startsWith('tchr')) {
            setUserId(value.toUpperCase());
        } else {
            setUserId(value);
        }
    };

    const currentType = detectLoginType(userId);
    const isTeacher = currentType === 'teacher';
    const isAdmin = currentType === 'admin';

    // Determine label text
    const getIdLabel = () => {
        if (!userId) return 'User ID'; // Default label when empty
        if (isTeacher) return 'Teacher ID';
        if (isAdmin) return 'Admin ID';
        return 'Student ID';
    };

    // Determine indicator text
    const getRoleIndicator = () => {
        if (isTeacher) return '👨‍🏫 Teacher Login';
        if (isAdmin) return '👑 Admin Login';
        return '👨‍🎓 Student Login';
    };

    // Determine button text
    const getButtonText = () => {
        if (isTeacher) return 'Login as Teacher';
        if (isAdmin) return 'Login as Admin';
        return 'Login';
    };

    // Determine color theme
    const getColorClass = () => {
        if (isTeacher) return 'orange';
        if (isAdmin) return 'purple';
        return 'blue';
    };

    const colorClass = getColorClass();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-[280px] sm:max-w-xs w-full relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-4 sm:mb-6">
                    <img
                        src="/eysa-logo.svg"
                        alt="EYSA Logo"
                        className="h-14 sm:h-16 lg:h-20 w-auto mx-auto mb-2 sm:mb-3 drop-shadow-lg"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F4E8C] mb-0.5 sm:mb-1">
                        Language Center
                    </h1>
                    <p className="text-gray-500 text-xs">
                        Please login to continue
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-4 sm:p-5">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {/* ID Input */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1.5 text-xs">
                                {getIdLabel()}
                            </label>
                            <div className="relative group">
                                {isAdmin ? (
                                    <Crown className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#A1B2CD] transition-colors w-4 h-4`} />
                                ) : (
                                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${colorClass === 'orange' ? 'group-focus-within:text-[#F39C32]' :
                                        colorClass === 'purple' ? 'group-focus-within:text-[#A1B2CD]' :
                                            'group-focus-within:text-[#1F4E8C]'
                                        } transition-colors w-4 h-4`} />
                                )}
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={handleIdChange}
                                    placeholder="Enter your ID"
                                    className={`w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none ${colorClass === 'orange' ? 'focus:border-[#F39C32]' :
                                        colorClass === 'purple' ? 'focus:border-[#A1B2CD]' :
                                            'focus:border-[#1F4E8C]'
                                        } focus:bg-white bg-gray-50/50 transition-all text-xs`}
                                    required
                                />
                            </div>
                            {userId && (
                                <p className={`text-[10px] mt-1 font-semibold ${colorClass === 'orange' ? 'text-orange-600' :
                                    colorClass === 'purple' ? 'text-[#A1B2CD]' :
                                        'text-blue-600'
                                    }`}>
                                    {getRoleIndicator()}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1.5 text-xs">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${colorClass === 'orange' ? 'group-focus-within:text-[#F39C32]' :
                                    colorClass === 'purple' ? 'group-focus-within:text-[#A1B2CD]' :
                                        'group-focus-within:text-[#1F4E8C]'
                                    } transition-colors w-4 h-4`} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className={`w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none ${colorClass === 'orange' ? 'focus:border-[#F39C32]' :
                                        colorClass === 'purple' ? 'focus:border-[#A1B2CD]' :
                                            'focus:border-[#1F4E8C]'
                                        } focus:bg-white bg-gray-50/50 transition-all text-xs`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2">
                                <span className="text-red-500 text-sm">⚠️</span>
                                <p className="text-red-600 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${colorClass === 'orange'
                                ? 'bg-gradient-to-r from-[#F39C32] to-[#f5a847] hover:from-[#e08a1f] hover:to-[#F39C32]'
                                : colorClass === 'purple'
                                    ? 'bg-gradient-to-r from-[#8FA3BD] to-[#A1B2CD] hover:from-[#7A8FAA] hover:to-[#8FA3BD]'
                                    : 'bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C]'
                                } text-white py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl text-xs`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <LogIn size={14} />
                                    {getButtonText()}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-[10px] text-gray-400">
                    <p>© 2026 EYSA Language Centre</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
