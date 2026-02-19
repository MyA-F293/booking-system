import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when modal opens
 * Modal will always be centered in viewport because of fixed positioning
 * 
 * Usage:
 * useModalScrollLock(isModalOpen);
 */
export const useModalScrollLock = (isOpen) => {
    useEffect(() => {
        if (isOpen) {
            // Immediately lock body scroll
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore body scroll when modal closes
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);
};

export default useModalScrollLock;
