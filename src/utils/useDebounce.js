import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for debounced/cooldown refresh functionality
 * Prevents spam clicking on refresh buttons
 * 
 * @param {Function} callback - The function to call
 * @param {number} cooldownMs - Cooldown period in milliseconds (default: 3000ms)
 * @returns {Object} { execute, isOnCooldown, remainingTime }
 */
export const useRefreshCooldown = (callback, cooldownMs = 3000) => {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const timerRef = useRef(null);
    const intervalRef = useRef(null);

    const execute = useCallback(async (...args) => {
        if (isOnCooldown) return;

        // Execute the callback
        await callback(...args);

        // Start cooldown
        setIsOnCooldown(true);
        setRemainingTime(Math.ceil(cooldownMs / 1000));

        // Update remaining time every second
        intervalRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Clear cooldown after specified time
        timerRef.current = setTimeout(() => {
            setIsOnCooldown(false);
            setRemainingTime(0);
            clearInterval(intervalRef.current);
        }, cooldownMs);

    }, [callback, cooldownMs, isOnCooldown]);

    return { execute, isOnCooldown, remainingTime };
};

/**
 * Simple debounce hook
 * @param {Function} callback 
 * @param {number} delay 
 */
export const useDebounce = (callback, delay = 300) => {
    const timerRef = useRef(null);

    const debouncedCallback = useCallback((...args) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
};

export default useRefreshCooldown;
