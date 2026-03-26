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
    const [loading, setLoading] = useState(true);

    // Fetch current week from database
    const fetchCurrentWeek = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('current_week')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('❌ Error fetching current week:', error);
                setCurrentWeek(1); // fallback
                return;
            }

            console.log('📅 Current week from database:', data.current_week);
            setCurrentWeek(data.current_week);
        } catch (err) {
            console.error('❌ Exception fetching current week:', err);
            setCurrentWeek(1); // fallback
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
        await fetchCurrentWeek();
    };

    useEffect(() => {
        fetchCurrentWeek();
    }, []);

    const value = {
        currentWeek,
        loading,
        incrementWeek,
        setWeek,
        refreshWeek
    };

    return (
        <WeekContext.Provider value={value}>
            {children}
        </WeekContext.Provider>
    );
};
