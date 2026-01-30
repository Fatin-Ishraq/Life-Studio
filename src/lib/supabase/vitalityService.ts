import { supabase } from './client';

export interface VitalityLog {
    id?: string;
    user_id: string;
    energy_level: number;
    mood_score: number;
    sleep_quality: number;
    notes?: string | null;
    logged_at?: string;
}

/**
 * Log vitality metrics (energy, mood, sleep)
 */
export async function logVitality(log: Omit<VitalityLog, 'id' | 'logged_at'>): Promise<VitalityLog> {
    const { data, error } = await supabase
        .from('vitality')
        .insert(log)
        .select()
        .single();

    if (error) {
        console.error('Error logging vitality:', error.message);
        throw error;
    }

    return data;
}

/**
 * Get vitality history for a user
 */
export async function getVitalityHistory(userId: string, limit = 30): Promise<VitalityLog[]> {
    const { data, error } = await supabase
        .from('vitality')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching vitality history:', error.message);
        throw error;
    }

    return data || [];
}
