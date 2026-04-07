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
    const [lastNotifiedWeek, setLastNotifiedWeek] = useState(null); // Track last notified week to prevent spam

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

    // Refresh week silently (without resetting initialized flag)
    // Used for polling and realtime updates
    const refreshWeekSilently = async (showNotification = false) => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('current_week')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('❌ Error refreshing week:', error);
                return;
            }

            if (data && data.current_week !== currentWeek) {
                const oldWeek = currentWeek;
                const newWeek = data.current_week;
                console.log('📅 Week changed! Old:', oldWeek, 'New:', newWeek);
                setCurrentWeek(newWeek);

                // Show notification only once per week change
                if (showNotification && newWeek !== lastNotifiedWeek) {
                    setLastNotifiedWeek(newWeek);
                    // Note: Toast will be shown by components that import useWeek
                    console.log('📢 Week change notification should be shown');
                }
            }
        } catch (err) {
            console.error('❌ Exception refreshing week:', err);
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

        // Setup realtime subscription for week changes
        console.log('🔵 Setting up realtime subscription for settings changes...');
        const subscription = supabase
            .channel('settings-week-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'settings',
                filter: 'id=eq.1'
            }, (payload) => {
                console.log('📅 Week changed via realtime!', payload);
                const newWeek = payload.new?.current_week;
                if (newWeek && newWeek !== currentWeek) {
                    console.log('📅 Updating week from', currentWeek, 'to', newWeek);
                    setCurrentWeek(newWeek);

                    // Show notification only once per week change
                    if (newWeek !== lastNotifiedWeek) {
                        setLastNotifiedWeek(newWeek);
                        console.log('📢 Week change notification: Week', newWeek);
                    }
                }
            })
            .subscribe((status) => {
                console.log('🔵 Realtime subscription status:', status);
            });

        // Setup page focus listener to refresh week when user returns to tab
        const handleFocus = () => {
            console.log('👀 Page focused, refreshing week...');
            refreshWeekSilently(false); // Don't show notification on focus
        };
        window.addEventListener('focus', handleFocus);

        // Setup polling as fallback (every 5 minutes)
        const pollInterval = setInterval(() => {
            console.log('🔄 Polling week from database...');
            refreshWeekSilently(false); // Don't show notification on poll
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            console.log('🔵 WeekProvider useEffect: Cleanup');
            clearTimeout(timer);
            subscription.unsubscribe();
            window.removeEventListener('focus', handleFocus);
            clearInterval(pollInterval);
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
        fetchCurrentWeek,
        refreshWeekSilently, // Export for manual refresh
        lastNotifiedWeek // Export for components to check if they should show notification
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
