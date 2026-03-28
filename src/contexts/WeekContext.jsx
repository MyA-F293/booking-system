import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const WeekContext = createContext();

export const useWeek = () => {
    const context = useContext(WeekContext);
    if (!context) {
        throw new Error('useWeek must be used within WeekProvider');
    }
    return context;
};

export const WeekProvider = ({ children }) => {
    const [currentWeek, setCurrentWeek] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialized, setInitialized] = useState(false);

    // Fetch current week from database
    const fetchCurrentWeek = async () => {
        // Don't fetch if already initialized
        if (initialized) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('current_week')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('❌ Error fetching current week:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                setError(error);
                setCurrentWeek(1); // fallback
                setInitialized(true);
                return;
            }

            if (data && data.current_week) {
                console.log('📅 Current week from database:', data.current_week);
                setCurrentWeek(data.current_week);
                setError(null);
                setInitialized(true);
            } else {
                console.warn('⚠️ No data returned from settings table');
                setCurrentWeek(1);
                setInitialized(true);
            }
        } catch (err) {
            console.error('❌ Exception fetching current week:', err);
            setError(err);
            setCurrentWeek(1); // fallback
            setInitialized(true);
        } finally {
            setLoading(false);
        }
    };

    // Increment week (admin only)
    const incrementWeek = async () => {
        try {
            const newWeek = currentWeek + 1;
            const { error } = await supabase
                .from('settings')
                .update({
                    current_week: newWeek,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;

            console.log('✅ Week incremented to:', newWeek);
            setCurrentWeek(newWeek);
            return newWeek;
        } catch (err) {
            console.error('❌ Error incrementing week:', err);
            throw err;
        }
    };

    // Set specific week (admin only)
    const setWeek = async (weekNumber) => {
        try {
            const { error } = await supabase
                .from('settings')
                .update({
                    current_week: weekNumber,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;

            console.log('✅ Week set to:', weekNumber);
            setCurrentWeek(weekNumber);
            return weekNumber;
        } catch (err) {
            console.error('❌ Error setting week:', err);
            throw err;
        }
    };

    // Refresh current week from database
    const refreshWeek = async () => {
        setInitialized(false);
        await fetchCurrentWeek();
    };

    // DON'T auto-fetch on mount - let components call fetchCurrentWeek when needed
    // This prevents blocking the app initialization
    useEffect(() => {
        console.log('🔵 WeekProvider useEffect: Running...');

        // Only fetch if we have a valid Supabase connection
        const timer = setTimeout(() => {
            console.log('🔵 WeekProvider useEffect: Calling fetchCurrentWeek after delay');
            fetchCurrentWeek();
        }, 100); // Small delay to let app initialize first

        return () => {
            console.log('🔵 WeekProvider useEffect: Cleanup');
            clearTimeout(timer);
        };
    }, []); // Empty dependency array - only run once on mount

    console.log('🔵 WeekProvider: Rendering with state', { currentWeek, loading, initialized });

    const value = {
        currentWeek,
        loading,
        error,
        initialized,
        incrementWeek,
        setWeek,
        refreshWeek,
        fetchCurrentWeek
    };

    // Always render children, even if there's an error
    // This prevents the entire app from crashing
    console.log('🔵 WeekProvider: Returning children');
    return (
        <WeekContext.Provider value={value}>
            {children}
        </WeekContext.Provider>
    );
};
