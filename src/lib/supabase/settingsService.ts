import { supabase } from './client';
import type { UserPreferences } from '@/types/database';

/**
 * Get user preferences or create defaults if they don't exist
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        // No preferences found, create defaults
        const { data: newData, error: createError } = await supabase
            .from('user_preferences')
            .insert({
                user_id: userId,
                day_start_time: '06:00',
                day_end_time: '23:00',
                pomo_duration: 25,
                short_break_duration: 5,
                long_break_duration: 15,
                deep_work_duration: 50,
                timer_sound: true,
                auto_archive_captures: true
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating default preferences:', createError);
            throw createError;
        }

        return newData;
    }

    if (error) {
        console.error('Error fetching user preferences:', error);
        throw error;
    }

    return data;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferences> {
    const { data, error } = await supabase
        .from('user_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
    }

    return data;
}
