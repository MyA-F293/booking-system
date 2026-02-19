import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when modal is open
 * Prevents background scrolling and ensures modal is always visible
 * 
 * Usage:
 * useModalScrollLock(isModalOpen);
 */
export const useModalScrollLock = (isOpen) => {
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Lock body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Restore body scroll
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);
};

export default useModalScrollLock;
