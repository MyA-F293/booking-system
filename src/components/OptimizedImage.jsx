import { useState } from 'react';

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading
 * - Loading placeholder
 * - Error handling
 * - Proper sizing
 */
const OptimizedImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false // Set true for above-the-fold images
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {/* Loading placeholder */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded"></div>
            )}

            {/* Error fallback */}
            {hasError ? (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    ❌
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    loading={priority ? 'eager' : 'lazy'} // Native lazy loading
                    onLoad={handleLoad}
                    onError={handleError}
                    width={width}
                    height={height}
                    decoding="async" // Async image decoding
                />
            )}
        </div>
    );
};

export default OptimizedImage;
