// Reusable Skeleton Loader Components

export const SkeletonCard = ({ className = '' }) => (
    <div className={`bg-white rounded-xl shadow-md p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
    </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="p-4 bg-gray-100">
            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        {[...Array(columns)].map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {[...Array(rows)].map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {[...Array(columns)].map((_, colIndex) => (
                                <td key={colIndex} className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const SkeletonBookingCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="mt-4 flex gap-2">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
        </div>
    </div>
);

export const SkeletonStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-md animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
        ))}
    </div>
);

export const SkeletonList = ({ items = 3 }) => (
    <div className="space-y-3">
        {[...Array(items)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-md animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
    </div>
);

export const SkeletonForm = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
        {[...Array(3)].map((_, i) => (
            <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
        ))}
        <div className="h-12 bg-gray-300 rounded w-full mt-6"></div>
    </div>
);

// Smooth Fade In Animation Component
export const FadeIn = ({ children, delay = 0, className = '' }) => (
    <div
        className={`animate-fadeIn ${className}`}
        style={{ animationDelay: `${delay}ms` }}
    >
        {children}
    </div>
);

// Loading Spinner with Text
export const LoadingSpinner = ({ text = 'Loading...', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-[#1F4E8C] rounded-full animate-spin mb-4`}></div>
            <p className="text-gray-600 text-sm font-medium">{text}</p>
        </div>
    );
};

// Pulse Loader (3 dots)
export const PulseLoader = () => (
    <div className="flex items-center justify-center space-x-2 py-8">
        <div className="w-3 h-3 bg-[#1F4E8C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-[#1F4E8C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-[#1F4E8C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
);

export default {
    SkeletonCard,
    SkeletonTable,
    SkeletonBookingCard,
    SkeletonStats,
    SkeletonList,
    SkeletonChart,
    SkeletonForm,
    FadeIn,
    LoadingSpinner,
    PulseLoader
};
