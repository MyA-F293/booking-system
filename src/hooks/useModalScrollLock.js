import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when modal is open
 * AND automatically scroll to top when modal opens
 * 
 * Usage:
 * useModalScrollLock(isModalOpen);
 */
export const useModalScrollLock = (isOpen) => {
    useEffect(() => {
        if (isOpen) {
            // FIRST: Scroll to top immediately when modal opens
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // THEN: Lock body scroll after a small delay
            const timer = setTimeout(() => {
                const scrollY = window.scrollY;

                // Lock body scroll
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollY}px`;
                document.body.style.width = '100%';
            }, 300); // Wait for smooth scroll to complete

            return () => {
                clearTimeout(timer);

                // Get the scroll position before unlocking
                const scrollY = document.body.style.top;

                // Restore body scroll
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position (if user wants to go back)
                if (scrollY) {
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
            };
        }
    }, [isOpen]);
};

export default useModalScrollLock;
