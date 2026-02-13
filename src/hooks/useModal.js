import { useState } from 'react';

export function useModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'success',
        actions: null
    });

    const showModal = ({ title, message, type = 'success', actions = null }) => {
        setModalConfig({ title, message, type, actions });
        setIsOpen(true);
    };

    const hideModal = () => {
        setIsOpen(false);
    };

    const showSuccess = (message, title = 'Success') => {
        showModal({ title, message, type: 'success' });
    };

    const showError = (message, title = 'Error') => {
        showModal({ title, message, type: 'error' });
    };

    const showWarning = (message, title = 'Warning') => {
        showModal({ title, message, type: 'warning' });
    };

    const showInfo = (message, title = 'Information') => {
        showModal({ title, message, type: 'info' });
    };

    const showConfirm = (message, onConfirm, title = 'Confirm') => {
        showModal({
            title,
            message,
            type: 'warning',
            actions: [
                {
                    label: 'Cancel',
                    onClick: hideModal,
                    primary: false
                },
                {
                    label: 'Confirm',
                    onClick: () => {
                        onConfirm();
                        hideModal();
                    },
                    primary: true
                }
            ]
        });
    };

    return {
        isOpen,
        modalConfig,
        showModal,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm
    };
}
