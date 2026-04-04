import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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

    // Force close booking (overrides all other rules) - Load from DATABASE
    const [forceClose, setForceClose] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load force_close from database on mount
    useEffect(() => {
        const loadForceClose = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('force_close_booking')
                    .single();

                if (error) {
                    console.error('❌ Error loading force_close_booking:', error);
                    setForceClose(false);
                } else {
                    setForceClose(data?.force_close_booking || false);
                    console.log('✅ Loaded force_close_booking from database:', data?.force_close_booking);
                }
            } catch (err) {
                console.error('❌ Exception loading force_close_booking:', err);
                setForceClose(false);
            } finally {
                setLoading(false);
            }
        };

        loadForceClose();
    }, []);

    // Save to localStorage whenever booking mode changes
    useEffect(() => {
        localStorage.setItem('eysa_booking_mode', bookingMode);
        console.log('📋 Booking Mode changed to:', bookingMode);
    }, [bookingMode]);

    const toggleBookingMode = () => {
        setBookingMode(prev => prev === 'production' ? 'testing' : 'production');
    };

    const toggleForceClose = async () => {
        const newValue = !forceClose;

        try {
            // Update database first
            const { error } = await supabase
                .from('settings')
                .update({ force_close_booking: newValue })
                .eq('id', 1); // Assuming settings table has id=1

            if (error) {
                console.error('❌ Error updating force_close_booking:', error);
                throw error;
            }

            // Update local state after successful database update
            setForceClose(newValue);
            console.log('✅ Force Close Booking updated in database:', newValue);
        } catch (err) {
            console.error('❌ Failed to toggle force close:', err);
            throw err;
        }
    };

    const isTestingMode = bookingMode === 'testing';
    const isProductionMode = bookingMode === 'production';

    return (
        <BookingModeContext.Provider value={{
            bookingMode,
            setBookingMode,
            toggleBookingMode,
            isTestingMode,
            isProductionMode,
            forceClose,
            setForceClose,
            toggleForceClose,
            loading
        }}>
            {children}
        </BookingModeContext.Provider>
    );
};
