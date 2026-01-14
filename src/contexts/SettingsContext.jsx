import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        batch: 1
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Try to load from Supabase first
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .eq('key', 'header_info')
                .single();

            if (data && !error) {
                // Handle migration from old format
                const value = data.value;
                if (typeof value.batch === 'string') {
                    // Extract number from "Batch 2025" format
                    const batchNum = parseInt(value.batch.replace(/\D/g, '')) || 1;
                    setSettings({ batch: batchNum });
                } else {
                    setSettings({ batch: value.batch || 1 });
                }
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('app_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (typeof parsed.batch === 'string') {
                        const batchNum = parseInt(parsed.batch.replace(/\D/g, '')) || 1;
                        setSettings({ batch: batchNum });
                    } else {
                        setSettings({ batch: parsed.batch || 1 });
                    }
                }
            }
        } catch (err) {
            // Fallback to localStorage
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ batch: typeof parsed.batch === 'number' ? parsed.batch : 1 });
            }
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            // Save to localStorage as backup
            localStorage.setItem('app_settings', JSON.stringify(newSettings));
            setSettings(newSettings);

            // Try to save to Supabase
            await supabase
                .from('app_settings')
                .upsert({
                    key: 'header_info',
                    value: newSettings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            return true;
        } catch (err) {
            console.error('Error saving settings:', err);
            // Still update local state even if Supabase fails
            return true;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
