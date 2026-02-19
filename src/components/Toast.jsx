import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const success = (message, duration) => addToast(message, 'success', duration);
    const error = (message, duration) => addToast(message, 'error', duration);
    const warning = (message, duration) => addToast(message, 'warning', duration);
    const info = (message, duration) => addToast(message, 'info', duration);

    const confirm = (message, onConfirm, onCancel) => {
        setConfirmModal({ message, onConfirm, onCancel });
    };

    const closeConfirm = () => {
        setConfirmModal(null);
    };

    return (
        <ToastContext.Provider value={{ success, error, warning, info, confirm }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    message={confirmModal.message}
                    onConfirm={() => {
                        confirmModal.onConfirm?.();
                        closeConfirm();
                    }}
                    onCancel={() => {
                        confirmModal.onCancel?.();
                        closeConfirm();
                    }}
                />
            )}
        </ToastContext.Provider>
    );
};

// Toast Item Component
const ToastItem = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const icons = {
        success: <CheckCircle className="text-green-500" size={22} />,
        error: <AlertCircle className="text-red-500" size={22} />,
        warning: <AlertTriangle className="text-orange-500" size={22} />,
        info: <Info className="text-blue-500" size={22} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-orange-50 border-orange-200',
        info: 'bg-blue-50 border-blue-200'
    };

    const textColors = {
        success: 'text-green-800',
        error: 'text-red-800',
        warning: 'text-orange-800',
        info: 'text-blue-800'
    };

    return (
        <div
            className={`
                ${bgColors[toast.type]} ${textColors[toast.type]}
                border rounded-2xl p-4 shadow-lg backdrop-blur-sm
                flex items-start gap-3 min-w-[300px]
                transform transition-all duration-300 ease-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <div className="flex-shrink-0 mt-0.5">
                {icons[toast.type]}
            </div>
            <p className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Confirm Modal Component
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    return (
        <div className={`
            fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4
            transition-all duration-300
            ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'}
        `}>
            <div className={`
                bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-[280px] sm:max-w-md w-full overflow-hidden
                transform transition-all duration-300
                ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                            <AlertTriangle className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-white">Confirm</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 sm:px-6 sm:pb-6 flex gap-2 sm:gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-xs sm:text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] text-white font-semibold hover:from-[#183d6e] hover:to-[#1F4E8C] transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                    >
                        Yes, Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastProvider;
