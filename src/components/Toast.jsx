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

    // Parse message to extract structured content
    const parseMessage = (msg) => {
        // Check if message contains structured format (with bullet points)
        if (msg.includes('•') || msg.includes('\n')) {
            const lines = msg.split('\n').filter(line => line.trim());
            const title = lines[0];
            const items = lines.slice(1).map(line => line.trim());
            return { title, items, isStructured: true };
        }
        return { title: msg, items: [], isStructured: false };
    };

    const { title, items, isStructured } = parseMessage(message);

    return (
        <div className={`
            fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto
            transition-all duration-300
            ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}
        `}>
            <div className={`
                bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden
                transform transition-all duration-300
                ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}>
                {/* Header with Icon */}
                <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="text-white w-7 h-7" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Confirmation Required</h3>
                            <p className="text-red-100 text-sm mt-0.5">Please review before proceeding</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isStructured ? (
                        <>
                            {/* Title */}
                            <div className="mb-4">
                                <p className="text-gray-800 font-semibold text-base leading-relaxed">
                                    {title}
                                </p>
                            </div>

                            {/* Items List */}
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 space-y-2.5">
                                {items.map((item, index) => {
                                    // Remove bullet point if exists
                                    const cleanItem = item.replace(/^[•\-]\s*/, '').trim();

                                    // Determine color based on content
                                    let dotColor = 'bg-red-500';
                                    if (cleanItem.toLowerCase().includes('schedule')) {
                                        dotColor = 'bg-orange-500';
                                    } else if (cleanItem.toLowerCase().includes('week')) {
                                        dotColor = 'bg-blue-500';
                                    }

                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`${dotColor} w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}></div>
                                            <p className="text-gray-700 text-sm leading-relaxed flex-1">
                                                {cleanItem}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Warning Footer */}
                            <div className="mt-4 bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                                <AlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0" />
                                <p className="text-xs text-gray-700 font-medium">
                                    This action is permanent and cannot be undone
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {message}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl text-sm"
                    >
                        Yes, Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastProvider;
