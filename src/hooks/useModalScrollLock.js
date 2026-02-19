import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when modal is open
 * 
 * Usage:
 * useModalScrollLock(isModalOpen);
 */
export const useModalScrollLock = (isOpen) => {
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;

            // Lock body scroll immediately
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Get the scroll position before unlocking
                const scrollY = document.body.style.top;

                // Restore body scroll
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position
                if (scrollY) {
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
            };
        }
    }, [isOpen]);
};

export default useModalScrollLock;
