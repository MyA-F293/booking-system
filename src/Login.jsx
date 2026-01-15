import { useState } from 'react';
import { User, Lock, LogIn, Loader2 } from 'lucide-react';
import { login } from './utils/authHelpers';
import { useLanguage } from './contexts/LanguageContext';

const Login = ({ onLoginSuccess }) => {
    const { t } = useLanguage();
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(studentId, password);
            onLoginSuccess(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (id, pass) => {
        setStudentId(id);
        setPassword(pass);
    };

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
                        {t('login.title')}
                    </h1>
                    <p className="text-gray-500 text-xs">
                        {t('login.subtitle')}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-4 sm:p-5">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {/* Student ID */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1.5 text-xs">
                                {t('login.studentId')}
                            </label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#1F4E8C] transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                                    placeholder={t('login.studentIdPlaceholder')}
                                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1F4E8C] focus:bg-white bg-gray-50/50 transition-all text-xs"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-1.5 text-xs">
                                {t('login.password')}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#1F4E8C] transition-colors w-4 h-4" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('login.passwordPlaceholder')}
                                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1F4E8C] focus:bg-white bg-gray-50/50 transition-all text-xs"
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
                            className="w-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white py-2.5 rounded-lg font-semibold hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl text-xs"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <LogIn size={14} />
                                    {t('login.loginButton')}
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
