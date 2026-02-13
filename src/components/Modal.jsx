import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, message, type = 'success', actions }) {
    if (!isOpen) return null;

    const typeStyles = {
        success: {
            Icon: CheckCircle2,
            iconBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
            iconColor: 'text-orange-500',
            iconGlow: 'shadow-lg shadow-orange-500/20',
            gradientBar: 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500',
            buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
            buttonShadow: 'shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40'
        },
        error: {
            Icon: AlertCircle,
            iconBg: 'bg-gradient-to-br from-red-50 to-rose-50',
            iconColor: 'text-red-500',
            iconGlow: 'shadow-lg shadow-red-500/20',
            gradientBar: 'bg-gradient-to-r from-red-400 via-rose-400 to-red-500',
            buttonBg: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
            buttonShadow: 'shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40'
        },
        warning: {
            Icon: AlertTriangle,
            iconBg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
            iconColor: 'text-yellow-500',
            iconGlow: 'shadow-lg shadow-yellow-500/20',
            gradientBar: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500',
            buttonBg: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600',
            buttonShadow: 'shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40'
        },
        info: {
            Icon: Info,
            iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            iconColor: 'text-blue-500',
            iconGlow: 'shadow-lg shadow-blue-500/20',
            gradientBar: 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500',
            buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
            buttonShadow: 'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
        }
    };

    const style = typeStyles[type] || typeStyles.success;
    const IconComponent = style.Icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform animate-slideUp overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative gradient top bar */}
                <div className={`h-1.5 ${style.gradientBar}`}></div>

                {/* Header with large icon */}
                <div className="flex flex-col items-center pt-8 pb-4 px-6">
                    <div className={`w-20 h-20 rounded-full ${style.iconBg} ${style.iconGlow} flex items-center justify-center mb-4 animate-bounce-gentle relative`}>
                        {/* Glow effect behind icon */}
                        <div className={`absolute inset-0 rounded-full ${style.iconBg} blur-xl opacity-50`}></div>
                        <IconComponent className={`w-10 h-10 ${style.iconColor} relative z-10`} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 text-center">{title}</h3>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all p-2 hover:bg-gray-100 rounded-full hover:scale-110"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="px-8 pb-6">
                    <p className="text-gray-600 text-center leading-relaxed text-base">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    {actions ? (
                        actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 ${action.primary
                                        ? `${style.buttonBg} text-white ${style.buttonShadow}`
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                {action.label}
                            </button>
                        ))
                    ) : (
                        <button
                            onClick={onClose}
                            className={`w-full px-5 py-3.5 ${style.buttonBg} text-white rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 ${style.buttonShadow}`}
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
