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
            // AUTO-DETECT: Get batch number from majority of active students
            const { data: students, error: studentsError } = await supabase
                .from('users')
                .select('batch')
                .eq('role', 'student')
                .not('batch', 'is', null);

            let detectedBatch = 1; // default fallback

            if (students && !studentsError && students.length > 0) {
                // Count occurrences of each batch
                const batchCounts = {};
                students.forEach(student => {
                    const batch = typeof student.batch === 'string'
                        ? parseInt(student.batch.replace(/\D/g, ''))
                        : student.batch;

                    if (batch && !isNaN(batch)) {
                        batchCounts[batch] = (batchCounts[batch] || 0) + 1;
                    }
                });

                // Find the most common batch
                let maxCount = 0;
                Object.entries(batchCounts).forEach(([batch, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        detectedBatch = parseInt(batch);
                    }
                });

                console.log('📊 Batch detection:', {
                    totalStudents: students.length,
                    batchCounts,
                    detectedBatch
                });
            }

            setSettings({ batch: detectedBatch });

        } catch (err) {
            console.error('❌ Error loading settings:', err);
            setSettings({ batch: 1 }); // fallback
        } finally {
            setLoading(false);
        }
    };

    const refreshSettings = async () => {
        setLoading(true);
        await loadSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
