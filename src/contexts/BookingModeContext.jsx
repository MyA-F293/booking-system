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
    console.log('🔵 BookingModeProvider: Component mounted/rendered');

    // Testing mode - Load from DATABASE (not localStorage anymore)
    const [testingMode, setTestingMode] = useState(false);

    // Force close booking (overrides all other rules) - Load from DATABASE
    const [forceClose, setForceClose] = useState(false);
    const [loading, setLoading] = useState(true);

    // Backward compatibility: keep bookingMode for legacy code
    const bookingMode = testingMode ? 'testing' : 'production';

    // Load force_close AND testing_mode from database on mount
    useEffect(() => {
        console.log('🔵 BookingModeContext: Starting to load settings from database...');

        const loadSettings = async () => {
            try {
                console.log('🔵 BookingModeContext: Querying settings table...');
                const { data, error } = await supabase
                    .from('settings')
                    .select('force_close_booking, testing_mode')
                    .single();

                console.log('🔵 BookingModeContext: Query result:', { data, error });

                if (error) {
                    console.error('❌ Error loading settings:', error);
                    setForceClose(false);
                    setTestingMode(false);
                } else {
                    setForceClose(data?.force_close_booking || false);
                    setTestingMode(data?.testing_mode || false);
                    console.log('✅ Loaded force_close_booking from database:', data?.force_close_booking);
                    console.log('✅ Loaded testing_mode from database:', data?.testing_mode);
                }
            } catch (err) {
                console.error('❌ Exception loading settings:', err);
                setForceClose(false);
                setTestingMode(false);
            } finally {
                setLoading(false);
                console.log('🔵 BookingModeContext: Loading complete, loading state set to false');
            }
        };

        loadSettings();

        // Subscribe to realtime changes
        console.log('🔵 BookingModeContext: Setting up realtime subscription...');
        const subscription = supabase
            .channel('settings-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'settings'
                },
                (payload) => {
                    console.log('🔔 Realtime update received:', payload);
                    if (payload.new) {
                        setForceClose(payload.new.force_close_booking || false);
                        setTestingMode(payload.new.testing_mode || false);
                        console.log('✅ Settings updated from realtime:', {
                            force_close: payload.new.force_close_booking,
                            testing_mode: payload.new.testing_mode
                        });
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            console.log('🔵 BookingModeContext: Cleaning up realtime subscription');
            subscription.unsubscribe();
        };
    }, []);

    // Remove localStorage sync (no longer needed)
    // Testing mode is now controlled from database only

    const toggleBookingMode = async () => {
        const newValue = !testingMode;
        console.log('🔵 About to update testing_mode to:', newValue);

        try {
            // Update database first
            const { data, error } = await supabase
                .from('settings')
                .update({ testing_mode: newValue })
                .eq('id', 1)
                .select(); // Return updated row to verify

            console.log('🔵 Update result:', { data, error });

            if (error) {
                console.error('❌ Error updating testing_mode:', error);
                throw error;
            }

            // Update local state after successful database update
            setTestingMode(newValue);
            console.log('✅ Testing Mode updated in database:', newValue);
            console.log('✅ Returned data from database:', data);
        } catch (err) {
            console.error('❌ Failed to toggle testing mode:', err);
            throw err;
        }
    };

    const toggleForceClose = async () => {
        const newValue = !forceClose;

        try {
            // Update database first
            const { error } = await supabase
                .from('settings')
                .update({ force_close_booking: newValue })
                .eq('id', 1);

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

    const isTestingMode = testingMode;
    const isProductionMode = !testingMode;

    return (
        <BookingModeContext.Provider value={{
            bookingMode, // backward compatibility
            testingMode,
            setTestingMode,
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
