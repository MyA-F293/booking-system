import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, message, type = 'success', actions }) {
    if (!isOpen) return null;

    const typeStyles = {
        success: {
            icon: '✓',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            borderColor: 'border-green-200'
        },
        error: {
            icon: '✕',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            borderColor: 'border-red-200'
        },
        warning: {
            icon: '⚠',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            borderColor: 'border-yellow-200'
        },
        info: {
            icon: 'ℹ',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        }
    };

    const style = typeStyles[type] || typeStyles.success;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center`}>
                            <span className={`text-2xl ${style.iconColor} font-bold`}>{style.icon}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-0">
                    {actions ? (
                        actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${action.primary
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {action.label}
                            </button>
                        ))
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
