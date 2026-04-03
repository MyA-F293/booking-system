import { createContext, useContext, useState, useEffect } from 'react';

const BookingModeContext = createContext();

export const useBookingMode = () => {
    const context = useContext(BookingModeContext);
    if (!context) {
        throw new Error('useBookingMode must be used within BookingModeProvider');
    }
    return context;
};

export const BookingModeProvider = ({ children }) => {
    // Load from localStorage, default to 'production'
    const [bookingMode, setBookingMode] = useState(() => {
        const saved = localStorage.getItem('eysa_booking_mode');
        return saved || 'production';
    });

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('eysa_booking_mode', bookingMode);
        console.log('📋 Booking Mode changed to:', bookingMode);
    }, [bookingMode]);

    const toggleBookingMode = () => {
        setBookingMode(prev => prev === 'production' ? 'testing' : 'production');
    };

    const isTestingMode = bookingMode === 'testing';
    const isProductionMode = bookingMode === 'production';

    return (
        <BookingModeContext.Provider value={{
            bookingMode,
            setBookingMode,
            toggleBookingMode,
            isTestingMode,
            isProductionMode
        }}>
            {children}
        </BookingModeContext.Provider>
    );
};
